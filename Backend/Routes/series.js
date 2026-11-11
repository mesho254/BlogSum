const express = require('express');
const router = express.Router();
const { protect } = require('../MiddleWares/authMiddleWare');
const {
  getAllSeries,
  getSeriesByIdOrSlug,
  getSeriesByBlogId,
  createSeries,
  updateSeries,
  deleteSeries,
} = require('../controllers/seriesController');

router.route('/')
  .get(getAllSeries)
  .post(protect, createSeries);

router.get('/by-blog/:blogId', getSeriesByBlogId);

router.route('/:idOrSlug')
  .get(getSeriesByIdOrSlug);

router.route('/:id')
  .put(protect, updateSeries)
  .delete(protect, deleteSeries);

module.exports = router;

