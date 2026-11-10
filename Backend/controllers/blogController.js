const Blog = require('../Models/Blog');
const User = require('../Models/User');
const Notification = require('../Models/Notification');
const { isAdminUser } = require('../MiddleWares/authMiddleWare');
const cron = require('node-cron');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'blog_images',
    format: async (req, file) => 'jpeg',
    public_id: (req, file) =>
      `${file.originalname.split('.')[0]}_${Date.now()}_${Math.round(Math.random() * 1000)}`,
  },
});

const upload = multer({ storage: storage });

const isBlogPubliclyVisible = (blog) => {
  if (!blog) return false;
  if (blog.status === 'draft') return false;
  const pubTime = blog.publishDate || blog.date;
  if (pubTime && new Date(pubTime) > new Date()) {
    return false;
  }
  return true;
};

const parseStringArrayField = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((s) => String(s).trim()).filter(Boolean);
      }
    } catch {
      // Fallback to comma-separated parsing
    }
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const extractUploadedUrls = (req) => {
  const files = [
    ...(req.files?.images || []),
    ...(req.files?.image || []),
    ...(req.file ? [req.file] : []),
  ];
  return files.map((f) => f.path).filter(Boolean);
};

// In-memory cache for fast (<5ms) blog list responses with background refresh & write invalidation
const blogsCache = {
  data: null,
  updatedAt: 0,
  promise: null,
};

const CACHE_TTL_MS = 15 * 1000; // Refresh in background after 15s

const populateBlogQuery = (query) =>
  query
    .populate('author', 'username profilePicture email location followers following roles isVerified')
    .populate('comments.user', 'username profilePicture roles isVerified')
    .populate('comments.replies.user', 'username profilePicture roles isVerified');

const refreshBlogsCache = async () => {
  if (blogsCache.promise) {
    return blogsCache.promise;
  }
  blogsCache.promise = populateBlogQuery(Blog.find())
    .sort({ date: -1, _id: -1 })
    .lean()
    .then((blogs) => {
      blogsCache.data = blogs;
      blogsCache.updatedAt = Date.now();
      blogsCache.promise = null;
      return blogs;
    })
    .catch((err) => {
      blogsCache.promise = null;
      throw err;
    });
  return blogsCache.promise;
};

const updateBlogInCache = (populatedBlog) => {
  if (!populatedBlog || !populatedBlog._id) return;
  if (Array.isArray(blogsCache.data)) {
    const idx = blogsCache.data.findIndex((b) => String(b._id) === String(populatedBlog._id));
    if (idx !== -1) {
      blogsCache.data[idx] = populatedBlog;
    } else {
      blogsCache.data = [populatedBlog, ...blogsCache.data];
    }
    blogsCache.updatedAt = Date.now();
  }
};

const invalidateBlogsCache = () => {
  blogsCache.updatedAt = 0;
  refreshBlogsCache().catch((err) => console.error('Background blog cache refresh failed:', err));
};

const getAllBlogsFromCacheOrDb = async (forceRefresh = false) => {
  if (!forceRefresh && Array.isArray(blogsCache.data)) {
    if (Date.now() - blogsCache.updatedAt > CACHE_TTL_MS) {
      refreshBlogsCache().catch((err) =>
        console.error('Background blog cache refresh error:', err)
      );
    }
    return blogsCache.data;
  }
  return refreshBlogsCache();
};

// Background scheduler job: checks for scheduled blogs whose publishDate has arrived,
// flips status from 'scheduled' -> 'published' in MongoDB, notifies the author & followers,
// and refreshes the in-memory blogs cache.
let isPublishingScheduled = false;
const publishDueScheduledBlogs = async (ioInstance = null) => {
  if (isPublishingScheduled) return;
  isPublishingScheduled = true;
  try {
    const now = new Date();
    const dueBlogs = await Blog.find({
      status: 'scheduled',
      $or: [
        { publishDate: { $lte: now } },
        { publishDate: { $exists: false }, date: { $lte: now } },
      ],
    }).populate('author', 'username followers');

    if (dueBlogs.length === 0) {
      return;
    }

    const dueIds = dueBlogs.map((b) => b._id);
    await Blog.updateMany(
      { _id: { $in: dueIds } },
      { $set: { status: 'published' } }
    );

    // Send notifications to author & followers for each newly published blog
    for (const dueBlog of dueBlogs) {
      try {
        if (dueBlog.author?._id) {
          await Notification.create({
            user: dueBlog.author._id,
            message: `Your scheduled story "${dueBlog.title}" is now published live!`,
          });

          const followerIds = Array.isArray(dueBlog.author.followers)
            ? dueBlog.author.followers
            : [];
          if (followerIds.length > 0) {
            const followerDocs = followerIds.map((fid) => ({
              user: fid,
              message: `${dueBlog.author.username || 'An author you follow'} published a new story: "${dueBlog.title}"`,
            }));
            await Notification.insertMany(followerDocs);
          }

          if (ioInstance) {
            ioInstance.emit('scheduledBlogPublished', {
              blogId: dueBlog._id,
              title: dueBlog.title,
            });
          }
        }
      } catch (notifErr) {
        console.error('Error creating scheduled publish notification:', notifErr);
      }
    }

    await refreshBlogsCache();
    console.log(
      `[Scheduler] Published ${dueBlogs.length} scheduled blog(s) at ${now.toISOString()}`
    );
  } catch (err) {
    console.error('[Scheduler] Error checking scheduled blogs:', err);
  } finally {
    isPublishingScheduled = false;
  }
};

