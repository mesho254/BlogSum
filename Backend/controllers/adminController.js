const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Blog = require('../Models/Blog');
const User = require('../Models/User');
const Notification = require('../Models/Notification');
const Subscriber = require('../Models/Subscribe');
const Channel = require('../Models/Channel');
const SiteSettings = require('../Models/SiteSettings');
const Contact = require('../Models/Contact');
const Job = require('../Models/Job');
const JobApplication = require('../Models/JobApplication');

// Configure disk storage for job candidate resumes
const resumesDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(resumesDir)) {
  try {
    fs.mkdirSync(resumesDir, { recursive: true });
  } catch (e) {
    console.error('Could not create resumes upload directory:', e.message);
  }
}

const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resumesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `resume-${Date.now()}-${cleanBase}${ext}`);
  },
});

const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});
const { invalidateAuthUserCache } = require('../MiddleWares/authMiddleWare');
const {
  invalidateBlogsCache,
  refreshBlogsCache,
  getAllBlogsFromCacheOrDb,
  populateBlogQuery,
  publishDueScheduledBlogs,
} = require('./blogController');

const computeEffectiveStatus = (blog) => {
  if (!blog) return 'published';
  if (blog.status === 'draft') return 'draft';
  const pubTime = blog.publishDate || blog.date;
  if (blog.status === 'scheduled' || (pubTime && new Date(pubTime) > new Date())) {
    return 'scheduled';
  }
  return 'published';
};

const ensureSiteSettings = async () => {
  try {
    let settings = await SiteSettings.findOne({ key: 'global' }).lean();
    if (!settings) {
      const created = await SiteSettings.create({ key: 'global' });
      settings = created.toObject();
    }
    return settings;
  } catch (err) {
    console.error('Error loading site settings:', err.message);
    return {
      key: 'global',
      siteName: 'BlogSum',
      siteTagline:
        'An independent digital publication for thoughtful essays, technical deep-dives, and cultural perspectives.',
      supportEmail: 'support@blogsum.com',
      announcementEnabled: false,
      announcementText: 'Welcome to the new BlogSum editorial publishing studio.',
      announcementLink: '/createBlog',
      announcementLinkLabel: 'Write a Story',
      allowRegistrations: true,
      allowCommentsGlobal: true,
      maintenanceMode: false,
      maintenanceMessage:
        'BlogSum is undergoing scheduled editorial maintenance. Please check back shortly.',
      maxImagesPerPost: 5,
      featuredBannerLimit: 5,
      socialLinks: {
        instagram: 'https://instagram.com',
        twitter: 'https://twitter.com',
        facebook: 'https://facebook.com',
        discord: 'https://discord.com',
        tiktok: 'https://tiktok.com',
        linkedin: 'https://linkedin.com',
        github: 'https://github.com',
      },
      customTermsText: '',
      customPrivacyText: '',
      customReturnText: '',
      customFaqs: [],
    };
  }
};

