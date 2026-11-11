const mongoose = require('mongoose');
const Series = require('../Models/Series');
const Blog = require('../Models/Blog');
const { isAdminUser } = require('../MiddleWares/authMiddleWare');

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .slice(0, 80);
};

// GET /api/series - List all public series or series by author
const getAllSeries = async (req, res) => {
  try {
    const { author } = req.query;
    const filter = {};

    if (author) {
      filter.author = author;
    } else {
      filter.isPublic = true;
    }

    const seriesList = await Series.find(filter)
      .populate('author', 'username email profilePicture isVerified')
      .populate({
        path: 'stories',
        select: 'title subtitle readTime date publishDate imageUrl status category',
      })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate aggregated reading time for each series
    const enriched = seriesList.map((s) => {
      let totalMins = 0;
      (s.stories || []).forEach((story) => {
        const match = (story?.readTime || '').match(/\d+/);
        if (match) totalMins += parseInt(match[0], 10);
      });
      return {
        ...s,
        storiesCount: (s.stories || []).length,
        totalReadTime: totalMins > 0 ? `${totalMins} min read` : '5 min read',
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching series list:', error);
    res.status(500).json({ message: 'Failed to retrieve series' });
  }
};

// GET /api/series/:idOrSlug - Single series details with chapters
const getSeriesByIdOrSlug = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);

    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };
    const series = await Series.findOne(query)
      .populate('author', 'username email profilePicture isVerified bio location')
      .populate({
        path: 'stories',
        select: 'title subtitle readTime date publishDate imageUrl status category author likes reactions comments',
        populate: { path: 'author', select: 'username profilePicture' },
      })
      .lean();

    if (!series) {
      return res.status(404).json({ message: 'Series not found' });
    }

    let totalMins = 0;
    (series.stories || []).forEach((story) => {
      const match = (story?.readTime || '').match(/\d+/);
      if (match) totalMins += parseInt(match[0], 10);
    });

    res.json({
      ...series,
      storiesCount: (series.stories || []).length,
      totalReadTime: totalMins > 0 ? `${totalMins} min total read` : '5 min read',
    });
  } catch (error) {
    console.error('Error fetching series details:', error);
    res.status(500).json({ message: 'Failed to retrieve series details' });
  }
};

// GET /api/series/by-blog/:blogId - Retrieve series navigation ribbon data for a story
const getSeriesByBlogId = async (req, res) => {
  try {
    const { blogId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.json({ series: null });
    }

    const series = await Series.findOne({ stories: blogId })
      .populate('author', 'username profilePicture isVerified')
      .populate({
        path: 'stories',
        select: 'title subtitle readTime date status',
      })
      .lean();

    if (!series) {
      return res.json({ series: null });
    }

    const stories = series.stories || [];
    const currentIndex = stories.findIndex((s) => String(s._id) === String(blogId));

    if (currentIndex === -1) {
      return res.json({ series: null });
    }

    const prevStory = currentIndex > 0 ? stories[currentIndex - 1] : null;
    const nextStory = currentIndex < stories.length - 1 ? stories[currentIndex + 1] : null;

    res.json({
      series: {
        _id: series._id,
        title: series.title,
        slug: series.slug,
        description: series.description,
        coverImage: series.coverImage,
        author: series.author,
        totalStories: stories.length,
      },
      currentPart: currentIndex + 1,
      totalParts: stories.length,
      prevStory,
      nextStory,
      allChapters: stories.map((s, idx) => ({
        _id: s._id,
        title: s.title,
        readTime: s.readTime,
        partNumber: idx + 1,
        isCurrent: idx === currentIndex,
      })),
    });
  } catch (error) {
    console.error('Error fetching series for blog:', error);
    res.status(500).json({ message: 'Failed to find series for blog' });
  }
};

