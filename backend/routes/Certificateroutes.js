const express = require('express');
const router = express.Router();
const {
  getMyCertificates,
  generateCertificate,
  verifyCertificate,
  downloadCertificate
} = require('../controllers/Certificatecontroller');
const { protect, authorize } = require('../middleware/auth');

// Student routes - View and download certificates
router.get('/my-certificates', protect, authorize('student'), getMyCertificates);
router.get('/download/:id', protect, authorize('student'), downloadCertificate);

// Public route - Verify certificate authenticity
router.get('/verify/:certificateId', verifyCertificate);

// System route - Generate certificate (triggered automatically on course completion)
router.post('/generate/:courseId', protect, authorize('student'), generateCertificate);

module.exports = router;