import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  swapRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SwapRequest',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Ensure one rating per swap request per user
ratingSchema.index({ fromUser: 1, swapRequest: 1 }, { unique: true });

export default mongoose.model('Rating', ratingSchema); 