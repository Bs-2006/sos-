const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.patch('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by email
router.get('/email/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update emergency contacts
router.put('/emergency-contacts', auth, async (req, res) => {
  try {
    const { emergencyContacts } = req.body;
    const userId = req.user.userId;

    if (!emergencyContacts || !Array.isArray(emergencyContacts)) {
      return res.status(400).json({ error: 'Invalid emergency contacts data' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { emergencyContacts },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Emergency contacts updated successfully',
      user
    });
  } catch (error) {
    console.error('Update emergency contacts error:', error);
    res.status(500).json({ error: 'Failed to update emergency contacts' });
  }
});

// Get emergency contacts
router.get('/emergency-contacts', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('emergencyContacts');
    
    res.json({
      success: true,
      emergencyContacts: user?.emergencyContacts || []
    });
  } catch (error) {
    console.error('Get emergency contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch emergency contacts' });
  }
});

module.exports = router;
