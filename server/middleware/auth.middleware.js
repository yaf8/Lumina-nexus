import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

// Verify JWT token
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized. Please log in.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User no longer exists'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated'
      });
    }

    // Check if user is suspended
    if (user.isSuspended) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is suspended. Please contact support.'
      });
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: 'error',
        message: 'Password recently changed. Please log in again.'
      });
    }

    // Grant access
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. Please log in again.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired. Please log in again.'
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Authentication error',
      error: error.message
    });
  }
};

// Restrict to specific roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

// Check if user has specific permission
export const requirePermission = (...permissions) => {
  return (req, res, next) => {
    const hasPermission = permissions.some(perm => 
      req.user.permissions.includes(perm) || req.user.role === 'admin'
    );

    if (!hasPermission) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have the required permissions'
      });
    }
    next();
  };
};

// Optional authentication - doesn't require login but adds user if logged in
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user && user.isActive && !user.isSuspended) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Check phone verification for posting events
export const requirePhoneVerification = (req, res, next) => {
  if (!req.user.phoneVerified) {
    return res.status(403).json({
      status: 'error',
      message: 'Phone verification required to post events',
      code: 'PHONE_VERIFICATION_REQUIRED'
    });
  }
  next();
};

// Generate JWT token
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Generate refresh token
export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  });
};

// Send token response
export const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('jwt', token, cookieOptions);
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    expires: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    )
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    refreshToken,
    data: { user }
  });
};
