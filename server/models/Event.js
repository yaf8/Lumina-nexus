import mongoose from 'mongoose';
import slugify from 'slugify';

const eventSchema = new mongoose.Schema({
  // Identity
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    index: 'text'
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  eventCode: {
    type: String,
    unique: true,
    index: true
  },
  
  // Content
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [10000, 'Description cannot exceed 10000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  category: {
    type: String,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  // Media
  coverImage: {
    type: String,
    required: [true, 'Cover image is required']
  },
  gallery: [{
    url: String,
    caption: String,
    order: Number
  }],
  videoUrl: {
    type: String
  },
  
  // Organizer Information
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Organizer is required']
  },
  organizerName: {
    type: String,
    required: [true, 'Organizer name is required']
  },
  organizerPhone: {
    type: String,
    required: [true, 'Organizer phone is required']
  },
  organizerEmail: {
    type: String,
    required: [true, 'Organizer email is required']
  },
  organizerWebsite: {
    type: String
  },
  organizerWhatsApp: {
    type: String
  },
  organizerSocial: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String,
    telegram: String
  },
  
  // Location
  location: {
    type: {
      type: String,
      enum: ['online', 'physical', 'hybrid'],
      required: [true, 'Location type is required']
    },
    venueName: {
      type: String,
      required: function() {
        return this.location.type === 'physical' || this.location.type === 'hybrid';
      }
    },
    address: {
      type: String,
      required: function() {
        return this.location.type === 'physical' || this.location.type === 'hybrid';
      }
    },
    mapCoords: {
      lat: {
        type: Number,
        required: function() {
          return this.location.type === 'physical' || this.location.type === 'hybrid';
        }
      },
      lng: {
        type: Number,
        required: function() {
          return this.location.type === 'physical' || this.location.type === 'hybrid';
        }
      }
    },
    onlineLink: {
      type: String,
      required: function() {
        return this.location.type === 'online' || this.location.type === 'hybrid';
      }
    },
    onlinePlatform: {
      type: String,
      enum: ['zoom', 'google-meet', 'microsoft-teams', 'webex', 'skype', 'other']
    },
    meetingId: String,
    meetingPassword: String,
    directions: String
  },
  
  // Scheduling
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value >= this.startDate;
      },
      message: 'End date must be after or equal to start date'
    }
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:MM)']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:MM)']
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  duration: {
    type: Number, // in minutes
    min: [1, 'Duration must be at least 1 minute']
  },
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'yearly']
    },
    endDate: Date,
    daysOfWeek: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  
  // Attendance
  maxCapacity: {
    type: Number,
    min: [1, 'Capacity must be at least 1'],
    default: null // null means unlimited
  },
  attendeeCount: {
    type: Number,
    default: 0
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'confirmed', 'attended', 'cancelled', 'no-show'],
      default: 'registered'
    },
    notes: String
  }],
  waitlist: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Registration Settings
  registration: {
    required: {
      type: Boolean,
      default: true
    },
    openDate: Date,
    closeDate: Date,
    approvalRequired: {
      type: Boolean,
      default: false
    }
  },
  
  // Ticketing & Payment
  isFree: {
    type: Boolean,
    default: true
  },
  price: {
    amount: {
      type: Number,
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD'
    },
    earlyBird: {
      amount: Number,
      validUntil: Date
    }
  },
  tickets: [{
    name: String,
    description: String,
    price: Number,
    quantity: Number,
    sold: {
      type: Number,
      default: 0
    },
    saleStart: Date,
    saleEnd: Date
  }],
  paymentMethods: [{
    type: String,
    enum: ['credit-card', 'debit-card', 'paypal', 'bank-transfer', 'cash', 'telebirr', 'cbe-birr', 'other']
  }],
  externalBookingLink: {
    type: String
  },
  refundPolicy: {
    type: String,
    enum: ['no-refunds', 'full-refund', 'partial-refund', 'exchange-only'],
    default: 'no-refunds'
  },
  
  // Engagement
  favoriteCount: {
    type: Number,
    default: 0
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
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
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status & Approval
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  isExpired: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  password: {
    type: String
  },
  
  // Visibility
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public'
  },
  
  // Age Restriction
  ageRestriction: {
    type: String,
    enum: ['all-ages', '13+', '16+', '18+', '21+'],
    default: 'all-ages'
  },
  
  // Accessibility
  accessibility: {
    wheelchairAccessible: { type: Boolean, default: false },
    signLanguage: { type: Boolean, default: false },
    assistiveListening: { type: Boolean, default: false },
    serviceAnimals: { type: Boolean, default: true },
    accessibleParking: { type: Boolean, default: false },
    accessibleRestrooms: { type: Boolean, default: false }
  },
  
  // Additional Information
  requirements: [{
    type: String
  }],
  whatToBring: [{
    type: String
  }],
  dressCode: {
    type: String,
    enum: ['casual', 'business-casual', 'formal', 'costume', 'theme', 'none']
  },
  languages: [{
    type: String,
    enum: ['en', 'am', 'om', 'ti', 'ko', 'other']
  }],
  
  // SEO & Sharing
  metaTitle: {
    type: String,
    maxlength: [70, 'Meta title cannot exceed 70 characters']
  },
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  socialImage: {
    type: String
  },
  
  // Analytics
  analytics: {
    pageViews: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    referrers: [{
      source: String,
      count: Number
    }]
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: Date,
  cancelledAt: Date,
  cancellationReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
eventSchema.index({ slug: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ isApproved: 1 });
eventSchema.index({ isExpired: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ endDate: 1 });
eventSchema.index({ 'location.type': 1 });
eventSchema.index({ isFeatured: 1 });
eventSchema.index({ createdAt: -1 });
eventSchema.index({ favoriteCount: -1 });
eventSchema.index({ viewCount: -1 });
eventSchema.index({ organizer: 1 });

// Compound indexes
eventSchema.index({ status: 1, isApproved: 1, isExpired: 1 });
eventSchema.index({ category: 1, startDate: 1 });

// Virtual for isUpcoming
eventSchema.virtual('isUpcoming').get(function() {
  return new Date(this.startDate) > new Date();
});

// Virtual for isOngoing
eventSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return new Date(this.startDate) <= now && new Date(this.endDate) >= now;
});

