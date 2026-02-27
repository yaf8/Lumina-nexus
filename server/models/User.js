import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [function() { return !this.googleId; }, 'Password is required for non-Google accounts'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  
  // Phone Information (Required for posting events)
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  phoneVerificationCode: {
    type: String,
    select: false
  },
  phoneVerificationExpires: {
    type: Date,
    select: false
  },
  
  // Google OAuth
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  googleProfilePicture: {
    type: String
  },
  
  // Profile
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say']
  },
  
  // Location
  location: {
    country: String,
    city: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Role & Permissions
  role: {
    type: String,
    enum: ['guest', 'user', 'reviewer', 'admin'],
    default: 'user'
  },
  permissions: [{
    type: String,
    enum: ['create:event', 'edit:any:event', 'delete:any:event', 'manage:users', 'review:events', 'admin:access']
  }],
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspensionReason: {
    type: String
  },
  suspendedUntil: {
    type: Date
  },
  
  // Email Verification
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Password Reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Password History
  passwordChangedAt: Date,
  passwordHistory: [{
    password: String,
    changedAt: Date
  }],
  
  // Login Tracking
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Session Management
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date,
    device: String,
    ip: String
  }],
  
  // User Activity
  eventsCreated: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  eventsJoined: [{
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    joinedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['registered', 'attended', 'cancelled', 'no-show'],
      default: 'registered'
    }
  }],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  
  // Notification Preferences
  notificationPreferences: {
    email: {
      eventReminders: { type: Boolean, default: true },
      newEvents: { type: Boolean, default: true },
      updates: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    },
    push: {
      eventReminders: { type: Boolean, default: true },
      newEvents: { type: Boolean, default: true },
      updates: { type: Boolean, default: true }
    },
    sms: {
      eventReminders: { type: Boolean, default: false },
      importantUpdates: { type: Boolean, default: true }
    }
  },
  
  // Privacy Settings
  privacySettings: {
    profileVisible: { type: Boolean, default: true },
    eventsVisible: { type: Boolean, default: true },
    allowMessages: { type: Boolean, default: true }
  },
  
  // Language Preference
  preferredLanguage: {
    type: String,
    enum: ['en', 'am', 'om', 'ti', 'ko'],
    default: 'en'
  },
  
  // Theme Preference
  themePreference: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  
  // Statistics
  stats: {
    totalEventsCreated: { type: Number, default: 0 },
    totalEventsJoined: { type: Number, default: 0 },
    totalFavorites: { type: Number, default: 0 },
    reputationScore: { type: Number, default: 0 }
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account age
userSchema.virtual('accountAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password was changed after JWT issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to increment login attempts
userSchema.methods.incrementLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5 && !this.lockUntil) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Static method to find by credentials
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email }).select('+password');
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  if (user.isSuspended) {
    throw new Error('Account is suspended. Please contact support.');
  }
  
  if (user.lockUntil && user.lockUntil > Date.now()) {
    throw new Error('Account is temporarily locked. Please try again later.');
  }
  
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    await user.incrementLoginAttempts();
    throw new Error('Invalid email or password');
  }
  
  if (user.loginAttempts > 0) {
    await user.updateOne({
      $set: { loginAttempts: 0 },
      $unset: { lockUntil: 1 }
    });
  }
  
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;
