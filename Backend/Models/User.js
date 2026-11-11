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
  isVerified: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, default: null },
  twoFactorTempSecret: { type: String, default: null },
  twoFactorRecoveryCodes: [{ type: String }],
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  bio: { type: String, default: '' },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sessions: [
    {
      sessionId: { type: String, required: true },
      userAgent: { type: String, default: '' },
      device: { type: String, default: 'Desktop' },
      browser: { type: String, default: 'Browser' },
      os: { type: String, default: 'OS' },
      ip: { type: String, default: '' },
      lastActive: { type: Date, default: Date.now },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  pushSubscriptions: [
    {
      endpoint: { type: String, required: true },
      expirationTime: { type: Number, default: null },
      keys: {
        p256dh: { type: String },
        auth: { type: String },
      },
    },
  ],
  payoutSettings: {
    stripeAccountId: { type: String, default: '' },
    stripeConnected: { type: Boolean, default: false },
    payoutMethod: {
      type: String,
      enum: ['paypal', 'stripe'],
      default: 'paypal',
    },
    paypalEmail: { type: String, default: '' },
  },
  membership: {
    tier: {
      type: String,
      enum: ['free', 'premium', 'supporter'],
      default: 'free',
    },
    isActive: { type: Boolean, default: false },
    validUntil: { type: Date, default: null },
    monthlyMeteredCount: { type: Number, default: 0 },
    meteredPeriodStart: { type: Date, default: Date.now },
  },
  securityAuditLogs: [
    {
      action: { type: String, required: true },
      ip: { type: String, default: '' },
      userAgent: { type: String, default: '' },
      status: {
        type: String,
        enum: ['success', 'warning', 'failed'],
        default: 'success',
      },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  personalAccessTokens: [
    {
      tokenId: { type: String, required: true },
      name: { type: String, required: true },
      tokenHash: { type: String, required: true },
      tokenPrefix: { type: String, required: true },
      scopes: [{ type: String }],
      lastUsedAt: { type: Date, default: null },
      expiresAt: { type: Date, default: null },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  webhooks: [
    {
      webhookId: { type: String, required: true },
      url: { type: String, required: true },
      secret: { type: String, required: true },
      events: [{ type: String }],
      active: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now },
      lastTriggeredAt: { type: Date, default: null },
      lastStatusCode: { type: Number, default: null },
    },
  ],
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