let scheduledCronTask = null;
const startScheduledBlogsCron = (ioInstance = null, cronExpression = '*/30 * * * * *') => {
  if (scheduledCronTask) {
    scheduledCronTask.stop();
  }
  // Run immediately once on startup, then via node-cron every 30 seconds
  publishDueScheduledBlogs(ioInstance);
  scheduledCronTask = cron.schedule(cronExpression, () => {
    publishDueScheduledBlogs(ioInstance);
  });
  return scheduledCronTask;
};

const getBlogs = async (req, res) => {
  try {
    // If any cached scheduled blog has reached its publishDate, trigger DB status transition
    if (
      Array.isArray(blogsCache.data) &&
      blogsCache.data.some(
        (b) =>
          b.status === 'scheduled' &&
          new Date(b.publishDate || b.date) <= new Date()
      )
    ) {
      publishDueScheduledBlogs(req.app?.get('io'));
    }

    if (req.user) {
      const userId = req.user._id;
      const blogs = await populateBlogQuery(Blog.find({ bookmarks: userId }))
        .sort({ date: -1, _id: -1 })
        .lean();
      return res.json(blogs.filter(isBlogPubliclyVisible));
    }

    // Serve immediately from memory cache if available, and revalidate in background when stale
    if (blogsCache.data) {
      if (Date.now() - blogsCache.updatedAt > CACHE_TTL_MS) {
        refreshBlogsCache().catch((err) => console.error('Background blog cache refresh error:', err));
      }
      return res.json(blogsCache.data.filter(isBlogPubliclyVisible));
    }

    const blogs = await refreshBlogsCache();
    res.json(blogs.filter(isBlogPubliclyVisible));
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ message: 'Server error while fetching blogs' });
  }
};


const getBlogById = async (req, res) => {
  try {
    const blog = await populateBlogQuery(Blog.findById(req.params.id)).lean();

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getProfileUserBlogs = async (req, res) => {
  try {
    if (req.user) {
      const userId = req.params.id;
      const userBlogs = await populateBlogQuery(Blog.find({ author: userId }))
        .sort({ date: -1, _id: -1 })
        .lean();
      const visibleBlogs =
        String(req.user._id) === String(userId) || isAdminUser(req.user)
          ? userBlogs
          : userBlogs.filter(isBlogPubliclyVisible);
      res.json(visibleBlogs);
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  } catch (error) {
    console.error('Error fetching user blogs:', error);
    res.status(500).json({ message: 'Server error while fetching user blogs' });
  }
};


const createBlog = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      readTime,
      category,
      content,
      allowComments,
      publishDate,
      date,
      status,
    } = req.body;

    const uploadedUrls = extractUploadedUrls(req);
    const existingImages = parseStringArrayField(req.body.existingImages);
    const allImages = [...existingImages, ...uploadedUrls].slice(0, 5);
    const primaryImage = allImages[0] || '';
    const parsedTags = parseStringArrayField(req.body.tags).slice(0, 10);

    const rawPublishDate = publishDate || date;
    const effectivePublishDate = rawPublishDate ? new Date(rawPublishDate) : new Date();
    const isFuturePublish = effectivePublishDate > new Date();
    const effectiveStatus =
      status === 'draft' ? 'draft' : isFuturePublish ? 'scheduled' : 'published';

    const blog = new Blog({
      title,
      subtitle: subtitle || '',
      readTime,
      category,
      content,
      imageUrl: primaryImage,
      images: allImages,
      tags: parsedTags,
      author: req.user._id,
      allowComments:
        allowComments === 'false' ? false : allowComments !== undefined ? Boolean(allowComments) : true,
      date: effectivePublishDate,
      publishDate: effectivePublishDate,
      status: effectiveStatus,
    });

    const createdBlog = await blog.save();
    const populatedCreated = await populateBlogQuery(Blog.findById(createdBlog._id)).lean();

    if (effectiveStatus === 'published' && populatedCreated?.author) {
      const followerIds = Array.isArray(populatedCreated.author.followers)
        ? populatedCreated.author.followers
        : [];
      if (followerIds.length > 0) {
        const followerDocs = followerIds.map((fid) => ({
          user: fid,
          message: `${populatedCreated.author.username || 'An author you follow'} published a new story: "${createdBlog.title}"`,
        }));
        Notification.insertMany(followerDocs).catch((err) =>
          console.error('Error notifying followers on publish:', err)
        );
      }
    }

    if (populatedCreated) {
      updateBlogInCache(populatedCreated);
    }
    invalidateBlogsCache();

    res.status(201).json(populatedCreated || createdBlog);
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ message: error.message || 'Server error creating blog' });
  }
};

