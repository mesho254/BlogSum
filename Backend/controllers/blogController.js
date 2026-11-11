const Blog = require('../Models/Blog');
const User = require('../Models/User');
const Notification = require('../Models/Notification');
const BlogRevision = require('../Models/BlogRevision');
const { isAdminUser } = require('../MiddleWares/authMiddleWare');
const {
  sanitizeStoryContent,
  sanitizeCommentContent,
  sanitizePlainText,
} = require('../Utils/sanitizer');
const { generateAiCopilotInsights } = require('../Utils/aiCopilot');
const { dispatchWebhookEvent } = require('../Utils/webhookDispatcher');
const { getCached, setCached } = require('../Utils/cacheEngine');
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

    const cleanTitle = sanitizePlainText(title);
    const cleanSubtitle = sanitizePlainText(subtitle || '');
    const cleanCategory = sanitizePlainText(category || 'Technology');
    const rawContent = sanitizeStoryContent(content || '');
    const cleanContent = rawContent && rawContent.trim() ? rawContent : '<p><br></p>';
    const cleanTags = parsedTags.map((t) => sanitizePlainText(t)).filter(Boolean);

    const blog = new Blog({
      title: cleanTitle,
      subtitle: cleanSubtitle,
      readTime: Number(readTime) || 3,
      category: cleanCategory,
      content: cleanContent,
      imageUrl: primaryImage,
      images: allImages,
      tags: cleanTags,
      author: req.user._id,
      allowComments:
        allowComments === 'false' ? false : allowComments !== undefined ? Boolean(allowComments) : true,
      isSponsored: req.body.isSponsored === 'true' || req.body.isSponsored === true,
      sponsorName: req.body.sponsorName ? sanitizePlainText(req.body.sponsorName) : '',
      accessLevel: req.body.accessLevel || (req.body.isMembersOnly === 'true' || req.body.isMembersOnly === true ? 'members' : 'public'),
      isMembersOnly: req.body.isMembersOnly === 'true' || req.body.isMembersOnly === true || req.body.accessLevel === 'members',
      digitalProduct: {
        enabled: req.body.digitalProductEnabled === 'true' || req.body.digitalProductEnabled === true,
        name: sanitizePlainText(req.body.digitalProductName || ''),
        downloadUrl: req.body.digitalProductUrl || '',
        price: Number(req.body.digitalProductPrice) || 0,
      },
      date: effectivePublishDate,
      publishDate: effectivePublishDate,
      status: effectiveStatus,
    });

    const createdBlog = await blog.save();
    recordBlogRevision(createdBlog, req.user._id, 'Initial save / publication').catch((err) =>
      console.error('Error saving initial revision:', err)
    );
    const populatedCreated = await populateBlogQuery(Blog.findById(createdBlog._id)).lean();

    if (effectiveStatus === 'published') {
      dispatchWebhookEvent(req.user._id, 'story.published', {
        id: createdBlog._id,
        title: createdBlog.title,
        category: createdBlog.category,
        readTime: createdBlog.readTime,
        url: `${process.env.CLIENT_URL || 'https://blog-sum.vercel.app'}/blog/${createdBlog._id}`,
        status: createdBlog.status,
        accessLevel: createdBlog.accessLevel,
        isMembersOnly: createdBlog.isMembersOnly,
      }).catch(() => {});
    }

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

    blog.title = title !== undefined ? sanitizePlainText(title) : blog.title;
    if (subtitle !== undefined) blog.subtitle = sanitizePlainText(subtitle);
    blog.readTime = readTime !== undefined ? Number(readTime) || blog.readTime : blog.readTime;
    if (category) blog.category = sanitizePlainText(category);
    if (content !== undefined) blog.content = sanitizeStoryContent(content);
    if (allowComments !== undefined) {
      blog.allowComments = allowComments === 'false' ? false : Boolean(allowComments);
    }
    if (req.body.isSponsored !== undefined) {
      blog.isSponsored = req.body.isSponsored === 'true' || req.body.isSponsored === true;
      blog.sponsorName = blog.isSponsored && req.body.sponsorName ? sanitizePlainText(req.body.sponsorName) : '';
    }
    if (req.body.accessLevel !== undefined) {
      blog.accessLevel = req.body.accessLevel;
      blog.isMembersOnly = req.body.accessLevel === 'members';
    } else if (req.body.isMembersOnly !== undefined) {
      blog.isMembersOnly = req.body.isMembersOnly === 'true' || req.body.isMembersOnly === true;
      blog.accessLevel = blog.isMembersOnly ? 'members' : 'public';
    }
    if (req.body.digitalProductEnabled !== undefined) {
      blog.digitalProduct = {
        enabled: req.body.digitalProductEnabled === 'true' || req.body.digitalProductEnabled === true,
        name: sanitizePlainText(req.body.digitalProductName || ''),
        downloadUrl: req.body.digitalProductUrl || '',
        price: Number(req.body.digitalProductPrice) || 0,
      };
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
      blog.tags = parseStringArrayField(req.body.tags).map((t) => sanitizePlainText(t)).filter(Boolean).slice(0, 10);
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
    dispatchWebhookEvent(req.user._id, 'story.updated', {
      id: updatedBlog._id,
      title: updatedBlog.title,
      category: updatedBlog.category,
      readTime: updatedBlog.readTime,
      url: `${process.env.CLIENT_URL || 'https://blog-sum.vercel.app'}/blog/${updatedBlog._id}`,
      status: updatedBlog.status,
    }).catch(() => {});
    recordBlogRevision(updatedBlog, req.user._id, 'Story updated').catch((err) =>
      console.error('Error saving update revision:', err)
    );
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

    if (userLiked && blog.author && String(blog.author) !== userStr) {
      try {
        const reactionLabel = userReaction ? `${userReaction} reaction` : 'reaction';
        const notif = await Notification.create({
          user: blog.author,
          message: `${user.username || 'A reader'} reacted (${reactionLabel}) to your story "${blog.title || 'Untitled'}"`,
        });
        const io = req.app.get('io');
        if (io) {
          io.to(String(blog.author)).emit('newNotification', notif);
        }
      } catch (notifErr) {
        console.error('Error creating like notification:', notifErr);
      }
    }

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


const dispatchMentionNotifications = async (text, senderUser, blogTitle, blogId, req) => {
  if (!text || typeof text !== 'string') return;
  const mentionMatches = text.match(/@([a-zA-Z0-9_]+)/g);
  if (!mentionMatches || mentionMatches.length === 0) return;

  const rawUsernames = Array.from(new Set(mentionMatches.map((m) => m.slice(1).toLowerCase())));
  try {
    const mentionedUsers = await User.find({
      username: { $in: rawUsernames.map((u) => new RegExp(`^${u}$`, 'i')) },
      _id: { $ne: senderUser._id },
    }).select('_id username');

    if (!mentionedUsers || mentionedUsers.length === 0) return;

    const io = req.app.get('io');
    for (const targetUser of mentionedUsers) {
      const notif = await Notification.create({
        user: targetUser._id,
        message: `@${senderUser.username || 'Someone'} mentioned you in a discussion on "${blogTitle || 'a story'}"`,
      });
      if (io) {
        io.to(String(targetUser._id)).emit('newNotification', notif);
      }
    }
  } catch (err) {
    console.warn('Error dispatching mention notifications:', err.message);
  }
};

const commentOnBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const file = req.file;

    const attachmentUrl = (req.body.attachment || req.body.imageUrl || file?.path || '').trim();
    const cleanComment = sanitizeCommentContent(comment);

    if (!cleanComment && !attachmentUrl) {
      return res.status(400).json({ message: 'Comment content or attachment is required' });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const commentData = {
      user: req.user._id,
      comment: cleanComment || '',
      attachment: attachmentUrl || '',
      date: new Date(),
      likes: [],
      replies: [],
    };

    blog.comments.push(commentData);

    const updatedBlog = await blog.save();
    const populatedBlog = await populateBlogQuery(Blog.findById(updatedBlog._id)).lean();

    updateBlogInCache(populatedBlog);
    invalidateBlogsCache();

    if (blog.author && String(blog.author) !== String(req.user._id)) {
      try {
        const notif = await Notification.create({
          user: blog.author,
          message: `${req.user.username || 'A reader'} commented on your story "${blog.title || 'Untitled'}"`,
        });
        const io = req.app.get('io');
        if (io) {
          io.to(String(blog.author)).emit('newNotification', notif);
        }
      } catch (notifErr) {
        console.error('Error creating comment notification:', notifErr);
      }
    }

    // Trigger @mention notifications
    if (cleanComment) {
      dispatchMentionNotifications(cleanComment, req.user, blog.title, blog._id, req);
    }

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
    const file = req.file;

    const attachmentUrl = (req.body.attachment || req.body.imageUrl || file?.path || '').trim();
    const cleanReply = sanitizeCommentContent(comment);

    if (!cleanReply && !attachmentUrl) {
      return res.status(400).json({ message: 'Reply content or attachment is required' });
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
      comment: cleanReply || '',
      attachment: attachmentUrl || '',
      date: new Date(),
      likes: [],
    });

    await blog.save();
    const populatedBlog = await populateBlogQuery(Blog.findById(blog._id)).lean();

    updateBlogInCache(populatedBlog);
    invalidateBlogsCache();

    if (targetComment.user && String(targetComment.user) !== String(req.user._id)) {
      try {
        const notif = await Notification.create({
          user: targetComment.user,
          message: `${req.user.username || 'A reader'} replied to your comment on "${blog.title || 'Untitled'}"`,
        });
        const io = req.app.get('io');
        if (io) {
          io.to(String(targetComment.user)).emit('newNotification', notif);
        }
      } catch (notifErr) {
        console.error('Error creating reply notification:', notifErr);
      }
    }

    // Trigger @mention notifications
    if (cleanReply) {
      dispatchMentionNotifications(cleanReply, req.user, blog.title, blog._id, req);
    }

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

    if (targetComment.user && String(targetComment.user) !== String(req.user._id)) {
      try {
        const notif = await Notification.create({
          user: targetComment.user,
          message: `${req.user.username || 'A reader'} liked your comment on "${blog.title || 'Untitled'}"`,
        });
        const io = req.app.get('io');
        if (io) {
          io.to(String(targetComment.user)).emit('newNotification', notif);
        }
      } catch (notifErr) {
        console.error('Error creating comment like notification:', notifErr);
      }
    }

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

const recordBlogRevision = async (blogDoc, authorId, summary = 'Story updated') => {
  try {
    if (!blogDoc || !blogDoc._id) return null;
    const count = await BlogRevision.countDocuments({ blog: blogDoc._id });
    const cleanBody = (blogDoc.content || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const wordCount = cleanBody ? cleanBody.split(/\s+/).filter(Boolean).length : 0;

    const revision = await BlogRevision.create({
      blog: blogDoc._id,
      author: authorId || blogDoc.author,
      title: blogDoc.title || 'Untitled',
      subtitle: blogDoc.subtitle || '',
      content: blogDoc.content || '',
      category: blogDoc.category || 'Technology',
      tags: blogDoc.tags || [],
      wordCount,
      summary,
      versionNumber: count + 1,
    });
    return revision;
  } catch (err) {
    console.error('Error recording blog revision snapshot:', err);
    return null;
  }
};

const autoSaveDraft = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      blogId,
      title,
      subtitle,
      content,
      category,
      tags,
      readTime,
      imageCredit,
    } = req.body;

    const cleanTitle = sanitizePlainText(title || 'Untitled Draft');
    const cleanSubtitle = sanitizePlainText(subtitle || '');
    const cleanCategory = sanitizePlainText(category || 'Technology');
    const rawContent = sanitizeStoryContent(content || '');
    const cleanContent = rawContent && rawContent.trim() ? rawContent : '<p><br></p>';
    const cleanImageCredit = sanitizePlainText(imageCredit || '');
    const parsedTags = Array.isArray(tags)
      ? tags.map((t) => sanitizePlainText(t)).filter(Boolean).slice(0, 10)
      : [];

    let blog;
    if (blogId) {
      blog = await Blog.findById(blogId);
      if (blog) {
        if (String(blog.author) !== String(userId) && !isAdminUser(req.user)) {
          return res.status(403).json({ message: 'Not authorized to edit this draft' });
        }
        blog.title = cleanTitle;
        blog.subtitle = cleanSubtitle;
        blog.category = cleanCategory;
        blog.content = cleanContent;
        blog.imageCredit = cleanImageCredit;
        blog.tags = parsedTags;
        if (readTime) blog.readTime = Number(readTime) || blog.readTime;
        await blog.save();
      }
    }

    if (!blog) {
      blog = new Blog({
        title: cleanTitle,
        subtitle: cleanSubtitle,
        category: cleanCategory,
        content: cleanContent,
        imageCredit: cleanImageCredit,
        tags: parsedTags,
        readTime: Number(readTime) || 3,
        author: userId,
        status: 'draft',
      });
      await blog.save();
    }

    res.json({
      success: true,
      draftId: blog._id,
      savedAt: new Date().toISOString(),
      message: 'Draft auto-saved successfully',
    });
  } catch (err) {
    console.error('Error in autoSaveDraft:', err);
    res.status(500).json({ message: 'Failed to auto-save draft' });
  }
};

