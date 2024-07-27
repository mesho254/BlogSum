const Message = require('../Models/Message');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

const sendMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { receiverId, message } = req.body;

  try {
    const newMessage = new Message({
      sender: req.user._id,
      receiver: receiverId,
      message,
      delivered: true
    });

    await newMessage.save();

    // Emit message to both sender and receiver rooms
    req.app.io.to(req.user._id.toString()).emit('message', newMessage);
    req.app.io.to(receiverId.toString()).emit('message', newMessage);

    res.json(newMessage);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

const getMessages = async (req, res) => {
  const messages = await Message.find({
    $or: [
      { sender: req.user._id, receiver: req.params.userId },
      { sender: req.params.userId, receiver: req.user._id }
    ]
  }).populate('sender', 'username profilePicture').populate('receiver', 'username profilePicture');
  
  res.json(messages);
};

const markMessagesAsRead = async (req, res) => {
  try {
    const { userId } = req.body;
    await Message.updateMany(
      { receiver: req.user.id, sender: userId, read: false },
      { $set: { read: true } }
    );

    // Emit read status update to sender
    req.app.io.to(userId.toString()).emit('read', { userId: req.user.id });

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

const getUnreadMessageCount = async (req, res) => {
  try {
    
    const count = await Message.countDocuments({
      receiver: req.user._id,
      read: false
    });
    res.json({ count });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = { sendMessage, getMessages, markMessagesAsRead, getUnreadMessageCount };
