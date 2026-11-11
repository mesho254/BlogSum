const express = require('express');
const router = express.Router();
const { protect } = require('../MiddleWares/authMiddleWare');
const {
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
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/login/2fa', verify2FALogin);
router.get('/allUsers', getAllUsers);
router.post('/forgot-password1', forgotPassword1);

router.get('/password-reset/:id/:token', getResetToken);
router.post('/password-reset/:id/:token', resetPassword1);

router.put('/changePassword', protect, changePassword);
router.post('/logout', logoutUser);

// Two-Factor Authentication (TOTP 2FA) Endpoints
router.get('/2fa/status', protect, get2FAStatus);
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify-enable', protect, verifyEnable2FA);
router.post('/2fa/disable', protect, disable2FA);

module.exports = router;
