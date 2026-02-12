const express = require('express');
const router = express.Router();
const { sendAnnouncement } = require('../controllers/Teachercontroller');
const { getTeacherStats } = require('../controllers/courseController');
const { getTeacherAssignments } = require('../controllers/Assignmentcontroller');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and for teachers only
router.use(protect);
router.use(authorize('teacher', 'admin'));

router.post('/announcements', sendAnnouncement);
router.get('/stats', getTeacherStats);
router.get('/assignments', getTeacherAssignments);

module.exports = router;
