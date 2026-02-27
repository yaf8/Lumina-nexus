import express from 'express';
import { User, Event, Category } from '../models/index.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';

const router = express.Router();

// All routes require admin access
router.use(protect);
router.use(restrictTo('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Admin
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // User statistics
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    const activeUsers = await User.countDocuments({ isActive: true });
    const suspendedUsers = await User.countDocuments({ isSuspended: true });

    // Event statistics
    const totalEvents = await Event.countDocuments();
    const upcomingEvents = await Event.countDocuments({
      startDate: { $gte: now },
      isExpired: false
    });
    const pendingEvents = await Event.countDocuments({ status: 'pending' });
    const approvedEvents = await Event.countDocuments({ isApproved: true });
    const expiredEvents = await Event.countDocuments({ isExpired: true });
    const featuredEvents = await Event.countDocuments({ isFeatured: true });

    // Events created this period
    const eventsThisMonth = await Event.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    const eventsThisWeek = await Event.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Engagement statistics
    const totalAttendees = await Event.aggregate([
      { $group: { _id: null, total: { $sum: '$attendeeCount' } } }
    ]);

    const totalFavorites = await Event.aggregate([
      { $group: { _id: null, total: { $sum: '$favoriteCount' } } }
    ]);

    const totalViews = await Event.aggregate([
      { $group: { _id: null, total: { $sum: '$viewCount' } } }
    ]);

    // Top categories
    const topCategories = await Event.aggregate([
      { $match: { isApproved: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          name: '$category.name',
          count: 1
        }
      }
    ]);

    // Recent activity
    const recentUsers = await User.find()
      .select('firstName lastName email role createdAt')
      .sort('-createdAt')
      .limit(5);

    const recentEvents = await Event.find()
      .select('title status createdAt organizer')
      .populate('organizer', 'firstName lastName')
      .sort('-createdAt')
      .limit(5);

    // User role distribution
    const userRoles = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Event status distribution
    const eventStatus = await Event.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
          newThisWeek: newUsersThisWeek,
          active: activeUsers,
          suspended: suspendedUsers,
          byRole: userRoles
        },
        events: {
          total: totalEvents,
          upcoming: upcomingEvents,
          pending: pendingEvents,
          approved: approvedEvents,
          expired: expiredEvents,
          featured: featuredEvents,
          thisMonth: eventsThisMonth,
          thisWeek: eventsThisWeek,
          byStatus: eventStatus
        },
        engagement: {
          totalAttendees: totalAttendees[0]?.total || 0,
          totalFavorites: totalFavorites[0]?.total || 0,
          totalViews: totalViews[0]?.total || 0
        },
        topCategories,
        recentActivity: {
          users: recentUsers,
          events: recentEvents
        }
      }
    });
  })
);

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Admin
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      sort = '-createdAt',
      search,
      role,
      isActive,
      isSuspended
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isSuspended !== undefined) filter.isSuspended = isSuspended === 'true';

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(filter)
      .select('-password -refreshTokens')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: users.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      data: { users }
    });
  })
);

// @route   GET /api/admin/users/:id
// @desc    Get user details
// @access  Admin
router.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
      .select('-password -refreshTokens')
      .populate('eventsCreated', 'title startDate status')
      .populate('eventsJoined.event', 'title startDate')
      .populate('favorites', 'title startDate');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  })
);

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Admin
router.put(
  '/users/:id/role',
  asyncHandler(async (req, res) => {
    const { role } = req.body;
    const validRoles = ['user', 'reviewer', 'admin'];

    if (!validRoles.includes(role)) {
      throw new AppError('Invalid role', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password -refreshTokens');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  })
);

// @route   PUT /api/admin/users/:id/suspend
// @desc    Suspend/unsuspend user
// @access  Admin
router.put(
  '/users/:id/suspend',
  asyncHandler(async (req, res) => {
    const { suspend, reason, duration } = req.body;

    const update = {
      isSuspended: suspend,
      suspensionReason: suspend ? reason : undefined,
      suspendedUntil: suspend && duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : undefined
    };

    const user = await User.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).select('-password -refreshTokens');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      message: suspend ? 'User suspended' : 'User unsuspended',
      data: { user }
    });
  })
);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Admin
router.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prevent deleting own account
    if (user._id.toString() === req.user._id.toString()) {
      throw new AppError('Cannot delete your own account', 400);
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  })
);

