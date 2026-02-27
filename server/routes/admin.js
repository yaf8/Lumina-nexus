import express from 'express';
import User from '../models/User.js';
import Event from '../models/Event.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authorization
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/stats', async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const pendingEvents = await Event.countDocuments({ status: 'pending' });
    const approvedEvents = await Event.countDocuments({ status: 'approved' });
    const totalReviewers = await User.countDocuments({ role: 'reviewer' });

    // Get events by category
    const eventsByCategory = await Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get events by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const eventsByMonth = await Event.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get users by month (last 6 months)
    const usersByMonth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get top events by attendance
    const topEvents = await Event.find({ isApproved: true })
      .sort({ attendeeCount: -1 })
      .limit(5)
      .select('title slug attendeeCount startDate');

    res.json({
      success: true,
      data: {
        counts: {
          totalUsers,
          totalEvents,
          pendingEvents,
          approvedEvents,
          totalReviewers
        },
        eventsByCategory,
        eventsByMonth,
        usersByMonth,
        topEvents
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Admin
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;

    if (!['admin', 'reviewer', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating role'
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user'
    });
  }
});

// @route   GET /api/admin/events
// @desc    Get all events for admin
// @access  Admin
router.get('/events', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status && status !== 'all') query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

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

// @route   PUT /api/admin/events/:id/approve
// @desc    Approve an event
// @access  Admin
router.put('/events/:id/approve', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        isApproved: true
      },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event,
      message: 'Event approved successfully'
    });
  } catch (error) {
    console.error('Approve event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error approving event'
    });
  }
});

// @route   PUT /api/admin/events/:id/reject
// @desc    Reject an event
// @access  Admin
router.put('/events/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        isApproved: false,
        rejectionReason: reason || ''
      },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event,
      message: 'Event rejected'
    });
  } catch (error) {
    console.error('Reject event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error rejecting event'
    });
  }
});

// @route   DELETE /api/admin/events/:id
// @desc    Delete any event
// @access  Admin
router.delete('/events/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

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

export default router;
