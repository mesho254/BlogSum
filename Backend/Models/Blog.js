const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: String,
  subtitle: { type: String, default: '' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  publishDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['published', 'scheduled', 'draft'],
    default: 'published',
  },
  readTime: String,
  imageUrl: String,
  images: [{ type: String }],
  tags: [{ type: String }],
  category: {
    type: String,
    enum: [
      'Technology',
      'Health',
      'Lifestyle',
      'Education',
      'Travel',
      'Business',
      'Finance',
      'Design',
      'Science',
      'Culture',
      'Food',
      'Productivity',
      'Career',
      'Entertainment',
      'Sports',
    ],
    required: true,
  },
  content: { type: String, required: true }, 
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      type: {
        type: String,
        enum: ['like', 'love', 'celebrate', 'support', 'insightful', 'funny'],
        default: 'love',
      },
    },
  ],
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] ,
  shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  allowComments: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      comment: String,
      attachment: String,
      date: { type: Date, default: Date.now },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      replies: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          comment: String,
          date: { type: Date, default: Date.now },
          likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        },
      ],
    }
  ]
});

blogSchema.index({ date: -1 });
blogSchema.index({ author: 1, date: -1 });

module.exports = mongoose.model('Blog', blogSchema);