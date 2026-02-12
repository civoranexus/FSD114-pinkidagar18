const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging (in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('âŒ Error Details:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
  } else {
    // In production, log less verbose
    console.error('âŒ Error:', err.message);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id: ${err.value}`;
    error.message = message;
    error.statusCode = 404;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${field} with value '${value}' already exists`;
    error.message = message;
    error.statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error.message = messages.join(', ');
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token. Please login again.';
    error.message = message;
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Authentication token has expired. Please login again.';
    error.message = message;
    error.statusCode = 401;
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error.message = 'File size is too large. Maximum size allowed is 10MB';
      error.statusCode = 400;
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      error.message = 'Too many files uploaded';
      error.statusCode = 400;
    } else {
      error.message = `File upload error: ${err.message}`;
      error.statusCode = 400;
    }
  }

  // Custom application errors
  if (err.isOperational) {
    // Operational, trusted error: send message to client
    error.statusCode = err.statusCode || 500;
    error.message = err.message;
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
};

// Custom Error class for operational errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found error handler (404)
const notFound = (req, res, next) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

// Async handler wrapper to catch errors in async functions
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  // Log error details
  const timestamp = new Date().toISOString();
  const logMessage = {
    timestamp,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    error: {
      name: err.name,
      message: err.message,
      statusCode: err.statusCode || 500
    }
  };

  if (process.env.NODE_ENV === 'development') {
    logMessage.error.stack = err.stack;
    console.error('📝 Error Log:', JSON.stringify(logMessage, null, 2));
  } else {
    console.error('📝 Error Log:', JSON.stringify(logMessage));
  }

  // Pass error to next middleware
  next(err);
};

module.exports = {
  errorHandler,
  AppError,
  notFound,
  asyncHandler,
  errorLogger
};