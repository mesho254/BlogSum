const mongoose = require('mongoose');

const channelSchema = mongoose.Schema({
  name: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

const Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;