const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      subtitle,
      readTime,
      category,
      content,
      allowComments,
      publishDate,
      date,
      status,
    } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (blog.author.toString() !== req.user._id.toString() && !isAdminUser(req.user)) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    blog.title = title !== undefined ? title : blog.title;
    if (subtitle !== undefined) blog.subtitle = subtitle;
    blog.readTime = readTime !== undefined ? readTime : blog.readTime;
    blog.category = category || blog.category;
    blog.content = content !== undefined ? content : blog.content;
    if (allowComments !== undefined) {
      blog.allowComments = allowComments === 'false' ? false : Boolean(allowComments);
    }
    if (isAdminUser(req.user)) {
      if (req.body.isFeatured !== undefined) {
        blog.isFeatured = req.body.isFeatured === 'false' ? false : Boolean(req.body.isFeatured);
      }
      if (req.body.isPinned !== undefined) {
        blog.isPinned = req.body.isPinned === 'false' ? false : Boolean(req.body.isPinned);
      }
    }

    if (req.body.tags !== undefined) {
      blog.tags = parseStringArrayField(req.body.tags).slice(0, 10);
    }

    const uploadedUrls = extractUploadedUrls(req);
    const hasExistingImagesField = req.body.existingImages !== undefined;
    const existingImages = hasExistingImagesField
      ? parseStringArrayField(req.body.existingImages)
      : Array.isArray(blog.images) && blog.images.length > 0
      ? blog.images
      : blog.imageUrl
      ? [blog.imageUrl]
      : [];

    if (uploadedUrls.length > 0 || hasExistingImagesField) {
      const mergedImages = [...existingImages, ...uploadedUrls].slice(0, 5);
      blog.images = mergedImages;
      blog.imageUrl = mergedImages[0] || blog.imageUrl;
    }

    const rawPublishDate = publishDate || date;
    if (rawPublishDate) {
      const parsedDate = new Date(rawPublishDate);
      if (!isNaN(parsedDate.getTime())) {
        blog.publishDate = parsedDate;
        blog.date = parsedDate;
      }
    }

    const effectivePub = blog.publishDate || blog.date;
    const isFuture = effectivePub && new Date(effectivePub) > new Date();
    if (status === 'draft') {
      blog.status = 'draft';
    } else if (status === 'published' && !isFuture) {
      blog.status = 'published';
    } else {
      blog.status = isFuture ? 'scheduled' : 'published';
    }

    const updatedBlog = await blog.save();
    const populatedUpdated = await populateBlogQuery(Blog.findById(updatedBlog._id)).lean();
    if (populatedUpdated) {
      updateBlogInCache(populatedUpdated);
    }
    invalidateBlogsCache();
    res.json(populatedUpdated || updatedBlog);
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ message: error.message || 'Server error updating blog' });
  }
};

const deleteBlog = async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findById(id);
  if (!blog) {
    return res.status(404).json({ message: 'Blog not found' });
  }

  if (blog.author.toString() !== req.user._id.toString() && !isAdminUser(req.user)) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  await blog.deleteOne();
  if (blogsCache.data) {
    blogsCache.data = blogsCache.data.filter((b) => String(b._id) !== String(id));
  }
  invalidateBlogsCache();
  res.json({ message: 'Blog removed' });
};