const buildAdminDataPayload = async (forceRefreshBlogs = false) => {
  const [rawBlogs, rawUsers, subscribers, channels, settings, contacts, jobs, applications] = await Promise.all([
    getAllBlogsFromCacheOrDb(forceRefreshBlogs).catch((err) => {
      console.error('Admin blogs fetch error:', err.message);
      return [];
    }),
    User.find()
      .select('-password')
      .sort({ createdAt: -1, _id: -1 })
      .lean()
      .catch((err) => {
        console.error('Admin users fetch error:', err.message);
        return [];
      }),
    Subscriber.find()
      .sort({ _id: -1 })
      .lean()
      .catch((err) => {
        console.error('Admin subscribers fetch error:', err.message);
        return [];
      }),
    Channel.find()
      .populate('createdBy', 'username email profilePicture')
      .populate('members', 'username profilePicture')
      .sort({ createdAt: -1, _id: -1 })
      .lean()
      .catch((err) => {
        console.error('Admin channels fetch error:', err.message);
        return [];
      }),
    ensureSiteSettings(),
    Contact.find()
      .populate('resolvedBy', 'username email')
      .sort({ createdAt: -1 })
      .lean()
      .catch((err) => {
        console.error('Admin contacts fetch error:', err.message);
        return [];
      }),
    Job.find()
      .populate('postedBy', 'username email')
      .sort({ createdAt: -1 })
      .lean()
      .catch((err) => {
        console.error('Admin jobs fetch error:', err.message);
        return [];
      }),
    JobApplication.find()
      .populate('job', 'title department')
      .populate('reviewedBy', 'username email')
      .sort({ createdAt: -1 })
      .lean()
      .catch((err) => {
        console.error('Admin job applications fetch error:', err.message);
        return [];
      }),
  ]);

  const blogs = Array.isArray(rawBlogs) ? rawBlogs : [];
  const users = Array.isArray(rawUsers) ? rawUsers : [];

  let publishedBlogs = 0;
  let scheduledBlogs = 0;
  let draftBlogs = 0;
  let featuredBlogs = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalBookmarks = 0;
  let totalShares = 0;

  const categoryMap = {};
  const authorStatsMap = {};
  const statsByUser = {};
  const allComments = [];

  const enrichedBlogs = blogs.map((blog) => {
    const effStatus = computeEffectiveStatus(blog);
    if (effStatus === 'published') publishedBlogs += 1;
    else if (effStatus === 'scheduled') scheduledBlogs += 1;
    else if (effStatus === 'draft') draftBlogs += 1;

    if (blog.isFeatured) featuredBlogs += 1;

    const likesCount = Array.isArray(blog.likes) ? blog.likes.length : 0;
    const bookmarksCount = Array.isArray(blog.bookmarks) ? blog.bookmarks.length : 0;
    const sharesCount = Array.isArray(blog.shares) ? blog.shares.length : 0;
    const topComments = Array.isArray(blog.comments) ? blog.comments : [];
    const repliesCount = topComments.reduce(
      (sum, c) => sum + (Array.isArray(c.replies) ? c.replies.length : 0),
      0
    );
    const blogCommentsCount = topComments.length + repliesCount;

    totalLikes += likesCount;
    totalComments += blogCommentsCount;
    totalBookmarks += bookmarksCount;
    totalShares += sharesCount;

    // Collect flattened comments & replies for Comment Moderation tab
    topComments.forEach((c) => {
      allComments.push({
        _id: String(c._id),
        commentId: String(c._id),
        replyId: null,
        isReply: false,
        blogId: String(blog._id),
        blogTitle: blog.title,
        blogCategory: blog.category,
        user: c.user || { username: 'Reader' },
        comment: c.comment,
        attachment: c.attachment || '',
        date: c.date,
        likesCount: Array.isArray(c.likes) ? c.likes.length : 0,
      });

      (c.replies || []).forEach((r) => {
        allComments.push({
          _id: `${c._id}_${r._id}`,
          commentId: String(c._id),
          replyId: String(r._id),
          isReply: true,
          blogId: String(blog._id),
          blogTitle: blog.title,
          blogCategory: blog.category,
          user: r.user || { username: 'Reader' },
          comment: r.comment,
          attachment: '',
          date: r.date,
          likesCount: Array.isArray(r.likes) ? r.likes.length : 0,
        });
      });
    });

    const cat = blog.category || 'Uncategorized';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { category: cat, count: 0, likes: 0, comments: 0 };
    }
    categoryMap[cat].count += 1;
    categoryMap[cat].likes += likesCount;
    categoryMap[cat].comments += blogCommentsCount;

    const authorId = blog.author?._id ? String(blog.author._id) : String(blog.author || '');
    if (authorId) {
      if (!authorStatsMap[authorId]) {
        authorStatsMap[authorId] = {
          _id: authorId,
          username: blog.author?.username || 'Unknown',
          email: blog.author?.email || '',
          profilePicture: blog.author?.profilePicture || '',
          isVerified: Boolean(blog.author?.isVerified),
          roles: blog.author?.roles || 'other',
          postsCount: 0,
          likesReceived: 0,
          commentsReceived: 0,
        };
      }
      authorStatsMap[authorId].postsCount += 1;
      authorStatsMap[authorId].likesReceived += likesCount;
      authorStatsMap[authorId].commentsReceived += blogCommentsCount;

      if (!statsByUser[authorId]) {
        statsByUser[authorId] = {
          blogsCount: 0,
          publishedCount: 0,
          scheduledCount: 0,
          draftCount: 0,
          totalLikesReceived: 0,
          totalCommentsReceived: 0,
        };
      }
      statsByUser[authorId].blogsCount += 1;
      if (effStatus === 'published') statsByUser[authorId].publishedCount += 1;
      else if (effStatus === 'scheduled') statsByUser[authorId].scheduledCount += 1;
      else if (effStatus === 'draft') statsByUser[authorId].draftCount += 1;
      statsByUser[authorId].totalLikesReceived += likesCount;
      statsByUser[authorId].totalCommentsReceived += blogCommentsCount;
    }

    return {
      ...blog,
      effectiveStatus: effStatus,
      likesCount,
      bookmarksCount,
      sharesCount,
      commentsCount: blogCommentsCount,
    };
  });

  // Sort blogs with pinned first, then newest
  enrichedBlogs.sort((a, b) => {
    if (Boolean(b.isPinned) !== Boolean(a.isPinned)) {
      return b.isPinned ? 1 : -1;
    }
    return new Date(b.date || 0) - new Date(a.date || 0);
  });

  allComments.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const enrichedUsers = users.map((u) => {
    const uid = String(u._id);
    const st = statsByUser[uid] || {
      blogsCount: 0,
      publishedCount: 0,
      scheduledCount: 0,
      draftCount: 0,
      totalLikesReceived: 0,
      totalCommentsReceived: 0,
    };
    const effectiveRole =
      u.roles === 'admin' || String(u.username || '').toLowerCase() === 'admin'
        ? 'admin'
        : u.roles || 'other';
    return {
      ...u,
      roles: effectiveRole,
      isVerified: Boolean(u.isVerified),
      isSuspended: Boolean(u.isSuspended),
      followersCount: Array.isArray(u.followers) ? u.followers.length : 0,
      followingCount: Array.isArray(u.following) ? u.following.length : 0,
      ...st,
    };
  });

  const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.count - a.count);

  const topStories = [...enrichedBlogs]
    .map((b) => ({
      _id: b._id,
      title: b.title,
      category: b.category,
      author: b.author,
      status: b.effectiveStatus,
      isFeatured: Boolean(b.isFeatured),
      date: b.publishDate || b.date,
      likesCount: b.likesCount,
      commentsCount: b.commentsCount,
      bookmarksCount: b.bookmarksCount,
      engagementScore: b.likesCount * 2 + b.commentsCount * 3 + b.bookmarksCount * 2,
    }))
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 6);

  const topAuthors = Object.values(authorStatsMap)
    .sort((a, b) => b.likesReceived - a.likesReceived || b.postsCount - a.postsCount)
    .slice(0, 6);

  const adminUsers = enrichedUsers.filter((u) => u.roles === 'admin').length;
  const editorUsers = enrichedUsers.filter((u) => u.roles === 'editor').length;
  const verifiedUsers = enrichedUsers.filter((u) => u.isVerified).length;
  const suspendedUsers = enrichedUsers.filter((u) => u.isSuspended).length;

  const effectiveContacts = Array.isArray(contacts) ? contacts : [];
  const effectiveJobs = Array.isArray(jobs) ? jobs : [];
  const effectiveApplications = Array.isArray(applications) ? applications : [];
  const newInquiriesCount = effectiveContacts.filter((c) => c.status === 'new').length;
  const activeJobsCount = effectiveJobs.filter((j) => j.isActive).length;
  const newApplicationsCount = effectiveApplications.filter((a) => a.status === 'new').length;

  return {
    counts: {
      totalBlogs: enrichedBlogs.length,
      publishedBlogs,
      scheduledBlogs,
      draftBlogs,
      featuredBlogs,
      totalUsers: enrichedUsers.length,
      adminUsers,
      editorUsers,
      verifiedUsers,
      suspendedUsers,
      totalLikes,
      totalComments,
      totalBookmarks,
      totalShares,
      subscribersCount: subscribers.length,
      channelsCount: channels.length,
      contactsCount: effectiveContacts.length,
      newInquiriesCount,
      jobsCount: effectiveJobs.length,
      activeJobsCount,
      applicationsCount: effectiveApplications.length,
      newApplicationsCount,
    },
    categoryBreakdown,
    topStories,
    topAuthors,
    recentUsers: enrichedUsers.slice(0, 5),
    blogs: enrichedBlogs,
    users: enrichedUsers,
    comments: allComments,
    subscribers,
    channels,
    settings,
    contacts: effectiveContacts,
    jobs: effectiveJobs,
    applications: effectiveApplications,
  };
};

