const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// @desc    Get my certificates
// @route   GET /api/certificates/my-certificates
// @access  Protected (Student)
exports.getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ student: req.user.id })
      .populate('course', 'title category instructor')
      .populate({
        path: 'course',
        populate: { path: 'instructor', select: 'name' }
      })
      .sort('-issuedAt');

    res.status(200).json({
      success: true,
      count: certificates.length,
      data: certificates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate certificate
// @route   POST /api/certificates/generate/:courseId
// @access  Protected (Student)
exports.generateCertificate = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.courseId
    }).populate('course');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if course is completed
    if (enrollment.progress < 100) {
      return res.status(400).json({
        success: false,
        message: 'Course must be 100% completed to generate certificate'
      });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      student: req.user.id,
      course: req.params.courseId
    });

    if (existingCertificate) {
      return res.status(400).json({
        success: false,
        message: 'Certificate already generated for this course',
        data: existingCertificate
      });
    }

    // Generate unique certificate ID
    const certificateId = `CERT-${Date.now()}-${req.user.id.toString().slice(-6)}`;

    // Get student info
    const student = await User.findById(req.user.id);

    const certificate = await Certificate.create({
      certificateId,
      student: req.user.id,
      course: req.params.courseId,
      studentName: student.name,
      courseName: enrollment.course.title,
      completionDate: Date.now(),
      issuedAt: Date.now()
    });

    await certificate.populate([
      { path: 'course', select: 'title category instructor' },
      { path: 'course', populate: { path: 'instructor', select: 'name' } }
    ]);

    res.status(201).json({
      success: true,
      message: 'Certificate generated successfully',
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify certificate
// @route   GET /api/certificates/verify/:certificateId
// @access  Public
exports.verifyCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findOne({ 
      certificateId: req.params.certificateId 
    })
      .populate('student', 'name email')
      .populate('course', 'title category');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
        verified: false
      });
    }

    res.status(200).json({
      success: true,
      verified: true,
      data: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        completionDate: certificate.completionDate,
        issuedAt: certificate.issuedAt,
        course: certificate.course
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download certificate
// @route   GET /api/certificates/download/:id
// @access  Protected (Student)
exports.downloadCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('course')
      .populate({
        path: 'course',
        populate: { path: 'instructor', select: 'name' }
      });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check ownership
    if (certificate.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this certificate'
      });
    }

    // Generate PDF
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4'
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${certificate.certificateId}.pdf`);

    doc.pipe(res);

    // Certificate Design
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8f9fa');

    // Border
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
       .lineWidth(3)
       .stroke('#1e3a8a');

    // Title
    doc.fillColor('#1e3a8a')
       .fontSize(40)
       .font('Helvetica-Bold')
       .text('CERTIFICATE OF COMPLETION', 0, 100, { align: 'center' });

    // Decorative line
    doc.moveTo(200, 160)
       .lineTo(doc.page.width - 200, 160)
       .stroke('#3b82f6');

    // Content
    doc.fillColor('#374151')
       .fontSize(18)
       .font('Helvetica')
       .text('This is to certify that', 0, 200, { align: 'center' });

    doc.fillColor('#1e3a8a')
       .fontSize(32)
       .font('Helvetica-Bold')
       .text(certificate.studentName, 0, 240, { align: 'center' });

    doc.fillColor('#374151')
       .fontSize(18)
       .font('Helvetica')
       .text('has successfully completed the course', 0, 300, { align: 'center' });

    doc.fillColor('#1e3a8a')
       .fontSize(26)
       .font('Helvetica-Bold')
       .text(certificate.courseName, 0, 340, { align: 'center' });

    // Date
    const completionDate = new Date(certificate.completionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    doc.fillColor('#374151')
       .fontSize(16)
       .font('Helvetica')
       .text(`Completion Date: ${completionDate}`, 0, 400, { align: 'center' });

    // Certificate ID
    doc.fillColor('#6b7280')
       .fontSize(12)
       .text(`Certificate ID: ${certificate.certificateId}`, 0, 450, { align: 'center' });

    // Instructor signature
    if (certificate.course && certificate.course.instructor) {
      doc.fillColor('#374151')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text(certificate.course.instructor.name, 150, 520);
      
      doc.fontSize(12)
         .font('Helvetica')
         .text('Instructor', 150, 540);

      doc.moveTo(150, 515)
         .lineTo(300, 515)
         .stroke('#9ca3af');
    }

    // Platform signature
    doc.fillColor('#374151')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('EduVillage', doc.page.width - 300, 520);
    
    doc.fontSize(12)
       .font('Helvetica')
       .text('Learning Platform', doc.page.width - 300, 540);

    doc.moveTo(doc.page.width - 300, 515)
       .lineTo(doc.page.width - 150, 515)
       .stroke('#9ca3af');

    // Footer
    doc.fillColor('#6b7280')
       .fontSize(10)
       .text('Verify this certificate at: eduvillage.com/verify/' + certificate.certificateId, 
             0, doc.page.height - 60, { align: 'center' });

    doc.end();

  } catch (error) {
    next(error);
  }
};