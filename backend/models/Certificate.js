const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  // Unique certificate ID for verification
  certificateId: {
    type: String,
    required: true,
    unique: true
  },

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },

  // Cached data for certificate (in case course/user is deleted)
  studentName: {
    type: String,
    required: true
  },

  studentEmail: {
    type: String
  },

  courseName: {
    type: String,
    required: true
  },

  courseCategory: {
    type: String
  },

  instructorName: {
    type: String
  },

  // Completion information
  completionDate: {
    type: Date,
    required: true
  },

  issuedAt: {
    type: Date,
    default: Date.now
  },

  // Certificate details
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'Pass', 'Distinction', 'Merit'],
    default: 'Pass'
  },

  score: {
    type: Number,
    min: 0,
    max: 100
  },

  // Certificate file
  certificateUrl: {
    type: String // URL to the generated PDF
  },

  // Verification
  verificationCode: {
    type: String,
    unique: true,
    sparse: true
  },

  isVerified: {
    type: Boolean,
    default: true
  },

  // Certificate template used
  template: {
    type: String,
    default: 'default'
  },

  // Additional metadata
  metadata: {
    totalLessons: Number,
    totalHours: Number,
    quizzesPassed: Number,
    assignmentsCompleted: Number,
    averageScore: Number
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired'],
    default: 'active'
  },

  revokedAt: {
    type: Date
  },

  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  revokedReason: {
    type: String
  },

  // Expiry date (if applicable)
  expiresAt: {
    type: Date
  },

  // Signature information
  signatures: [{
    name: String,
    title: String,
    role: String, // instructor, admin, etc.
    signature: String // URL to signature image
  }],

  // QR code for quick verification
  qrCode: {
    type: String // base64 encoded QR code image
  },

  // Share settings
  isPublic: {
    type: Boolean,
    default: false
  },

  shareableLink: {
    type: String,
    unique: true,
    sparse: true
  },

  // Skills or competencies earned
  skills: [{
    type: String
  }],

  // View/download count
  viewCount: {
    type: Number,
    default: 0
  },

  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
certificateSchema.index({ student: 1, course: 1 }, { unique: true });
certificateSchema.index({ issuedAt: -1 });
certificateSchema.index({ status: 1 });

// Generate certificate ID before saving
certificateSchema.pre('save', function (next) {
  if (this.isNew && !this.certificateId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.certificateId = `CERT-${timestamp}-${random}`;
  }
  next();
});

// Generate verification code
certificateSchema.pre('save', function (next) {
  if (this.isNew && !this.verificationCode) {
    const code = Math.random().toString(36).substring(2, 12).toUpperCase();
    this.verificationCode = code;
  }
  next();
});

// Generate shareable link
certificateSchema.pre('save', function (next) {
  if (this.isPublic && !this.shareableLink) {
    const slug = this.certificateId.toLowerCase();
    this.shareableLink = `/verify/${slug}`;
  }
  next();
});

// Method to revoke certificate
certificateSchema.methods.revoke = function (reason, revokedBy) {
  this.status = 'revoked';
  this.revokedAt = new Date();
  this.revokedBy = revokedBy;
  this.revokedReason = reason;
  return this.save();
};

// Method to verify certificate
certificateSchema.methods.verify = function () {
  if (this.status === 'revoked') {
    return {
      valid: false,
      reason: 'Certificate has been revoked',
      revokedAt: this.revokedAt,
      revokedReason: this.revokedReason
    };
  }

  if (this.expiresAt && this.expiresAt < new Date()) {
    return {
      valid: false,
      reason: 'Certificate has expired',
      expiredAt: this.expiresAt
    };
  }

  return {
    valid: true,
    certificateId: this.certificateId,
    studentName: this.studentName,
    courseName: this.courseName,
    completionDate: this.completionDate,
    issuedAt: this.issuedAt
  };
};

// Static method to verify by certificate ID
certificateSchema.statics.verifyByCertificateId = async function (certificateId) {
  const certificate = await this.findOne({ certificateId });

  if (!certificate) {
    return {
      valid: false,
      reason: 'Certificate not found'
    };
  }

  return certificate.verify();
};

// Increment view count
certificateSchema.methods.incrementView = function () {
  this.viewCount += 1;
  return this.save();
};

// Increment download count
certificateSchema.methods.incrementDownload = function () {
  this.downloadCount += 1;
  return this.save();
};

module.exports = mongoose.model('Certificate', certificateSchema);