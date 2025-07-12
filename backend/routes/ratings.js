import express from 'express';
import Rating from '../models/Rating.js';
import SwapRequest from '../models/SwapRequest.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { validateRating } from '../middleware/validation.js';

const router = express.Router();

// Submit rating for completed swap
router.post('/submit', auth, validateRating, async (req, res) => {
  try {
    const { swapRequestId, toUserId, rating, feedback } = req.body;

    // Check if swap request exists and is completed
    const swapRequest = await SwapRequest.findById(swapRequestId);
    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    if (swapRequest.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed swaps' });
    }

    // Check if user is part of this swap
    if (swapRequest.fromUser.toString() !== req.user._id.toString() && 
        swapRequest.toUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to rate this swap' });
    }

    // Check if user is rating the other person (not themselves)
    if (swapRequest.fromUser.toString() === req.user._id.toString() && 
        swapRequest.toUser.toString() !== toUserId) {
      return res.status(400).json({ message: 'Invalid rating target' });
    }

    if (swapRequest.toUser.toString() === req.user._id.toString() && 
        swapRequest.fromUser.toString() !== toUserId) {
      return res.status(400).json({ message: 'Invalid rating target' });
    }

    // Check if rating already exists
    const existingRating = await Rating.findOne({
      fromUser: req.user._id,
      swapRequest: swapRequestId
    });

    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this swap' });
    }

    // Create rating
    const newRating = new Rating({
      fromUser: req.user._id,
      toUser: toUserId,
      swapRequest: swapRequestId,
      rating,
      feedback
    });

    await newRating.save();

    // Update target user's average rating
    const targetUser = await User.findById(toUserId);
    const userRatings = await Rating.find({ toUser: toUserId });
    
    const totalRating = userRatings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / userRatings.length;

    targetUser.rating = Math.round(averageRating * 10) / 10; // Round to 1 decimal
    targetUser.totalRatings = userRatings.length;
    await targetUser.save();

    res.status(201).json({ 
      message: 'Rating submitted successfully',
      rating: newRating 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get ratings for a user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const ratings = await Rating.find({ toUser: req.params.userId })
      .populate('fromUser', 'name')
      .populate('swapRequest', 'skillsOffered skillsRequested')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ ratings });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's own ratings given
router.get('/my-ratings', auth, async (req, res) => {
  try {
    const ratings = await Rating.find({ fromUser: req.user._id })
      .populate('toUser', 'name')
      .populate('swapRequest', 'skillsOffered skillsRequested')
      .sort({ createdAt: -1 });

    res.json({ ratings });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 