const getBlogRevisions = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    if (String(blog.author) !== String(req.user._id) && !isAdminUser(req.user)) {
      return res.status(403).json({ message: 'Not authorized to view revisions' });
    }

    const revisions = await BlogRevision.find({ blog: id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json(revisions);
  } catch (err) {
    console.error('Error fetching blog revisions:', err);
    res.status(500).json({ message: 'Server error fetching revisions' });
  }
};

const restoreBlogRevision = async (req, res) => {
  try {
    const { id, revisionId } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    if (String(blog.author) !== String(req.user._id) && !isAdminUser(req.user)) {
      return res.status(403).json({ message: 'Not authorized to restore revisions' });
    }

    const revision = await BlogRevision.findById(revisionId);
    if (!revision || String(revision.blog) !== String(id)) {
      return res.status(404).json({ message: 'Revision snapshot not found' });
    }

    // Save current state as a revision before restoring
    await recordBlogRevision(blog, req.user._id, `Auto-saved before restoring v${revision.versionNumber}`);

    // Restore fields
    blog.title = revision.title;
    blog.subtitle = revision.subtitle || '';
    blog.content = revision.content;
    if (revision.category) blog.category = revision.category;
    if (Array.isArray(revision.tags)) blog.tags = revision.tags;

    await blog.save();

    const populatedBlog = await populateBlogQuery(Blog.findById(blog._id)).lean();
    updateBlogInCache(populatedBlog);
    invalidateBlogsCache();

    res.json({
      success: true,
      message: `Restored to version ${revision.versionNumber}`,
      blog: populatedBlog,
    });
  } catch (err) {
    console.error('Error restoring blog revision:', err);
    res.status(500).json({ message: 'Failed to restore revision' });
  }
};

