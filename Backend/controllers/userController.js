const User = require('../Models/User');
const cloudinary = require('../config/cloudinary');
const Notification = require('../Models/Notification')
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

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
  .populate('followers', 'username profilePicture')
  .populate('following', 'username profilePicture');
  res.json(user);
};

const getOtherUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture')
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
    const user = await User.findById(req.params.id).select('-password')
    .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture')
      .populate('likedBlogs', 'title')
      .populate('bookmarkedBlogs', 'title')
      .populate('messages', 'content');;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
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

const followUser = async (req, res) => {
  const user = await User.findById(req.user._id);
  const targetUser = await User.findById(req.params.id);

  if (!user.following.includes(targetUser._id)) {
    user.following.push(targetUser._id);
    targetUser.followers.push(user._id);

    await user.save();
    await targetUser.save();

    const notification = new Notification({
      user: targetUser._id,
      message: `${user.username} started following you`,
    });

    await notification.save();
  }

  res.json(user);
};

const unfollowUser = async (req, res) => {
  const user = await User.findById(req.user._id);
  const targetUser = await User.findById(req.params.id);

  user.following = user.following.filter(f => f.toString() !== targetUser._id.toString());
  targetUser.followers = targetUser.followers.filter(f => f.toString() !== user._id.toString());

  await user.save();
  await targetUser.save();

  res.json(user);
};

const getFollowState = async (req, res) => {
  const user = await User.findById(req.user._id);
  const targetUser = await User.findById(req.params.id);

  const isFollowing = user.following.includes(targetUser._id);
  res.json({ isFollowing });
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

module.exports = {
  getUserProfile,
  getOtherUserProfile,
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
  upload
};

