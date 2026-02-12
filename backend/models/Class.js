const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  title: {
    type: String,
    required: [true, 'Class title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    trim: true
  },
  
  // Class type
  type: {
    type: String,
    enum: ['live', 'recorded', 'hybrid', 'workshop', 'webinar'],
    default: 'live'
  },
  
  // Schedule
  scheduledAt: {
    type: Date,
    required: true
  },
  
  duration: {
    type: Number, // in minutes
    default: 60
  },
  
  endTime: {
    type: Date
  },
  
  // Meeting information
  meetingLink: {
    type: String
  },
  
  meetingId: {
    type: String
  },
  
  meetingPassword: {
    type: String
  },
  
  platform: {
    type: String,
    enum: ['zoom', 'meet', 'teams', 'webex', 'custom'],
    default: 'zoom'
  },
  
  // Recording
  recordingUrl: {
    type: String
  },
  
  recordingAvailable: {
    type: Boolean,
    default: false
  },
  
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled'
  },
  
  // Participants
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  maxParticipants: {
    type: Number,
    default: 100
  },
  
  // Attendance tracking
  attendanceMarked: {
    type: Boolean,
    default: false
  },
  
  attendanceRecords: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: Date,
    leftAt: Date,
    duration: Number, // minutes
    status: {
      type: String,
      enum: ['present', 'absent', 'late']
    }
  }],
  
  // Class materials
  materials: [{
    title: String,
    description: String,
    url: String,
    type: {
      type: String,
      enum: ['slides', 'notes', 'video', 'document', 'link']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Agenda
  agenda: [{
    topic: String,
    duration: Number, // minutes
    completed: {
      type: Boolean,
      default: false
    }
  }],
  
  // Chat/Discussion
  chatEnabled: {
    type: Boolean,
    default: true
  },
  
  chatMessages: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Q&A
  questions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    question: String,
    answer: String,
    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    askedAt: {
      type: Date,
      default: Date.now
    },
    answeredAt: Date,
    isPublic: {
      type: Boolean,
      default: true
    }
  }],
  
  // Polls
  polls: [{
    question: String,
    options: [{
      text: String,
      votes: {
        type: Number,
        default: 0
      }
    }],
    voters: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    closedAt: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Notifications
  notificationsSent: {
    type: Boolean,
    default: false
  },
  
  remindersSent: {
    type: Boolean,
    default: false
  },
  
  // Cancellation/Rescheduling
  cancelledAt: {
    type: Date
  },
  
  cancellationReason: {
    type: String
  },
  
  rescheduledFrom: {
    type: Date
  },
  
  rescheduledTo: {
    type: Date
  },
  
  // Tags and categories
  tags: [{
    type: String
  }],
  
  // Optional: Link to specific module/lesson
  module: {
    type: mongoose.Schema.Types.ObjectId
  },
  
  lesson: {
    type: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
classSchema.index({ course: 1, scheduledAt: 1 });
classSchema.index({ instructor: 1, scheduledAt: 1 });
classSchema.index({ status: 1, scheduledAt: 1 });
classSchema.index({ scheduledAt: 1 });

// Calculate end time before saving
classSchema.pre('save', function(next) {
  if (this.scheduledAt && this.duration && !this.endTime) {
    this.endTime = new Date(this.scheduledAt.getTime() + this.duration * 60000);
  }
  next();
});

// Update status based on time
classSchema.methods.updateStatus = function() {
  const now = new Date();
  const scheduledTime = new Date(this.scheduledAt);
  const endTime = new Date(this.endTime);
  
  if (this.status === 'cancelled' || this.status === 'completed') {
    return this.status;
  }
  
  if (now < scheduledTime) {
    this.status = 'scheduled';
  } else if (now >= scheduledTime && now < endTime) {
    this.status = 'ongoing';
  } else if (now >= endTime) {
    this.status = 'completed';
  }
  
  return this.status;
};

// Method to cancel class
classSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

// Method to reschedule class
classSchema.methods.reschedule = function(newDateTime) {
  this.rescheduledFrom = this.scheduledAt;
  this.rescheduledTo = newDateTime;
  this.scheduledAt = newDateTime;
  this.status = 'rescheduled';
  
  // Recalculate end time
  if (this.duration) {
    this.endTime = new Date(newDateTime.getTime() + this.duration * 60000);
  }
  
  return this.save();
};

// Method to mark attendance
classSchema.methods.markAttendance = function(studentId, status, joinedAt, leftAt) {
  const existing = this.attendanceRecords.find(
    record => record.student.toString() === studentId.toString()
  );
  
  if (existing) {
    existing.status = status;
    existing.joinedAt = joinedAt;
    existing.leftAt = leftAt;
    if (joinedAt && leftAt) {
      existing.duration = Math.round((leftAt - joinedAt) / (1000 * 60));
    }
  } else {
    const record = {
      student: studentId,
      status,
      joinedAt,
      leftAt
    };
    
    if (joinedAt && leftAt) {
      record.duration = Math.round((leftAt - joinedAt) / (1000 * 60));
    }
    
    this.attendanceRecords.push(record);
  }
  
  this.attendanceMarked = true;
  return this.save();
};

// Static method to get upcoming classes
classSchema.statics.getUpcoming = function(courseIds, limit = 10) {
  const now = new Date();
  return this.find({
    course: { $in: courseIds },
    scheduledAt: { $gte: now },
    status: 'scheduled'
  })
    .populate('course', 'title thumbnail')
    .populate('instructor', 'name profilePicture')
    .sort('scheduledAt')
    .limit(limit);
};

module.exports = mongoose.model('Class', classSchema);