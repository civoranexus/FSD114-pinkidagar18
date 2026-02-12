const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Also check for token in cookies (optional)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please login.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token may be invalid.'
      });
    }

    // Check if user account is active
    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// @desc    Authorize specific roles
// @usage   authorize('admin', 'teacher')
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route. Required roles: ${roles.join(', ')}`
      });
    }
    
    next();
  };
};

// @desc    Generate JWT token
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Optional user - doesn't fail if not authenticated
// @usage   For routes that work both authenticated and unauthenticated
exports.optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    // No token, continue without user
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
  } catch (error) {
    // Token invalid, continue without user
    console.log('Optional auth - invalid token, continuing without user');
  }

  next();
};

// @desc    Check if user owns the resource
// @usage   For ensuring users can only modify their own resources
exports.checkOwnership = (resourceUserIdField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if resource exists in req object
    if (!req.resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Check ownership
    const resourceUserId = req.resource[resourceUserIdField];
    if (!resourceUserId || resourceUserId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    next();
  };
};

// @desc    Rate limiting helper - track requests per user
exports.userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    
    if (!requests.has(userId)) {
      requests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const userRequests = requests.get(userId);

    if (now > userRequests.resetTime) {
      // Reset window
      requests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userRequests.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      });
    }

    userRequests.count++;
    next();
  };
};

// @desc    Attach user to request if token is valid (for public routes that benefit from user context)
exports.attachUser = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Silently fail - this is optional
    }
  }

  next();
};