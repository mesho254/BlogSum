const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const Token = require('../Models/Token');
const SiteSettings = require('../Models/SiteSettings');
const Joi = require("joi");
const bcrypt = require('bcryptjs');
const sendEmail = require("../Utils/sendEmail");
const crypto = require('crypto');
const dotenv = require('dotenv');
const { generateSecret, generateURI, verifySync } = require('otplib');
const qrcode = require('qrcode');
const { logAdminAction, recordUserSecurityLog } = require('../Utils/auditLogger');


dotenv.config()

function parseUserAgent(ua = '') {
  let device = 'Desktop';
  if (/mobile/i.test(ua)) device = 'Mobile';
  else if (/ipad|tablet/i.test(ua)) device = 'Tablet';

  let browser = 'Browser';
  if (/edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/chrome/i.test(ua)) browser = 'Google Chrome';
  else if (/firefox/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(ua)) browser = 'Apple Safari';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  let os = 'OS';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  return { device, browser, os };
}

const createAndTrackSession = async (user, req) => {
  const sessionId = crypto.randomBytes(16).toString('hex');
  const ua = req.headers['user-agent'] || '';
  const ip = req.ip || req.connection?.remoteAddress || '';
  const { device, browser, os } = parseUserAgent(ua);

  if (!Array.isArray(user.sessions)) {
    user.sessions = [];
  }

  // Keep up to 10 most recent active sessions
  user.sessions.unshift({
    sessionId,
    userAgent: ua.slice(0, 200),
    device,
    browser,
    os,
    ip: String(ip).slice(0, 45),
    lastActive: new Date(),
    createdAt: new Date(),
  });

  if (user.sessions.length > 10) {
    user.sessions = user.sessions.slice(0, 10);
  }

  await user.save();
  return sessionId;
};

const generateAccessToken = (id, sessionId = '') => {
  return jwt.sign({ id, sessionId, type: 'access' }, process.env.JWT_SECRET, {
    expiresIn: '15m', // 15 minutes
  });
};

const generateRefreshToken = (id, sessionId = '') => {
  const secret = process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + '_refresh_secret_key_v1');
  return jwt.sign({ id, sessionId, type: 'refresh' }, secret, {
    expiresIn: '7d', // 7 days
  });
};

// Backward-compatible alias
const generateToken = generateAccessToken;

const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  // 15-minute Access Token cookie
  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000,
  });
  // 7-day Refresh Token cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  const settings = await SiteSettings.findOne({ key: 'global' }).lean();
  if (settings && settings.allowRegistrations === false) {
    return res.status(403).json({
      message: 'New account registrations are currently paused by the administrator.',
    });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }
  const initialRole =
    String(username || '').trim().toLowerCase() === 'admin' ? 'admin' : 'other';
  const user = await User.create({
    username,
    email,
    password,
    roles: initialRole,
  });
  if (user) {
    const sessionId = await createAndTrackSession(user, req);
    const accessToken = generateAccessToken(user._id, sessionId);
    const refreshToken = generateRefreshToken(user._id, sessionId);
    recordUserSecurityLog(user._id, {
      action: 'Account registered and signed in',
      req,
      status: 'success',
    });
    setAuthCookies(res, accessToken, refreshToken);
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      isVerified: Boolean(user.isVerified),
      profilePicture: user.profilePicture || '',
      token: accessToken,  // Still send in JSON for localStorage
      accessToken,
      refreshToken,
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

const authUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // Account Lockout check (after 5 failed attempts)
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const remainingMins = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
    return res.status(423).json({
      message: `Account is temporarily locked due to too many failed attempts. Please try again in ${remainingMins} minute${remainingMins > 1 ? 's' : ''}.`,
    });
  }

  const isMatch = await user.matchPassword(password);

  if (isMatch) {
    // Reset lockout counters on successful authentication
    if (user.loginAttempts > 0 || user.lockUntil) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
    }

    if (String(user.username || '').trim().toLowerCase() === 'admin' && user.roles !== 'admin') {
      user.roles = 'admin';
    }
    await user.save();

    if (user.isSuspended && user.roles !== 'admin') {
      return res.status(403).json({
        message: 'Your account has been suspended by an administrator. Please contact support.',
      });
    }

    // 2FA Verification Challenge Gate
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const temp2FAToken = jwt.sign(
        { id: user._id, purpose: '2fa_login' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({
        requires2FA: true,
        temp2FAToken,
        email: user.email,
        username: user.username,
      });
    }

    const sessionId = await createAndTrackSession(user, req);
    const accessToken = generateAccessToken(user._id, sessionId);
    const refreshToken = generateRefreshToken(user._id, sessionId);
    recordUserSecurityLog(user._id, {
      action: 'Signed in successfully via password',
      req,
      status: 'success',
    });
    setAuthCookies(res, accessToken, refreshToken);
    return res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      isVerified: Boolean(user.isVerified),
      profilePicture: user.profilePicture || '',
      token: accessToken,
      accessToken,
      refreshToken,
    });
  } else {
    // Failed password attempt
    recordUserSecurityLog(user._id, {
      action: 'Failed sign-in attempt (incorrect password)',
      req,
      status: 'failed',
    });
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30-min lock
      await user.save();
      return res.status(423).json({
        message: 'Account locked for 30 minutes due to 5 consecutive failed login attempts.',
      });
    }
    await user.save();
    const remaining = 5 - user.loginAttempts;
    return res.status(401).json({
      message: `Invalid email or password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before account lockout.`,
    });
  }
};


