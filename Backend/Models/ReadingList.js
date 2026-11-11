const mongoose = require('mongoose');

const readingListSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPrivate: { type: Boolean, default: false },
    blogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
    color: { type: String, default: '#4f46e5' },
    icon: { type: String, default: 'bookmark' },
  },
  { timestamps: true }
);

readingListSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ReadingList', readingListSchema);

