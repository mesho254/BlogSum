const express = require('express');
const router = express.Router();
const { protect, admin } = require('../MiddleWares/authMiddleWare');
const {
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
  getLikeStatus,
  getBookmarkStatus,
  getBlogShareCount,
  getBlockStatus
} = require('../controllers/userController');

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, upload.single('profilePicture'), updateUserProfile);

router.route('/otherProfile/:id', getOtherUserProfile)

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