const aiCopilotHandler = async (req, res) => {
  try {
    const { action, title, subtitle, content, category, tags } = req.body;
    if (!action) {
      return res.status(400).json({
        message: 'Action is required (generate-headlines, generate-tldr, analyze-readability)',
      });
    }

    const results = await generateAiCopilotInsights({
      action,
      title: title || '',
      subtitle: subtitle || '',
      content: content || '',
      category: category || 'Technology',
      tags: tags || [],
    });

    res.json(results);
  } catch (err) {
    console.error('AI Copilot error:', err);
    res.status(500).json({ message: err.message || 'AI Copilot assistance error' });
  }
};

const getForYouFeed = async (req, res) => {
  try {
    const allBlogs = await getAllBlogsFromCacheOrDb();
    const visibleBlogs = allBlogs.filter(isBlogPubliclyVisible);

    const followedAuthorIds = new Set();
    const preferredCategories = new Set();

    if (req.user) {
      if (Array.isArray(req.user.following)) {
        req.user.following.forEach((id) => followedAuthorIds.add(String(id)));
      }
      if (Array.isArray(req.user.bookmarkedBlogs)) {
        visibleBlogs
          .filter((b) => req.user.bookmarkedBlogs.some((bmId) => String(bmId) === String(b._id)))
          .forEach((b) => {
            if (b.category) preferredCategories.add(b.category);
          });
      }
    }

    const now = Date.now();
    const scoredBlogs = visibleBlogs.map((blog) => {
      const pubDate = new Date(blog.publishDate || blog.date || blog.createdAt).getTime();
      const hoursSincePublish = Math.max(0.1, (now - pubDate) / (1000 * 60 * 60));

      const likes = blog.likesCount || blog.likes?.length || 0;
      const comments = blog.comments?.length || 0;
      const shares = blog.sharesCount || blog.shares || 0;

      let affinityBonus = 0;
      if (blog.author?._id && followedAuthorIds.has(String(blog.author._id))) {
        affinityBonus += 25;
      }
      if (blog.category && preferredCategories.has(blog.category)) {
        affinityBonus += 15;
      }
      if (blog.isFeatured) {
        affinityBonus += 20;
      }

      const score =
        (likes * 2 + comments * 3 + shares * 4 + affinityBonus + 5) /
        Math.pow(hoursSincePublish + 2, 1.4);

      return {
        ...blog,
        algorithmicScore: score,
      };
    });

    scoredBlogs.sort((a, b) => b.algorithmicScore - a.algorithmicScore);

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;
    const paginated = scoredBlogs.slice(startIndex, startIndex + limit);

    res.json({
      blogs: paginated,
      page,
      totalPages: Math.ceil(scoredBlogs.length / limit),
      totalStories: scoredBlogs.length,
    });
  } catch (error) {
    console.error('Error computing for-you feed:', error);
    res.status(500).json({ message: 'Error generating personalized feed' });
  }
};

