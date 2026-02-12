const express = require('express');
const router = express.Router();
const {
  createClass,
  getUpcomingClasses,
  getClassesByCourse,
  updateClass,
  deleteClass,
  joinClass
} = require('../controllers/Classcontroller');
const { protect, authorize } = require('../middleware/auth');

// Student routes - View and join classes
router.get('/upcoming', protect, authorize('student'), getUpcomingClasses);
router.post('/:id/join', protect, authorize('student'), joinClass);

// Teacher routes - Manage classes
router.post('/', protect, authorize('teacher', 'admin'), createClass);
router.get('/course/:courseId', protect, authorize('teacher', 'admin'), getClassesByCourse);
router.put('/:id', protect, authorize('teacher', 'admin'), updateClass);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteClass);

module.exports = router;