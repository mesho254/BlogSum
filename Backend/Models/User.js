const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  likedBlogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
  bookmarkedBlogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
  MyShares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
  MyBlogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
  profilePicture: { type: String },
  location: { type: String },
  messages:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  roles: { type: String, default: 'other' },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
