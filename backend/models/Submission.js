const mongoose = require('mongoose');

// Submission Schema
const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Submission content
  content: {
    type: String // For text submissions
  },
  link: {
    type: String // For link submissions
  },
  attachments: [{
    filename: String,
    url: String,
    size: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Submission status
  status: {
    type: String,
    enum: ['pending', 'submitted', 'graded', 'returned', 'late'],
    default: 'submitted'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  isLate: {
    type: Boolean,
    default: false
  },
  // Grading information
  grade: {
    marks: {
      type: Number,
      min: 0
    },
    feedback: {
      type: String
    },
    rubricScores: [{
      criteria: String,
      points: Number,
      comment: String
    }],
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gradedAt: {
      type: Date
    }
  },
  // Comments/feedback
  teacherComments: [{
    comment: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  studentComments: [{
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Revision tracking
  revisionNumber: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    content: String,
    attachments: [mongoose.Schema.Types.Mixed],
    submittedAt: Date
  }]
}, {
  timestamps: true
});

// Ensure one submission per student per assignment
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
submissionSchema.index({ student: 1, status: 1 });
submissionSchema.index({ assignment: 1, status: 1 });

// Check if submission is late
submissionSchema.pre('save', async function (next) {
  if (this.isNew) {
    // Check if Assignment model is already registered
    const Assignment = mongoose.models.Assignment || mongoose.model('Assignment');
    const assignment = await Assignment.findById(this.assignment);
    if (assignment && this.submittedAt > assignment.dueDate) {
      this.isLate = true;
      this.status = 'late';
    }
  }
  next();
});

// Update status when graded
submissionSchema.pre('save', function (next) {
  if (this.grade && this.grade.marks !== undefined && this.status !== 'returned') {
    this.status = 'graded';
  }
  next();
});

const Submission = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);

module.exports = Submission;