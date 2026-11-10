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
  replyToComment,
  likeComment,
  getBookmarkedBlogs,
  getProfileUserBlogs,
  upload,
} = require('../controllers/blogController');

const uploadFields = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'image', maxCount: 5 },
]);

router.route('/')
  .get(getBlogs)
  .post(protect, uploadFields, createBlog);

router.get('/user/blogs', protect, getUserBlogs); 

router.get('/otherBlogs/:id',protect, getProfileUserBlogs)

router.route('/:id')
  .get(getBlogById)
  .put(protect, uploadFields, updateBlog)
  .delete(protect, deleteBlog);

router.route('/:id/like').put(protect, likeBlog);
router.route('/:id/bookmark').put(protect, bookmarkBlog);
router.route('/:id/comment').post(protect, commentOnBlog);
router.route('/:id/comment/:commentId/reply').post(protect, replyToComment);
router.route('/:id/comment/:commentId/like').put(protect, likeComment);
router.route('/:id/share').put(protect, shareBlog);
router.get('/bookmarked', protect, getBookmarkedBlogs);

module.exports = router;
