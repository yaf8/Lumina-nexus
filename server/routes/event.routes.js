import express from 'express';
import { body, query as queryValidator } from 'express-validator';
import { Event, Category } from '../models/index.js';
import { 
  protect, 
  optionalAuth, 
  requirePhoneVerification 
} from '../middleware/auth.middleware.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';

const router = express.Router();

import { validationResult } from 'express-validator';

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

// @route   GET /api/events
// @desc    Get all events with filters
// @access  Public
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 12,
      sort = '-createdAt',
      category,
      type,
      search,
      startDate,
      endDate,
      location,
      isFree,
      status = 'published',
      upcoming = 'true'
    } = req.query;

    // Build filter object
    const filter = { isApproved: true };

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Upcoming events only
    if (upcoming === 'true') {
      filter.endDate = { $gte: new Date() };
      filter.isExpired = false;
    }

    // Category filter
    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) {
        filter.category = cat._id;
      }
    }

    // Location type filter
    if (type) {
      filter['location.type'] = type;
    }

    // Search filter
    if (search) {
      filter.$text = { $search: search };
    }

    // Date range filter
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    // Location search
    if (location) {
      filter.$or = [
        { 'location.address': { $regex: location, $options: 'i' } },
        { 'location.venueName': { $regex: location, $options: 'i' } }
      ];
    }

    // Price filter
    if (isFree !== undefined) {
      filter.isFree = isFree === 'true';
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const events = await Event.find(filter)
      .populate('organizer', 'firstName lastName avatar')
      .populate('category', 'name slug color')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await Event.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: events.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      data: { events }
    });
  })
);

// @route   GET /api/events/featured
// @desc    Get featured events
// @access  Public
router.get(
  '/featured',
  asyncHandler(async (req, res) => {
    const events = await Event.find({
      isFeatured: true,
      isApproved: true,
      isExpired: false,
      endDate: { $gte: new Date() }
    })
      .populate('organizer', 'firstName lastName avatar')
      .populate('category', 'name slug color')
      .sort('-favoriteCount')
      .limit(6);

    res.status(200).json({
      status: 'success',
      results: events.length,
      data: { events }
    });
  })
);

// @route   GET /api/events/popular
// @desc    Get popular events
// @access  Public
router.get(
  '/popular',
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    
    const events = await Event.findPopular(parseInt(limit));

    res.status(200).json({
      status: 'success',
      results: events.length,
      data: { events }
    });
  })
);

// @route   GET /api/events/upcoming
// @desc    Get upcoming events
// @access  Public
router.get(
  '/upcoming',
  asyncHandler(async (req, res) => {
    const { limit = 10, days = 30 } = req.query;
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));
    
    const events = await Event.findUpcoming({
      startDate: { $lte: futureDate }
    })
      .populate('organizer', 'firstName lastName avatar')
      .populate('category', 'name slug color')
      .limit(parseInt(limit));

    res.status(200).json({
      status: 'success',
      results: events.length,
      data: { events }
    });
  })
);

// @route   GET /api/events/:slug
// @desc    Get single event by slug
// @access  Public
router.get(
  '/:slug',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const event = await Event.findOne({ slug })
      .populate('organizer', 'firstName lastName avatar bio')
      .populate('category', 'name slug color icon')
      .populate('attendees.user', 'firstName lastName avatar');

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Check if user has favorited
    let isFavorited = false;
    let isRegistered = false;
    
    if (req.user) {
      isFavorited = event.favorites.some(
        id => id.toString() === req.user._id.toString()
      );
      isRegistered = event.attendees.some(
        a => a.user._id.toString() === req.user._id.toString()
      );
    }

    // Increment view count
    await event.incrementViewCount();

    res.status(200).json({
      status: 'success',
      data: { 
        event: {
          ...event.toObject(),
          isFavorited,
          isRegistered
        }
      }
    });
  })
);