const getRssFeed = async (req, res) => {
  try {
    const allBlogs = await getAllBlogsFromCacheOrDb();
    const visibleBlogs = allBlogs.filter(isBlogPubliclyVisible).slice(0, 30);
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    const itemsXml = visibleBlogs
      .map((blog) => {
        const pubDate = new Date(blog.publishDate || blog.date || blog.createdAt).toUTCString();
        const cleanTitle = (blog.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const cleanDesc = (blog.subtitle || blog.summary || (blog.content || '').replace(/<[^>]*>/g, '').slice(0, 240))
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const authorName = blog.author?.username || 'BlogSum Author';

        return `
    <item>
      <title>${cleanTitle}</title>
      <link>${baseUrl}/blog/${blog._id}</link>
      <guid>${baseUrl}/blog/${blog._id}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${authorName}</dc:creator>
      <description>${cleanDesc}</description>
      ${blog.category ? `<category>${blog.category}</category>` : ''}
    </item>`;
      })
      .join('\n');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>BlogSum - Independent Editorial &amp; Technology Stories</title>
    <link>${baseUrl}</link>
    <description>The latest in-depth stories, analysis, and essays from independent authors on BlogSum.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(rssXml);
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    res.status(500).send('Error generating RSS feed');
  }
};

const { generateStoryAudio, cleanTextForNarration } = require('../Utils/audioSynthesizer');

const generateBlogAudio = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // If story already has a persistent Cloudinary audio narration, return immediately
    if (blog.audioUrl && blog.audioUrl.startsWith('https://res.cloudinary.com')) {
      return res.json({
        success: true,
        audioUrl: blog.audioUrl,
        audioDuration: blog.audioDuration || 0,
        fallbackText: cleanTextForNarration(blog.title, blog.subtitle, blog.content),
      });
    }

    const { audioUrl, audioDuration, fallbackText } = await generateStoryAudio(
      blog._id,
      blog.title,
      blog.subtitle,
      blog.content
    );

    if (audioUrl) {
      blog.audioUrl = audioUrl;
      blog.audioDuration = audioDuration;
      await blog.save();
      updateBlogInCache(blog);
    }

    res.json({
      success: true,
      audioUrl: blog.audioUrl || audioUrl,
      audioDuration: blog.audioDuration || audioDuration,
      fallbackText: fallbackText || '',
    });
  } catch (error) {
    console.error('Error generating story audio:', error);
    res.status(500).json({ message: 'Failed to generate audio narration' });
  }
};

