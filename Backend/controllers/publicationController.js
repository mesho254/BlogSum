const Publication = require('../Models/Publication');
const Blog = require('../Models/Blog');

const createPublication = async (req, res) => {
  try {
    const { name, description = '', topics = [], logo = '', banner = '' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Publication name is required' });
    }

    const baseSlug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    let slug = baseSlug;
    let counter = 1;
    while (await Publication.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const publication = await Publication.create({
      name: name.trim().slice(0, 100),
      slug,
      description: description.trim().slice(0, 300),
      logo,
      banner,
      owner: req.user._id,
      editors: [req.user._id],
      writers: [req.user._id],
      topics: Array.isArray(topics) ? topics : [],
      stories: [],
    });

    res.status(201).json(publication);
  } catch (error) {
    console.error('Error creating publication:', error);
    res.status(500).json({ message: 'Failed to create publication' });
  }
};

const getPublications = async (req, res) => {
  try {
    const publications = await Publication.find()
      .populate('owner', 'username profilePicture')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = publications.map((p) => ({
      ...p,
      storiesCount: Array.isArray(p.stories) ? p.stories.length : 0,
      editorsCount: Array.isArray(p.editors) ? p.editors.length : 0,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching publications:', error);
    res.status(500).json({ message: 'Failed to retrieve publications' });
  }
};

const getPublicationBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const publication = await Publication.findOne({ slug: slug.toLowerCase() })
      .populate('owner', 'username profilePicture bio')
      .populate('editors', 'username profilePicture')
      .populate({
        path: 'stories',
        match: { status: 'published' },
        populate: { path: 'author', select: 'username profilePicture isVerified' },
        options: { sort: { date: -1 } },
      })
      .lean();

    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    res.json(publication);
  } catch (error) {
    console.error('Error fetching publication by slug:', error);
    res.status(500).json({ message: 'Failed to retrieve publication' });
  }
};

const updatePublication = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, topics, logo, banner } = req.body;

    const publication = await Publication.findById(id);
    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    const isOwnerOrEditor =
      String(publication.owner) === String(req.user._id) ||
      (publication.editors || []).some((e) => String(e) === String(req.user._id));

    if (!isOwnerOrEditor && req.user.roles !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this publication' });
    }

    if (name) publication.name = name.trim().slice(0, 100);
    if (typeof description === 'string') publication.description = description.trim().slice(0, 300);
    if (Array.isArray(topics)) publication.topics = topics;
    if (logo) publication.logo = logo;
    if (banner) publication.banner = banner;

    await publication.save();
    res.json(publication);
  } catch (error) {
    console.error('Error updating publication:', error);
    res.status(500).json({ message: 'Failed to update publication' });
  }
};

const addStoryToPublication = async (req, res) => {
  try {
    const { id } = req.params;
    const { blogId } = req.body;

    const publication = await Publication.findById(id);
    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const isAuthorized =
      String(publication.owner) === String(req.user._id) ||
      String(blog.author) === String(req.user._id) ||
      req.user.roles === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to submit to this publication' });
    }

    if (!publication.stories.some((s) => String(s) === String(blogId))) {
      publication.stories.push(blogId);
      await publication.save();
    }

    blog.publication = publication._id;
    await blog.save();

    res.json({ success: true, message: `Story added to ${publication.name}` });
  } catch (error) {
    console.error('Error adding story to publication:', error);
    res.status(500).json({ message: 'Failed to add story to publication' });
  }
};

module.exports = {
  createPublication,
  getPublications,
  getPublicationBySlug,
  updatePublication,
  addStoryToPublication,
};