// @route   POST /api/events
// @desc    Create new event
// @access  Private (requires phone verification)
router.post(
  '/',
  protect,
  requirePhoneVerification,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required'),
    body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required'),
    body('location.type').isIn(['online', 'physical', 'hybrid']).withMessage('Valid location type is required'),
    body('coverImage').notEmpty().withMessage('Cover image is required'),
    body('organizerPhone').notEmpty().withMessage('Organizer phone is required'),
    body('organizerEmail').isEmail().withMessage('Valid organizer email is required'),
    validate
  ],
  asyncHandler(async (req, res) => {
    const eventData = {
      ...req.body,
      organizer: req.user._id,
      organizerName: req.body.organizerName || `${req.user.firstName} ${req.user.lastName}`,
      status: 'pending', // Requires approval
      isApproved: false
    };

    const event = await Event.create(eventData);

    // Add to user's created events
    req.user.eventsCreated.push(event._id);
    req.user.stats.totalEventsCreated = req.user.eventsCreated.length;
    await req.user.save({ validateBeforeSave: false });

    res.status(201).json({
      status: 'success',
      message: 'Event created successfully and is pending approval',
      data: { event }
    });
  })
);

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private (owner or admin)
router.put(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const event = await Event.findById(id);
    
    if (!event) {
      throw new AppError('Event not found', 404);
    }
    
    // Check ownership or admin
    const isOwner = event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw new AppError('Not authorized to update this event', 403);
    }
    
    // Fields that can be updated
    const allowedFields = [
      'title', 'description', 'shortDescription', 'category', 'tags',
      'coverImage', 'gallery', 'videoUrl', 'organizerName', 'organizerPhone',
      'organizerEmail', 'organizerWebsite', 'organizerWhatsApp', 'organizerSocial',
      'location', 'startDate', 'endDate', 'startTime', 'endTime', 'timezone',
      'recurring', 'maxCapacity', 'registration', 'isFree', 'price', 'tickets',
      'paymentMethods', 'externalBookingLink', 'refundPolicy', 'ageRestriction',
      'accessibility', 'requirements', 'whatToBring', 'dressCode', 'languages',
      'metaTitle', 'metaDescription', 'socialImage', 'visibility'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    // Reset approval if event is modified (except by admin)
    if (!isAdmin && event.isApproved) {
      updates.status = 'pending';
      updates.isApproved = false;
    }
    
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: isAdmin ? 'Event updated' : 'Event updated and pending approval',
      data: { event: updatedEvent }
    });
  })
);

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private (owner or admin)
router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const event = await Event.findById(id);
    
    if (!event) {
      throw new AppError('Event not found', 404);
    }
    
    // Check ownership or admin
    const isOwner = event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw new AppError('Not authorized to delete this event', 403);
    }
    
    await Event.findByIdAndDelete(id);
    
    // Remove from user's created events
    req.user.eventsCreated = req.user.eventsCreated.filter(
      eId => eId.toString() !== id
    );
    req.user.stats.totalEventsCreated = req.user.eventsCreated.length;
    await req.user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Event deleted successfully'
    });
  })
);

// @route   POST /api/events/:id/register
// @desc    Register for event
// @access  Private
router.post(
  '/:id/register',
  protect,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    
    const event = await Event.findById(id);
    
    if (!event) {
      throw new AppError('Event not found', 404);
    }
    
    if (event.isExpired) {
      throw new AppError('Event has already ended', 400);
    }
    
    if (event.status !== 'published' && event.status !== 'approved') {
      throw new AppError('Event is not open for registration', 400);
    }
    
    // Check if already registered
    const alreadyRegistered = event.attendees.some(
      a => a.user.toString() === req.user._id.toString()
    );
    
    if (alreadyRegistered) {
      throw new AppError('Already registered for this event', 400);
    }
    
    // Check capacity
    if (event.isFull) {
      // Add to waitlist
      event.waitlist.push({ user: req.user._id });
      await event.save();
      
      return res.status(200).json({
        status: 'success',
        message: 'Added to waitlist - event is at full capacity'
      });
    }
    
    // Add attendee
    await event.addAttendee(req.user._id);
    
    // Add to user's joined events
    req.user.eventsJoined.push({ event: id });
    req.user.stats.totalEventsJoined = req.user.eventsJoined.length;
    await req.user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Successfully registered for event'
    });
  })
);

// @route   DELETE /api/events/:id/register
// @desc    Cancel registration
// @access  Private
router.delete(
  '/:id/register',
  protect,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const event = await Event.findById(id);
    
    if (!event) {
      throw new AppError('Event not found', 404);
    }
    
    // Remove from attendees
    event.attendees = event.attendees.filter(
      a => a.user.toString() !== req.user._id.toString()
    );
    event.attendeeCount = event.attendees.length;
    await event.save();
    
    // Remove from user's joined events
    req.user.eventsJoined = req.user.eventsJoined.filter(
      j => j.event.toString() !== id
    );
    req.user.stats.totalEventsJoined = req.user.eventsJoined.length;
    await req.user.save({ validateBeforeSave: false });
    
    // Promote from waitlist if available
    if (event.waitlist.length > 0) {
      const nextInLine = event.waitlist.shift();
      event.attendees.push({ user: nextInLine.user });
      event.attendeeCount = event.attendees.length;
      await event.save();
      
      // TODO: Notify user promoted from waitlist
    }

    res.status(200).json({
      status: 'success',
      message: 'Registration cancelled'
    });
  })
);

// @route   POST /api/events/:id/favorite
// @desc    Toggle favorite
// @access  Private
router.post(
  '/:id/favorite',
  protect,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const event = await Event.findById(id);
    
    if (!event) {
      throw new AppError('Event not found', 404);
    }
    
    const isFavorited = event.favorites.includes(req.user._id);
    
    if (isFavorited) {
      await event.removeFavorite(req.user._id);
      
      // Remove from user's favorites
      req.user.favorites = req.user.favorites.filter(
        eId => eId.toString() !== id
      );
      
      res.status(200).json({
        status: 'success',
        message: 'Removed from favorites',
        isFavorited: false
      });
    } else {
      await event.addFavorite(req.user._id);
      
      // Add to user's favorites
      req.user.favorites.push(id);
      
      res.status(200).json({
        status: 'success',
        message: 'Added to favorites',
        isFavorited: true
      });
    }
    
    req.user.stats.totalFavorites = req.user.favorites.length;
    await req.user.save({ validateBeforeSave: false });
  })
);

// @route   POST /api/events/:id/share
// @desc    Record share
// @access  Public
router.post(
  '/:id/share',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { platform } = req.body;
    
    await Event.findByIdAndUpdate(id, {
      $inc: { shareCount: 1, [`analytics.clicks`]: 1 }
    });

    res.status(200).json({
      status: 'success',
      message: 'Share recorded'
    });
  })
);

export default router;
