const express = require('express');
const router = express.Router();
const {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getMyCourses,
  getCourseStudents,
  getCourseMaterials,
  getTeacherStats
} = require('../controllers/courseController');
const { protect, authorize, attachUser } = require('../middleware/auth');

// Public routes
router.get('/', attachUser, getAllCourses);

// Protected routes - IMPORTANT: Specific routes must come BEFORE parameterized routes (:id)
// Teacher routes
router.get('/my-courses', protect, authorize('teacher', 'admin'), getMyCourses);
router.get('/teacher/stats', protect, authorize('teacher'), getTeacherStats);

// Student routes  
router.get('/materials/:courseId', protect, authorize('student'), getCourseMaterials);

// Course management (Teacher/Admin)
router.post('/', protect, authorize('teacher', 'admin'), createCourse);

// Single course routes - MUST come after specific routes
router.get('/:id', getCourse);
router.put('/:id', protect, authorize('teacher', 'admin'), updateCourse);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteCourse);

// Course students (Teacher/Admin)
router.get('/:id/students', protect, authorize('teacher', 'admin'), getCourseStudents);

module.exports = router;