// Virtual for spots remaining
eventSchema.virtual('spotsRemaining').get(function() {
  if (!this.maxCapacity) return null;
  return Math.max(0, this.maxCapacity - this.attendeeCount);
});

// Virtual for isFull
eventSchema.virtual('isFull').get(function() {
  if (!this.maxCapacity) return false;
  return this.attendeeCount >= this.maxCapacity;
});

// Pre-save middleware to generate slug and event code
eventSchema.pre('save', async function(next) {
  if (this.isModified('title')) {
    let baseSlug = slugify(this.title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure unique slug
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  
  // Generate unique event code
  if (!this.eventCode) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.eventCode = `EVT-${timestamp}-${random}`;
  }
  
  // Calculate duration
  if (this.startTime && this.endTime) {
    const [startHour, startMin] = this.startTime.split(':').map(Number);
    const [endHour, endMin] = this.endTime.split(':').map(Number);
    this.duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    if (this.duration < 0) this.duration += 24 * 60; // Next day
  }
  
  next();
});

// Instance method to increment view count
eventSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  this.analytics.pageViews += 1;
  return this.save({ validateBeforeSave: false });
};

// Instance method to add attendee
eventSchema.methods.addAttendee = async function(userId) {
  if (this.isFull) {
    throw new Error('Event is at full capacity');
  }
  
  const alreadyRegistered = this.attendees.some(
    a => a.user.toString() === userId.toString()
  );
  
  if (alreadyRegistered) {
    throw new Error('User already registered for this event');
  }
  
  this.attendees.push({ user: userId });
  this.attendeeCount = this.attendees.length;
  
  return this.save();
};

// Instance method to add to favorites
eventSchema.methods.addFavorite = async function(userId) {
  if (!this.favorites.includes(userId)) {
    this.favorites.push(userId);
    this.favoriteCount = this.favorites.length;
    return this.save();
  }
  return this;
};

// Instance method to remove from favorites
eventSchema.methods.removeFavorite = async function(userId) {
  this.favorites = this.favorites.filter(
    id => id.toString() !== userId.toString()
  );
  this.favoriteCount = this.favorites.length;
  return this.save();
};

// Static method to find upcoming events
eventSchema.statics.findUpcoming = function(filters = {}) {
  return this.find({
    startDate: { $gte: new Date() },
    isApproved: true,
    isExpired: false,
    status: { $in: ['approved', 'published'] },
    ...filters
  }).sort({ startDate: 1 });
};

// Static method to find popular events
eventSchema.statics.findPopular = function(limit = 10) {
  return this.find({
    isApproved: true,
    isExpired: false,
    status: { $in: ['approved', 'published'] }
  })
    .sort({ favoriteCount: -1, viewCount: -1 })
    .limit(limit);
};

const Event = mongoose.model('Event', eventSchema);

export default Event;
