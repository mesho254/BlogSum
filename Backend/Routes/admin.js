const express = require('express');
const router = express.Router();
const { protect, admin } = require('../MiddleWares/authMiddleWare');
const {
  getAdminOverview,
  getAllAdminBlogs,
  updateBlogAdminStatus,
  bulkManageBlogs,
  triggerScheduledPublisher,
  getAllCommentsAdmin,
  deleteCommentAdmin,
  getAllUsersAdmin,
  createUserAdmin,
  updateUserAdmin,
  deleteUserAdmin,
  getSubscribersAdmin,
  addSubscriberAdmin,
  deleteSubscriberAdmin,
  broadcastAnnouncement,
  getChannelsAdmin,
  deleteChannelAdmin,
  getPublicSiteSettings,
  getSiteSettingsAdmin,
  updateSiteSettingsAdmin,
  getContactsAdmin,
  updateContactStatusAdmin,
  deleteContactAdmin,
  getPublicJobs,
  getAllJobsAdmin,
  createJobAdmin,
  updateJobAdmin,
  deleteJobAdmin,
  toggleJobStatusAdmin,
  uploadResume,
  submitJobApplication,
  getJobApplicationsAdmin,
  updateJobApplicationStatusAdmin,
  deleteJobApplicationAdmin,
} = require('../controllers/adminController');

// Public endpoints
router.get('/public-settings', getPublicSiteSettings);
router.get('/jobs', getPublicJobs);
router.post('/jobs/apply', uploadResume.single('resume'), submitJobApplication);

// Admin-only overview
router.get('/overview', protect, admin, getAdminOverview);

// Blog & Post Management
router.get('/blogs', protect, admin, getAllAdminBlogs);
router.put('/blogs/:id/status', protect, admin, updateBlogAdminStatus);
router.post('/blogs/bulk', protect, admin, bulkManageBlogs);
router.post('/blogs/run-scheduler', protect, admin, triggerScheduledPublisher);

// Comment Moderation
router.get('/comments', protect, admin, getAllCommentsAdmin);
router.delete('/blogs/:blogId/comments/:commentId', protect, admin, deleteCommentAdmin);

// User & Role Management
router.get('/users', protect, admin, getAllUsersAdmin);
router.post('/users', protect, admin, createUserAdmin);
router.put('/users/:id', protect, admin, updateUserAdmin);
router.delete('/users/:id', protect, admin, deleteUserAdmin);

// Support & Inquiries (Contact Submissions)
router.get('/contacts', protect, admin, getContactsAdmin);
router.put('/contacts/:id', protect, admin, updateContactStatusAdmin);
router.delete('/contacts/:id', protect, admin, deleteContactAdmin);

// Careers & Job Postings (Admin CRUD)
router.get('/jobs/all', protect, admin, getAllJobsAdmin);
router.post('/jobs', protect, admin, createJobAdmin);
router.put('/jobs/:id', protect, admin, updateJobAdmin);
router.delete('/jobs/:id', protect, admin, deleteJobAdmin);
router.put('/jobs/:id/toggle', protect, admin, toggleJobStatusAdmin);

// Candidate Applications Management
router.get('/applications', protect, admin, getJobApplicationsAdmin);
router.put('/applications/:id', protect, admin, updateJobApplicationStatusAdmin);
router.delete('/applications/:id', protect, admin, deleteJobApplicationAdmin);

// Subscribers & Broadcasts
router.get('/subscribers', protect, admin, getSubscribersAdmin);
router.post('/subscribers', protect, admin, addSubscriberAdmin);
router.delete('/subscribers/:id', protect, admin, deleteSubscriberAdmin);
router.post('/announcements', protect, admin, broadcastAnnouncement);

// Community Channels
router.get('/channels', protect, admin, getChannelsAdmin);
router.delete('/channels/:id', protect, admin, deleteChannelAdmin);

// Global Platform Settings
router.get('/settings', protect, admin, getSiteSettingsAdmin);
router.put('/settings', protect, admin, updateSiteSettingsAdmin);

module.exports = router;
