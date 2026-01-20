const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

<<<<<<< HEAD
dotenv.config();

connectDB();

const app = express();

=======
// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Middleware
>>>>>>> 2066d84652fabaaa540b5607d7cc3bf04bd6afbc
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

<<<<<<< HEAD
=======
// Routes
>>>>>>> 2066d84652fabaaa540b5607d7cc3bf04bd6afbc
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));

<<<<<<< HEAD
=======
// Health check route
>>>>>>> 2066d84652fabaaa540b5607d7cc3bf04bd6afbc
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EduVillage API is running',
    timestamp: new Date().toISOString()
  });
});

<<<<<<< HEAD
=======
// 404 handler
>>>>>>> 2066d84652fabaaa540b5607d7cc3bf04bd6afbc
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

<<<<<<< HEAD
app.use(errorHandler);

=======
// Error handler middleware (must be last)
app.use(errorHandler);

// Start server
>>>>>>> 2066d84652fabaaa540b5607d7cc3bf04bd6afbc
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║              🎓 EduVillage Backend Server                  ║
║                                                            ║
║  Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}           ║
║  API URL: http://localhost:${PORT}                          ║
║                                                            ║
║  Civora Nexus Pvt. Ltd. - CivoraX Internship              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

<<<<<<< HEAD
=======
// Handle unhandled promise rejections
>>>>>>> 2066d84652fabaaa540b5607d7cc3bf04bd6afbc
process.on('unhandledRejection', (err) => {
  console.log(`❌ Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;