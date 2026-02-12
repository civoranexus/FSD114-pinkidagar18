const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  // Attendance date
  date: {
    type: Date,
    default: Date.now
  },
  // Status
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'present'
  },
  // When attendance was marked
  markedAt: {
    type: Date,
    default: Date.now
  },
  // Method of marking attendance
  method: {
    type: String,
    enum: ['manual', 'face', 'qr', 'geolocation', 'auto'],
    default: 'manual'
  },
  // Verification data for face/QR
  verificationData: {
    type: {
      type: String,
      enum: ['face', 'qr', 'geolocation']
    },
    verified: {
      type: Boolean,
      default: false
    },
    confidence: {
      type: Number, // for face recognition
      min: 0,
      max: 100
    },
    qrCode: String,
    location: {
      latitude: Number,
      longitude: Number,
      accuracy: Number
    },
    timestamp: Date
  },
  // Location data (if using geolocation)
  location: {
    latitude: Number,
    longitude: Number,
    accuracy: Number
  },
  // IP address
  ipAddress: String,
  
  // Device information
  device: {
    type: String,
    platform: String,
    browser: String
  },
  // Remarks or notes
  remarks: String,
  
  // Who marked/updated the attendance
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // For late arrivals
  arrivalTime: {
    type: Date
  },
  
  // For early departures
  departureTime: {
    type: Date
  },
  
  // Duration spent (in minutes)
  duration: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
attendanceSchema.index({ student: 1, course: 1, date: 1 });
attendanceSchema.index({ course: 1, date: 1 });
attendanceSchema.index({ class: 1 });
attendanceSchema.index({ status: 1 });

// Prevent duplicate attendance for same student, course, and class
attendanceSchema.index({ student: 1, course: 1, class: 1 }, { unique: true, sparse: true });

// Calculate duration if arrival and departure times are set
attendanceSchema.pre('save', function(next) {
  if (this.arrivalTime && this.departureTime) {
    const durationMs = this.departureTime - this.arrivalTime;
    this.duration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
  }
  next();
});

// Static method to get attendance statistics
attendanceSchema.statics.getStudentStats = async function(studentId, courseId) {
  const records = await this.find({ 
    student: studentId, 
    course: courseId 
  });
  
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;
  const excused = records.filter(r => r.status === 'excused').length;
  
  const attendanceRate = total > 0 ? ((present / total) * 100).toFixed(2) : 0;
  
  return {
    total,
    present,
    absent,
    late,
    excused,
    attendanceRate: parseFloat(attendanceRate)
  };
};

// Static method to get course attendance statistics
attendanceSchema.statics.getCourseStats = async function(courseId, startDate, endDate) {
  const query = { course: courseId };
  
  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  }
  
  const records = await this.find(query);
  
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;
  
  const averageAttendance = total > 0 ? ((present / total) * 100).toFixed(2) : 0;
  
  // Get unique students
  const uniqueStudents = [...new Set(records.map(r => r.student.toString()))];
  
  return {
    totalRecords: total,
    totalStudents: uniqueStudents.length,
    present,
    absent,
    late,
    averageAttendance: parseFloat(averageAttendance)
  };
};

module.exports = mongoose.model('Attendance', attendanceSchema);