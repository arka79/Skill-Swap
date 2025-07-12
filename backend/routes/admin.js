import express from 'express';
import User from '../models/User.js';
import SwapRequest from '../models/SwapRequest.js';
import Rating from '../models/Rating.js';
import AdminLog from '../models/AdminLog.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Secure admin promotion (requires secret key)
router.post('/promote/:userId', async (req, res) => {
  try {
    const { secretKey } = req.body;
    const { userId } = req.params;

    // Check if secret key matches (you should change this to a secure key)
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: 'Invalid secret key' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isAdmin = true;
    await user.save();

    // Log admin action
    await AdminLog.create({
      admin: user._id,
      action: 'promote_user',
      targetUser: user._id,
      details: `User ${user.name} promoted to admin`
    });

    res.json({ 
      message: 'User promoted to admin successfully',
      user: { name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users (admin only)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, banned } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (banned !== undefined) {
      query.isBanned = banned === 'true';
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({ 
      users, 
      total, 
      page: parseInt(page), 
      totalPages: Math.ceil(total / limit) 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Ban/Unban user
router.put('/users/:userId/ban', adminAuth, async (req, res) => {
  try {
    const { isBanned } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBanned = isBanned;
    await user.save();

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: isBanned ? 'ban_user' : 'unban_user',
      targetUser: user._id,
      details: `User ${isBanned ? 'banned' : 'unbanned'}: ${user.name}`
    });

    res.json({ 
      message: `User ${isBanned ? 'banned' : 'unbanned'} successfully`,
      user 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get swap statistics
router.get('/stats/swaps', adminAuth, async (req, res) => {
  try {
    const stats = await SwapRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const totalRatings = await Rating.countDocuments();

    res.json({ 
      swapStats: stats,
      totalUsers,
      totalRatings
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get recent swap requests
router.get('/swaps', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (status) {
      query.status = status;
    }

    const swapRequests = await SwapRequest.find(query)
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SwapRequest.countDocuments(query);

    res.json({ 
      swapRequests, 
      total, 
      page: parseInt(page), 
      totalPages: Math.ceil(total / limit) 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete swap request (admin only)
router.delete('/swaps/:requestId', adminAuth, async (req, res) => {
  try {
    const swapRequest = await SwapRequest.findById(req.params.requestId);
    
    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    await SwapRequest.findByIdAndDelete(req.params.requestId);

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'delete_swap',
      details: `Deleted swap request: ${swapRequest._id}`
    });

    res.json({ message: 'Swap request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export data as CSV
router.get('/export/:type', adminAuth, async (req, res) => {
  try {
    const { type } = req.params;
    let data = [];

    switch (type) {
      case 'users':
        data = await User.find().select('-password');
        break;
      case 'swaps':
        data = await SwapRequest.find()
          .populate('fromUser', 'name email')
          .populate('toUser', 'name email');
        break;
      case 'ratings':
        data = await Rating.find()
          .populate('fromUser', 'name')
          .populate('toUser', 'name');
        break;
      default:
        return res.status(400).json({ message: 'Invalid export type' });
    }

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'export_data',
      details: `Exported ${type} data`,
      metadata: { count: data.length }
    });

    res.json({ 
      message: `${type} data exported successfully`,
      count: data.length,
      data 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get admin logs
router.get('/logs', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const logs = await AdminLog.find()
      .populate('admin', 'name')
      .populate('targetUser', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AdminLog.countDocuments();

    res.json({ 
      logs, 
      total, 
      page: parseInt(page), 
      totalPages: Math.ceil(total / limit) 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 