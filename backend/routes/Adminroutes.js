const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getAllTeachers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getAllAttendance,
  getSystemStats,
  createNotification,
  getAllNotifications,
  deleteNotification,
  generateReport
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require admin role
router.use(protect, authorize('admin'));

// User Management
router.get('/students', getAllStudents);
router.get('/teachers', getAllTeachers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Subject Management
router.get('/subjects', getAllSubjects);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

// Attendance Management
router.get('/attendance', getAllAttendance);

// Notification Management
router.get('/notifications', getAllNotifications);
router.post('/notifications', createNotification);
router.delete('/notifications/:id', deleteNotification);

// System Analytics
router.get('/stats', getSystemStats);

// Reports
router.post('/reports/generate', generateReport);

module.exports = router;