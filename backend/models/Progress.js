const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
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
  completedLessons: [{
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastAccessedLesson: {
    moduleId: mongoose.Schema.Types.ObjectId,
    lessonId: mongoose.Schema.Types.ObjectId
  },
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateUrl: {
    type: String
  },
  totalTimeSpent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

progressSchema.index({ student: 1, course: 1 }, { unique: true });

progressSchema.methods.calculateProgress = function(totalLessons) {
  if (totalLessons === 0) return 0;
  this.progressPercentage = Math.round((this.completedLessons.length / totalLessons) * 100);
  
  if (this.progressPercentage === 100 && !this.completionDate) {
    this.completionDate = new Date();
  }
  
  return this.progressPercentage;
};

module.exports = mongoose.model('Progress', progressSchema);