const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAssignments,
  getMyAssignments,
  submitAssignment,
  gradeAssignment,
  deleteAssignment
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');

// Teacher routes - Create and manage assignments
router.post('/', protect, authorize('teacher', 'admin'), createAssignment);
router.get('/course/:courseId', protect, authorize('teacher', 'admin'), getAssignments);
router.post('/:id/grade', protect, authorize('teacher', 'admin'), gradeAssignment);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteAssignment);

// Student routes - View and submit assignments
router.get('/student/my-assignments', protect, authorize('student'), getMyAssignments);
router.post('/:id/submit', protect, authorize('student'), submitAssignment);

module.exports = router;