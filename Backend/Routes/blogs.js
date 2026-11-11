const express = require('express');
const router = express.Router();
const Blog = require('../Models/Blog');
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

router.get('/sitemap.xml', async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' }).select('_id date publishDate updatedAt').lean();
    const baseUrl = process.env.CLIENT_URL || 'https://blog-sum.vercel.app';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    const staticPages = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/about', priority: '0.6', changefreq: 'monthly' },
      { path: '/careers', priority: '0.6', changefreq: 'weekly' },
      { path: '/help', priority: '0.5', changefreq: 'monthly' },
      { path: '/doc', priority: '0.5', changefreq: 'monthly' },
      { path: '/terms-of-service', priority: '0.3', changefreq: 'monthly' },
      { path: '/privacypolicy', priority: '0.3', changefreq: 'monthly' },
    ];

    for (const page of staticPages) {
      xml += `  <url>\n    <loc>${baseUrl}${page.path}</loc>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
    }

    for (const blog of blogs) {
      const lastmod = blog.updatedAt || blog.publishDate || blog.date || new Date();
      xml += `  <url>\n    <loc>${baseUrl}/blog/${blog._id}</loc>\n    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }

    xml += `</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating sitemap.xml:', error);
    return res.status(500).send('Error generating sitemap');
  }
});

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
