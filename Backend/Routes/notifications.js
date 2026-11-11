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

// Delete a notification
router.delete('/:id', protect, notificationController.deleteNotification);

// Mark all notifications as read for a user
router.put('/read/all', protect, notificationController.markAllAsRead);

// Web Push Notification Subscriptions
router.get('/vapid-public-key', notificationController.getVapidPublicKey);
router.post('/push-subscribe', protect, notificationController.subscribeToPush);

module.exports = router;
