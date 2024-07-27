const Blog = require('../Models/Blog');
const User = require('../Models/User');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'blog_images',
    format: async (req, file) => 'jpeg',
    public_id: (req, file) => file.originalname.split('.')[0], // use original filename
  },
});

const upload = multer({ storage: storage });


const getBlogs = async (req, res) => {
  try {
    let blogs;
    if (req.user) {
      // If user is authenticated, fetch bookmarked blogs
      const userId = req.user._id;
      blogs = await Blog.find({ bookmarks: userId }).populate('author', 'username profilePicture');
    } else {
      // Otherwise, fetch all blogs
      blogs = await Blog.find().populate('author', 'username profilePicture');
    }
    res.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ message: 'Server error while fetching blogs' });
  }
};


const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'username profilePicture')
      .populate({
        path: 'comments.user',
        select: 'username profilePicture',
      });

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
      const userBlogs = await Blog.find({ author: userId }).populate('author', 'username profilePicture');
      res.json(userBlogs);
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  } catch (error) {
    console.error('Error fetching user blogs:', error);
    res.status(500).json({ message: 'Server error while fetching user blogs' });
  }
};


const createBlog = async (req, res) => {
  const { title, readTime, category, content, allowComments } = req.body;
  const image = req.file.path;

  const blog = new Blog({
    title,
    readTime,
    category,
    content,
    imageUrl: image,
    author: req.user._id,
    allowComments, 
  });

  const createdBlog = await blog.save();
  res.status(201).json(createdBlog);
};

const updateBlog = async (req, res) => {
  const { id } = req.params;
  const { title, readTime, category, content, allowComments } = req.body;

  const blog = await Blog.findById(id);

  if (blog.author.toString() !== req.user._id.toString()) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  blog.title = title || blog.title;
  blog.readTime = readTime || blog.readTime;
  blog.category = category || blog.category;
  blog.content = content || blog.content;
  blog.allowComments = allowComments !== undefined ? allowComments : blog.allowComments;  // Update allowComments field

  if (req.file) {
    blog.imageUrl = req.file.path;
  }

  const updatedBlog = await blog.save();
  res.json(updatedBlog);
};

const deleteBlog = async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findById(id);

  if (blog.author.toString() !== req.user._id.toString()) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  await blog.deleteOne();
  res.json({ message: 'Blog removed' });
};

const likeBlog = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const blog = await Blog.findById(id);
  const user = await User.findById(userId);

  if (!blog || !user) {
    return res.status(404).json({ message: 'Blog or user not found' });
  }

  if (blog.likes.includes(userId)) {
    blog.likes = blog.likes.filter((like) => like.toString() !== userId.toString());
    user.likedBlogs = user.likedBlogs.filter((blogId) => blogId.toString() !== id);
  } else {
    blog.likes.push(userId);
    user.likedBlogs.push(id);
  }

  await blog.save();
  await user.save();

  const updatedBlog = await Blog.findById(blog._id).populate('author', 'username profilePicture').populate('comments.user', 'username profilePicture');
  res.json(updatedBlog);
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

    if (blog.bookmarks.includes(userId)) {
      blog.bookmarks = blog.bookmarks.filter(bookmark => bookmark.toString() !== userId.toString());
      user.bookmarkedBlogs = user.bookmarkedBlogs.filter(bookmark => bookmark.toString() !== id);
    } else {
      blog.bookmarks.push(userId);
      user.bookmarkedBlogs.push(id);
    }

    await blog.save();
    await user.save();

    const populatedBlog = await Blog.findById(blog._id)
      .populate('author', 'username profilePicture')
      .populate('comments.user', 'username profilePicture');

    res.json(populatedBlog);
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

    if (blog.shares.includes(userId)) {
      blog.shares = blog.shares.filter(share => share.toString() !== userId.toString());
      user.MyShares = user.MyShares.filter(share => share.toString() !== id);
    } else {
      blog.shares.push(userId);
      user.MyShares.push(id);
    }

    await blog.save();
    await user.save();

    const populatedBlog = await Blog.findById(blog._id)
      .populate('author', 'username profilePicture')
      .populate('comments.user', 'username profilePicture');

    res.json(populatedBlog);
  } catch (error) {
    console.error('Error bookmarking blog:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const commentOnBlog = async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  const file = req.file;

  const blog = await Blog.findById(id);
  const commentData = { user: req.user._id, comment };

  if (file) {
    commentData.attachment = file.path;
  }

  blog.comments.push(commentData);

  const updatedBlog = await blog.save();
  const populatedBlog = await Blog.findById(updatedBlog._id).populate('author', 'username profilePicture').populate('comments.user', 'username profilePicture');
  res.json(populatedBlog.comments);
};

const getBookmarkedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ bookmarks: req.user._id }).populate('author', 'username');
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserBlogs = async (req, res) => {
  try {
    if (req.user) {
      const userId = req.user._id;
      const userBlogs = await Blog.find({ author: userId }).populate('author', 'username profilePicture');
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
  shareBlog,
  getBookmarkedBlogs,
  getProfileUserBlogs,
  upload,
};
