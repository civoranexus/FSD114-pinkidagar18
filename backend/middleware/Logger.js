const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// @desc    Log requests to console and file
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || 'Unknown';
  
  // Log to console
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);

  // Log to file (optional - can be disabled in production)
  if (process.env.ENABLE_FILE_LOGGING === 'true') {
    const logMessage = `[${timestamp}] ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}\n`;
    const logFile = path.join(logsDir, `access-${new Date().toISOString().split('T')[0]}.log`);
    
    fs.appendFile(logFile, logMessage, (err) => {
      if (err) console.error('Error writing to log file:', err);
    });
  }

  next();
};

// @desc    Log errors to file
const errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const errorMessage = err.message;
  const stack = err.stack;

  // Log error to file
  if (process.env.ENABLE_FILE_LOGGING === 'true') {
    const logMessage = `
[${timestamp}] ERROR
Method: ${method}
URL: ${url}
Message: ${errorMessage}
Stack: ${stack}
-----------------------------------
`;
    const errorLogFile = path.join(logsDir, `error-${new Date().toISOString().split('T')[0]}.log`);
    
    fs.appendFile(errorLogFile, logMessage, (err) => {
      if (err) console.error('Error writing to error log file:', err);
    });
  }

  next(err);
};

// @desc    Performance logger - track response time
const performanceLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;
    const url = req.originalUrl;
    const statusCode = res.statusCode;

    // Log slow requests (> 1000ms)
    if (duration > 1000) {
      console.warn(`⚠️ Slow Request: ${method} ${url} - ${duration}ms - Status: ${statusCode}`);
    }

    // Log all requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✓ ${method} ${url} - ${duration}ms - Status: ${statusCode}`);
    }
  });

  next();
};

// @desc    API analytics logger
const analyticsLogger = (req, res, next) => {
  // Skip logging for health check and static files
  if (req.url === '/api/health' || req.url.startsWith('/static')) {
    return next();
  }

  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user ? req.user.id : null,
    userRole: req.user ? req.user.role : null
  };

  // You can send this to analytics service or database
  // For now, just log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics:', logData);
  }

  next();
};

// @desc    Clean up old log files (older than 30 days)
const cleanupOldLogs = () => {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

  fs.readdir(logsDir, (err, files) => {
    if (err) {
      console.error('Error reading logs directory:', err);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      
      fs.stat(filePath, (err, stats) => {
        if (err) return;

        if (stats.mtime.getTime() < thirtyDaysAgo) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Error deleting old log file ${file}:`, err);
            } else {
              console.log(`Deleted old log file: ${file}`);
            }
          });
        }
      });
    });
  });
};

// Run cleanup once a day
if (process.env.ENABLE_FILE_LOGGING === 'true') {
  setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);
}

module.exports = {
  requestLogger,
  errorLogger,
  performanceLogger,
  analyticsLogger,
  cleanupOldLogs
};