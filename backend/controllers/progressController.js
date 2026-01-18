const Progress = require('../models/Progress');
const Course = require('../models/Course');

exports.getProgress = async (req, res, next) => {
  try {
    const progress = await Progress.findOne({
      student: req.user.id,
      course: req.params.courseId
    }).populate('course', 'title thumbnail');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found. Please enroll in this course first.'
      });
    }

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

exports.completeLesson = async (req, res, next) => {
  try {
    const { lessonId, moduleId } = req.body;

    let progress = await Progress.findOne({
      student: req.user.id,
      course: req.params.courseId
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found. Please enroll in this course first.'
      });
    }

    const alreadyCompleted = progress.completedLessons.some(
      lesson => lesson.lessonId.toString() === lessonId
    );

    if (!alreadyCompleted) {
      progress.completedLessons.push({
        lessonId,
        completedAt: Date.now()
      });
    }

    progress.lastAccessedLesson = { moduleId, lessonId };

    const course = await Course.findById(req.params.courseId);
    let totalLessons = 0;
    course.modules.forEach(module => {
      totalLessons += module.lessons.length;
    });

    progress.calculateProgress(totalLessons);
    await progress.save();

    res.status(200).json({
      success: true,
      message: 'Lesson marked as completed',
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

exports.updateLastAccessed = async (req, res, next) => {
  try {
    const { lessonId, moduleId } = req.body;

    const progress = await Progress.findOneAndUpdate(
      {
        student: req.user.id,
        course: req.params.courseId
      },
      {
        lastAccessedLesson: { moduleId, lessonId }
      },
      { new: true }
    );

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyProgress = async (req, res, next) => {
  try {
    const allProgress = await Progress.find({ student: req.user.id })
      .populate('course', 'title thumbnail instructor')
      .populate({
        path: 'course',
        populate: { path: 'instructor', select: 'name' }
      })
      .sort('-updatedAt');

    res.status(200).json({
      success: true,
      count: allProgress.length,
      data: allProgress
    });
  } catch (error) {
    next(error);
  }
};

exports.getCourseAnalytics = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view analytics for this course'
      });
    }

    const progressData = await Progress.find({ course: req.params.courseId })
      .populate('student', 'name email');

    const totalStudents = progressData.length;
    const completedStudents = progressData.filter(p => p.progressPercentage === 100).length;
    const averageProgress = totalStudents > 0
      ? progressData.reduce((sum, p) => sum + p.progressPercentage, 0) / totalStudents
      : 0;

    const analytics = {
      totalEnrolled: totalStudents,
      completed: completedStudents,
      inProgress: totalStudents - completedStudents,
      averageProgress: Math.round(averageProgress),
      completionRate: totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0,
      students: progressData
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};