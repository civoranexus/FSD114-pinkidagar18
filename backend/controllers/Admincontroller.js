const User = require('../models/User');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const Enrollment = require('../models/Enrollment');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');

// ============================================
// USER MANAGEMENT
// ============================================

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Protected (Admin)
exports.getAllStudents = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;

    let query = { role: 'student' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.isActive = status === 'active';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const students = await User.find(query)
      .select('-password')
      .populate('enrolledCourses', 'title')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: students.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      data: students
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all teachers
// @route   GET /api/admin/teachers
// @access  Protected (Admin)
exports.getAllTeachers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    let query = { role: 'teacher' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const teachers = await User.find(query)
      .select('-password')
      .populate('createdCourses', 'title')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: teachers.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      data: teachers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Protected (Admin)
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('enrolledCourses')
      .populate('createdCourses');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create user
// @route   POST /api/admin/users
// @access  Protected (Admin)
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student'
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Protected (Admin)
exports.updateUser = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      isActive: req.body.isActive,
      bio: req.body.bio,
      phoneNumber: req.body.phoneNumber
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key =>
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Protected (Admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting admin users
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    // Cleanup based on role
    if (user.role === 'student') {
      // Remove from enrolled courses
      await Course.updateMany(
        { enrolledStudents: user._id },
        { $pull: { enrolledStudents: user._id } }
      );
      // Delete enrollments
      await Enrollment.deleteMany({ student: user._id });
    } else if (user.role === 'teacher') {
      // Handle teacher's courses
      await Course.updateMany(
        { instructor: user._id },
        { status: 'draft' }
      );
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// SUBJECT MANAGEMENT
// ============================================

// @desc    Get all subjects
// @route   GET /api/admin/subjects
// @access  Protected (Admin)
exports.getAllSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find().sort('name');

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create subject
// @route   POST /api/admin/subjects
// @access  Protected (Admin)
exports.createSubject = async (req, res, next) => {
  try {
    const { name, code, description, category } = req.body;

    const subject = await Subject.create({
      name,
      code,
      description,
      category
    });

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: subject
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update subject
// @route   PUT /api/admin/subjects/:id
// @access  Protected (Admin)
exports.updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: subject
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subject
// @route   DELETE /api/admin/subjects/:id
// @access  Protected (Admin)
exports.deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    await subject.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ATTENDANCE MANAGEMENT
// ============================================

// @desc    Get all attendance records
// @route   GET /api/admin/attendance
// @access  Protected (Admin)
exports.getAllAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate, courseId, status } = req.query;

    let query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (courseId) {
      query.course = courseId;
    }

    if (status) {
      query.status = status;
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name email')
      .populate('course', 'title')
      .populate('class', 'title scheduledAt')
      .sort('-date')
      .limit(100);

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// NOTIFICATION MANAGEMENT
// ============================================

// @desc    Get all notifications
// @route   GET /api/admin/notifications
// @access  Protected (Admin)
exports.getAllNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find()
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .limit(50);

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create notification
// @route   POST /api/admin/notifications
// @access  Protected (Admin)
exports.createNotification = async (req, res, next) => {
  try {
    const { title, message, recipients, priority } = req.body;

    const notification = await Notification.create({
      title,
      message,
      recipients: recipients || 'all',
      priority: priority || 'normal',
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/admin/notifications/:id
// @access  Protected (Admin)
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// SYSTEM ANALYTICS
// ============================================

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Protected (Admin)
exports.getSystemStats = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ status: 'published' });
    const totalEnrollments = await Enrollment.countDocuments();
    const activeStudents = await User.countDocuments({ role: 'student', isActive: true });

    // Attendance rate
    const attendanceRecords = await Attendance.find();
    const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
    const avgAttendance = attendanceRecords.length > 0
      ? ((presentCount / attendanceRecords.length) * 100).toFixed(1)
      : 0;

    // Recent enrollments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentEnrollments = await Enrollment.countDocuments({
      enrolledAt: { $gte: thirtyDaysAgo }
    });

    // Course completion rate
    const completedEnrollments = await Enrollment.countDocuments({ progress: 100 });
    const completionRate = totalEnrollments > 0
      ? ((completedEnrollments / totalEnrollments) * 100).toFixed(1)
      : 0;

    const stats = {
      users: {
        totalStudents,
        totalTeachers,
        activeStudents,
        totalUsers: totalStudents + totalTeachers
      },
      courses: {
        total: totalCourses,
        published: publishedCourses,
        draft: totalCourses - publishedCourses
      },
      enrollments: {
        total: totalEnrollments,
        recent: recentEnrollments,
        completed: completedEnrollments,
        completionRate: parseFloat(completionRate)
      },
      attendance: {
        totalRecords: attendanceRecords.length,
        avgAttendance: parseFloat(avgAttendance)
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate report
// @route   POST /api/admin/reports/generate
// @access  Protected (Admin)
exports.generateReport = async (req, res, next) => {
  try {
    const { reportType, startDate, endDate, filters } = req.body;

    // This is a placeholder for report generation logic
    // You can implement specific report types based on reportType

    const report = {
      type: reportType,
      generatedAt: Date.now(),
      dateRange: { startDate, endDate },
      data: {
        message: 'Report generation functionality - implement based on reportType'
      }
    };

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};