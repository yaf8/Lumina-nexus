import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { uploadSingle, uploadMultiple, handleUploadError, getFileUrl } from '../utils/multerConfig.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = express.Router();

// Apply authentication to all upload routes
router.use(protect);

// @route   POST /api/upload/image
// @desc    Upload single image
// @access  Private
router.post(
  '/image',
  uploadSingle('image'),
  handleUploadError,
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No image file provided'
      });
    }

    const imageUrl = getFileUrl(req.file.filename);

    res.status(200).json({
      status: 'success',
      data: {
        filename: req.file.filename,
        url: imageUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  })
);

// @route   POST /api/upload/images
// @desc    Upload multiple images
// @access  Private
router.post(
  '/images',
  uploadMultiple('images', 10),
  handleUploadError,
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No image files provided'
      });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      url: getFileUrl(file.filename),
      size: file.size,
      mimetype: file.mimetype
    }));

    res.status(200).json({
      status: 'success',
      results: uploadedFiles.length,
      data: { files: uploadedFiles }
    });
  })
);

// @route   POST /api/upload/gallery
// @desc    Upload event gallery images
// @access  Private
router.post(
  '/gallery',
  uploadMultiple('images', 10),
  handleUploadError,
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No image files provided'
      });
    }

    const galleryImages = req.files.map((file, index) => ({
      url: getFileUrl(file.filename),
      caption: req.body.captions?.[index] || '',
      order: index
    }));

    res.status(200).json({
      status: 'success',
      results: galleryImages.length,
      data: { gallery: galleryImages }
    });
  })
);

// @route   POST /api/upload/avatar
// @desc    Upload user avatar
// @access  Private
router.post(
  '/avatar',
  uploadSingle('avatar'),
  handleUploadError,
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No avatar file provided'
      });
    }

    const avatarUrl = getFileUrl(req.file.filename);

    // Update user's avatar
    req.user.avatar = avatarUrl;
    await req.user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      data: {
        avatar: avatarUrl
      }
    });
  })
);

export default router;
