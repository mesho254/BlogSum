const express = require('express');
const router = express.Router();
const { protect } = require('../MiddleWares/authMiddleWare');
const { sendMessage, getMessages, getChannelMessages, markMessagesAsRead, markMessagesAsDelivered, addReaction, trashMessage, restoreMessage, pinMessage, unpinMessage, addFavorite, removeFavorite, reportMessage, getFavorites, getTrash, getUnreadMessageCount } = require('../controllers/messageController');
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
  .post(protect, upload.single('attachment'), sendMessage);
router.get('/favorites', protect, getFavorites);
router.get('/trash', protect, getTrash);
router.get('/unreadCount', protect, getUnreadMessageCount);
router.get('/:userId', protect, getMessages);
router.get('/channel/:channelId', protect, getChannelMessages);
router.post('/markAsRead', protect, markMessagesAsRead);
router.post('/markAsDelivered', protect, markMessagesAsDelivered);
router.post('/react/:messageId', protect, addReaction);
router.post('/trash/:messageId', protect, trashMessage);
router.post('/restore/:messageId', protect, restoreMessage);
router.post('/pin/:messageId', protect, pinMessage);
router.post('/unpin/:messageId', protect, unpinMessage);
router.post('/favorite/:messageId', protect, addFavorite);
router.delete('/favorite/:messageId', protect, removeFavorite);
router.post('/report/:messageId', protect, reportMessage);
module.exports = router;