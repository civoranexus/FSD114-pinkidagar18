const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  contentType: {
    type: String,
    enum: ['video', 'text', 'pdf', 'link'],
    required: true
  },
  contentUrl: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 0
  },
  order: {
    type: Number,
    required: true
  },
  isFree: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    required: true
  },
  lessons: [lessonSchema]
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  thumbnail: {
    type: String,
    default: 'default-course.png'
  },
  category: {
    type: String,
    required: true,
    enum: ['Programming', 'Design', 'Business', 'Marketing', 'Data Science', 'Personal Development', 'Other']
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modules: [moduleSchema],
  price: {
    type: Number,
    default: 0
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  totalDuration: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    default: 'English'
  },
  tags: [{
    type: String,
    trim: true
  }],
  requirements: [{
    type: String
  }],
  learningOutcomes: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

courseSchema.pre('save', function(next) {
  let totalDuration = 0;
  this.modules.forEach(module => {
    module.lessons.forEach(lesson => {
      totalDuration += lesson.duration || 0;
    });
  });
  this.totalDuration = totalDuration;
  next();
});

module.exports = mongoose.model('Course', courseSchema);