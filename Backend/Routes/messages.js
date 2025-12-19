const express = require('express');
const router = express.Router();
const { protect } = require('../MiddleWares/authMiddleWare');
const { sendMessage, getMessages, getChannelMessages, markMessagesAsRead, markMessagesAsDelivered, addReaction, deleteMessage, getUnreadMessageCount } = require('../controllers/messageController');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'message_attachments',
  },
});

const upload = multer({ storage: storage });

router.route('/')
  .post(protect, upload.single('attachment'), sendMessage)

router.get('/:userId', protect, getMessages);
router.get('/channel/:channelId', protect, getChannelMessages);
router.post('/markAsRead', protect, markMessagesAsRead);
router.post('/markAsDelivered', protect, markMessagesAsDelivered);
router.post('/react/:messageId', protect, addReaction);
router.delete('/:messageId', protect, deleteMessage);
router.get('/unreadCount', protect, getUnreadMessageCount);

module.exports = router;