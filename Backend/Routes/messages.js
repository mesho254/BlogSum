const express = require('express');
const router = express.Router();
const { protect } = require('../MiddleWares/authMiddleWare');
const { sendMessage, getMessages, markMessagesAsRead, getUnreadMessageCount } = require('../controllers/messageController');

router.route('/')
  .post(protect, sendMessage)

router.get('/:userId', protect, getMessages);
router.post('/markAsRead', protect, markMessagesAsRead);
router.get('/unreadCount', protect, getUnreadMessageCount);

module.exports = router;
