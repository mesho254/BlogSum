const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  readTime: String,
  imageUrl: String,
  category: {
    type: String,
    enum: ['Technology', 'Health', 'Lifestyle', 'Education', 'Travel'], // Add your categories here
    required: true,
  },
  content: { type: String, required: true }, 
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] ,
  shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  allowComments: { type: Boolean, default: true }, 
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      comment: String,
      date: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('Blog', blogSchema);