const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ username: { $ne: 'deleted-user' } }, 'username email profilePicture'); // Fetch only the necessary fields
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};


// Forgot Password
// send password link
const forgotPassword1 = async (req, res) => {
	try {
		const emailSchema = Joi.object({
			email: Joi.string().email().required().label("Email"),
		});
		const { error } = emailSchema.validate(req.body);
		if (error)
			return res.status(400).send({ message: error.details[0].message });

		let user = await User.findOne({ email: req.body.email });
		if (!user)
			return res
				.status(409)
				.send({ message: "User with given email does not exist!" });

		let token = await Token.findOne({ userId: user._id });
		if (!token) {
			token = await new Token({
				userId: user._id,
				token: crypto.randomBytes(32).toString("hex"),
			}).save();
		}

		const url = `${process.env.BASE_URL}/password-reset/${user._id}/${token.token}`;
		const resetHtml = sendEmail.buildPasswordResetEmail({
			username: user.username || user.email,
			resetUrl: url,
		});
		await sendEmail(
			user.email,
			"Reset your BlogSum password",
			`Reset your BlogSum password by visiting: ${url}`,
			resetHtml
		);

		res
			.status(200)
			.send({ message: "Password reset link sent to your email account" });
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
}

// verify password reset link
const getResetToken = async (req, res) => {
	try {
		const user = await User.findOne({ _id: req.params.id });
		if (!user) return res.status(400).send({ message: "Invalid link" });

		const token = await Token.findOne({
			userId: user._id,
			token: req.params.token,
		});
		if (!token) return res.status(400).send({ message: "Invalid link" });

		res.status(200).send("Valid Url");
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
}

//  set new password
const  resetPassword1 = async (req, res) => {
	try {
		const passwordSchema = Joi.object({
			password: passwordComplexity().required().label("Password"),
		});
		const { error } = passwordSchema.validate(req.body);
		if (error)
			return res.status(400).send({ message: error.details[0].message });

		const user = await User.findOne({ _id: req.params.id });
		if (!user) return res.status(400).send({ message: "Invalid link" });

		const token = await Token.findOne({
			userId: user._id,
			token: req.params.token,
		});
		if (!token) return res.status(400).send({ message: "Invalid link" });

		if (!user.verified) user.verified = true;

		const salt = await bcrypt.genSalt(Number(process.env.SALT));
		const hashPassword = await bcrypt.hash(req.body.password, salt);

		user.password = hashPassword;
		await user.save();
		await token.remove();

		res.status(200).send({ message: "Password reset successfully" });
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
}



const changePassword = async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  
  try {
  const user = await User.findOne({ email });
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  
  recordUserSecurityLog(user._id, {
    action: 'Changed account password',
    req,
    status: 'success',
  });

  res.json({ message: 'Password changed successfully' });
  } catch (err) {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
  console.log(err)
  }
  };

const logoutUser = async (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  res.json({ message: 'Logged out successfully' });
};

// ---------------- 2FA (TOTP) Controllers ----------------

const generateRecoveryCodes = () => {
  const codes = [];
  for (let i = 0; i < 8; i++) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4)}`);
  }
  return codes;
};

const get2FAStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('twoFactorEnabled twoFactorRecoveryCodes');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
      recoveryCodesCount: user.twoFactorRecoveryCodes?.length || 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve 2FA status' });
  }
};

const setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const secret = generateSecret();
    user.twoFactorTempSecret = secret;

    const recoveryCodes = generateRecoveryCodes();
    user.twoFactorRecoveryCodes = recoveryCodes;
    await user.save();

    const otpauthUri = generateURI({
      issuer: 'BlogSum',
      label: user.email || user.username,
      secret,
    });

    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUri, {
      margin: 2,
      width: 240,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    res.json({
      secret,
      qrCodeDataUrl,
      otpauthUri,
      recoveryCodes,
    });
  } catch (err) {
    console.error('Error setting up 2FA:', err);
    res.status(500).json({ message: 'Failed to generate 2FA setup configuration' });
  }
};

const verifyEnable2FA = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: '6-digit verification code is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.twoFactorTempSecret) {
      return res.status(400).json({ message: '2FA setup was not initiated. Please start setup again.' });
    }

    const cleanToken = String(token).trim().replace(/[\s-]/g, '');
    const result = verifySync({ token: cleanToken, secret: user.twoFactorTempSecret });

    if (!result || !result.valid) {
      return res.status(400).json({ message: 'Invalid 6-digit verification code. Please check your authenticator app.' });
    }

    user.twoFactorEnabled = true;
    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = null;
    await user.save();

    recordUserSecurityLog(user._id, {
      action: 'Enabled Two-Factor Authentication (TOTP)',
      req,
      status: 'success',
    });

    await logAdminAction({
      req,
      actionType: '2FA_ENABLED',
      targetType: 'User',
      targetId: user._id,
      targetLabel: user.username,
    });

    res.json({
      success: true,
      message: 'Two-Factor Authentication (2FA) is now securely activated on your account!',
    });
  } catch (err) {
    console.error('Error verifying 2FA enable:', err);
    res.status(500).json({ message: 'Failed to activate 2FA' });
  }
};

const disable2FA = async (req, res) => {
  try {
    const { password, code } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Current password is required to disable 2FA' });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled on this account' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    if (code) {
      const cleanCode = String(code).trim().replace(/[\s-]/g, '');
      const result = verifySync({ token: cleanCode, secret: user.twoFactorSecret });
      let valid = result && result.valid;
      if (!valid && user.twoFactorRecoveryCodes?.includes(cleanCode.toUpperCase())) {
        valid = true;
      }
      if (!valid) {
        return res.status(400).json({ message: 'Invalid 2FA code or recovery code' });
      }
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorTempSecret = null;
    user.twoFactorRecoveryCodes = [];
    await user.save();

    recordUserSecurityLog(user._id, {
      action: 'Disabled Two-Factor Authentication',
      req,
      status: 'warning',
    });

    await logAdminAction({
      req,
      actionType: '2FA_DISABLED',
      targetType: 'User',
      targetId: user._id,
      targetLabel: user.username,
    });

    res.json({
      success: true,
      message: 'Two-Factor Authentication has been disabled on your account.',
    });
  } catch (err) {
    console.error('Error disabling 2FA:', err);
    res.status(500).json({ message: 'Failed to disable 2FA' });
  }
};

const verify2FALogin = async (req, res) => {
  try {
    const { temp2FAToken, code } = req.body;

    if (!temp2FAToken || !code) {
      return res.status(400).json({ message: 'Verification token and 6-digit code or recovery code are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(temp2FAToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: '2FA session expired. Please sign in again with your password.' });
    }

    if (decoded.purpose !== '2fa_login' || !decoded.id) {
      return res.status(401).json({ message: 'Invalid 2FA challenge token' });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(401).json({ message: 'User not found or 2FA not enabled' });
    }

    const cleanCode = String(code).trim().replace(/[\s-]/g, '');

    // 1. Check TOTP code
    const totpResult = verifySync({ token: cleanCode, secret: user.twoFactorSecret });
    let isCodeValid = totpResult && totpResult.valid;

    // 2. Check recovery code if TOTP didn't match
    let usedRecoveryCode = false;
    if (!isCodeValid && Array.isArray(user.twoFactorRecoveryCodes)) {
      const idx = user.twoFactorRecoveryCodes.findIndex(
        (rc) => rc.replace(/[\s-]/g, '').toUpperCase() === cleanCode.toUpperCase()
      );
      if (idx !== -1) {
        isCodeValid = true;
        usedRecoveryCode = true;
        user.twoFactorRecoveryCodes.splice(idx, 1);
        await user.save();
      }
    }

    if (!isCodeValid) {
      return res.status(401).json({ message: 'Invalid verification code or recovery backup code.' });
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const sessionId = await createAndTrackSession(user, req);
    const accessToken = generateAccessToken(user._id, sessionId);
    const refreshToken = generateRefreshToken(user._id, sessionId);
    recordUserSecurityLog(user._id, {
      action: usedRecoveryCode
        ? 'Signed in using 2FA emergency backup recovery code'
        : 'Completed Two-Factor Authentication (TOTP)',
      req,
      status: 'success',
    });
    setAuthCookies(res, accessToken, refreshToken);

    return res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      isVerified: Boolean(user.isVerified),
      profilePicture: user.profilePicture || '',
      token: accessToken,
      accessToken,
      refreshToken,
      usedRecoveryCode,
      remainingRecoveryCodes: user.twoFactorRecoveryCodes?.length || 0,
    });
  } catch (error) {
    console.error('Error during 2FA login verification:', error);
    res.status(500).json({ message: 'Server error during 2FA verification' });
  }
};

const logoutOtherSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const currentSessionId = req.sessionId;
    if (currentSessionId) {
      user.sessions = (user.sessions || []).filter((s) => s.sessionId === currentSessionId);
    } else {
      user.sessions = user.sessions && user.sessions.length ? [user.sessions[0]] : [];
    }
    await user.save();
    res.json({ message: 'All other remote sessions have been logged out' });
  } catch (err) {
    res.status(500).json({ message: 'Error logging out other sessions' });
  }
};

const getUserSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('sessions');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const currentSessionId = req.sessionId;
    const sessions = (user.sessions || []).map((s) => ({
      sessionId: s.sessionId,
      device: s.device,
      browser: s.browser,
      os: s.os,
      ip: s.ip,
      lastActive: s.lastActive,
      createdAt: s.createdAt,
      isCurrent: Boolean(currentSessionId && s.sessionId === currentSessionId),
    }));
    res.json({ sessions, currentSessionId });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving active sessions' });
  }
};

const terminateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.sessions = (user.sessions || []).filter((s) => s.sessionId !== sessionId);
    await user.save();
    recordUserSecurityLog(user._id, {
      action: 'Revoked a remote device session',
      req,
      status: 'warning',
    });
    res.json({ message: 'Session terminated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error terminating session' });
  }
};

const getUserSecurityLogs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('securityAuditLogs');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const logs = [...(user.securityAuditLogs || [])].reverse();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve security audit logs' });
  }
};

const rotateRefreshToken = async (req, res) => {
  try {
    let token = req.cookies?.refreshToken || req.body?.refreshToken;
    let fallbackToken = req.cookies?.token;
    if (!fallbackToken && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      fallbackToken = req.headers.authorization.split(' ')[1];
    }
    const tokenToVerify = token || fallbackToken;
    if (!tokenToVerify) {
      return res.status(401).json({ message: 'No authorization token provided' });
    }

    let decoded;
    const refreshSecret = process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + '_refresh_secret_key_v1');
    try {
      decoded = jwt.verify(tokenToVerify, refreshSecret);
    } catch (e1) {
      try {
        decoded = jwt.verify(tokenToVerify, process.env.JWT_SECRET, { ignoreExpiration: true });
      } catch (e2) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
    }

    const user = await User.findById(decoded.id);
    if (!user || user.isSuspended) {
      return res.status(401).json({ message: 'User account invalid or suspended' });
    }

    if (decoded.sessionId && Array.isArray(user.sessions)) {
      const sessionExists = user.sessions.some((s) => s.sessionId === decoded.sessionId);
      if (!sessionExists) {
        return res.status(401).json({ message: 'Session has been revoked' });
      }
    }

    const newAccessToken = generateAccessToken(user._id, decoded.sessionId || '');
    const newRefreshToken = generateRefreshToken(user._id, decoded.sessionId || '');

    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.json({
      token: newAccessToken,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles,
        profilePicture: user.profilePicture || '',
      },
    });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = {
  registerUser,
  authUser,
  getAllUsers,
  forgotPassword1,
  getResetToken,
  resetPassword1,
  changePassword,
  logoutUser,
  get2FAStatus,
  setup2FA,
  verifyEnable2FA,
  disable2FA,
  verify2FALogin,
  getUserSessions,
  terminateSession,
  logoutOtherSessions,
  getUserSecurityLogs,
  rotateRefreshToken,
};