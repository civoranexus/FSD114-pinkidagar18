const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Enroll in course
// @route   POST /api/enrollments/enroll/:courseId
// @access  Protected (Student)
exports.enrollInCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course is published
    if (course.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'This course is not available for enrollment'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      student: req.user.id,
      course: req.params.courseId
    });

    // Add to course's enrolled students
    course.enrolledStudents.push(req.user.id);
    await course.save();

    // Add to user's enrolled courses
    await User.findByIdAndUpdate(req.user.id, {
      $push: { enrolledCourses: course._id }
    });

    // Populate the enrollment data
    await enrollment.populate('course', 'title thumbnail instructor category level');

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my enrollments
// @route   GET /api/enrollments/my-enrollments
// @access  Protected (Student)
exports.getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user.id })
      .populate({
        path: 'course',
        populate: { path: 'instructor', select: 'name profilePicture' }
      })
      .sort('-enrolledAt');

    // Filter out null courses (in case course was deleted)
    const validEnrollments = enrollments.filter(e => e.course !== null);

    res.status(200).json({
      success: true,
      count: validEnrollments.length,
      data: validEnrollments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unenroll from course
// @route   DELETE /api/enrollments/unenroll/:courseId
// @access  Protected (Student)
exports.unenrollFromCourse = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.courseId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Remove from course's enrolled students
    await Course.findByIdAndUpdate(req.params.courseId, {
      $pull: { enrolledStudents: req.user.id }
    });

    // Remove from user's enrolled courses
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { enrolledCourses: req.params.courseId }
    });

    // Delete enrollment
    await enrollment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Successfully unenrolled from course'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get enrollment progress
// @route   GET /api/enrollments/progress/:courseId
// @access  Protected (Student)
exports.getEnrollmentProgress = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.courseId
    })
      .populate('course', 'title thumbnail modules');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        enrollment,
        progress: enrollment.progress,
        completedLessons: enrollment.completedLessons,
        lastAccessedLesson: enrollment.lastAccessedLesson
      }
    });
  } catch (error) {
    next(error);
  }
};