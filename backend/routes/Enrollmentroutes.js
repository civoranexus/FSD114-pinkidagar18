const express = require('express');
const router = express.Router();
const {
  enrollInCourse,
  getMyEnrollments,
  unenrollFromCourse,
  getEnrollmentProgress
} = require('../controllers/Enrollmentcontroller');
const { protect, authorize } = require('../middleware/auth');

// All enrollment routes require student role
router.post('/enroll/:courseId', protect, authorize('student'), enrollInCourse);
router.get('/my-enrollments', protect, authorize('student'), getMyEnrollments);
router.delete('/unenroll/:courseId', protect, authorize('student'), unenrollFromCourse);
router.get('/progress/:courseId', protect, authorize('student'), getEnrollmentProgress);

module.exports = router;