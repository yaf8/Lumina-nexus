import express from 'express';
import { Event } from '../models/index.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';

const router = express.Router();

// All routes require reviewer or admin access
router.use(protect);
router.use(restrictTo('reviewer', 'admin'));

// @route   GET /api/reviewer/queue
// @desc    Get pending events queue
// @access  Reviewer/Admin
router.get(
  '/queue',
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const events = await Event.find({ status: 'pending' })
      .populate('organizer', 'firstName lastName email phoneNumber')
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Event.countDocuments({ status: 'pending' });

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

// @route   GET /api/reviewer/events/:id
// @desc    Get event details for review
// @access  Reviewer/Admin
router.get(
  '/events/:id',
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'firstName lastName email phoneNumber avatar bio')
      .populate('category', 'name slug color');

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { event }
    });
  })
);

// @route   PUT /api/reviewer/events/:id/approve
// @desc    Approve event
// @access  Reviewer/Admin
router.put(
  '/events/:id/approve',
  asyncHandler(async (req, res) => {
    const { notes } = req.body;

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      {
        status: 'published',
        isApproved: true,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        publishedAt: new Date()
      },
      { new: true }
    );

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // TODO: Send notification to organizer

    res.status(200).json({
      status: 'success',
      message: 'Event approved successfully',
      data: { event }
    });
  })
);

// @route   PUT /api/reviewer/events/:id/reject
// @desc    Reject event
// @access  Reviewer/Admin
router.put(
  '/events/:id/reject',
  asyncHandler(async (req, res) => {
    const { reason, suggestions } = req.body;

    if (!reason) {
      throw new AppError('Rejection reason is required', 400);
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        isApproved: false,
        rejectionReason: reason
      },
      { new: true }
    );

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // TODO: Send notification to organizer with reason and suggestions

    res.status(200).json({
      status: 'success',
      message: 'Event rejected',
      data: { event, suggestions }
    });
  })
);

// @route   PUT /api/reviewer/events/:id/request-changes
// @desc    Request changes for event
// @access  Reviewer/Admin
router.put(
  '/events/:id/request-changes',
  asyncHandler(async (req, res) => {
    const { changes, message } = req.body;

    if (!changes || !Array.isArray(changes) || changes.length === 0) {
      throw new AppError('Changes array is required', 400);
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      {
        status: 'draft',
        reviewNotes: {
          changes,
          message,
          reviewer: req.user._id,
          requestedAt: new Date()
        }
      },
      { new: true }
    );

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // TODO: Send notification to organizer

    res.status(200).json({
      status: 'success',
      message: 'Changes requested',
      data: { event }
    });
  })
);

// @route   GET /api/reviewer/stats
// @desc    Get reviewer statistics
// @access  Reviewer/Admin
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const pendingCount = await Event.countDocuments({ status: 'pending' });
    
    const reviewedToday = await Event.countDocuments({
      approvedBy: req.user._id,
      approvedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    const totalReviewed = await Event.countDocuments({
      approvedBy: req.user._id
    });

    const recentReviews = await Event.find({
      approvedBy: req.user._id
    })
      .select('title status approvedAt')
      .sort('-approvedAt')
      .limit(5);

    res.status(200).json({
      status: 'success',
      data: {
        pendingCount,
        reviewedToday,
        totalReviewed,
        recentReviews
      }
    });
  })
);

export default router;
