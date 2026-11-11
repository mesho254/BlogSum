const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const { protect, admin } = require('../MiddleWares/authMiddleWare');
const {
  getPayPalConfig,
  createTipOrder,
  captureTipOrder,
  getAuthorTips,
  getAllTips,
} = require('../controllers/tipController');

// Middleware: extracts authenticated user if token present, but does not block guests
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
        req.user = await User.findById(decoded.id).select('username email');
      }
    } catch (e) {
      // Optional auth: continue without req.user
    }
  }
  next();
};

// Public config
router.get('/paypal/config', getPayPalConfig);

// PayPal order creation & capture
router.post('/paypal/create-order', optionalAuth, createTipOrder);
router.post('/paypal/capture-order', optionalAuth, captureTipOrder);

// Author tip history
router.get('/author/:authorId', getAuthorTips);

// Admin: all platform tips
router.get('/all', protect, admin, getAllTips);

module.exports = router;

