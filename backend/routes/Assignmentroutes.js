const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAssignments,
  getMyAssignments,
  submitAssignment,
  gradeAssignment,
  getAssignmentSubmissions,
  deleteAssignment,
  getTeacherAssignments,
  updateAssignment
} = require('../controllers/Assignmentcontroller');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/Upload');

// Teacher routes - Create and manage assignments
router.post('/', protect, authorize('teacher', 'admin'), createAssignment);
router.get('/course/:courseId', protect, authorize('teacher', 'admin'), getAssignments);
router.get('/:id/submissions', protect, authorize('teacher', 'admin'), getAssignmentSubmissions);
router.post('/:id/grade', protect, authorize('teacher', 'admin'), gradeAssignment);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteAssignment);

// Teacher specific routes
router.get('/teacher/my-assignments', protect, authorize('teacher'), getTeacherAssignments);
router.put('/:id', protect, authorize('teacher', 'admin'), updateAssignment);

// Student routes - View and submit assignments
router.get('/student/my-assignments', protect, authorize('student'), getMyAssignments);
router.post('/:id/submit', protect, authorize('student'), upload.single('file'), submitAssignment);

module.exports = router;