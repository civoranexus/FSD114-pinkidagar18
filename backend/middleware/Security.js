const crypto = require('crypto');

// @desc    Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );
  
  // Remove powered by header
  res.removeHeader('X-Powered-By');
  
  next();
};

// @desc    Rate limiting per IP
const rateLimitByIP = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const ipRequests = requests.get(ip);

    if (now > ipRequests.resetTime) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (ipRequests.count >= maxRequests) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${ip}`);
      return res.status(429).json({
        success: false,
        message: 'Too many requests from this IP. Please try again later.',
        retryAfter: Math.ceil((ipRequests.resetTime - now) / 1000)
      });
    }

    ipRequests.count++;
    next();
  };
};

// @desc    CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// @desc    API key validation middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is required'
    });
  }

  // Validate against environment variable
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key'
    });
  }

  next();
};

// @desc    IP whitelist middleware
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.length === 0) {
      return next();
    }

    if (!allowedIPs.includes(ip)) {
      console.warn(`⚠️ Unauthorized IP access attempt: ${ip}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address'
      });
    }

    next();
  };
};

// @desc    Request signature validation
const validateSignature = (req, res, next) => {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  const secret = process.env.WEBHOOK_SECRET;

  if (!signature || !timestamp) {
    return res.status(401).json({
      success: false,
      message: 'Missing signature or timestamp'
    });
  }

  // Check timestamp to prevent replay attacks (5 minute window)
  const now = Date.now();
  const requestTime = parseInt(timestamp);
  if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
    return res.status(401).json({
      success: false,
      message: 'Request timestamp expired'
    });
  }

  // Generate expected signature
  const payload = JSON.stringify(req.body) + timestamp;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({
      success: false,
      message: 'Invalid signature'
    });
  }

  next();
};

// @desc    SQL injection prevention
const preventSQLInjection = (req, res, next) => {
  const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi;
  
  const checkForSQL = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        if (sqlPattern.test(obj[key])) {
          return true;
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkForSQL(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  if (checkForSQL(req.body) || checkForSQL(req.query) || checkForSQL(req.params)) {
    console.warn('⚠️ Potential SQL injection attempt detected');
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected'
    });
  }

  next();
};

// @desc    NoSQL injection prevention
const preventNoSQLInjection = (req, res, next) => {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Check for MongoDB operators
        if (key.startsWith('$')) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

// @desc    CSRF token validation
const csrfProtection = (req, res, next) => {
  // Skip CSRF check for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  }

  next();
};

// @desc    Generate CSRF token
const generateCSRFToken = (req, res, next) => {
  if (!req.session) {
    return next();
  }

  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  // Make token available to client
  res.locals.csrfToken = req.session.csrfToken;
  next();
};

// @desc    Helmet-like security middleware
const helmet = () => {
  return (req, res, next) => {
    // Strict Transport Security
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // X-XSS-Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer-Policy
    res.setHeader('Referrer-Policy', 'no-referrer');
    
    // Permissions-Policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
  };
};

module.exports = {
  securityHeaders,
  rateLimitByIP,
  corsOptions,
  validateApiKey,
  ipWhitelist,
  validateSignature,
  preventSQLInjection,
  preventNoSQLInjection,
  csrfProtection,
  generateCSRFToken,
  helmet
};