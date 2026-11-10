const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    siteName: { type: String, default: 'BlogSum' },
    siteTagline: {
      type: String,
      default:
        'An independent digital publication for thoughtful essays, technical deep-dives, and cultural perspectives.',
    },
    supportEmail: { type: String, default: 'support@blogsum.com' },
    announcementEnabled: { type: Boolean, default: false },
    announcementText: {
      type: String,
      default: 'Welcome to the new BlogSum editorial publishing studio.',
    },
    announcementLink: { type: String, default: '/createBlog' },
    announcementLinkLabel: { type: String, default: 'Write a Story' },
    allowRegistrations: { type: Boolean, default: true },
    allowCommentsGlobal: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: {
      type: String,
      default: 'BlogSum is undergoing scheduled editorial maintenance. Please check back shortly.',
    },
    maxImagesPerPost: { type: Number, default: 5 },
    featuredBannerLimit: { type: Number, default: 5 },
    socialLinks: {
      instagram: { type: String, default: 'https://instagram.com' },
      twitter: { type: String, default: 'https://twitter.com' },
      facebook: { type: String, default: 'https://facebook.com' },
      discord: { type: String, default: 'https://discord.com' },
      tiktok: { type: String, default: 'https://tiktok.com' },
      linkedin: { type: String, default: 'https://linkedin.com' },
      github: { type: String, default: 'https://github.com' },
    },
    customTermsText: { type: String, default: '' },
    customPrivacyText: { type: String, default: '' },
    customReturnText: { type: String, default: '' },
    customFaqs: [
      {
        category: { type: String, default: 'General' },
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