// POST /api/series - Create a new series
const createSeries = async (req, res) => {
  try {
    const { title, description, coverImage, stories, isPublic } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Series title is required' });
    }

    const cleanTitle = title.trim();
    let baseSlug = slugify(cleanTitle);
    if (!baseSlug) baseSlug = 'series';

    // Ensure unique slug
    let uniqueSlug = baseSlug;
    let count = 1;
    while (await Series.exists({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${count++}`;
    }

    const storyIds = Array.isArray(stories)
      ? stories.filter((id) => mongoose.Types.ObjectId.isValid(id))
      : [];

    const newSeries = new Series({
      title: cleanTitle,
      slug: uniqueSlug,
      description: (description || '').trim(),
      coverImage: coverImage || '',
      author: req.user._id,
      stories: storyIds,
      isPublic: isPublic !== false,
    });

    await newSeries.save();

    // Link blogs to this series
    if (storyIds.length > 0) {
      for (let i = 0; i < storyIds.length; i++) {
        await Blog.updateOne(
          { _id: storyIds[i], author: req.user._id },
          { $set: { series: newSeries._id, seriesOrder: i + 1 } }
        );
      }
    }

    const populated = await Series.findById(newSeries._id)
      .populate('author', 'username profilePicture isVerified')
      .populate('stories', 'title readTime date status')
      .lean();

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating series:', error);
    res.status(500).json({ message: 'Failed to create series' });
  }
};

// PUT /api/series/:id - Update series
const updateSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, coverImage, stories, isPublic } = req.body;

    const series = await Series.findById(id);
    if (!series) {
      return res.status(404).json({ message: 'Series not found' });
    }

    const isOwner = String(series.author) === String(req.user._id);
    if (!isOwner && !isAdminUser(req.user)) {
      return res.status(403).json({ message: 'Not authorized to edit this series' });
    }

    if (title && title.trim()) {
      series.title = title.trim();
    }
    if (description !== undefined) {
      series.description = description.trim();
    }
    if (coverImage !== undefined) {
      series.coverImage = coverImage;
    }
    if (isPublic !== undefined) {
      series.isPublic = Boolean(isPublic);
    }

    if (Array.isArray(stories)) {
      const oldStoryIds = (series.stories || []).map((s) => String(s));
      const newStoryIds = stories.filter((sId) => mongoose.Types.ObjectId.isValid(sId));

      // Unlink removed stories
      const removedIds = oldStoryIds.filter((oldId) => !newStoryIds.includes(oldId));
      if (removedIds.length > 0) {
        await Blog.updateMany(
          { _id: { $in: removedIds } },
          { $unset: { series: 1, seriesOrder: 1 } }
        );
      }

      // Link and update order for all current stories
      for (let i = 0; i < newStoryIds.length; i++) {
        await Blog.updateOne(
          { _id: newStoryIds[i] },
          { $set: { series: series._id, seriesOrder: i + 1 } }
        );
      }

      series.stories = newStoryIds;
    }

    await series.save();

    const populated = await Series.findById(series._id)
      .populate('author', 'username profilePicture isVerified')
      .populate('stories', 'title readTime date status')
      .lean();

    res.json(populated);
  } catch (error) {
    console.error('Error updating series:', error);
    res.status(500).json({ message: 'Failed to update series' });
  }
};

// DELETE /api/series/:id - Delete series
const deleteSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const series = await Series.findById(id);

    if (!series) {
      return res.status(404).json({ message: 'Series not found' });
    }

    const isOwner = String(series.author) === String(req.user._id);
    if (!isOwner && !isAdminUser(req.user)) {
      return res.status(403).json({ message: 'Not authorized to delete this series' });
    }

    // Unlink all member stories
    await Blog.updateMany({ series: series._id }, { $unset: { series: 1, seriesOrder: 1 } });
    await Series.findByIdAndDelete(id);

    res.json({ message: 'Series deleted successfully' });
  } catch (error) {
    console.error('Error deleting series:', error);
    res.status(500).json({ message: 'Failed to delete series' });
  }
};

module.exports = {
  getAllSeries,
  getSeriesByIdOrSlug,
  getSeriesByBlogId,
  createSeries,
  updateSeries,
  deleteSeries,
};

