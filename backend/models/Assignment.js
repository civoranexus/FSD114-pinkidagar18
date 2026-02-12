const mongoose = require('mongoose');

// Assignment Schema
const assignmentSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Assignment description is required']
  },
  instructions: {
    type: String
  },
  dueDate: {
    type: Date,
    required: true
  },
  maxMarks: {
    type: Number,
    default: 100,
    min: 0
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
  submissionType: {
    type: String,
    enum: ['file', 'text', 'link', 'both'],
    default: 'file'
  },
  allowedFileTypes: [{
    type: String // e.g., 'pdf', 'docx', 'zip'
  }],
  maxFileSize: {
    type: Number, // in MB
    default: 10
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Optional: Link to specific module/lesson
  module: {
    type: mongoose.Schema.Types.ObjectId
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId
  },
  // Grading rubric
  rubric: [{
    criteria: String,
    maxPoints: Number,
    description: String
  }],
  // Auto-grading settings (if applicable)
  autoGrade: {
    enabled: {
      type: Boolean,
      default: false
    },
    criteria: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
assignmentSchema.index({ course: 1, dueDate: 1 });
assignmentSchema.index({ createdBy: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
