const express = require('express');
const router = express.Router();
const { protect, admin, optionalAuth } = require('../MiddleWares/authMiddleWare');
const {
  searchUsersForMention,
  getUserProfile,
  getUserById,
  updateUserProfile,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
  getBookmarkedBlogs,
  getFollowState,
  upload,
  getUser,
  getLikedBlogs,
  getMessages,
  getOtherLikedBlogs,
  getOtherUserProfile,
  getPublicAuthorProfile,
  getLikeStatus,
  getBookmarkStatus,
  getBlogShareCount,
  getBlockStatus,
  exportUserData,
  getPayoutAndMembership,
  updatePayoutSettings,
  connectStripeAccount,
  updateMembership,
} = require('../controllers/userController');
const { getDeletionPreview, deleteMyAccount } = require('../controllers/accountController');

router.get('/mention-search', optionalAuth, searchUsersForMention);
router.get('/export-my-data', protect, exportUserData);

// Creator Monetization, Stripe Connect & Membership Tiers
router.get('/payout-and-membership', protect, getPayoutAndMembership);
router.put('/payout-settings', protect, updatePayoutSettings);
router.post('/stripe-connect', protect, connectStripeAccount);
router.post('/membership-tier', protect, updateMembership);

// GDPR Article 17 — self-service account deletion
router.get('/me/deletion-preview', protect, getDeletionPreview);
router.delete('/me', protect, deleteMyAccount);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, upload.single('profilePicture'), updateUserProfile);

router.get('/otherProfile/:id', getOtherUserProfile);
router.get('/public-profile/:id', getPublicAuthorProfile);

router.get('/bookmarked-blogs', protect, getBookmarkedBlogs);
router.get('/liked-blogs', protect, getLikedBlogs)
router.get('/otherLiked/:id', protect, getOtherLikedBlogs)
router.get('/messages', protect, getMessages)


router.route('/:id')
  .get(protect, getUserById)
  .put(protect, followUser);

router.route('/user/:id').get(protect, getUser)


  router.route('/:id/follow-state')
  .get(protect, getFollowState);

  router.get('/:id/like-status', protect, getLikeStatus);
  router.get('/:id/bookmark-status', protect, getBookmarkStatus);
  router.get('/:id/share-count', protect, getBlogShareCount);

router.route('/:id/follow').put(protect, followUser);
router.route('/:id/unfollow').put(protect, unfollowUser);
router.route('/:id/block').put(protect, blockUser);
router.route('/:id/unblock').put(protect, unblockUser);
router.route('/:id/blockStatus').get(protect, getBlockStatus)


module.exports = router;
