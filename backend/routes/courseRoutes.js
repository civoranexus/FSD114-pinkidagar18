const express = require('express');
const router = express.Router();
const {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  getTeacherCourses,
  getEnrolledCourses
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getAllCourses);
router.get('/:id', getCourse);
router.post('/:id/enroll', protect, authorize('student'), enrollCourse);
router.get('/student/enrolled', protect, authorize('student'), getEnrolledCourses);
router.get('/teacher/my-courses', protect, authorize('teacher', 'admin'), getTeacherCourses);
router.post('/', protect, authorize('teacher', 'admin'), createCourse);
router.put('/:id', protect, authorize('teacher', 'admin'), updateCourse);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteCourse);

module.exports = router;