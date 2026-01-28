const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const User = require('../models/User');
const Class = require('../models/Class');

// @desc    Get my attendance records
// @route   GET /api/attendance/my-attendance
// @access  Protected (Student)
exports.getMyAttendance = async (req, res, next) => {
  try {
    const { courseId, startDate, endDate } = req.query;

    let query = { student: req.user.id };

    if (courseId) {
      query.course = courseId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('course', 'title')
      .populate('class', 'title scheduledAt')
      .sort('-date');

    // Calculate statistics
    const totalClasses = attendance.length;
    const presentClasses = attendance.filter(a => a.status === 'present').length;
    const absentClasses = attendance.filter(a => a.status === 'absent').length;
    const lateClasses = attendance.filter(a => a.status === 'late').length;
    const attendanceRate = totalClasses > 0 ? ((presentClasses / totalClasses) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      count: attendance.length,
      stats: {
        total: totalClasses,
        present: presentClasses,
        absent: absentClasses,
        late: lateClasses,
        attendanceRate: parseFloat(attendanceRate)
      },
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark attendance
// @route   POST /api/attendance/mark
// @access  Protected (Student)
exports.markAttendance = async (req, res, next) => {
  try {
    const { courseId, classId, location } = req.body;

    if (!courseId || !classId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide courseId and classId'
      });
    }

    // Check if already marked
    const existingAttendance = await Attendance.findOne({
      student: req.user.id,
      course: courseId,
      class: classId
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this class'
      });
    }

    // Verify class exists
    const classInfo = await Class.findById(classId);
    if (!classInfo) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Determine status based on time
    let status = 'present';
    const now = new Date();
    const scheduledTime = new Date(classInfo.scheduledAt);
    const lateThreshold = 15 * 60 * 1000; // 15 minutes

    if (now > scheduledTime && (now - scheduledTime) > lateThreshold) {
      status = 'late';
    }

    const attendance = await Attendance.create({
      student: req.user.id,
      course: courseId,
      class: classId,
      status,
      markedAt: now,
      method: 'manual',
      location
    });

    await attendance.populate([
      { path: 'course', select: 'title' },
      { path: 'class', select: 'title scheduledAt' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify face attendance
// @route   POST /api/attendance/verify-face
// @access  Protected (Student)
exports.verifyFaceAttendance = async (req, res, next) => {
  try {
    const { imageData, courseId, classId } = req.body;

    if (!imageData || !courseId || !classId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide imageData, courseId, and classId'
      });
    }

    // TODO: Implement face recognition verification
    // For now, we'll simulate it
    const faceVerified = true; // Replace with actual face recognition logic

    if (!faceVerified) {
      return res.status(400).json({
        success: false,
        message: 'Face verification failed'
      });
    }

    // Check if already marked
    const existingAttendance = await Attendance.findOne({
      student: req.user.id,
      course: courseId,
      class: classId
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this class'
      });
    }

    const attendance = await Attendance.create({
      student: req.user.id,
      course: courseId,
      class: classId,
      status: 'present',
      markedAt: Date.now(),
      method: 'face',
      verificationData: {
        type: 'face',
        verified: true
      }
    });

    await attendance.populate([
      { path: 'course', select: 'title' },
      { path: 'class', select: 'title scheduledAt' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Face attendance verified and marked successfully',
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify QR attendance
// @route   POST /api/attendance/verify-qr
// @access  Protected (Student)
exports.verifyQRAttendance = async (req, res, next) => {
  try {
    const { qrData, courseId, classId } = req.body;

    if (!qrData || !courseId || !classId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide qrData, courseId, and classId'
      });
    }

    // TODO: Implement QR code verification
    // Verify QR data matches class and hasn't expired
    const qrVerified = true; // Replace with actual QR verification logic

    if (!qrVerified) {
      return res.status(400).json({
        success: false,
        message: 'QR code verification failed or expired'
      });
    }

    // Check if already marked
    const existingAttendance = await Attendance.findOne({
      student: req.user.id,
      course: courseId,
      class: classId
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this class'
      });
    }

    const attendance = await Attendance.create({
      student: req.user.id,
      course: courseId,
      class: classId,
      status: 'present',
      markedAt: Date.now(),
      method: 'qr',
      verificationData: {
        type: 'qr',
        verified: true,
        qrCode: qrData
      }
    });

    await attendance.populate([
      { path: 'course', select: 'title' },
      { path: 'class', select: 'title scheduledAt' }
    ]);

    res.status(201).json({
      success: true,
      message: 'QR attendance verified and marked successfully',
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get course attendance (Teacher)
// @route   GET /api/attendance/course/:courseId
// @access  Protected (Teacher/Admin)
exports.getCourseAttendance = async (req, res, next) => {
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
        message: 'Not authorized to view attendance for this course'
      });
    }

    const attendance = await Attendance.find({ course: req.params.courseId })
      .populate('student', 'name email profilePicture')
      .populate('class', 'title scheduledAt')
      .sort('-date');

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update attendance
// @route   PUT /api/attendance/:id
// @access  Protected (Teacher/Admin)
exports.updateAttendance = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;

    let attendance = await Attendance.findById(req.params.id).populate('course');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Check authorization
    if (attendance.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this attendance record'
      });
    }

    attendance.status = status || attendance.status;
    attendance.remarks = remarks || attendance.remarks;
    attendance.updatedBy = req.user.id;

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete attendance
// @route   DELETE /api/attendance/:id
// @access  Protected (Teacher/Admin)
exports.deleteAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.findById(req.params.id).populate('course');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Check authorization
    if (attendance.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this attendance record'
      });
    }

    await attendance.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};