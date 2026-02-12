const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
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
  
  // Progress tracking
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  completedLessons: [{
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  lastAccessedLesson: {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId
    },
    accessedAt: {
      type: Date,
      default: Date.now
    }
  },
  
  // Enrollment dates
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  
  completedAt: {
    type: Date
  },
  
  // Certificate information
  certificateIssued: {
    type: Boolean,
    default: false
  },
  
  certificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  },
  
  // Time tracking
  totalTimeSpent: {
    type: Number,
    default: 0 // in minutes
  },
  
  // Enrollment status
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped', 'suspended'],
    default: 'active'
  },
  
  // Payment information (if paid course)
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  
  paymentDate: {
    type: Date
  },
  
  amountPaid: {
    type: Number,
    default: 0
  },
  
  // Performance metrics
  quizScores: [{
    quizId: mongoose.Schema.Types.ObjectId,
    score: Number,
    percentage: Number,
    attemptedAt: Date
  }],
  
  assignmentScores: [{
    assignmentId: mongoose.Schema.Types.ObjectId,
    score: Number,
    maxScore: Number,
    submittedAt: Date
  }],
  
  averageQuizScore: {
    type: Number,
    default: 0
  },
  
  averageAssignmentScore: {
    type: Number,
    default: 0
  },
  
  // Notes and bookmarks
  notes: [{
    lessonId: mongoose.Schema.Types.ObjectId,
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  bookmarks: [{
    lessonId: mongoose.Schema.Types.ObjectId,
    timestamp: Number, // for video bookmarks
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Ensure unique enrollment per student per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Additional indexes for performance
enrollmentSchema.index({ student: 1, status: 1 });
enrollmentSchema.index({ course: 1, status: 1 });
enrollmentSchema.index({ enrolledAt: 1 });

// Calculate progress percentage
enrollmentSchema.methods.calculateProgress = function(totalLessons) {
  if (totalLessons === 0) return 0;
  
  const completedCount = this.completedLessons.length;
  this.progress = Math.round((completedCount / totalLessons) * 100);
  
  // Mark as completed if 100%
  if (this.progress === 100 && !this.completedAt) {
    this.completedAt = new Date();
    this.status = 'completed';
  }
  
  return this.progress;
};

// Update last accessed lesson
enrollmentSchema.methods.updateLastAccessed = function(moduleId, lessonId) {
  this.lastAccessedLesson = {
    moduleId,
    lessonId,
    accessedAt: new Date()
  };
};

// Add completed lesson
enrollmentSchema.methods.addCompletedLesson = function(moduleId, lessonId) {
  const alreadyCompleted = this.completedLessons.some(
    lesson => lesson.lessonId.toString() === lessonId.toString()
  );
  
  if (!alreadyCompleted) {
    this.completedLessons.push({
      lessonId,
      moduleId,
      completedAt: new Date()
    });
  }
};

// Calculate average scores
enrollmentSchema.methods.calculateAverages = function() {
  if (this.quizScores.length > 0) {
    const totalQuizScore = this.quizScores.reduce((sum, q) => sum + q.percentage, 0);
    this.averageQuizScore = Math.round(totalQuizScore / this.quizScores.length);
  }
  
  if (this.assignmentScores.length > 0) {
    const totalAssignmentScore = this.assignmentScores.reduce((sum, a) => {
      const percentage = (a.score / a.maxScore) * 100;
      return sum + percentage;
    }, 0);
    this.averageAssignmentScore = Math.round(totalAssignmentScore / this.assignmentScores.length);
  }
};

// Pre-save middleware to update averages
enrollmentSchema.pre('save', function(next) {
  this.calculateAverages();
  next();
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);