// GET /api/admin/overview (Unified single-request endpoint for the entire Admin Control Center)
const getAdminOverview = async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const payload = await buildAdminDataPayload(forceRefresh);
    res.json(payload);
  } catch (error) {
    console.error('Error in getAdminOverview:', error);
    res.status(500).json({ message: 'Failed to load admin overview' });
  }
};

// GET /api/admin/blogs
const getAllAdminBlogs = async (req, res) => {
  try {
    const payload = await buildAdminDataPayload(false);
    res.json(payload.blogs);
  } catch (error) {
    console.error('Error in getAllAdminBlogs:', error);
    res.status(500).json({ message: 'Failed to fetch blogs for admin' });
  }
};

// PUT /api/admin/blogs/:id/status
const updateBlogAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isFeatured, isPinned, allowComments, category, publishDate } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const previousStatus = computeEffectiveStatus(blog);

    if (typeof isFeatured === 'boolean') blog.isFeatured = isFeatured;
    if (typeof isPinned === 'boolean') blog.isPinned = isPinned;
    if (typeof allowComments === 'boolean') blog.allowComments = allowComments;
    if (category) blog.category = category;

    if (publishDate) {
      const parsed = new Date(publishDate);
      if (!isNaN(parsed.getTime())) {
        blog.publishDate = parsed;
        blog.date = parsed;
      }
    }

    if (status && ['published', 'scheduled', 'draft'].includes(status)) {
      blog.status = status;
      if (status === 'published') {
        const now = new Date();
        if (!blog.publishDate || new Date(blog.publishDate) > now) {
          blog.publishDate = now;
          blog.date = now;
        }
      }
    }

    await blog.save();
    const populated = await populateBlogQuery(Blog.findById(blog._id)).lean();

    if (blog.author && String(blog.author) !== String(req.user._id)) {
      if (previousStatus !== 'published' && blog.status === 'published') {
        await Notification.create({
          user: blog.author,
          message: `An administrator approved and published your story: "${blog.title}"`,
        }).catch(() => {});
      } else if (isFeatured === true) {
        await Notification.create({
          user: blog.author,
          message: `Your story "${blog.title}" was selected as an Editor's Pick by the admin team!`,
        }).catch(() => {});
      }
    }

    invalidateBlogsCache();
    await refreshBlogsCache();

    res.json({
      ...populated,
      effectiveStatus: computeEffectiveStatus(populated),
    });
  } catch (error) {
    console.error('Error in updateBlogAdminStatus:', error);
    res.status(500).json({ message: 'Failed to update blog status' });
  }
};

