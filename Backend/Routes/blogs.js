const express = require('express');
const router = express.Router();
const { protect } = require('../MiddleWares/authMiddleWare');
const {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  likeBlog,
  getUserBlogs,
  bookmarkBlog,
  shareBlog,
  commentOnBlog,
  getBookmarkedBlogs,
  getProfileUserBlogs,
  upload,
} = require('../controllers/blogController');

router.route('/')
  .get(getBlogs)
  .post(protect, upload.single('image'), createBlog);

router.get('/user/blogs', protect, getUserBlogs); 

router.get('/otherBlogs/:id',protect, getProfileUserBlogs)

router.route('/:id')
  .get(getBlogById)
  .put(protect, upload.single('image'), updateBlog)
  .delete(protect, deleteBlog);

router.route('/:id/like').put(protect, likeBlog);
router.route('/:id/bookmark').put(protect, bookmarkBlog);
router.route('/:id/comment').post(protect, commentOnBlog);
router.route('/:id/share').put(protect, shareBlog);
// router.post('/:commentId/comment/:id/reply', protect, uploadCommentAttachment.single('attachment'), replyToComment); // Updated
router.get('/bookmarked', protect, getBookmarkedBlogs);

module.exports = router;
