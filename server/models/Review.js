import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// One review per user per event
reviewSchema.index({ event: 1, user: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
