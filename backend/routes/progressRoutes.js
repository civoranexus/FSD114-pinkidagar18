const express = require('express');
const router = express.Router();
const {
  getProgress,
  completeLesson,
  updateLastAccessed,
  getMyProgress,
  getCourseAnalytics,
  resetProgress
} = require('../controllers/progressController');
const { protect, authorize } = require('../middleware/auth');

// Student routes - Track learning progress
router.get('/my-progress', protect, authorize('student'), getMyProgress);
router.get('/:courseId', protect, authorize('student'), getProgress);
router.post('/:courseId/complete-lesson', protect, authorize('student'), completeLesson);
router.put('/:courseId/update-position', protect, authorize('student'), updateLastAccessed);
router.delete('/:courseId/reset', protect, authorize('student'), resetProgress);

// Teacher/Admin routes - View analytics
router.get('/course/:courseId/analytics', protect, authorize('teacher', 'admin'), getCourseAnalytics);

module.exports = router;