// POST /api/admin/blogs/bulk
const bulkManageBlogs = async (req, res) => {
  try {
    const { blogIds, action } = req.body;
    if (!Array.isArray(blogIds) || blogIds.length === 0) {
      return res.status(400).json({ message: 'No blog IDs provided' });
    }

    const now = new Date();
    let resultMessage = '';

    if (action === 'delete') {
      await Blog.deleteMany({ _id: { $in: blogIds } });
      resultMessage = `Deleted ${blogIds.length} stories.`;
    } else if (action === 'publish') {
      await Blog.updateMany(
        { _id: { $in: blogIds } },
        { $set: { status: 'published', publishDate: now, date: now } }
      );
      resultMessage = `Published ${blogIds.length} stories immediately.`;
    } else if (action === 'draft') {
      await Blog.updateMany({ _id: { $in: blogIds } }, { $set: { status: 'draft' } });
      resultMessage = `Moved ${blogIds.length} stories to draft.`;
    } else if (action === 'feature') {
      await Blog.updateMany({ _id: { $in: blogIds } }, { $set: { isFeatured: true } });
      resultMessage = `Marked ${blogIds.length} stories as Featured.`;
    } else if (action === 'unfeature') {
      await Blog.updateMany({ _id: { $in: blogIds } }, { $set: { isFeatured: false } });
      resultMessage = `Removed Featured status from ${blogIds.length} stories.`;
    } else {
      return res.status(400).json({ message: 'Unsupported bulk action' });
    }

    invalidateBlogsCache();
    await refreshBlogsCache();

    res.json({ message: resultMessage });
  } catch (error) {
    console.error('Error in bulkManageBlogs:', error);
    res.status(500).json({ message: 'Bulk operation failed' });
  }
};

