const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a notification title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Please add a notification message'],
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  recipients: {
    type: String,
    enum: ['all', 'students', 'teachers', 'specific'],
    default: 'all'
  },
  specificRecipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error', 'announcement'],
    default: 'info'
  },
  read: {
    type: Boolean,
    default: false
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  link: {
    type: String,
    trim: true
  },
  expiresAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ recipients: 1, createdAt: -1 });
notificationSchema.index({ createdBy: 1 });

// Automatically delete expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);