const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '', maxlength: 300 },
    logo: { type: String, default: '' },
    banner: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    editors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    writers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    topics: [{ type: String }],
    stories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Publication', publicationSchema);

