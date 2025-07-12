import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { validateProfileUpdate } from '../middleware/validation.js';

const router = express.Router();

// Get all public users (for discovery)
router.get('/discover', auth, async (req, res) => {
  try {
    const { skill, search } = req.query;
    let query = { isPublic: true, isBanned: false, _id: { $ne: req.user._id } };

    if (skill) {
      query.$or = [
        { skillsOffered: { $regex: skill, $options: 'i' } },
        { skillsWanted: { $regex: skill, $options: 'i' } }
      ];
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { skillsOffered: { $regex: search, $options: 'i' } },
        { skillsWanted: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('name location skillsOffered skillsWanted availability rating totalRatings')
      .limit(20);

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile by ID
router.get('/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -email');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isPublic && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Profile is private' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, validateProfileUpdate, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['name', 'location', 'availability', 'isPublic', 'skillsOffered', 'skillsWanted'];
    
    const filteredUpdates = {};
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      filteredUpdates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add skill to offered skills
router.post('/skills/offered', auth, async (req, res) => {
  try {
    const { skill } = req.body;
    if (!skill || skill.trim() === '') {
      return res.status(400).json({ message: 'Skill is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user.skillsOffered.includes(skill.trim())) {
      user.skillsOffered.push(skill.trim());
      await user.save();
    }

    res.json({ skillsOffered: user.skillsOffered });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove skill from offered skills
router.delete('/skills/offered/:skill', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.skillsOffered = user.skillsOffered.filter(skill => skill !== req.params.skill);
    await user.save();

    res.json({ skillsOffered: user.skillsOffered });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add skill to wanted skills
router.post('/skills/wanted', auth, async (req, res) => {
  try {
    const { skill } = req.body;
    if (!skill || skill.trim() === '') {
      return res.status(400).json({ message: 'Skill is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user.skillsWanted.includes(skill.trim())) {
      user.skillsWanted.push(skill.trim());
      await user.save();
    }

    res.json({ skillsWanted: user.skillsWanted });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove skill from wanted skills
router.delete('/skills/wanted/:skill', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.skillsWanted = user.skillsWanted.filter(skill => skill !== req.params.skill);
    await user.save();

    res.json({ skillsWanted: user.skillsWanted });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 