const VALID_REACTIONS = ['like', 'love', 'celebrate', 'support', 'insightful', 'funny'];

const likeBlog = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const requestedReaction = req.body?.reactionType;
  const reactionType = VALID_REACTIONS.includes(requestedReaction) ? requestedReaction : null;

  try {
    const blog = await Blog.findById(id);
    const user = await User.findById(userId);

    if (!blog || !user) {
      return res.status(404).json({ message: 'Blog or user not found' });
    }

    if (!Array.isArray(blog.reactions)) {
      blog.reactions = [];
    }

    // Ensure any legacy likes have a matching entry in blog.reactions
    blog.likes.forEach((likedUserId) => {
      if (!blog.reactions.some((r) => String(r.user) === String(likedUserId))) {
        blog.reactions.push({ user: likedUserId, type: 'love' });
      }
    });

    const userStr = String(userId);
    const blogIdStr = String(id);
    const alreadyInLikes = blog.likes.some((like) => String(like) === userStr);
    const existingReactionIdx = blog.reactions.findIndex((r) => String(r.user) === userStr);
    const currentReactionType = existingReactionIdx !== -1 ? blog.reactions[existingReactionIdx].type : null;

    let userLiked = false;
    let userReaction = null;

    if (reactionType) {
      // User selected a specific reaction from the LinkedIn reaction bar
      if (alreadyInLikes && currentReactionType === reactionType && req.body?.toggleOffIfSame !== false) {
        // Clicking the same active reaction removes it
        blog.likes = blog.likes.filter((like) => String(like) !== userStr);
        blog.reactions = blog.reactions.filter((r) => String(r.user) !== userStr);
        user.likedBlogs = user.likedBlogs.filter((bId) => String(bId) !== blogIdStr);
        userLiked = false;
        userReaction = null;
      } else {
        // Set or switch to the chosen reaction type
        if (!alreadyInLikes) {
          blog.likes.push(userId);
        }
        if (existingReactionIdx !== -1) {
          blog.reactions[existingReactionIdx].type = reactionType;
        } else {
          blog.reactions.push({ user: userId, type: reactionType });
        }
        if (!user.likedBlogs.some((bId) => String(bId) === blogIdStr)) {
          user.likedBlogs.push(id);
        }
        userLiked = true;
        userReaction = reactionType;
      }
    } else {
      // Standard toggle click on the main button
      if (alreadyInLikes) {
        blog.likes = blog.likes.filter((like) => String(like) !== userStr);
        blog.reactions = blog.reactions.filter((r) => String(r.user) !== userStr);
        user.likedBlogs = user.likedBlogs.filter((bId) => String(bId) !== blogIdStr);
        userLiked = false;
        userReaction = null;
      } else {
        blog.likes.push(userId);
        blog.reactions.push({ user: userId, type: 'love' });
        if (!user.likedBlogs.some((bId) => String(bId) === blogIdStr)) {
          user.likedBlogs.push(id);
        }
        userLiked = true;
        userReaction = 'love';
      }
    }

    await Promise.all([blog.save(), user.save()]);

    const updatedBlog = await populateBlogQuery(Blog.findById(blog._id)).lean();
    updateBlogInCache(updatedBlog);
    invalidateBlogsCache();

    res.json({
      ...updatedBlog,
      userLiked,
      userReaction,
    });
  } catch (error) {
    console.error('Error liking blog:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const bookmarkBlog = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const blog = await Blog.findById(id);
    const user = await User.findById(userId);

    if (!blog || !user) {
      return res.status(404).json({ message: 'Blog or user not found' });
    }

    const userStr = String(userId);
    const blogIdStr = String(id);
    const alreadyBookmarked = blog.bookmarks.some((b) => String(b) === userStr);

    if (alreadyBookmarked) {
      blog.bookmarks = blog.bookmarks.filter((bookmark) => String(bookmark) !== userStr);
      user.bookmarkedBlogs = user.bookmarkedBlogs.filter((bookmark) => String(bookmark) !== blogIdStr);
    } else {
      blog.bookmarks.push(userId);
      if (!user.bookmarkedBlogs.some((bId) => String(bId) === blogIdStr)) {
        user.bookmarkedBlogs.push(id);
      }
    }

    await Promise.all([blog.save(), user.save()]);

    const populatedBlog = await populateBlogQuery(Blog.findById(blog._id)).lean();
    updateBlogInCache(populatedBlog);
    invalidateBlogsCache();

    res.json({
      ...populatedBlog,
      userBookmarked: !alreadyBookmarked,
    });
  } catch (error) {
    console.error('Error bookmarking blog:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const shareBlog = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const blog = await Blog.findById(id);
    const user = await User.findById(userId);

    if (!blog || !user) {
      return res.status(404).json({ message: 'Blog or user not found' });
    }

    const userStr = String(userId);
    const blogIdStr = String(id);
    if (!blog.shares.some((share) => String(share) === userStr)) {
      blog.shares.push(userId);
    }
    if (!user.MyShares.some((share) => String(share) === blogIdStr)) {
      user.MyShares.push(id);
    }

    await Promise.all([blog.save(), user.save()]);

    const populatedBlog = await populateBlogQuery(Blog.findById(blog._id)).lean();
    updateBlogInCache(populatedBlog);
    invalidateBlogsCache();
    res.json(populatedBlog);
  } catch (error) {
    console.error('Error sharing blog:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const commentOnBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const file = req.file;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const commentData = { user: req.user._id, comment, date: new Date(), likes: [], replies: [] };

    if (file) {
      commentData.attachment = file.path;
    }

    blog.comments.push(commentData);

    const updatedBlog = await blog.save();
    const populatedBlog = await populateBlogQuery(Blog.findById(updatedBlog._id)).lean();

    updateBlogInCache(populatedBlog);
    invalidateBlogsCache();
    res.json(populatedBlog.comments);
  } catch (error) {
    console.error('Error commenting on blog:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const replyToComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const targetComment = blog.comments.id(commentId);
    if (!targetComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (!Array.isArray(targetComment.replies)) {
      targetComment.replies = [];
    }

    targetComment.replies.push({
      user: req.user._id,
      comment: comment.trim(),
      date: new Date(),
      likes: [],
    });

    await blog.save();
    const populatedBlog = await populateBlogQuery(Blog.findById(blog._id)).lean();

    updateBlogInCache(populatedBlog);
    invalidateBlogsCache();
    res.json(populatedBlog.comments);
  } catch (error) {
    console.error('Error replying to comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const likeComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { replyId } = req.body || {};
    const userId = req.user._id;
    const userStr = String(userId);

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const targetComment = blog.comments.id(commentId);
    if (!targetComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (replyId) {
      const targetReply = targetComment.replies?.id(replyId);
      if (!targetReply) {
        return res.status(404).json({ message: 'Reply not found' });
      }
      if (!Array.isArray(targetReply.likes)) targetReply.likes = [];
      if (targetReply.likes.some((u) => String(u) === userStr)) {
        targetReply.likes = targetReply.likes.filter((u) => String(u) !== userStr);
      } else {
        targetReply.likes.push(userId);
      }
    } else {
      if (!Array.isArray(targetComment.likes)) targetComment.likes = [];
      if (targetComment.likes.some((u) => String(u) === userStr)) {
        targetComment.likes = targetComment.likes.filter((u) => String(u) !== userStr);
      } else {
        targetComment.likes.push(userId);
      }
    }

    await blog.save();
    const populatedBlog = await populateBlogQuery(Blog.findById(blog._id)).lean();

    updateBlogInCache(populatedBlog);
    invalidateBlogsCache();
    res.json(populatedBlog.comments);
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getBookmarkedBlogs = async (req, res) => {
  try {
    const blogs = await populateBlogQuery(Blog.find({ bookmarks: req.user._id }))
      .sort({ date: -1, _id: -1 })
      .lean();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserBlogs = async (req, res) => {
  try {
    if (req.user) {
      const userId = req.user._id;
      const userBlogs = await populateBlogQuery(Blog.find({ author: userId }))
        .sort({ date: -1, _id: -1 })
        .lean();
      res.json(userBlogs);
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  } catch (error) {
    console.error('Error fetching user blogs:', error);
    res.status(500).json({ message: 'Server error while fetching user blogs' });
  }
};

module.exports = {
  getUserBlogs,
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  likeBlog,
  bookmarkBlog,
  commentOnBlog,
  replyToComment,
  likeComment,
  shareBlog,
  getBookmarkedBlogs,
  getProfileUserBlogs,
  refreshBlogsCache,
  invalidateBlogsCache,
  getAllBlogsFromCacheOrDb,
  populateBlogQuery,
  publishDueScheduledBlogs,
  startScheduledBlogsCron,
  upload,
};
