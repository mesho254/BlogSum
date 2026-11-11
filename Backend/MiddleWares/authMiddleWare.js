const jwt = require('jsonwebtoken');
const User = require('../Models/User');

// Short-lived in-memory cache for authenticated user lookups to prevent
// burst parallel requests from hammering MongoDB Atlas on page load
const authUserCache = new Map();
const AUTH_CACHE_TTL_MS = 10 * 1000;

const invalidateAuthUserCache = (userId) => {
  if (userId) {
    authUserCache.delete(String(userId));
  } else {
    authUserCache.clear();
  }
};

const isAdminUser = (user) => {
  if (!user) return false;
  if (user.roles === 'admin') return true;
  if (String(user.username || '').trim().toLowerCase() === 'admin') return true;
  return false;
};

const protect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized to access this route' });
  }

  // Developer Personal Access Token (PAT) Authentication
  if (token.startsWith('bsum_pat_')) {
    try {
      const crypto = require('crypto');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const user = await User.findOne({ 'personalAccessTokens.tokenHash': tokenHash });
      if (!user) {
        return res.status(401).json({ error: 'Invalid or revoked Personal Access Token' });
      }
      User.updateOne(
        { _id: user._id, 'personalAccessTokens.tokenHash': tokenHash },
        { $set: { 'personalAccessTokens.$.lastUsedAt': new Date() } }
      ).catch(() => {});
      req.user = user;
      req.isPatAuth = true;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Error validating Personal Access Token' });
    }
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userIdStr = String(decoded.id);

    let user = null;
    const cached = authUserCache.get(userIdStr);
    if (cached && Date.now() - cached.timestamp < AUTH_CACHE_TTL_MS) {
      user = cached.user;
    } else {
      user = await User.findById(decoded.id);
      if (user) {
        authUserCache.set(userIdStr, { user, timestamp: Date.now() });
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists' });
    }

    // Session revocation check
    if (decoded.sessionId && Array.isArray(user.sessions) && user.sessions.length > 0) {
      const sessionExists = user.sessions.some((s) => s.sessionId === decoded.sessionId);
      if (!sessionExists) {
        return res.status(401).json({ error: 'This session has been terminated. Please log in again.' });
      }
    }
    req.sessionId = decoded.sessionId;

    // Automatically ensure the 'admin' username carries the 'admin' role without blocking
    if (String(user.username || '').trim().toLowerCase() === 'admin' && user.roles !== 'admin') {
      user.roles = 'admin';
      User.updateOne({ _id: user._id }, { $set: { roles: 'admin' } }).catch(() => {});
    }

    if (user.isSuspended && !isAdminUser(user)) {
      return res.status(403).json({
        error: 'Your account has been suspended by an administrator.',
        message: 'Your account has been suspended by an administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Not authorized to access this route' });
  }
};

const admin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (isAdminUser(req.user)) {
      return next();
    }
    return res.status(403).json({ message: 'Not authorized as an administrator' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error verifying admin privileges' });
  }
};

const optionalAuth = async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && decoded.id) {
        req.user = await User.findById(decoded.id).select('username email roles following bookmarkedBlogs');
        req.sessionId = decoded.sessionId;
      }
    } catch (e) {
      // Optional auth: proceed anonymously
    }
  }
  next();
};

module.exports = { protect, admin, isAdminUser, optionalAuth, invalidateAuthUserCache };
