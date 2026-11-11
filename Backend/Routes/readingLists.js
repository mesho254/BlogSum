const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../MiddleWares/authMiddleWare');
const {
  getUserReadingLists,
  createReadingList,
  updateReadingList,
  deleteReadingList,
  toggleStoryInList,
  getReadingListById,
} = require('../controllers/readingListController');

router.get('/', protect, getUserReadingLists);
router.post('/', protect, createReadingList);
router.get('/:id', optionalAuth, getReadingListById);
router.put('/:id', protect, updateReadingList);
router.delete('/:id', protect, deleteReadingList);
router.post('/:id/toggle-story', protect, toggleStoryInList);

module.exports = router;

