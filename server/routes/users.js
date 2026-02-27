import express from 'express';
import User from '../models/User.js';
import Event from '../models/Event.js';
import { protect } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favorites', 'title slug imagePath startDate startTime category')
      .populate('joinedEvents', 'title slug imagePath startDate startTime category')
      .select('-password');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
});

// @route   PUT /api/users/me
// @desc    Update current user profile
// @access  Private
router.put('/me', protect, async (req, res) => {
  try {
    const { name, avatar } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

// @route   POST /api/users/me/avatar
// @desc    Upload avatar
// @access  Private
router.post('/me/avatar', protect, uploadSingle, handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: `/uploads/${req.file.filename}` },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      data: user,
      message: 'Avatar uploaded successfully'
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading avatar'
    });
  }
});

// @route   GET /api/users/me/events
// @desc    Get user's created events
// @access  Private
router.get('/me/events', protect, async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching events'
    });
  }
});

// @route   GET /api/users/me/favorites
// @desc    Get user's favorite events
// @access  Private
router.get('/me/favorites', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'favorites',
        match: { isExpired: false }
      });

    res.json({
      success: true,
      data: user.favorites
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching favorites'
    });
  }
});

// @route   GET /api/users/me/joined-events
// @desc    Get user's joined events
// @access  Private
router.get('/me/joined-events', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'joinedEvents',
        match: { isExpired: false }
      });

    res.json({
      success: true,
      data: user.joinedEvents
    });
  } catch (error) {
    console.error('Get joined events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching joined events'
    });
  }
});

export default router;
