const Class = require('../models/Class');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Get upcoming classes for student
// @route   GET /api/classes/upcoming
// @access  Protected (Student)
exports.getUpcomingClasses = async (req, res, next) => {
  try {
    // Get student's enrolled courses
    const enrollments = await Enrollment.find({ student: req.user.id })
      .select('course');
    
    const enrolledCourseIds = enrollments.map(e => e.course);

    // Find upcoming classes for those courses
    const now = new Date();
    const classes = await Class.find({
      course: { $in: enrolledCourseIds },
      scheduledAt: { $gte: now },
      status: 'scheduled'
    })
      .populate('course', 'title thumbnail')
      .populate('instructor', 'name profilePicture')
      .sort('scheduledAt')
      .limit(20);

    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join a class
// @route   POST /api/classes/:id/join
// @access  Protected (Student)
exports.joinClass = async (req, res, next) => {
  try {
    const classInfo = await Class.findById(req.params.id)
      .populate('course', 'title');

    if (!classInfo) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: classInfo.course._id
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to join the class'
      });
    }

    // Check if class has started
    const now = new Date();
    const classStart = new Date(classInfo.scheduledAt);
    const fifteenMinutesBefore = new Date(classStart.getTime() - 15 * 60000);

    if (now < fifteenMinutesBefore) {
      return res.status(400).json({
        success: false,
        message: 'Class can only be joined 15 minutes before start time'
      });
    }

    // Add student to participants if not already there
    if (!classInfo.participants.includes(req.user.id)) {
      classInfo.participants.push(req.user.id);
      await classInfo.save();
    }

    res.status(200).json({
      success: true,
      message: 'Successfully joined the class',
      data: {
        meetingLink: classInfo.meetingLink,
        title: classInfo.title,
        scheduledAt: classInfo.scheduledAt,
        duration: classInfo.duration
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a class
// @route   POST /api/classes
// @access  Protected (Teacher/Admin)
exports.createClass = async (req, res, next) => {
  try {
    const { courseId, title, description, scheduledAt, duration, meetingLink, type } = req.body;

    // Verify course exists and user is instructor
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create classes for this course'
      });
    }

    const classInfo = await Class.create({
      course: courseId,
      instructor: req.user.id,
      title,
      description,
      scheduledAt,
      duration,
      meetingLink,
      type: type || 'live'
    });

    await classInfo.populate([
      { path: 'course', select: 'title' },
      { path: 'instructor', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: classInfo
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get classes by course
// @route   GET /api/classes/course/:courseId
// @access  Protected (Teacher/Admin)
exports.getClassesByCourse = async (req, res, next) => {
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
        message: 'Not authorized to view classes for this course'
      });
    }

    const classes = await Class.find({ course: req.params.courseId })
      .populate('instructor', 'name')
      .sort('scheduledAt');

    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a class
// @route   PUT /api/classes/:id
// @access  Protected (Teacher/Admin)
exports.updateClass = async (req, res, next) => {
  try {
    let classInfo = await Class.findById(req.params.id).populate('course');

    if (!classInfo) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check authorization
    if (classInfo.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this class'
      });
    }

    const { title, description, scheduledAt, duration, meetingLink, status, type } = req.body;

    classInfo.title = title || classInfo.title;
    classInfo.description = description || classInfo.description;
    classInfo.scheduledAt = scheduledAt || classInfo.scheduledAt;
    classInfo.duration = duration || classInfo.duration;
    classInfo.meetingLink = meetingLink || classInfo.meetingLink;
    classInfo.status = status || classInfo.status;
    classInfo.type = type || classInfo.type;

    await classInfo.save();

    res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      data: classInfo
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Protected (Teacher/Admin)
exports.deleteClass = async (req, res, next) => {
  try {
    const classInfo = await Class.findById(req.params.id).populate('course');

    if (!classInfo) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check authorization
    if (classInfo.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this class'
      });
    }

    await classInfo.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};