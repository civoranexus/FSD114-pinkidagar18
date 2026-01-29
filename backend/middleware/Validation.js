const { AppError } = require('./errorHandler');

// @desc    Validate request body fields
exports.validateFields = (requiredFields = []) => {
  return (req, res, next) => {
    const missingFields = [];

    requiredFields.forEach(field => {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    next();
  };
};

// @desc    Validate email format
exports.validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next();
  }

  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  next();
};

// @desc    Validate password strength
exports.validatePassword = (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return next();
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  // Optional: Add more password requirements
  // const hasUpperCase = /[A-Z]/.test(password);
  // const hasLowerCase = /[a-z]/.test(password);
  // const hasNumbers = /\d/.test(password);
  // const hasSpecialChar = /[!@#$%^&*]/.test(password);

  next();
};

// @desc    Validate ObjectId format
exports.validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;

    if (!objectIdRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }

    next();
  };
};

// @desc    Validate date format
exports.validateDate = (fieldName) => {
  return (req, res, next) => {
    const dateValue = req.body[fieldName];

    if (!dateValue) {
      return next();
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: `Invalid date format for ${fieldName}`
      });
    }

    next();
  };
};

// @desc    Validate file upload
exports.validateFileUpload = (options = {}) => {
  return (req, res, next) => {
    const {
      required = false,
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    } = options;

    if (!req.file && !req.files) {
      if (required) {
        return res.status(400).json({
          success: false,
          message: 'File upload is required'
        });
      }
      return next();
    }

    const file = req.file || (req.files && req.files[0]);

    if (!file) {
      if (required) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }
      return next();
    }

    // Check file size
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`
      });
    }

    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      });
    }

    next();
  };
};

// @desc    Validate pagination parameters
exports.validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page number. Must be a positive integer.'
      });
    }
    req.query.page = pageNum;
  }

  if (limit) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit. Must be between 1 and 100.'
      });
    }
    req.query.limit = limitNum;
  }

  next();
};

// @desc    Validate enrollment eligibility
exports.validateEnrollment = async (req, res, next) => {
  try {
    const Course = require('../models/Course');
    const Enrollment = require('../models/Enrollment');

    const courseId = req.params.courseId;
    const studentId = req.user.id;

    // Check if course exists
    const course = await Course.findById(courseId);
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
      student: studentId,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Attach course to request for use in controller
    req.course = course;
    next();
  } catch (error) {
    next(error);
  }
};

// @desc    Sanitize input to prevent XSS
exports.sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove script tags and other dangerous HTML
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

// @desc    Validate assignment submission
exports.validateAssignmentSubmission = (req, res, next) => {
  const { submissionType } = req.body;

  if (submissionType === 'file' && !req.file && !req.files) {
    return res.status(400).json({
      success: false,
      message: 'File submission is required for this assignment'
    });
  }

  if (submissionType === 'text' && !req.body.content) {
    return res.status(400).json({
      success: false,
      message: 'Text content is required for this assignment'
    });
  }

  if (submissionType === 'link' && !req.body.link) {
    return res.status(400).json({
      success: false,
      message: 'Link is required for this assignment'
    });
  }

  next();
};

// @desc    Validate date range
exports.validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }
  }

  next();
};

// @desc    Validate role
exports.validateRole = (allowedRoles = []) => {
  return (req, res, next) => {
    const { role } = req.body;

    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};