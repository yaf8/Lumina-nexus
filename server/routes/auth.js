import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone is required'
      });
    }

    // Check if user exists
    const existingQuery = email ? { email } : { phone };
    const existingUser = await User.findOne(existingQuery);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or phone'
      });
    }

    // Create user
    const userData = { name };
    if (email) userData.email = email;
    if (phone) userData.phone = phone;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      userData.password = hashedPassword;
    }

    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user._id);

    res
      .cookie('token', token, cookieOptions)
      .status(201)
      .json({
        success: true,
        data: {
          _id: user._id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          phoneVerified: user.phoneVerified
        },
        token
      });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Check if email/phone provided
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone is required'
      });
    }

    // Find user
    const query = email ? { email } : { phone };
    const user = await User.findOne(query).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    if (user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please sign in with Google'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res
      .cookie('token', token, cookieOptions)
      .json({
        success: true,
        data: {
          _id: user._id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          phoneVerified: user.phoneVerified
        },
        token
      });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/google
// @desc    Google OAuth login/register
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { email, name, googleId, avatar } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({
        success: false,
        message: 'Google authentication data is incomplete'
      });
    }

    // Check if user exists with Google ID
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user exists with email
      user = await User.findOne({ email });
      
      if (user) {
        // Link Google account
        user.googleId = googleId;
        if (avatar) user.avatar = avatar;
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          email,
          name: name || email.split('@')[0],
          googleId,
          avatar: avatar || ''
        });
      }
    }

    // Generate token
    const token = generateToken(user._id);

    res
      .cookie('token', token, cookieOptions)
      .json({
        success: true,
        data: {
          _id: user._id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          phoneVerified: user.phoneVerified
        },
        token
      });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Google authentication'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favorites', 'title slug imagePath startDate startTime')
      .populate('joinedEvents', 'title slug imagePath startDate startTime');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user data'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', (req, res) => {
  res
    .clearCookie('token', { ...cookieOptions, maxAge: 0 })
    .json({
      success: true,
      message: 'Logged out successfully'
    });
});

// @route   POST /api/auth/verify-phone
// @desc    Verify phone number
// @access  Private
router.post('/verify-phone', protect, async (req, res) => {
  try {
    const { phone, code } = req.body;

    // In production, you would verify the code with SMS provider
    // For now, we'll accept any 6-digit code
    if (!code || code.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    const user = await User.findById(req.user._id);
    user.phone = phone;
    user.phoneVerified = true;
    await user.save();

    res.json({
      success: true,
      message: 'Phone verified successfully',
      data: {
        phone: user.phone,
        phoneVerified: user.phoneVerified
      }
    });
  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during phone verification'
    });
  }
});

// @route   POST /api/auth/send-verification
// @desc    Send verification code to phone
// @access  Private
router.post('/send-verification', protect, async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // In production, send SMS with verification code
    // For demo, return a mock code
    const mockCode = '123456';

    res.json({
      success: true,
      message: 'Verification code sent',
      // Remove in production
      mockCode
    });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending verification code'
    });
  }
});

export default router;