// @route   GET /api/admin/events
// @desc    Get all events for admin
// @access  Admin
router.get(
  '/events',
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      sort = '-createdAt',
      status,
      isApproved,
      isExpired,
      search
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
    if (isExpired !== undefined) filter.isExpired = isExpired === 'true';
    if (search) {
      filter.$text = { $search: search };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const events = await Event.find(filter)
      .populate('organizer', 'firstName lastName email')
      .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

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

// @route   PUT /api/admin/events/:id/approve
// @desc    Approve event
// @access  Admin
router.put(
  '/events/:id/approve',
  asyncHandler(async (req, res) => {
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

    res.status(200).json({
      status: 'success',
      message: 'Event approved successfully',
      data: { event }
    });
  })
);

// @route   PUT /api/admin/events/:id/reject
// @desc    Reject event
// @access  Admin
router.put(
  '/events/:id/reject',
  asyncHandler(async (req, res) => {
    const { reason } = req.body;

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

    res.status(200).json({
      status: 'success',
      message: 'Event rejected',
      data: { event }
    });
  })
);

// @route   PUT /api/admin/events/:id/featured
// @desc    Toggle featured status
// @access  Admin
router.put(
  '/events/:id/featured',
  asyncHandler(async (req, res) => {
    const { featured } = req.body;

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { isFeatured: featured },
      { new: true }
    );

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    res.status(200).json({
      status: 'success',
      message: featured ? 'Event featured' : 'Event unfeatured',
      data: { event }
    });
  })
);

// @route   DELETE /api/admin/events/:id
// @desc    Delete any event
// @access  Admin
router.delete(
  '/events/:id',
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Event deleted successfully'
    });
  })
);

// @route   GET /api/admin/categories
// @desc    Get all categories
// @access  Admin
router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const categories = await Category.find().sort('order');

    res.status(200).json({
      status: 'success',
      data: { categories }
    });
  })
);

// @route   POST /api/admin/categories
// @desc    Create category
// @access  Admin
router.post(
  '/categories',
  asyncHandler(async (req, res) => {
    const category = await Category.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { category }
    });
  })
);

// @route   PUT /api/admin/categories/:id
// @desc    Update category
// @access  Admin
router.put(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { category }
    });
  })
);

// @route   DELETE /api/admin/categories/:id
// @desc    Delete category
// @access  Admin
router.delete(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    // Check if category has events
    const eventsCount = await Event.countDocuments({ category: req.params.id });
    
    if (eventsCount > 0) {
      throw new AppError('Cannot delete category with existing events', 400);
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Category deleted successfully'
    });
  })
);

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics
// @access  Admin
router.get(
  '/analytics',
  asyncHandler(async (req, res) => {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Daily user registrations
    const userRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Daily event creations
    const eventCreations = await Event.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top organizers
    const topOrganizers = await Event.aggregate([
      { $match: { isApproved: true } },
      {
        $group: {
          _id: '$organizer',
          eventCount: { $sum: 1 },
          totalAttendees: { $sum: '$attendeeCount' }
        }
      },
      { $sort: { eventCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'organizer'
        }
      },
      { $unwind: '$organizer' },
      {
        $project: {
          name: { $concat: ['$organizer.firstName', ' ', '$organizer.lastName'] },
          eventCount: 1,
          totalAttendees: 1
        }
      }
    ]);

    // Location distribution
    const locationDistribution = await Event.aggregate([
      { $match: { isApproved: true } },
      {
        $group: {
          _id: '$location.type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        userRegistrations,
        eventCreations,
        topOrganizers,
        locationDistribution
      }
    });
  })
);

export default router;
