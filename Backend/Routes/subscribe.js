const express = require('express');
const { subscribe, getSubscribers, sendNewsToSubscribers } = require('../controllers/subscribeController');

const router = express.Router();

router.post('/subscribe', subscribe);
router.get('/subscribers', getSubscribers);
router.post('/send-news', sendNewsToSubscribers);

module.exports = router;