// POST /api/admin/blogs/run-scheduler
const triggerScheduledPublisher = async (req, res) => {
  try {
    await publishDueScheduledBlogs(req.app?.get('io'));
    await refreshBlogsCache();
    res.json({ message: 'Scheduled blog publisher executed and cache refreshed.' });
  } catch (error) {
    console.error('Error in triggerScheduledPublisher:', error);
    res.status(500).json({ message: 'Failed to execute scheduled publisher' });
  }
};

// GET /api/admin/comments
const getAllCommentsAdmin = async (req, res) => {
  try {
    const payload = await buildAdminDataPayload(false);
    res.json(payload.comments);
  } catch (error) {
    console.error('Error in getAllCommentsAdmin:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
};

// DELETE /api/admin/blogs/:blogId/comments/:commentId
const deleteCommentAdmin = async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    const { replyId } = req.query;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (replyId) {
      const parentComment = blog.comments.id(commentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
      parentComment.replies = (parentComment.replies || []).filter(
        (r) => String(r._id) !== String(replyId)
      );
    } else {
      blog.comments = (blog.comments || []).filter((c) => String(c._id) !== String(commentId));
    }

    await blog.save();
    invalidateBlogsCache();
    await refreshBlogsCache();

    res.json({ message: 'Comment removed by administrator' });
  } catch (error) {
    console.error('Error in deleteCommentAdmin:', error);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
};

// GET /api/admin/users
const getAllUsersAdmin = async (req, res) => {
  try {
    const payload = await buildAdminDataPayload(false);
    res.json(payload.users);
  } catch (error) {
    console.error('Error in getAllUsersAdmin:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// POST /api/admin/users
const createUserAdmin = async (req, res) => {
  try {
    const { username, email, password, roles, isVerified, location, bio } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const existing = await User.findOne({
      $or: [{ email: email.trim() }, { username: username.trim() }],
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: 'A user with that email or username already exists' });
    }

    const newUser = await User.create({
      username: username.trim(),
      email: email.trim(),
      password,
      roles: roles || 'other',
      isVerified: Boolean(isVerified),
      location: location || '',
      bio: bio || '',
    });

    const userObj = newUser.toObject();
    delete userObj.password;

    res.status(201).json(userObj);
  } catch (error) {
    console.error('Error in createUserAdmin:', error);
    res.status(500).json({ message: error.message || 'Failed to create user' });
  }
};

// PUT /api/admin/users/:id
const updateUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, location, bio, roles, isVerified, isSuspended, newPassword } =
      req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (String(user._id) === String(req.user._id)) {
      if (isSuspended === true) {
        return res.status(400).json({ message: 'You cannot suspend your own admin account.' });
      }
      if (roles && roles !== 'admin') {
        return res.status(400).json({ message: 'You cannot demote your own admin role.' });
      }
    }

    if (username !== undefined) user.username = username.trim();
    if (email !== undefined) user.email = email.trim();
    if (location !== undefined) user.location = location;
    if (bio !== undefined) user.bio = bio;
    if (roles !== undefined) user.roles = roles;
    if (typeof isVerified === 'boolean') user.isVerified = isVerified;
    if (typeof isSuspended === 'boolean') user.isSuspended = isSuspended;

    if (newPassword && String(newPassword).trim().length >= 6) {
      user.password = String(newPassword).trim();
    }

    await user.save();
    invalidateAuthUserCache(user._id);

    const updatedObj = user.toObject();
    delete updatedObj.password;

    invalidateBlogsCache();
    res.json(updatedObj);
  } catch (error) {
    console.error('Error in updateUserAdmin:', error);
    res.status(500).json({ message: error.message || 'Failed to update user' });
  }
};

// DELETE /api/admin/users/:id
const deleteUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteBlogs } = req.query;

    if (String(id) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own active admin account.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (deleteBlogs === 'true') {
      await Blog.deleteMany({ author: user._id });
    }

    await Notification.deleteMany({ user: user._id });
    await user.deleteOne();
    invalidateAuthUserCache(user._id);

    invalidateBlogsCache();
    await refreshBlogsCache();

    res.json({
      message:
        deleteBlogs === 'true'
          ? `User @${user.username} and all their stories were deleted.`
          : `User @${user.username} was deleted.`,
    });
  } catch (error) {
    console.error('Error in deleteUserAdmin:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// GET /api/admin/subscribers
const getSubscribersAdmin = async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ _id: -1 }).lean();
    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch subscribers' });
  }
};

