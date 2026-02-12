const mongoose = require('mongoose');

// Subject Schema - For admin to manage subjects/categories
const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },

  code: {
    type: String,
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [20, 'Code cannot exceed 20 characters']
  },

  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  category: {
    type: String,
    enum: ['Programming', 'Design', 'Business', 'Marketing', 'Data Science', 'Personal Development', 'Other'],
    default: 'Other'
  },

  icon: {
    type: String,
    default: '📚'
  },

  color: {
    type: String,
    default: '#3B82F6'
  },

  // Associated courses count
  coursesCount: {
    type: Number,
    default: 0
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // SEO
  slug: {
    type: String,
    unique: true,
    sparse: true
  },

  // Display order
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate slug before saving
subjectSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
