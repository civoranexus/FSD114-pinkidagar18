const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getMyAttendance,
  getCourseAttendance,
  updateAttendance,
  deleteAttendance,
  verifyFaceAttendance,
  verifyQRAttendance
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

// Student routes - Mark and view attendance
router.get('/my-attendance', protect, authorize('student'), getMyAttendance);
router.post('/mark', protect, authorize('student'), markAttendance);
router.post('/verify-face', protect, authorize('student'), verifyFaceAttendance);
router.post('/verify-qr', protect, authorize('student'), verifyQRAttendance);

// Teacher routes - Manage course attendance
router.get('/course/:courseId', protect, authorize('teacher', 'admin'), getCourseAttendance);
router.put('/:id', protect, authorize('teacher', 'admin'), updateAttendance);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteAttendance);

module.exports = router;