// POST /api/admin/subscribers
const addSubscriberAdmin = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const existing = await Subscriber.findOne({ email: email.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Email is already subscribed' });
    }
    const sub = await Subscriber.create({ email: email.trim() });
    res.status(201).json(sub);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add subscriber' });
  }
};

// DELETE /api/admin/subscribers/:id
const deleteSubscriberAdmin = async (req, res) => {
  try {
    await Subscriber.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subscriber removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove subscriber' });
  }
};

// POST /api/admin/announcements
const broadcastAnnouncement = async (req, res) => {
  try {
    const { message, targetRole } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Announcement message is required' });
    }

    const filter = {};
    if (targetRole && targetRole !== 'all') {
      filter.roles = targetRole;
    }

    const users = await User.find(filter).select('_id').lean();
    if (users.length === 0) {
      return res.status(404).json({ message: 'No matching users found for broadcast' });
    }

    const formattedMsg = `📢 Editorial Dispatch: ${message.trim()}`;
    const docs = users.map((u) => ({
      user: u._id,
      message: formattedMsg,
      read: false,
    }));

    await Notification.insertMany(docs);

    const io = req.app?.get('io');
    if (io) {
      users.forEach((u) => {
        io.to(String(u._id)).emit('newNotification', {
          message: formattedMsg,
          createdAt: new Date(),
        });
      });
    }

    res.json({
      message: `Broadcast delivered to ${users.length} user${users.length === 1 ? '' : 's'}.`,
      recipientsCount: users.length,
    });
  } catch (error) {
    console.error('Error in broadcastAnnouncement:', error);
    res.status(500).json({ message: 'Failed to broadcast announcement' });
  }
};

// GET /api/admin/channels
const getChannelsAdmin = async (req, res) => {
  try {
    const channels = await Channel.find()
      .populate('createdBy', 'username email profilePicture')
      .populate('members', 'username profilePicture')
      .sort({ createdAt: -1, _id: -1 })
      .lean();
    res.json(channels);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch channels' });
  }
};

// DELETE /api/admin/channels/:id
const deleteChannelAdmin = async (req, res) => {
  try {
    await Channel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Channel deleted by administrator' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete channel' });
  }
};

// GET /api/admin/public-settings
const getPublicSiteSettings = async (req, res) => {
  try {
    const settings = await ensureSiteSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load site settings' });
  }
};

// GET /api/admin/settings
const getSiteSettingsAdmin = async (req, res) => {
  try {
    const settings = await ensureSiteSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load site settings' });
  }
};

// PUT /api/admin/settings
const updateSiteSettingsAdmin = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne({ key: 'global' });
    if (!settings) {
      settings = new SiteSettings({ key: 'global' });
    }
    const allowedFields = [
      'siteName',
      'siteTagline',
      'supportEmail',
      'announcementEnabled',
      'announcementText',
      'announcementLink',
      'announcementLinkLabel',
      'allowRegistrations',
      'allowCommentsGlobal',
      'maintenanceMode',
      'maintenanceMessage',
      'maxImagesPerPost',
      'featuredBannerLimit',
      'socialLinks',
      'customTermsText',
      'customPrivacyText',
      'customReturnText',
      'customFaqs',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    settings.updatedBy = req.user._id;
    await settings.save();

    res.json(settings);
  } catch (error) {
    console.error('Error in updateSiteSettingsAdmin:', error);
    res.status(500).json({ message: 'Failed to update site settings' });
  }
};

// ==========================================
// Support & Inquiries (Contact Submissions)
// ==========================================
// GET /api/admin/contacts
const getContactsAdmin = async (req, res) => {
  try {
    const contacts = await Contact.find()
      .populate('resolvedBy', 'username email')
      .sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch support inquiries', error: error.message });
  }
};

