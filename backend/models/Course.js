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
    enum: ['video', 'text', 'pdf', 'link', 'quiz', 'assignment'],
    required: true
  },
  contentUrl: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 0 // in minutes
  },
  order: {
    type: Number,
    required: true
  },
  isFree: {
    type: Boolean,
    default: false
  },
  // Additional resources for the lesson
  resources: [{
    title: String,
    url: String,
    type: String // pdf, link, video, etc.
  }]
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
  coverImage: {
    type: String
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
  
  // Pricing
  price: {
    type: Number,
    default: 0
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  discountPrice: {
    type: Number
  },
  
  // Students enrolled in this course
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  totalDuration: {
    type: Number,
    default: 0 // in minutes
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
  
  // Course materials and resources
  materials: [{
    title: String,
    description: String,
    url: String,
    type: String, // pdf, video, link, etc.
    size: String
  }],
  
  resources: [{
    title: String,
    description: String,
    url: String,
    type: String
  }],
  
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  
  // Rating and reviews
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
  },
  
  // Course statistics
  stats: {
    totalEnrollments: {
      type: Number,
      default: 0
    },
    totalCompletions: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    }
  },
  
  // SEO and metadata
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  metaDescription: {
    type: String
  },
  metaKeywords: [{
    type: String
  }],
  
  // Publishing dates
  publishedAt: {
    type: Date
  },
  lastUpdatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Calculate total duration before saving
courseSchema.pre('save', function(next) {
  let totalDuration = 0;
  this.modules.forEach(module => {
    module.lessons.forEach(lesson => {
      totalDuration += lesson.duration || 0;
    });
  });
  this.totalDuration = totalDuration;
  
  // Update stats
  this.stats.totalEnrollments = this.enrolledStudents.length;
  
  next();
});

// Generate slug from title
courseSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

// Update publishedAt when status changes to published
courseSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Indexes for better query performance
courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ status: 1 });

module.exports = mongoose.model('Course', courseSchema);