const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Create assignment
// @route   POST /api/assignments
// @access  Protected (Teacher/Admin)
exports.createAssignment = async (req, res, next) => {
  try {
    const { courseId, title, description, dueDate, maxMarks, attachments } = req.body;

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
        message: 'Not authorized to create assignments for this course'
      });
    }

    const assignment = await Assignment.create({
      course: courseId,
      title,
      description,
      dueDate,
      maxMarks,
      attachments,
      createdBy: req.user.id
    });

    await assignment.populate('course', 'title');

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get assignments for a course
// @route   GET /api/assignments/course/:courseId
// @access  Protected (Teacher/Admin)
exports.getAssignments = async (req, res, next) => {
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
        message: 'Not authorized to view assignments for this course'
      });
    }

    const assignments = await Assignment.find({ course: req.params.courseId })
      .populate('createdBy', 'name')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my assignments (student)
// @route   GET /api/assignments/student/my-assignments
// @access  Protected (Student)
exports.getMyAssignments = async (req, res, next) => {
  try {
    const { status } = req.query;

    // Get student's enrolled courses
    const user = await User.findById(req.user.id).select('enrolledCourses');

    // Find assignments for enrolled courses
    const query = { course: { $in: user.enrolledCourses } };

    const assignments = await Assignment.find(query)
      .populate('course', 'title')
      .sort('-createdAt');

    // Get submission status for each assignment
    const assignmentsWithStatus = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = await Submission.findOne({
          assignment: assignment._id,
          student: req.user.id
        });

        const assignmentObj = assignment.toObject();
        assignmentObj.status = submission ? submission.status : 'pending';
        assignmentObj.submission = submission || null;
        assignmentObj.grade = submission?.grade || null;

        return assignmentObj;
      })
    );

    // Filter by status if provided
    let filteredAssignments = assignmentsWithStatus;
    if (status) {
      filteredAssignments = assignmentsWithStatus.filter(a => a.status === status);
    }

    res.status(200).json({
      success: true,
      count: filteredAssignments.length,
      data: filteredAssignments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit assignment
// @route   POST /api/assignments/:id/submit
// @access  Protected (Student)
exports.submitAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      assignment: req.params.id,
      student: req.user.id
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'Assignment already submitted'
      });
    }

    // Check if past due date
    if (new Date() > new Date(assignment.dueDate)) {
      return res.status(400).json({
        success: false,
        message: 'Assignment submission deadline has passed'
      });
    }

    const { content } = req.body;
    const attachments = req.file ? [{
      name: req.file.originalname,
      url: `/uploads/${req.file.filename || Date.now() + '-' + req.file.originalname}`,
      type: req.file.mimetype
    }] : req.body.attachments;

    const submission = await Submission.create({
      assignment: req.params.id,
      student: req.user.id,
      content,
      attachments,
      status: 'submitted'
    });

    await submission.populate([
      { path: 'assignment', select: 'title maxMarks' },
      { path: 'student', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Grade assignment
// @route   POST /api/assignments/:id/grade
// @access  Protected (Teacher/Admin)
exports.gradeAssignment = async (req, res, next) => {
  try {
    const { studentId, marks, feedback } = req.body;

    const assignment = await Assignment.findById(req.params.id).populate('course');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check authorization
    if (assignment.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to grade this assignment'
      });
    }

    const submission = await Submission.findOne({
      assignment: req.params.id,
      student: studentId
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    if (marks > assignment.maxMarks) {
      return res.status(400).json({
        success: false,
        message: `Marks cannot exceed maximum marks (${assignment.maxMarks})`
      });
    }

    submission.grade = {
      marks,
      feedback,
      gradedBy: req.user.id,
      gradedAt: Date.now()
    };
    submission.status = 'graded';

    await submission.save();
    await submission.populate([
      { path: 'student', select: 'name email' },
      { path: 'grade.gradedBy', select: 'name' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Assignment graded successfully',
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get submissions for an assignment
// @route   GET /api/assignments/:id/submissions
// @access  Protected (Teacher/Admin)
exports.getAssignmentSubmissions = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check authorization
    if (assignment.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view submissions for this assignment'
      });
    }

    const submissions = await Submission.find({ assignment: req.params.id })
      .populate('student', 'name email profilePicture')
      .sort('-submittedAt');

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Protected (Teacher/Admin)
exports.deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check authorization
    if (assignment.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this assignment'
      });
    }

    // Delete all submissions for this assignment
    await Submission.deleteMany({ assignment: req.params.id });

    await assignment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all assignments for a teacher
// @route   GET /api/assignments/teacher/my-assignments
// @access  Protected (Teacher)
exports.getTeacherAssignments = async (req, res, next) => {
  try {
    const courses = await Course.find({ instructor: req.user.id });
    const courseIds = courses.map(c => c._id);

    const assignments = await Assignment.find({ course: { $in: courseIds } })
      .populate('course', 'title')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Protected (Teacher/Admin)
exports.updateAssignment = async (req, res, next) => {
  try {
    let assignment = await Assignment.findById(req.params.id).populate('course');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check authorization
    if (assignment.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this assignment'
      });
    }

    assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('course', 'title');

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: assignment
    });
  } catch (error) {
    next(error);
  }
};
