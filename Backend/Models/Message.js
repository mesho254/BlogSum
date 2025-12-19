const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', default: null },
  message: { type: String },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  fileUrl: { type: String },
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String }
  }]
}, {
  timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;