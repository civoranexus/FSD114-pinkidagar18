const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// ===========================================
// MIDDLEWARE CONFIGURATION
// ===========================================

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Compression middleware
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Security middleware
const { securityHeaders, helmet } = require('./middleware/Security');
app.use(securityHeaders);
app.use(helmet());

// Request sanitization
const { preventNoSQLInjection, preventSQLInjection } = require('./middleware/Security');
app.use(preventNoSQLInjection);
app.use(preventSQLInjection);

// Input sanitization
const { sanitizeInput } = require('./middleware/Validation');
app.use(sanitizeInput);

// Rate limiting
const { rateLimitByIP } = require('./middleware/Security');
app.use('/api/', rateLimitByIP(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// Logging middleware
const { requestLogger, performanceLogger } = require('./middleware/Logger');
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);
app.use(performanceLogger);

// Cache control
const { cacheControl } = require('./middleware/Cache');
app.use(cacheControl(300)); // 5 minutes default

// ===========================================
// ROUTES
// ===========================================

// Import route modules
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const progressRoutes = require('./routes/progressRoutes');
const assignmentRoutes = require('./routes/Assignmentroutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const classRoutes = require('./routes/classRoutes');
const adminRoutes = require('./routes/adminroutes');
const aiRoutes = require('./routes/aiRoutes');
const teacherRoutes = require('./routes/TeacherRoutes');

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/teacher', teacherRoutes);

// ===========================================
// HEALTH CHECK & SYSTEM ENDPOINTS
// ===========================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EduVillage API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to EduVillage API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      courses: '/api/courses',
      enrollments: '/api/enrollments',
      progress: '/api/progress',
      assignments: '/api/assignments',
      attendance: '/api/attendance',
      certificates: '/api/certificates',
      classes: '/api/classes',
      admin: '/api/admin'
    }
  });
});

// Cache statistics endpoint (development only)
if (process.env.NODE_ENV === 'development') {
  const { getCacheStats, clearCache } = require('./middleware/Cache');

  app.get('/api/cache/stats', (req, res) => {
    const stats = getCacheStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  });

  app.delete('/api/cache/clear', (req, res) => {
    const { pattern } = req.query;
    const cleared = clearCache(pattern);
    res.status(200).json({
      success: true,
      message: `Cleared ${cleared} cache entries`,
      pattern: pattern || 'all'
    });
  });
}

// ===========================================
// ERROR HANDLING
// ===========================================

// Import error handlers
const { errorHandler, notFound, errorLogger } = require('./middleware/errorHandler');

// 404 handler - must be after all routes
app.use(notFound);

// Error logging
app.use(errorLogger);

// Global error handler - must be last
app.use(errorHandler);

// ===========================================
// SERVER INITIALIZATION
// ===========================================

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  console.log('===========================================');
  console.log(`🚀 EduVillage Server Started`);
  console.log(`===========================================`);
  console.log(`📍 Environment: ${NODE_ENV}`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`📚 API: http://localhost:${PORT}/api`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health`);
  console.log('===========================================');
});

// ===========================================
// GRACEFUL SHUTDOWN HANDLERS
// ===========================================

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  console.error('Stack:', err.stack);

  // Close server & exit process
  server.close(() => {
    console.log('🔴 Server closed due to unhandled promise rejection');
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error('Stack:', err.stack);

  // Exit process
  console.log('🔴 Server shutting down due to uncaught exception');
  process.exit(1);
});

// Handle SIGTERM signal (Heroku, Docker, etc.)
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM signal received');
  console.log('🔴 Closing server gracefully...');

  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle SIGINT signal (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT signal received (Ctrl+C)');
  console.log('🔴 Closing server gracefully...');

  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// ===========================================
// EXPORT
// ===========================================

module.exports = app;