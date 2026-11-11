const ReadingList = require('../Models/ReadingList');
const Blog = require('../Models/Blog');

/**
 * Returns all reading lists for the current user, ensuring a default "Read Later" list exists
 */
const getUserReadingLists = async (req, res) => {
  try {
    const userId = req.user._id;
    let lists = await ReadingList.find({ user: userId })
      .populate('blogs', 'title subtitle imageUrl date readTime category')
      .sort({ createdAt: -1 });

    // Seed default "Read Later" list if user has no lists yet
    if (!lists || lists.length === 0) {
      const defaultList = await ReadingList.create({
        name: 'Read Later',
        description: 'Stories saved for a focused reading session',
        user: userId,
        isPrivate: true,
        color: '#4f46e5',
        icon: 'book',
        blogs: [],
      });
      lists = [defaultList];
    }

    res.json(lists);
  } catch (error) {
    console.error('Error fetching reading lists:', error);
    res.status(500).json({ message: 'Failed to retrieve reading lists' });
  }
};

/**
 * Creates a new custom reading list / bookmark folder
 */
const createReadingList = async (req, res) => {
  try {
    const { name, description = '', isPrivate = false, color = '#4f46e5' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Reading list name is required' });
    }

    const readingList = await ReadingList.create({
      name: name.trim().slice(0, 80),
      description: description.trim().slice(0, 240),
      isPrivate: Boolean(isPrivate),
      color: color || '#4f46e5',
      user: req.user._id,
      blogs: [],
    });

    res.status(201).json(readingList);
  } catch (error) {
    console.error('Error creating reading list:', error);
    res.status(500).json({ message: 'Failed to create reading list' });
  }
};

/**
 * Updates an existing reading list
 */
const updateReadingList = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isPrivate, color } = req.body;

    const list = await ReadingList.findOne({ _id: id, user: req.user._id });
    if (!list) {
      return res.status(404).json({ message: 'Reading list not found' });
    }

    if (name) list.name = name.trim().slice(0, 80);
    if (typeof description === 'string') list.description = description.trim().slice(0, 240);
    if (typeof isPrivate === 'boolean') list.isPrivate = isPrivate;
    if (color) list.color = color;

    await list.save();
    res.json(list);
  } catch (error) {
    console.error('Error updating reading list:', error);
    res.status(500).json({ message: 'Failed to update reading list' });
  }
};

/**
 * Deletes a reading list
 */
const deleteReadingList = async (req, res) => {
  try {
    const { id } = req.params;
    const list = await ReadingList.findOneAndDelete({ _id: id, user: req.user._id });
    if (!list) {
      return res.status(404).json({ message: 'Reading list not found' });
    }
    res.json({ message: 'Reading list deleted successfully' });
  } catch (error) {
    console.error('Error deleting reading list:', error);
    res.status(500).json({ message: 'Failed to delete reading list' });
  }
};

/**
 * Toggles or adds a story to a specific reading list
 */
const toggleStoryInList = async (req, res) => {
  try {
    const { id } = req.params;
    const { blogId } = req.body;

    if (!blogId) {
      return res.status(400).json({ message: 'Story ID is required' });
    }

    const list = await ReadingList.findOne({ _id: id, user: req.user._id });
    if (!list) {
      return res.status(404).json({ message: 'Reading list not found' });
    }

    const exists = list.blogs.some((b) => String(b?._id || b) === String(blogId));
    let updatedList;
    let added = false;

    if (!exists) {
      updatedList = await ReadingList.findOneAndUpdate(
        { _id: id, user: req.user._id },
        { $addToSet: { blogs: blogId } },
        { new: true }
      );
      added = true;
    } else {
      updatedList = await ReadingList.findOneAndUpdate(
        { _id: id, user: req.user._id },
        { $pull: { blogs: blogId } },
        { new: true }
      );
      added = false;
    }

    res.json({
      message: added ? `Added to "${updatedList.name}"` : `Removed from "${updatedList.name}"`,
      added,
      listId: updatedList._id,
      storyCount: (updatedList.blogs || []).length,
    });
  } catch (error) {
    console.error('Error toggling story in reading list:', error);
    res.status(500).json({ message: 'Failed to update reading list item' });
  }
};

/**
 * Gets a specific reading list with populated stories
 */
const getReadingListById = async (req, res) => {
  try {
    const { id } = req.params;
    const list = await ReadingList.findById(id).populate({
      path: 'blogs',
      populate: { path: 'author', select: 'username profilePicture roles isVerified' },
    });

    if (!list) {
      return res.status(404).json({ message: 'Reading list not found' });
    }

    // Privacy check: only owner can view if private
    if (list.isPrivate && (!req.user || String(req.user._id) !== String(list.user))) {
      return res.status(403).json({ message: 'This reading list is marked as private.' });
    }

    res.json(list);
  } catch (error) {
    console.error('Error fetching reading list by ID:', error);
    res.status(500).json({ message: 'Failed to fetch reading list' });
  }
};

module.exports = {
  getUserReadingLists,
  createReadingList,
  updateReadingList,
  deleteReadingList,
  toggleStoryInList,
  getReadingListById,
};