const generateOgImage = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('author', 'username');
    if (!blog) return res.status(404).send('Blog not found');

    const escapeXml = (unsafe = '') =>
      String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const title = escapeXml(blog.title || 'BlogSum Story');
    const author = escapeXml(blog.author?.username || 'BlogSum Author');
    const category = escapeXml(blog.category || 'Stories');
    const readTime = `${blog.readTime || 3} min read`;
    const initial = (blog.author?.username?.[0] || 'B').toUpperCase();

    const words = title.split(' ');
    const lines = [];
    let curLine = '';
    for (const w of words) {
      if ((curLine + ' ' + w).trim().length > 38) {
        lines.push(curLine.trim());
        curLine = w;
      } else {
        curLine += ' ' + w;
      }
    }
    if (curLine) lines.push(curLine.trim());
    const displayLines = lines.slice(0, 3);

    const titleSvg = displayLines
      .map(
        (line, idx) =>
          `<tspan x="80" dy="${idx === 0 ? 0 : 54}">${line}</tspan>`
      )
      .join('');

    const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#090d16"/>
          <stop offset="60%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#1e1b4b"/>
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#4f46e5"/>
          <stop offset="50%" stop-color="#7c3aed"/>
          <stop offset="100%" stop-color="#ec4899"/>
        </linearGradient>
        <radialGradient id="glow" cx="80%" cy="20%" r="60%">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <rect width="1200" height="630" fill="url(#bg)"/>
      <rect width="1200" height="630" fill="url(#glow)"/>

      <rect x="0" y="0" width="1200" height="8" fill="url(#accent)"/>

      <g transform="translate(80, 80)">
        <rect width="36" height="36" rx="8" fill="url(#accent)"/>
        <text x="18" y="25" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle">B</text>
        <text x="48" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="22" fill="#ffffff" letter-spacing="-0.5">BlogSum</text>
        <rect x="160" y="5" width="110" height="26" rx="13" fill="rgba(99, 102, 241, 0.2)" stroke="rgba(99, 102, 241, 0.4)" stroke-width="1"/>
        <text x="215" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="11" fill="#818cf8" text-anchor="middle" letter-spacing="1">EDITORIAL</text>
      </g>

      <g transform="translate(80, 160)">
        <rect width="140" height="34" rx="17" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1"/>
        <text x="70" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="13" fill="#38bdf8" text-anchor="middle">${category.toUpperCase()}</text>
      </g>

      <text x="80" y="270" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="44" fill="#f8fafc" letter-spacing="-0.5">
        ${titleSvg}
      </text>

      <g transform="translate(80, 500)">
        <circle cx="28" cy="28" r="28" fill="#4f46e5"/>
        <text x="28" y="37" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="22" fill="#ffffff" text-anchor="middle">${initial}</text>
        <text x="72" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="20" fill="#ffffff">${author}</text>
        <text x="72" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="500" font-size="14" fill="#94a3b8">Author · ${readTime}</text>
      </g>

      <g transform="translate(940, 524)">
        <text x="180" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="15" fill="#64748b" text-anchor="end">blogsum.vercel.app</text>
      </g>
    </svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.send(svg);
  } catch (err) {
    console.error('Error generating OG image:', err);
    res.status(500).send('Failed to generate preview image');
  }
};

