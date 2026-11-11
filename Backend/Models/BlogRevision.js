const mongoose = require('mongoose');

const blogRevisionSchema = new mongoose.Schema(
  {
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
    },
    tags: [{ type: String }],
    wordCount: {
      type: Number,
      default: 0,
    },
    summary: {
      type: String,
      default: 'Manual save',
    },
    versionNumber: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

blogRevisionSchema.index({ blog: 1, createdAt: -1 });

module.exports = mongoose.model('BlogRevision', blogRevisionSchema);

