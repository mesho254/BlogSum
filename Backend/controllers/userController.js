const mongoose = require('mongoose');
const User = require('../Models/User');
const Blog = require('../Models/Blog');
const cloudinary = require('../config/cloudinary');
const Notification = require('../Models/Notification')
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { evaluateUserBadges } = require('../Utils/badgeEvaluator');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile_pictures',
    format: async (req, file) => 'jpeg',
    public_id: (req, file) => file.filename,
  },
});

const upload = multer({ storage: storage });

const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password')
    .populate('followers', 'username profilePicture bio location')
    .populate('following', 'username profilePicture bio location')
    .lean();
  if (user) {
    const authorBlogs = await Blog.find({ author: user._id }).select('status likes comments publishDate date').lean();
    user.badges = evaluateUserBadges(user, authorBlogs);
  }
  res.json(user);
};

const getOtherUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
      .populate('followers', 'username profilePicture bio location')
      .populate('following', 'username profilePicture bio location')
      .populate('likedBlogs', 'title')
      .populate('bookmarkedBlogs', 'title')
      .populate('messages', 'content');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const getUserById = async (req, res) => {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const query = isObjectId ? { _id: req.params.id } : { username: { $regex: `^${req.params.id}$`, $options: 'i' } };
    const user = await User.findOne(query).select('-password')
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture')
      .populate('likedBlogs', 'title')
      .populate('bookmarkedBlogs', 'title')
      .populate('messages', 'content')
      .lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const authorBlogs = await Blog.find({ author: user._id }).select('status likes comments publishDate date').lean();
    user.badges = evaluateUserBadges(user, authorBlogs);
    res.json(user);
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('likedBlogs', 'title')  // Populate as needed
      .populate('bookmarkedBlogs', 'title');  // Populate as needed

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('followers')
    .populate('following')
    .populate('likedBlogs')
    .populate('messages');

  user.username = req.body.username || user.username;
  user.email = req.body.email || user.email;
  user.location = req.body.location || user.location;

  if (req.file) {
    user.profilePicture = req.file.path;
  }

  const updatedUser = await user.save();
  res.json({
    ...updatedUser.toObject(),
    followersCount: user.followers.length,
    followingCount: user.following.length,
    likesCount: user.likedBlogs.length,
  });
};

const findUserByIdOrUsername = async (identifier) => {
  if (!identifier) return null;
  const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
  if (isObjectId) {
    const user = await User.findById(identifier);
    if (user) return user;
  }
  return await User.findOne({ username: { $regex: `^${identifier}$`, $options: 'i' } });
};

const followUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const targetUser = await findUserByIdOrUsername(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'Target user not found' });

    if (!user.following.some(f => String(f) === String(targetUser._id))) {
      user.following.push(targetUser._id);
      targetUser.followers.push(user._id);

      await user.save();
      await targetUser.save();

      const notification = new Notification({
        user: targetUser._id,
        message: `${user.username} started following you`,
      });

      await notification.save();

      try {
        const io = req.app.get('io');
        if (io) {
          io.to(String(targetUser._id)).emit('newNotification', notification);
        }
      } catch (notifErr) {
        console.error('Error emitting follow notification:', notifErr);
      }
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to follow user' });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const targetUser = await findUserByIdOrUsername(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'Target user not found' });

    user.following = user.following.filter(f => f.toString() !== targetUser._id.toString());
    targetUser.followers = targetUser.followers.filter(f => f.toString() !== user._id.toString());

    await user.save();
    await targetUser.save();

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to unfollow user' });
  }
};

const getFollowState = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const targetUser = await findUserByIdOrUsername(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'Target user not found' });

    const isFollowing = user.following.some(f => String(f) === String(targetUser._id));
    res.json({ isFollowing });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving follow state' });
  }
};

const blockUser = async (req, res) => {
  const user = await User.findById(req.user._id);
  const targetUser = await User.findById(req.params.id);

  if (!user.blockedUsers.includes(targetUser._id)) {
    user.blockedUsers.push(targetUser._id);
    await user.save();
  }

  res.json(user);
};

const unblockUser = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.blockedUsers = user.blockedUsers.filter(b => b.toString() !== req.params.id);
  await user.save();
  res.json(user);
};

