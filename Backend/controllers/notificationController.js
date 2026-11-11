const Notification = require('../Models/Notification'); // adjust the path as necessary
const User = require('../Models/User');
const { getVapidPublicKey, sendWebPushToUser } = require('../Utils/pushNotifier');

// Get all notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id; // assuming the user ID is available in the request object
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get a notification by ID
exports.getNotificationById = async (req, res) => {
    try {
      const notificationId = req.params.id;
      const notification = await Notification.findById(notificationId);
  
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
  
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    await Notification.findByIdAndUpdate(notificationId, { read: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Mark a notification as unread
exports.markAsUnread = async (req, res) => {
    try {
      const notificationId = req.params.id;
      await Notification.findByIdAndUpdate(notificationId, { read: false });
      res.json({ message: 'Notification marked as unread' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };

// Mark all notifications as read for a user
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id; // assuming the user ID is available in the request object
    await Notification.updateMany({ user: userId, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    await Notification.findByIdAndDelete(notificationId);
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getVapidPublicKey = (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
};

exports.subscribeToPush = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Valid subscription object is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!Array.isArray(user.pushSubscriptions)) {
      user.pushSubscriptions = [];
    }

    const exists = user.pushSubscriptions.some((s) => s.endpoint === subscription.endpoint);
    if (!exists) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }

    sendWebPushToUser(req.user._id, {
      title: 'BlogSum Notifications Enabled',
      body: 'You will receive instant alerts when your favorite authors publish.',
      url: '/notifications',
    }).catch(() => {});

    res.json({ success: true, message: 'Push subscription registered successfully' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ message: 'Failed to register push subscription' });
  }
};