// PUT /api/admin/contacts/:id
const updateContactStatusAdmin = async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;
  try {
    const contact = await Contact.findById(id);
    if (!contact) return res.status(404).json({ message: 'Inquiry not found' });

    if (status) {
      contact.status = status;
      if (status === 'resolved') {
        contact.resolvedAt = new Date();
        contact.resolvedBy = req.user._id;
      } else {
        contact.resolvedAt = null;
        contact.resolvedBy = null;
      }
    }
    if (adminNotes !== undefined) {
      contact.adminNotes = adminNotes;
    }
    await contact.save();
    res.json({ message: 'Inquiry updated successfully', contact });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update inquiry', error: error.message });
  }
};

// DELETE /api/admin/contacts/:id
const deleteContactAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const contact = await Contact.findByIdAndDelete(id);
    if (!contact) return res.status(404).json({ message: 'Inquiry not found' });
    res.json({ message: 'Inquiry removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete inquiry', error: error.message });
  }
};

// ==========================================
// Careers & Job Postings
// ==========================================
// GET /api/admin/jobs (Public endpoint for active jobs)
const getPublicJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch job postings', error: error.message });
  }
};

// GET /api/admin/jobs/all (Admin endpoint for all jobs)
const getAllJobsAdmin = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('postedBy', 'username email')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch job postings', error: error.message });
  }
};

// POST /api/admin/jobs
const createJobAdmin = async (req, res) => {
  const {
    title,
    department,
    location,
    type,
    experience,
    salaryRange,
    description,
    responsibilities,
    requirements,
    perks,
    tags,
    applyEmail,
    isActive,
  } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required.' });
  }

  try {
    const job = await Job.create({
      title,
      department: department || 'Editorial',
      location: location || 'Remote',
      type: type || 'Full-Time',
      experience: experience || 'Mid-Level',
      salaryRange: salaryRange || 'Competitive',
      description,
      responsibilities: Array.isArray(responsibilities)
        ? responsibilities
        : (responsibilities ? String(responsibilities).split('\n').map((s) => s.trim()).filter(Boolean) : []),
      requirements: Array.isArray(requirements)
        ? requirements
        : (requirements ? String(requirements).split('\n').map((s) => s.trim()).filter(Boolean) : []),
      perks: Array.isArray(perks)
        ? perks
        : (perks ? String(perks).split('\n').map((s) => s.trim()).filter(Boolean) : []),
      tags: Array.isArray(tags)
        ? tags
        : (tags ? String(tags).split(',').map((t) => t.trim()).filter(Boolean) : []),
      applyEmail: applyEmail || 'careers@blogsum.com',
      isActive: isActive !== undefined ? isActive : true,
      postedBy: req.user._id,
    });
    res.status(201).json({ message: 'Job posting published successfully', job });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create job posting', error: error.message });
  }
};

// PUT /api/admin/jobs/:id
const updateJobAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: 'Job posting not found' });

    const fields = [
      'title',
      'department',
      'location',
      'type',
      'experience',
      'salaryRange',
      'description',
      'applyEmail',
      'isActive',
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) job[f] = req.body[f];
    });

    if (req.body.responsibilities !== undefined) {
      job.responsibilities = Array.isArray(req.body.responsibilities)
        ? req.body.responsibilities
        : String(req.body.responsibilities).split('\n').map((s) => s.trim()).filter(Boolean);
    }
    if (req.body.requirements !== undefined) {
      job.requirements = Array.isArray(req.body.requirements)
        ? req.body.requirements
        : String(req.body.requirements).split('\n').map((s) => s.trim()).filter(Boolean);
    }
    if (req.body.perks !== undefined) {
      job.perks = Array.isArray(req.body.perks)
        ? req.body.perks
        : String(req.body.perks).split('\n').map((s) => s.trim()).filter(Boolean);
    }
    if (req.body.tags !== undefined) {
      job.tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : String(req.body.tags).split(',').map((t) => t.trim()).filter(Boolean);
    }

    await job.save();
    res.json({ message: 'Job posting updated successfully', job });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update job posting', error: error.message });
  }
};

