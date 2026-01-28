const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

// @desc    Get progress for a course
// @route   GET /api/progress/:courseId
// @access  Protected (Student)
exports.getProgress = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.courseId
    }).populate('course', 'title thumbnail modules');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found. Please enroll in this course first.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        progress: enrollment.progress,
        completedLessons: enrollment.completedLessons,
        lastAccessedLesson: enrollment.lastAccessedLesson,
        enrolledAt: enrollment.enrolledAt,
        course: enrollment.course
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete a lesson
// @route   POST /api/progress/:courseId/complete-lesson
// @access  Protected (Student)
exports.completeLesson = async (req, res, next) => {
  try {
    const { lessonId, moduleId } = req.body;

    if (!lessonId || !moduleId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide lessonId and moduleId'
      });
    }

    let enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.courseId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found. Please enroll in this course first.'
      });
    }

    // Check if already completed
    const alreadyCompleted = enrollment.completedLessons.some(
      lesson => lesson.lessonId.toString() === lessonId
    );

    if (!alreadyCompleted) {
      enrollment.completedLessons.push({
        lessonId,
        moduleId,
        completedAt: Date.now()
      });
    }

    // Update last accessed
    enrollment.lastAccessedLesson = { moduleId, lessonId };

    // Calculate progress
    const course = await Course.findById(req.params.courseId);
    let totalLessons = 0;
    
    if (course && course.modules) {
      course.modules.forEach(module => {
        totalLessons += module.lessons ? module.lessons.length : 0;
      });
    }

    if (totalLessons > 0) {
      const completedCount = enrollment.completedLessons.length;
      enrollment.progress = Math.round((completedCount / totalLessons) * 100);
    }

    await enrollment.save();

    res.status(200).json({
      success: true,
      message: 'Lesson marked as completed',
      data: {
        progress: enrollment.progress,
        completedLessons: enrollment.completedLessons,
        totalLessons
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update last accessed lesson position
// @route   PUT /api/progress/:courseId/update-position
// @access  Protected (Student)
exports.updateLastAccessed = async (req, res, next) => {
  try {
    const { lessonId, moduleId } = req.body;

    if (!lessonId || !moduleId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide lessonId and moduleId'
      });
    }

    const enrollment = await Enrollment.findOneAndUpdate(
      {
        student: req.user.id,
        course: req.params.courseId
      },
      {
        lastAccessedLesson: { moduleId, lessonId }
      },
      { new: true }
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Position updated',
      data: {
        lastAccessedLesson: enrollment.lastAccessedLesson
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all my progress
// @route   GET /api/progress/my-progress
// @access  Protected (Student)
exports.getMyProgress = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user.id })
      .populate({
        path: 'course',
        select: 'title thumbnail instructor category',
        populate: { path: 'instructor', select: 'name' }
      })
      .sort('-updatedAt');

    // Filter out null courses
    const validEnrollments = enrollments.filter(e => e.course !== null);

    const progressData = validEnrollments.map(enrollment => ({
      course: enrollment.course,
      progress: enrollment.progress,
      completedLessons: enrollment.completedLessons.length,
      lastAccessedLesson: enrollment.lastAccessedLesson,
      enrolledAt: enrollment.enrolledAt,
      lastAccessed: enrollment.updatedAt
    }));

    res.status(200).json({
      success: true,
      count: progressData.length,
      data: progressData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get course analytics (for teachers)
// @route   GET /api/progress/course/:courseId/analytics
// @access  Protected (Teacher/Admin)
exports.getCourseAnalytics = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check authorization
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view analytics for this course'
      });
    }

    const enrollments = await Enrollment.find({ course: req.params.courseId })
      .populate('student', 'name email profilePicture');

    const totalStudents = enrollments.length;
    const completedStudents = enrollments.filter(e => e.progress === 100).length;
    const inProgress = enrollments.filter(e => e.progress > 0 && e.progress < 100).length;
    const notStarted = enrollments.filter(e => e.progress === 0).length;
    
    const averageProgress = totalStudents > 0
      ? enrollments.reduce((sum, e) => sum + e.progress, 0) / totalStudents
      : 0;

    const analytics = {
      totalEnrolled: totalStudents,
      completed: completedStudents,
      inProgress: inProgress,
      notStarted: notStarted,
      averageProgress: Math.round(averageProgress),
      completionRate: totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0,
      students: enrollments.map(e => ({
        student: e.student,
        progress: e.progress,
        completedLessons: e.completedLessons.length,
        enrolledAt: e.enrolledAt,
        lastAccessed: e.updatedAt
      }))
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset progress for a course
// @route   DELETE /api/progress/:courseId/reset
// @access  Protected (Student)
exports.resetProgress = async (req, res, next) => {
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

    // Reset progress
    enrollment.progress = 0;
    enrollment.completedLessons = [];
    enrollment.lastAccessedLesson = null;
    await enrollment.save();

    res.status(200).json({
      success: true,
      message: 'Progress reset successfully',
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
};