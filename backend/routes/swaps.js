import express from 'express';
import SwapRequest from '../models/SwapRequest.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { validateSwapRequest } from '../middleware/validation.js';

const router = express.Router();

// Send swap request
router.post('/request', auth, validateSwapRequest, async (req, res) => {
  try {
    const { toUserId, message, skillsOffered, skillsRequested } = req.body;

    // Check if user is trying to send request to themselves
    if (toUserId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send request to yourself' });
    }

    // Check if target user exists and is not banned
    const targetUser = await User.findById(toUserId);
    if (!targetUser || targetUser.isBanned) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if there's already a pending request
    const existingRequest = await SwapRequest.findOne({
      fromUser: req.user._id,
      toUser: toUserId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request with this user' });
    }

    const swapRequest = new SwapRequest({
      fromUser: req.user._id,
      toUser: toUserId,
      message,
      skillsOffered,
      skillsRequested
    });

    await swapRequest.save();

    res.status(201).json({ 
      message: 'Swap request sent successfully',
      swapRequest 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's swap requests (sent and received)
router.get('/my-requests', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {
      $or: [
        { fromUser: req.user._id },
        { toUser: req.user._id }
      ]
    };

    if (status) {
      query.status = status;
    }

    const swapRequests = await SwapRequest.find(query)
      .populate('fromUser', 'name')
      .populate('toUser', 'name')
      .sort({ createdAt: -1 });

    res.json({ swapRequests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Accept swap request
router.put('/accept/:requestId', auth, async (req, res) => {
  try {
    const swapRequest = await SwapRequest.findById(req.params.requestId)
      .populate('fromUser', 'name')
      .populate('toUser', 'name');

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    if (swapRequest.toUser._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }

    if (swapRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }

    swapRequest.status = 'accepted';
    await swapRequest.save();

    res.json({ 
      message: 'Swap request accepted',
      swapRequest 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject swap request
router.put('/reject/:requestId', auth, async (req, res) => {
  try {
    const swapRequest = await SwapRequest.findById(req.params.requestId);

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    if (swapRequest.toUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }

    if (swapRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }

    swapRequest.status = 'rejected';
    await swapRequest.save();

    res.json({ 
      message: 'Swap request rejected',
      swapRequest 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Complete swap request
router.put('/complete/:requestId', auth, async (req, res) => {
  try {
    const swapRequest = await SwapRequest.findById(req.params.requestId);

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    if (swapRequest.status !== 'accepted') {
      return res.status(400).json({ message: 'Request must be accepted to complete' });
    }

    // Check if user is part of this swap
    if (swapRequest.fromUser.toString() !== req.user._id.toString() && 
        swapRequest.toUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this request' });
    }

    swapRequest.status = 'completed';
    swapRequest.completedAt = new Date();
    await swapRequest.save();

    res.json({ 
      message: 'Swap completed successfully',
      swapRequest 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel swap request (only by sender)
router.delete('/cancel/:requestId', auth, async (req, res) => {
  try {
    const swapRequest = await SwapRequest.findById(req.params.requestId);

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    if (swapRequest.fromUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the sender can cancel the request' });
    }

    if (swapRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending requests' });
    }

    swapRequest.status = 'cancelled';
    await swapRequest.save();

    res.json({ 
      message: 'Swap request cancelled',
      swapRequest 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 