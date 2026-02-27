import express from 'express';
import { body } from 'express-validator';
import { User } from '../models/index.js';
import { protect } from '../middleware/auth.middleware.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';

const router = express.Router();

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

import { validationResult } from 'express-validator';

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get(
  '/profile',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
      .populate('eventsCreated', 'title startDate endDate status coverImage slug')
      .populate({
        path: 'eventsJoined.event',
        select: 'title startDate endDate status coverImage slug location'
      })
      .populate('favorites', 'title startDate endDate coverImage slug location');

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  })
);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  protect,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('bio').optional().trim().isLength({ max: 500 }),
    validate
  ],
  asyncHandler(async (req, res) => {
    const allowedFields = [
      'firstName', 'lastName', 'bio', 'dateOfBirth', 'gender',
      'location', 'notificationPreferences', 'privacySettings',
      'preferredLanguage', 'themePreference'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  })
);

// @route   PUT /api/users/avatar
// @desc    Update user avatar
// @access  Private
router.put(
  '/avatar',
  protect,
  asyncHandler(async (req, res) => {
    const { avatarUrl } = req.body;
    
    if (!avatarUrl) {
      throw new AppError('Avatar URL is required', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  })
);

// @route   GET /api/users/events
// @desc    Get user's events (created and joined)
// @access  Private
router.get(
  '/events',
  protect,
  asyncHandler(async (req, res) => {
    const { type = 'all' } = req.query;
    
    const user = await User.findById(req.user._id)
      .populate({
        path: 'eventsCreated',
        select: 'title description startDate endDate status coverImage slug location attendeeCount maxCapacity',
        match: type === 'created' || type === 'all' ? {} : { _id: null }
      })
      .populate({
        path: 'eventsJoined.event',
        select: 'title description startDate endDate status coverImage slug location attendeeCount maxCapacity'
      });

    let response = {};
    
    if (type === 'all' || type === 'created') {
      response.created = user.eventsCreated;
    }
    
    if (type === 'all' || type === 'joined') {
      response.joined = user.eventsJoined;
    }
    
    if (type === 'favorites') {
      await user.populate('favorites');
      response.favorites = user.favorites;
    }

    res.status(200).json({
      status: 'success',
      data: response
    });
  })
);

// @route   POST /api/users/favorites/:eventId
// @desc    Add event to favorites
// @access  Private
router.post(
  '/favorites/:eventId',
  protect,
  asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    
    const user = await User.findById(req.user._id);
    
    if (user.favorites.includes(eventId)) {
      throw new AppError('Event already in favorites', 400);
    }
    
    user.favorites.push(eventId);
    user.stats.totalFavorites = user.favorites.length;
    await user.save();
    
    // Update event favorite count
    const { Event } = await import('../models/index.js');
    await Event.findByIdAndUpdate(eventId, { $inc: { favoriteCount: 1 } });

    res.status(200).json({
      status: 'success',
      message: 'Added to favorites'
    });
  })
);

// @route   DELETE /api/users/favorites/:eventId
// @desc    Remove event from favorites
// @access  Private
router.delete(
  '/favorites/:eventId',
  protect,
  asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    
    const user = await User.findById(req.user._id);
    
    if (!user.favorites.includes(eventId)) {
      throw new AppError('Event not in favorites', 400);
    }
    
    user.favorites = user.favorites.filter(id => id.toString() !== eventId);
    user.stats.totalFavorites = user.favorites.length;
    await user.save();
    
    // Update event favorite count
    const { Event } = await import('../models/index.js');
    await Event.findByIdAndUpdate(eventId, { $inc: { favoriteCount: -1 } });

    res.status(200).json({
      status: 'success',
      message: 'Removed from favorites'
    });
  })
);

// @route   GET /api/users/favorites
// @desc    Get user's favorite events
// @access  Private
router.get(
  '/favorites',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'favorites',
        select: 'title description startDate endDate coverImage slug location attendeeCount maxCapacity',
        match: { isExpired: false, isApproved: true }
      });

    res.status(200).json({
      status: 'success',
      data: { favorites: user.favorites }
    });
  })
);

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get(
  '/stats',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    
    const { Event } = await import('../models/index.js');
    
    // Get additional stats
    const upcomingEvents = await Event.countDocuments({
      organizer: req.user._id,
      startDate: { $gte: new Date() },
      isExpired: false
    });
    
    const pastEvents = await Event.countDocuments({
      organizer: req.user._id,
      endDate: { $lt: new Date() }
    });
    
    const totalAttendees = await Event.aggregate([
      { $match: { organizer: req.user._id } },
      { $group: { _id: null, total: { $sum: '$attendeeCount' } } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          ...user.stats,
          upcomingEvents,
          pastEvents,
          totalAttendees: totalAttendees[0]?.total || 0
        }
      }
    });
  })
);

export default router;
