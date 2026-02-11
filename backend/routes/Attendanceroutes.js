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
} = require('../controllers/Attendancecontroller');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/Upload');

// Student routes - Mark and view attendance
router.get('/my-attendance', protect, authorize('student'), getMyAttendance);
router.post('/mark', protect, authorize('student'), markAttendance);
router.post('/mark-face', protect, authorize('student'), upload.single('image'), verifyFaceAttendance);
router.post('/mark-qr', protect, authorize('student'), verifyQRAttendance);

// Teacher routes - Manage course attendance
router.get('/course/:courseId', protect, authorize('teacher', 'admin'), getCourseAttendance);
router.put('/:id', protect, authorize('teacher', 'admin'), updateAttendance);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteAttendance);

module.exports = router;