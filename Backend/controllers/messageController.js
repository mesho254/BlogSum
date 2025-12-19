const Message = require('../Models/Message');
const mongoose = require('mongoose');
// const { validationResult } = require('express-validator');

const sendMessage = async (req, res) => {
  const { receiverId, channelId, message } = req.body;

  if (!receiverId && !channelId) {
    return res.status(400).send('Either receiverId or channelId is required');
  }

  try {
    const newMessage = new Message({
      sender: req.user._id,
      receiver: receiverId || null,
      channel: channelId || null,
      message: message || '',
      deliveredTo: [],
      readBy: [],
      fileUrl: req.file ? req.file.path : null,
      reactions: []
    });

    await newMessage.save();

    await newMessage.populate('sender', 'username profilePicture');
    if (receiverId) {
      await newMessage.populate('receiver', 'username profilePicture');
    }

    const io = req.app.get('io');
    if (channelId) {
      io.to(channelId.toString()).emit('message', newMessage);
    } else {
      io.to(req.user._id.toString()).emit('message', newMessage);
      io.to(receiverId.toString()).emit('message', newMessage);
    }

    res.json(newMessage);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

const getMessages = async (req, res) => {
  const messages = await Message.find({
    $or: [
      { sender: req.user._id, receiver: req.params.userId, channel: null },
      { sender: req.params.userId, receiver: req.user._id, channel: null }
    ]
  }).populate('sender', 'username profilePicture').populate('receiver', 'username profilePicture').populate('reactions.user', 'username');
  
  res.json(messages);
};

const getChannelMessages = async (req, res) => {
  const messages = await Message.find({ channel: req.params.channelId }).populate('sender', 'username profilePicture').populate('reactions.user', 'username');
  
  res.json(messages);
};

const markMessagesAsRead = async (req, res) => {
  try {
    const { targetId, isChannel } = req.body;
    if (!targetId) {
      return res.status(400).send('targetId is required');
    }
    let query;
    if (isChannel) {
      query = { channel: targetId, readBy: { $ne: req.user._id } };
    } else {
      query = { receiver: req.user._id, sender: targetId, readBy: { $ne: req.user._id } };
    }
    await Message.updateMany(query, { $addToSet: { readBy: req.user._id } });

    // Emit read update
    const io = req.app.get('io');
    if (isChannel) {
      io.to(targetId.toString()).emit('readUpdate', { userId: req.user._id, targetId, isChannel });
    } else {
      io.to(targetId.toString()).emit('readUpdate', { userId: req.user._id, targetId, isChannel });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

const markMessagesAsDelivered = async (req, res) => {
  try {
    const { targetId, isChannel } = req.body;
    if (!targetId) {
      return res.status(400).send('targetId is required');
    }
    let query;
    if (isChannel) {
      query = { channel: targetId, deliveredTo: { $ne: req.user._id } };
    } else {
      query = { receiver: req.user._id, sender: targetId, deliveredTo: { $ne: req.user._id } };
    }
    await Message.updateMany(query, { $addToSet: { deliveredTo: req.user._id } });

    // Emit delivered update
    const io = req.app.get('io');
    if (isChannel) {
      io.to(targetId.toString()).emit('deliveredUpdate', { userId: req.user._id, targetId, isChannel });
    } else {
      io.to(targetId.toString()).emit('deliveredUpdate', { userId: req.user._id, targetId, isChannel });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

const addReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).send('Message not found');
    }
    const index = message.reactions.findIndex(r => r.user.toString() === req.user._id.toString());
    if (index > -1) {
      message.reactions[index].emoji = emoji;
    } else {
      message.reactions.push({ user: req.user._id, emoji });
    }
    await message.save();

    await message.populate('sender', 'username profilePicture');
    if (message.receiver) {
      await message.populate('receiver', 'username profilePicture');
    }
    await message.populate('reactions.user', 'username');

    const reaction = message.reactions.find(r => r.user._id.toString() === req.user._id.toString());
    const io = req.app.get('io');
    const emitData = { messageId: message._id, reaction: { user: { _id: req.user._id, username: req.user.username }, emoji: reaction.emoji } };
    if (message.channel) {
      io.to(message.channel.toString()).emit('reaction', emitData);
    } else {
      io.to(message.sender.toString()).emit('reaction', emitData);
      io.to(message.receiver.toString()).emit('reaction', emitData);
    }

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).send('Message not found');
    }
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(401).send('Not authorized');
    }
    await message.deleteOne();

    const io = req.app.get('io');
    const emitData = { messageId: req.params.messageId };
    if (message.channel) {
      io.to(message.channel.toString()).emit('deleteMessage', emitData);
    } else {
      io.to(message.sender.toString()).emit('deleteMessage', emitData);
      io.to(message.receiver.toString()).emit('deleteMessage', emitData);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

const getUnreadMessageCount = async (req, res) => {
  try {
    const userChannels = await require('../Models/Channel').find({ members: req.user._id }, '_id');
    const channelIds = userChannels.map(c => c._id);
    const count = await Message.countDocuments({
      readBy: { $ne: req.user._id },
      $or: [
        { receiver: req.user._id },
        { channel: { $in: channelIds } }
      ]
    });
    res.json({ count });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = { sendMessage, getMessages, getChannelMessages, markMessagesAsRead, markMessagesAsDelivered, addReaction, deleteMessage, getUnreadMessageCount };