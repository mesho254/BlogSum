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
  imageCredit: { type: String, default: '' },
  audioUrl: { type: String, default: '' },
  audioDuration: { type: Number, default: 0 },
  images: [{ type: String }],
  tags: [{ type: String }],
  aiKeyTakeaways: [{ type: String }],
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
  content: {
    type: String,
    default: '<p><br></p>',
    validate: {
      validator: function (v) {
        if (this.status === 'published') {
          return typeof v === 'string' && v.trim().length > 0;
        }
        return true;
      },
      message: 'Story content is required when publishing.',
    },
  }, 
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
  series: { type: mongoose.Schema.Types.ObjectId, ref: 'Series' },
  seriesOrder: { type: Number, default: 0 },
  allowComments: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  publication: { type: mongoose.Schema.Types.ObjectId, ref: 'Publication' },
  accessLevel: {
    type: String,
    enum: ['public', 'members', 'metered'],
    default: 'public',
  },
  isMembersOnly: { type: Boolean, default: false },
  isSponsored: { type: Boolean, default: false },
  sponsorName: { type: String, default: '' },
  digitalProduct: {
    enabled: { type: Boolean, default: false },
    name: { type: String, default: '' },
    downloadUrl: { type: String, default: '' },
    price: { type: Number, default: 0 },
  },
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      comment: { type: String, default: '' },
      attachment: { type: String, default: '' },
      date: { type: Date, default: Date.now },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      replies: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          comment: { type: String, default: '' },
          attachment: { type: String, default: '' },
          date: { type: Date, default: Date.now },
          likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        },
      ],
    }
  ]
});

blogSchema.index({ date: -1 });
blogSchema.index({ publishDate: -1, status: 1 });
blogSchema.index({ author: 1, date: -1 });
blogSchema.index({ author: 1, status: 1 });
blogSchema.index({ category: 1, status: 1 });
blogSchema.index({ title: 'text', subtitle: 'text', tags: 'text' });

module.exports = mongoose.model('Blog', blogSchema);