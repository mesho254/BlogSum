const express = require('express');
const {
  subscribe,
  getSubscribers,
  sendNewsToSubscribers,
  submitContactInquiry,
} = require('../controllers/subscribeController');

const router = express.Router();

router.post('/subscribe', subscribe);
router.get('/subscribers', getSubscribers);
router.post('/send-news', sendNewsToSubscribers);
router.post('/contact', submitContactInquiry);

module.exports = router;
