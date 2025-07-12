import mongoose from 'mongoose';

const swapRequestSchema = new mongoose.Schema({
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
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  skillsOffered: [{
    type: String,
    trim: true
  }],
  skillsRequested: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
swapRequestSchema.index({ fromUser: 1, status: 1 });
swapRequestSchema.index({ toUser: 1, status: 1 });

export default mongoose.model('SwapRequest', swapRequestSchema); 