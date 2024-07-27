const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController'); 
const { protect } = require('../MiddleWares/authMiddleWare');

// Get all notifications for a user
router.get('/', protect, notificationController.getNotifications);

// Mark a specific notification as read
router.put('/:id/read', protect, notificationController.markAsRead);

router.get('/:id', notificationController.getNotificationById)

router.put('/:id/unread', notificationController.markAsUnread)

// Mark all notifications as read for a user
router.put('/read/all', protect, notificationController.markAllAsRead);

module.exports = router;
