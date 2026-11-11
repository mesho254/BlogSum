const mongoose = require('mongoose');

const seriesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Series title is required'],
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    coverImage: {
      type: String,
      default: '',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
      },
    ],
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

seriesSchema.index({ author: 1, createdAt: -1 });
seriesSchema.index({ slug: 1 });

module.exports = mongoose.model('Series', seriesSchema);

