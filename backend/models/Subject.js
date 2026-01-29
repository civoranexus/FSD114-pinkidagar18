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
subjectSchema.pre('save', function(next) {
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

// Notification Schema - For system-wide notifications
const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  
  // Who should receive this notification
  recipients: {
    type: String,
    enum: ['all', 'students', 'teachers', 'admins', 'specific'],
    default: 'all'
  },
  
  // For specific recipients
  specificRecipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Notification type
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error', 'announcement', 'system'],
    default: 'info'
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Category
  category: {
    type: String,
    enum: ['general', 'course', 'assignment', 'grade', 'system', 'security'],
    default: 'general'
  },
  
  // Link/action
  actionUrl: {
    type: String
  },
  
  actionText: {
    type: String
  },
  
  // Icon
  icon: {
    type: String,
    default: '🔔'
  },
  
  // Rich content
  htmlContent: {
    type: String
  },
  
  // Attachments
  attachments: [{
    title: String,
    url: String,
    type: String
  }],
  
  // Scheduling
  scheduledFor: {
    type: Date
  },
  
  expiresAt: {
    type: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'expired', 'cancelled'],
    default: 'sent'
  },
  
  // Read tracking
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Statistics
  stats: {
    sent: {
      type: Number,
      default: 0
    },
    delivered: {
      type: Number,
      default: 0
    },
    read: {
      type: Number,
      default: 0
    },
    clicked: {
      type: Number,
      default: 0
    }
  },
  
  // Creator
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Email notification
  sendEmail: {
    type: Boolean,
    default: false
  },
  
  emailSent: {
    type: Boolean,
    default: false
  },
  
  // Push notification
  sendPush: {
    type: Boolean,
    default: true
  },
  
  pushSent: {
    type: Boolean,
    default: false
  },
  
  // Related entity
  relatedTo: {
    entityType: {
      type: String,
      enum: ['course', 'assignment', 'class', 'user', 'system']
    },
    entityId: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ status: 1, scheduledFor: 1 });
notificationSchema.index({ recipients: 1, createdAt: -1 });
notificationSchema.index({ 'relatedTo.entityType': 1, 'relatedTo.entityId': 1 });

// Check if notification has expired
notificationSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

// Mark as read by user
notificationSchema.methods.markAsRead = function(userId) {
  const alreadyRead = this.readBy.some(
    record => record.user.toString() === userId.toString()
  );
  
  if (!alreadyRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    this.stats.read += 1;
  }
  
  return this.save();
};

// Get unread count for user
notificationSchema.statics.getUnreadCount = async function(userId, userRole) {
  const query = {
    $or: [
      { recipients: 'all' },
      { recipients: userRole + 's' }, // 'students', 'teachers', 'admins'
      { specificRecipients: userId }
    ],
    status: 'sent',
    'readBy.user': { $ne: userId }
  };
  
  return this.countDocuments(query);
};

// Get notifications for user
notificationSchema.statics.getForUser = async function(userId, userRole, options = {}) {
  const { limit = 20, skip = 0, unreadOnly = false } = options;
  
  const query = {
    $or: [
      { recipients: 'all' },
      { recipients: userRole + 's' },
      { specificRecipients: userId }
    ],
    status: 'sent',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gte: new Date() } }
    ]
  };
  
  if (unreadOnly) {
    query['readBy.user'] = { $ne: userId };
  }
  
  return this.find(query)
    .sort('-createdAt')
    .limit(limit)
    .skip(skip)
    .populate('createdBy', 'name profilePicture');
};

const Subject = mongoose.model('Subject', subjectSchema);
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Subject, Notification };