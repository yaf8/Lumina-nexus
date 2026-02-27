import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { body, validationResult } from 'express-validator';
import { User } from '../models/index.js';
import { 
  protect, 
  sendTokenResponse, 
  generateToken,
  generateRefreshToken 
} from '../middleware/auth.middleware.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array()
    });
  }
  next();
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    validate
  ],
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, phoneNumber } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      isVerified: true // Auto-verify for now
    });

    sendTokenResponse(user, 201, res);
  })
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
  ],
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check credentials
    const user = await User.findByCredentials(email, password);
    
    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  })
);

// @route   POST /api/auth/google
// @desc    Login/Register with Google
// @access  Public
router.post(
  '/google',
  asyncHandler(async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
      throw new AppError('Google credential is required', 400);
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture, sub: googleId } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // Update Google info if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.googleProfilePicture = picture;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      // Create new user
      user = await User.create({
        firstName: given_name,
        lastName: family_name,
        email,
        googleId,
        googleProfilePicture: picture,
        isVerified: true,
        password: undefined // No password for Google users
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  })
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
      .populate('eventsCreated', 'title startDate status')
      .populate('eventsJoined.event', 'title startDate status')
      .populate('favorites', 'title startDate coverImage');

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  })
);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post(
  '/logout',
  protect,
  asyncHandler(async (req, res) => {
    // Clear cookies
    res.cookie('jwt', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
    res.cookie('refreshToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  })
);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public (with refresh token)
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        throw new AppError('Invalid refresh token', 401);
      }

      const newToken = generateToken(user._id);
      const newRefreshToken = generateRefreshToken(user._id);

      res.status(200).json({
        status: 'success',
        token: newToken,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  })
);

// @route   PUT /api/auth/update-password
// @desc    Update password
// @access  Private
router.put(
  '/update-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
    validate
  ],
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  })
);

// @route   POST /api/auth/forgot-password
// @desc    Forgot password
// @access  Public
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    validate
  ],
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if email exists
      return res.status(200).json({
        status: 'success',
        message: 'If an account exists, a password reset email will be sent'
      });
    }

    // Generate reset token (simplified - in production, send email)
    const resetToken = generateToken(user._id);
    
    // In production: Send email with reset link
    // For now, just return the token
    res.status(200).json({
      status: 'success',
      message: 'Password reset token generated',
      resetToken // Remove in production
    });
  })
);

// @route   POST /api/auth/verify-phone
// @desc    Request phone verification
// @access  Private
router.post(
  '/verify-phone',
  protect,
  [
    body('phoneNumber').notEmpty().withMessage('Phone number is required'),
    validate
  ],
  asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;
    
    // Generate verification code (6 digits)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to user
    req.user.phoneNumber = phoneNumber;
    req.user.phoneVerificationCode = verificationCode;
    req.user.phoneVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await req.user.save({ validateBeforeSave: false });
    
    // In production: Send SMS with verification code
    // For now, return the code for testing
    res.status(200).json({
      status: 'success',
      message: 'Verification code sent',
      code: verificationCode // Remove in production
    });
  })
);

// @route   POST /api/auth/verify-phone-code
// @desc    Verify phone code
// @access  Private
router.post(
  '/verify-phone-code',
  protect,
  [
    body('code').isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit code required'),
    validate
  ],
  asyncHandler(async (req, res) => {
    const { code } = req.body;
    
    const user = await User.findById(req.user._id).select('+phoneVerificationCode +phoneVerificationExpires');
    
    if (!user.phoneVerificationCode || user.phoneVerificationCode !== code) {
      throw new AppError('Invalid verification code', 400);
    }
    
    if (user.phoneVerificationExpires < new Date()) {
      throw new AppError('Verification code expired', 400);
    }
    
    // Mark as verified
    user.phoneVerified = true;
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({
      status: 'success',
      message: 'Phone number verified successfully'
    });
  })
);

export default router;
