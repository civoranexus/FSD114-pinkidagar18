const Notification = require('../models/Notification');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Send announcement to students
// @route   POST /api/teacher/announcements
// @access  Protected (Teacher)
exports.sendAnnouncement = async (req, res, next) => {
    try {
        const { title, message, courseId, type = 'announcement', priority = 'normal' } = req.body;

        let recipients = 'all';
        let specificRecipients = [];

        if (courseId) {
            const course = await Course.findById(courseId).populate('enrolledStudents');
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to send announcements for this course'
                });
            }

            recipients = 'specific';
            specificRecipients = course.enrolledStudents.map(s => s._id);
        } else {
            // Find all students enrolled in any of this teacher's courses
            const courses = await Course.find({ instructor: req.user.id });
            const allStudents = new Set();
            courses.forEach(c => {
                c.enrolledStudents.forEach(s => allStudents.add(s.toString()));
            });

            recipients = 'specific';
            specificRecipients = Array.from(allStudents);
        }

        if (specificRecipients.length === 0 && recipients === 'specific') {
            return res.status(400).json({
                success: false,
                message: 'No students enrolled to receive announcement'
            });
        }

        const notification = await Notification.create({
            title,
            message,
            recipients,
            specificRecipients,
            type,
            priority,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Announcement sent successfully',
            data: notification
        });
    } catch (error) {
        next(error);
    }
};
