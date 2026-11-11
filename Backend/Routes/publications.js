const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../MiddleWares/authMiddleWare');
const {
  createPublication,
  getPublications,
  getPublicationBySlug,
  updatePublication,
  addStoryToPublication,
} = require('../controllers/publicationController');

router.get('/', optionalAuth, getPublications);
router.get('/:slug', optionalAuth, getPublicationBySlug);
router.post('/', protect, createPublication);
router.put('/:id', protect, updatePublication);
router.post('/:id/add-story', protect, addStoryToPublication);

module.exports = router;

