/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import express from 'express';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { protect, authorize, requirePhoneVerification } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';
import { isEventExpired } from '../utils/helpers.js';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @route   GET /api/events
// @desc    Get all events with filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      category,
      type,
      search,
      status = 'approved',
      page = 1,
      limit = 12,
      sortBy = 'startDate',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = {};

    // Status filter
    if (status === 'approved') {
      query.isApproved = true;
      query.isExpired = false;
    } else if (status !== 'all') {
      query.status = status;
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Location type filter
    if (type && type !== 'all') {
      query['location.type'] = type;
    }

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const events = await Event.find(query)
      .populate('createdBy', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching events'
    });
  }
});

// @route   GET /api/events/slug/:slug
// @desc    Get single event by slug
// @access  Public
router.get('/slug/:slug', async (req, res) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug })
      .populate('createdBy', 'name avatar email phone')
      .populate('attendees', 'name avatar');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching event'
    });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name avatar email phone')
      .populate('attendees', 'name avatar');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching event'
    });
  }
});

// @route   POST /api/events
// @desc    Create new event
// @access  Private 
router.post(
  '/',
  protect,
  requirePhoneVerification,
  asyncHandler(async (req, res) => {
    let categoryId = req.body.category;

    // 1. Resolve Category: If the frontend sent a slug/name instead of an ObjectId, look it up
    if (categoryId && !mongoose.isValidObjectId(categoryId)) {
      const categoryDoc = await Category.findOne({
        $or: [{ slug: categoryId }, { name: categoryId }]
      });
      if (!categoryDoc) {
        throw new AppError(`Invalid category provided: ${categoryId}`, 400);
      }
      categoryId = categoryDoc._id;
    }

    // 2. Process Location: If the frontend sends a string instead of the strict Location object
    let locationData = req.body.location;
    if (!locationData) {
      locationData = { type: 'physical', venueName: 'TBD', address: 'TBD' };
    } else if (typeof locationData === 'string') {
      locationData = {
        type: 'physical',
        venueName: locationData,
        address: locationData,
        mapCoords: { lat: 0, lng: 0 }
      };
    } else if (!locationData.type) {
      locationData.type = 'physical';
      if (!locationData.address) locationData.address = 'TBD';
      if (!locationData.venueName) locationData.venueName = 'TBD';
    }

    // 3. Format Event Data with fallback values for the logged-in user
    const eventData = {
      ...req.body,
      category: categoryId, // Override with resolved Mongo ID
      location: locationData,
      organizer: req.user._id,
      organizerName: req.body.organizerName || `${req.user.firstName} ${req.user.lastName}`,
      organizerEmail: req.body.organizerEmail || req.user.email,
      organizerPhone: req.body.organizerPhone || req.user.phoneNumber || 'Not provided',
      status: 'pending', // Event requires admin approval by default
      isApproved: false
    };

    const event = await Event.create(eventData);

    // Add to user's created events list
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
// @access  Private (owner only)
router.put('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check ownership
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }

    // Update event
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedEvent,
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating event'
    });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private (owner or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check ownership
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event'
      });
    }

    await event.deleteOne();

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting event'
    });
  }
});

// @route   POST /api/events/:id/join
// @desc    Join an event
// @access  Private
router.post('/:id/join', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if already joined
    if (event.attendees.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Already joined this event'
      });
    }

    // Check capacity
    if (event.maxCapacity && event.attendeeCount >= event.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Event has reached maximum capacity'
      });
    }

    // Add to event
    event.attendees.push(req.user._id);
    event.attendeeCount += 1;
    await event.save();

    // Add to user's joined events
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { joinedEvents: event._id }
    });

    res.json({
      success: true,
      message: 'Successfully joined the event',
      data: {
        attendeeCount: event.attendeeCount
      }
    });
  } catch (error) {
    console.error('Join event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error joining event'
    });
  }
});

// @route   POST /api/events/:id/leave
// @desc    Leave an event
// @access  Private
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Remove from event
    event.attendees = event.attendees.filter(
      attendee => attendee.toString() !== req.user._id.toString()
    );
    event.attendeeCount = Math.max(0, event.attendeeCount - 1);
    await event.save();

    // Remove from user's joined events
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { joinedEvents: event._id }
    });

    res.json({
      success: true,
      message: 'Successfully left the event',
      data: {
        attendeeCount: event.attendeeCount
      }
    });
  } catch (error) {
    console.error('Leave event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error leaving event'
    });
  }
});

// @route   POST /api/events/:id/favorite
// @desc    Favorite an event
// @access  Private
router.post('/:id/favorite', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Add to user's favorites
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { favorites: event._id }
    });

    // Increment favorite count
    event.favoriteCount += 1;
    await event.save();

    res.json({
      success: true,
      message: 'Event added to favorites',
      data: {
        favoriteCount: event.favoriteCount
      }
    });
  } catch (error) {
    console.error('Favorite event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error favoriting event'
    });
  }
});

// @route   DELETE /api/events/:id/favorite
// @desc    Unfavorite an event
// @access  Private
router.delete('/:id/favorite', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Remove from user's favorites
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { favorites: event._id }
    });

    // Decrement favorite count
    event.favoriteCount = Math.max(0, event.favoriteCount - 1);
    await event.save();

    res.json({
      success: true,
      message: 'Event removed from favorites',
      data: {
        favoriteCount: event.favoriteCount
      }
    });
  } catch (error) {
    console.error('Unfavorite event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error unfavoriting event'
    });
  }
});

// @route   POST /api/events/:id/image
// @desc    Upload event image
// @access  Private
router.post('/:id/image', protect, uploadSingle, handleUploadError, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check ownership
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Update image path
    event.imagePath = `/uploads/${req.file.filename}`;
    await event.save();

    res.json({
      success: true,
      data: {
        imagePath: event.imagePath
      },
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading image'
    });
  }
});

// Serve static files
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

export default router;