// DELETE /api/admin/jobs/:id
const deleteJobAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const job = await Job.findByIdAndDelete(id);
    if (!job) return res.status(404).json({ message: 'Job posting not found' });
    res.json({ message: 'Job posting deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete job posting', error: error.message });
  }
};

// PUT /api/admin/jobs/:id/toggle
const toggleJobStatusAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: 'Job posting not found' });
    job.isActive = !job.isActive;
    await job.save();
    res.json({ message: `Job posting ${job.isActive ? 'activated' : 'deactivated'}`, job });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle job status', error: error.message });
  }
};

// POST /api/admin/jobs/apply (Public candidate application submission with resume upload)
const submitJobApplication = async (req, res) => {
  try {
    const { name, email, portfolio, notes, jobId, jobTitle, department } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Full name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Valid email address is required' });
    }

    let resumeUrl = req.body.resumeUrl ? req.body.resumeUrl.trim() : '';
    let resumeFileName = req.body.resumeFileName ? req.body.resumeFileName.trim() : '';

    if (req.file) {
      resumeUrl = `/uploads/resumes/${req.file.filename}`;
      resumeFileName = req.file.originalname;
    }

    const resolvedJobTitle = jobTitle && jobTitle.trim() ? jobTitle.trim() : 'General Editorial Application';
    const resolvedDepartment = department && department.trim() ? department.trim() : 'Editorial';

    const application = await JobApplication.create({
      job: jobId && mongoose.Types.ObjectId.isValid(jobId) ? jobId : undefined,
      jobTitle: resolvedJobTitle,
      department: resolvedDepartment,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      portfolio: portfolio ? portfolio.trim() : '',
      resumeUrl,
      resumeFileName,
      notes: notes ? notes.trim() : '',
      status: 'new',
    });

    // Notify admins if possible
    try {
      const adminUsers = await User.find({ roles: 'admin' }).select('_id');
      const notifs = adminUsers.map((adm) => ({
        user: adm._id,
        type: 'job_application',
        message: `New job application received from ${name.trim()} for ${resolvedJobTitle}`,
        actionUrl: '/admin',
      }));
      if (notifs.length > 0) {
        await Notification.insertMany(notifs);
      }
    } catch (notifErr) {
      console.error('Failed to notify admins of new job application:', notifErr.message);
    }

    res.status(201).json({
      message: 'Application received successfully! Our editorial and talent team will review your submission.',
      application,
    });
  } catch (error) {
    console.error('Job application submission error:', error);
    res.status(500).json({ message: 'Failed to submit application', error: error.message });
  }
};

// GET /api/admin/applications (Admin fetch all job applications)
const getJobApplicationsAdmin = async (req, res) => {
  try {
    const applications = await JobApplication.find()
      .populate('job', 'title department location')
      .populate('reviewedBy', 'username email')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch job applications', error: error.message });
  }
};

// PUT /api/admin/applications/:id (Admin update application status / review notes)
const updateJobApplicationStatusAdmin = async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;
  try {
    const application = await JobApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (status && ['new', 'reviewed', 'interviewing', 'rejected', 'hired'].includes(status)) {
      application.status = status;
    }
    if (adminNotes !== undefined) {
      application.adminNotes = adminNotes;
    }

    application.reviewedBy = req.user ? req.user._id : undefined;
    application.reviewedAt = new Date();

    await application.save();
    const updated = await JobApplication.findById(id)
      .populate('job', 'title department')
      .populate('reviewedBy', 'username email');

    res.json({ message: 'Application updated successfully', application: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update application', error: error.message });
  }
};

// DELETE /api/admin/applications/:id (Admin delete application)
const deleteJobApplicationAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const application = await JobApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Try deleting uploaded resume file from disk if local
    if (application.resumeUrl && application.resumeUrl.startsWith('/uploads/resumes/')) {
      const filename = application.resumeUrl.replace('/uploads/resumes/', '');
      const filePath = path.join(resumesDir, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error('Failed to remove deleted resume file:', e.message);
        }
      }
    }

    await JobApplication.findByIdAndDelete(id);
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete application', error: error.message });
  }
};

module.exports = {
  uploadResume,
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
  submitJobApplication,
  getJobApplicationsAdmin,
  updateJobApplicationStatusAdmin,
  deleteJobApplicationAdmin,
};
