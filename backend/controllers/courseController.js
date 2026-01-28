const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
exports.getAllCourses = async (req, res, next) => {
  try {
    const { category, level, status, search, page = 1, limit = 10 } = req.query;

    let query = {};

    // Filters
    if (category && category !== 'all') query.category = category;
    if (level) query.level = level;

    // Only show published courses to non-admin/non-teacher users
    if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
      if (status) query.status = status;
    } else {
      query.status = 'published';
    }

    // Search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const courses = await Course.find(query)
      .populate('instructor', 'name profilePicture')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Course.countDocuments(query);

    res.status(200).json({
      success: true,
      count: courses.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email profilePicture bio');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get teacher's courses
// @route   GET /api/courses/my-courses
// @access  Protected (Teacher/Admin)
exports.getMyCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ instructor: req.user.id })
      .populate('enrolledStudents', 'name email profilePicture')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Protected (Teacher/Admin)
exports.createCourse = async (req, res, next) => {
  try {
    req.body.instructor = req.user.id;

    const course = await Course.create(req.body);

    // Add course to user's createdCourses
    await User.findByIdAndUpdate(req.user.id, {
      $push: { createdCourses: course._id }
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Protected (Teacher/Admin - Course Owner)
exports.updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check ownership
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Protected (Teacher/Admin - Course Owner)
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check ownership
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course'
      });
    }

    // Remove course from instructor's createdCourses
    await User.findByIdAndUpdate(course.instructor, {
      $pull: { createdCourses: course._id }
    });

    // Remove course from all enrolled students
    await User.updateMany(
      { enrolledCourses: course._id },
      { $pull: { enrolledCourses: course._id } }
    );

    // Delete all enrollments for this course
    await Enrollment.deleteMany({ course: course._id });

    // Delete the course
    await course.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get course students
// @route   GET /api/courses/:id/students
// @access  Protected (Teacher/Admin)
exports.getCourseStudents = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('enrolledStudents', 'name email profilePicture createdAt');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is the course instructor or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view students for this course'
      });
    }

    res.status(200).json({
      success: true,
      count: course.enrolledStudents.length,
      data: course.enrolledStudents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get course materials
// @route   GET /api/courses/materials/:courseId
// @access  Protected (Student - Enrolled only)
exports.getCourseMaterials = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .select('title modules materials resources');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if student is enrolled
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.courseId
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to access materials'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        title: course.title,
        modules: course.modules,
        materials: course.materials,
        resources: course.resources
      }
    });
  } catch (error) {
    next(error);
  }
};