const getBookmarkedBlogs = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate({
      path: 'bookmarkedBlogs',
      populate: {
        path: 'author',
        select: 'username profilePicture'
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.bookmarkedBlogs);
  } catch (error) {
    console.error('Error fetching bookmarked blogs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const getLikedBlogs = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate({
      path: 'likedBlogs',
      populate: {
        path: 'author',
        select: 'username profilePicture'
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.likedBlogs);
  } catch (error) {
    console.error('Error fetching liked blogs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getOtherLikedBlogs = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).populate({
      path: 'likedBlogs',
      populate: {
        path: 'author',
        select: 'username profilePicture'
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.likedBlogs);
  } catch (error) {
    console.error('Error fetching liked blogs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate({
      path: 'messages',
      populate: {
        path: 'author',
        select: 'username profilePicture message read'
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const getBlockStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const isBlocked = user.blockedUsers.includes(req.params.id);
    res.json({ isBlocked });
  } catch (error) {
    console.error('Error fetching block status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getLikeStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const blogId = req.params.id;
    const isLiked = user.likedBlogs.includes(blogId);

    res.json({ isLiked });
  } catch (error) {
    console.error('Error fetching like status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getBookmarkStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const blogId = req.params.id;
    const isBookmarked = user.bookmarkedBlogs.includes(blogId);

    res.json({ isBookmarked });
  } catch (error) {
    console.error('Error fetching bookmark status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const getBlogShareCount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const blogId = req.params.id;
    const isShared = user.MyShares.includes(blogId);

    res.json({ isShared});
  } catch (error) {
    console.error('Error fetching like status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPublicAuthorProfile = async (req, res) => {
  try {
    const rawId = req.params.id;
    const isObjectId = mongoose.Types.ObjectId.isValid(rawId);
    const query = isObjectId ? { _id: rawId } : { username: { $regex: `^${rawId}$`, $options: 'i' } };

    const user = await User.findOne(query)
      .select('username email profilePicture location followers following likedBlogs')
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const authorBlogs = await Blog.find({ author: user._id })
      .select('title category date publishDate status readTime imageUrl likes reactions')
      .sort({ date: -1 })
      .lean();

    const now = new Date();
    const publishedAuthorBlogs = (authorBlogs || []).filter((b) => {
      if (b.status === 'draft') return false;
      const pubTime = b.publishDate || b.date;
      if (pubTime && new Date(pubTime) > now) return false;
      return true;
    });

    const totalLikesReceived = publishedAuthorBlogs.reduce(
      (sum, b) => sum + (Array.isArray(b.likes) ? b.likes.length : 0),
      0
    );

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      location: user.location || '',
      followers: user.followers || [],
      following: user.following || [],
      followersCount: Array.isArray(user.followers) ? user.followers.length : 0,
      followingCount: Array.isArray(user.following) ? user.following.length : 0,
      postsCount: publishedAuthorBlogs.length,
      totalLikesReceived,
      badges: evaluateUserBadges(user, authorBlogs),
      recentBlogs: publishedAuthorBlogs.slice(0, 2),
    });
  } catch (error) {
    console.error('Error fetching public author profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/users/export-my-data (GDPR compliance export)
const exportUserData = async (req, res) => {
  try {
    const userId = req.user._id;
    const [userProfile, blogs, notifications] = await Promise.all([
      User.findById(userId).select('-password').lean(),
      Blog.find({ author: userId }).lean(),
      Notification.find({ user: userId }).lean(),
    ]);

    const exportBundle = {
      exportMetadata: {
        platform: 'BlogSum Independent Publishing Platform',
        exportedAt: new Date().toISOString(),
        formatVersion: '1.0',
        accountOwner: userProfile.username,
        email: userProfile.email,
      },
      account: userProfile,
      storiesAuthored: blogs,
      notificationsHistory: notifications,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="blogsum-data-export-${userProfile.username}-${Date.now()}.json"`
    );
    return res.status(200).json(exportBundle);
  } catch (error) {
    console.error('Error exporting user data:', error);
    res.status(500).json({ message: 'Failed to generate data archive' });
  }
};

const getPayoutAndMembership = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('payoutSettings membership');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      payoutSettings: user.payoutSettings || {
        payoutMethod: 'paypal',
        paypalEmail: '',
        stripeConnected: false,
        stripeAccountId: '',
      },
      membership: user.membership || {
        tier: 'free',
        isActive: false,
        monthlyMeteredCount: 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving monetization settings' });
  }
};

const updatePayoutSettings = async (req, res) => {
  try {
    const { payoutMethod, paypalEmail } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.payoutSettings) user.payoutSettings = {};
    if (payoutMethod) user.payoutSettings.payoutMethod = payoutMethod;
    if (typeof paypalEmail === 'string') user.payoutSettings.paypalEmail = paypalEmail.trim();

    await user.save();
    res.json({
      success: true,
      message: 'Payout settings updated successfully',
      payoutSettings: user.payoutSettings,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update payout preferences' });
  }
};

const connectStripeAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.payoutSettings) user.payoutSettings = {};
    const isConnecting = !user.payoutSettings.stripeConnected;

    user.payoutSettings.stripeConnected = isConnecting;
    user.payoutSettings.stripeAccountId = isConnecting ? `acct_express_${user._id.toString().slice(-6)}` : '';
    if (isConnecting) {
      user.payoutSettings.payoutMethod = 'stripe';
    }

    await user.save();
    res.json({
      success: true,
      message: isConnecting ? 'Stripe Connect Express account connected successfully!' : 'Stripe account disconnected',
      payoutSettings: user.payoutSettings,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle Stripe Connect account' });
  }
};

const updateMembership = async (req, res) => {
  try {
    const { tier } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const targetTier = ['premium', 'supporter'].includes(tier) ? tier : 'free';
    const isActive = targetTier !== 'free';

    user.membership = {
      tier: targetTier,
      isActive,
      validUntil: isActive ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      monthlyMeteredCount: user.membership?.monthlyMeteredCount || 0,
      meteredPeriodStart: user.membership?.meteredPeriodStart || new Date(),
    };

    await user.save();
    res.json({
      success: true,
      message: isActive ? `Upgraded to BlogSum ${targetTier.toUpperCase()} Member!` : 'Membership reset to Free reader tier.',
      membership: user.membership,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update membership tier' });
  }
};

const searchUsersForMention = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const query = q
      ? { username: { $regex: q, $options: 'i' }, isSuspended: { $ne: true } }
      : { isSuspended: { $ne: true } };

    const users = await User.find(query)
      .select('username profilePicture roles bio isVerified')
      .limit(8)
      .lean();

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to search users for mentions' });
  }
};

module.exports = {
  searchUsersForMention,
  exportUserData,
  getUserProfile,
  getOtherUserProfile,
  getPublicAuthorProfile,
  getOtherLikedBlogs,
  getBookmarkedBlogs,
  getLikeStatus,
  getBlogShareCount,
  getBookmarkStatus,
  getBlockStatus,
  getLikedBlogs,
  getFollowState,
  getUserById,
  updateUserProfile,
  getMessages,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
  getUser,
  upload,
  getPayoutAndMembership,
  updatePayoutSettings,
  connectStripeAccount,
  updateMembership,
};