const generateAuthorRssFeed = async (req, res) => {
  try {
    const { username } = req.params;
    const authorUser = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
    if (!authorUser) return res.status(404).send('Author not found');

    const blogs = await Blog.find({ author: authorUser._id, status: 'published' })
      .sort({ publishDate: -1, date: -1 })
      .limit(30)
      .lean();

    const baseUrl = process.env.CLIENT_URL || 'https://blog-sum.vercel.app';
    const itemsXml = blogs.map((b) => `
    <item>
      <title><![CDATA[${b.title}]]></title>
      <link>${baseUrl}/blog/${b._id}</link>
      <guid>${baseUrl}/blog/${b._id}</guid>
      <pubDate>${new Date(b.publishDate || b.date).toUTCString()}</pubDate>
      <dc:creator><![CDATA[${authorUser.username}]]></dc:creator>
      <description><![CDATA[${b.subtitle || (b.content || '').replace(/<[^>]+>/g, '').slice(0, 200)}]]></description>
      ${b.category ? `<category>${b.category}</category>` : ''}
    </item>`).join('\n');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${authorUser.username}'s Stories on BlogSum</title>
    <link>${baseUrl}/profile/${authorUser._id}</link>
    <description>Recent articles and essays written by ${authorUser.username} on BlogSum.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(rssXml);
  } catch (err) {
    res.status(500).send('Error generating author RSS feed');
  }
};

const generateCategoryRssFeed = async (req, res) => {
  try {
    const { category } = req.params;
    const blogs = await Blog.find({ category: new RegExp(`^${category}$`, 'i'), status: 'published' })
      .populate('author', 'username')
      .sort({ publishDate: -1, date: -1 })
      .limit(30)
      .lean();

    const baseUrl = process.env.CLIENT_URL || 'https://blog-sum.vercel.app';
    const itemsXml = blogs.map((b) => `
    <item>
      <title><![CDATA[${b.title}]]></title>
      <link>${baseUrl}/blog/${b._id}</link>
      <guid>${baseUrl}/blog/${b._id}</guid>
      <pubDate>${new Date(b.publishDate || b.date).toUTCString()}</pubDate>
      <dc:creator><![CDATA[${b.author?.username || 'Author'}]]></dc:creator>
      <description><![CDATA[${b.subtitle || (b.content || '').replace(/<[^>]+>/g, '').slice(0, 200)}]]></description>
      <category>${b.category || category}</category>
    </item>`).join('\n');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>BlogSum - ${category} Stories</title>
    <link>${baseUrl}/?category=${encodeURIComponent(category)}</link>
    <description>The latest stories and insights in ${category} on BlogSum.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(rssXml);
  } catch (err) {
    res.status(500).send('Error generating category RSS feed');
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
  recordBlogRevision,
  autoSaveDraft,
  getBlogRevisions,
  restoreBlogRevision,
  aiCopilotHandler,
  getForYouFeed,
  getRssFeed,
  generateAuthorRssFeed,
  generateCategoryRssFeed,
  generateOgImage,
  generateBlogAudio,
  upload,
};
