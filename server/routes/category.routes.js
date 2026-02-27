import express from 'express';
import { Category } from '../models/index.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all active categories
// @access  Public
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true })
      .sort('order')
      .select('name slug description icon color image');

    res.status(200).json({
      status: 'success',
      results: categories.length,
      data: { categories }
    });
  })
);

// @route   GET /api/categories/:slug
// @desc    Get category by slug
// @access  Public
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const category = await Category.findOne({ 
      slug: req.params.slug,
      isActive: true 
    });

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { category }
    });
  })
);

// @route   GET /api/categories/:slug/events
// @desc    Get events by category
// @access  Public
router.get(
  '/:slug/events',
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 12 } = req.query;
    
    const category = await Category.findOne({ 
      slug: req.params.slug,
      isActive: true 
    });

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }

    const { Event } = await import('../models/index.js');
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const events = await Event.find({
      category: category._id,
      isApproved: true,
      isExpired: false,
      endDate: { $gte: new Date() }
    })
      .populate('organizer', 'firstName lastName avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    const total = await Event.countDocuments({
      category: category._id,
      isApproved: true,
      isExpired: false,
      endDate: { $gte: new Date() }
    });

    res.status(200).json({
      status: 'success',
      results: events.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      data: { 
        category: {
          name: category.name,
          description: category.description,
          icon: category.icon,
          color: category.color
        },
        events 
      }
    });
  })
);

export default router;
