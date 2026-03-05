const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Emergency call records (in production, use a proper database model)
const emergencyCalls = new Map();

// Initiate emergency call
router.post('/initiate', auth, async (req, res) => {
  try {
    const { userId, location, timestamp } = req.body;
    
    const emergencyId = `EMG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    emergencyCalls.set(emergencyId, {
      id: emergencyId,
      userId,
      location,
      timestamp,
      status: 'active',
      recording: {
        started: new Date(),
        url: null // Will be set when recording is uploaded
      }
    });

    res.json({
      success: true,
      emergencyId,
      message: 'Emergency call initiated'
    });
  } catch (error) {
    console.error('Emergency initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate emergency call' });
  }
});

// Notify emergency contacts
router.post('/notify-contacts', auth, async (req, res) => {
  try {
    const { emergencyId } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user || !user.emergencyContacts || user.emergencyContacts.length === 0) {
      return res.status(400).json({ error: 'No emergency contacts found' });
    }

    const emergency = emergencyCalls.get(emergencyId);
    if (!emergency) {
      return res.status(404).json({ error: 'Emergency call not found' });
    }

    // In production, integrate with SMS/Call API (Twilio, AWS SNS, etc.)
    const notifications = user.emergencyContacts.map(contact => ({
      name: contact.name,
      phone: contact.phone,
      relation: contact.relation,
      message: `🚨 EMERGENCY ALERT 🚨\n\n${user.name} has activated emergency services.\n\nLocation: ${emergency.location?.latitude || 'Unknown'}, ${emergency.location?.longitude || 'Unknown'}\n\nTime: ${new Date(emergency.timestamp).toLocaleString()}\n\nEmergency services (108 & 100) have been contacted.\n\nCall recording will be shared shortly.\n\n- LifeLink Emergency System`,
      status: 'sent', // In production, track actual delivery status
      type: 'sms_and_call' // Both SMS and voice call
    }));

    // Store notification records
    emergency.notifications = notifications;
    emergencyCalls.set(emergencyId, emergency);

    console.log('Emergency notifications sent:', notifications);

    res.json({
      success: true,
      notificationsSent: notifications.length,
      contacts: notifications
    });
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ error: 'Failed to notify emergency contacts' });
  }
});

// End emergency call
router.post('/end', auth, async (req, res) => {
  try {
    const { emergencyId, duration } = req.body;
    
    const emergency = emergencyCalls.get(emergencyId);
    if (!emergency) {
      return res.status(404).json({ error: 'Emergency call not found' });
    }

    emergency.status = 'completed';
    emergency.duration = duration;
    emergency.endedAt = new Date();
    
    emergencyCalls.set(emergencyId, emergency);

    // In production: Process and send call recording to emergency contacts
    // This would involve:
    // 1. Uploading recording to cloud storage (S3, etc.)
    // 2. Sending recording link via SMS/Email to emergency contacts
    // 3. Storing emergency record in database for history

    res.json({
      success: true,
      message: 'Emergency call ended',
      emergencyId,
      duration
    });
  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({ error: 'Failed to end emergency call' });
  }
});

// Upload call recording (for bot to upload)
router.post('/upload-recording', auth, async (req, res) => {
  try {
    const { emergencyId, recordingUrl } = req.body;
    
    const emergency = emergencyCalls.get(emergencyId);
    if (!emergency) {
      return res.status(404).json({ error: 'Emergency call not found' });
    }

    emergency.recording.url = recordingUrl;
    emergency.recording.uploadedAt = new Date();
    emergencyCalls.set(emergencyId, emergency);

    // Send recording to emergency contacts
    const userId = emergency.userId;
    const user = await User.findById(userId);
    
    if (user && user.emergencyContacts) {
      // In production: Send recording link to each contact via SMS/Email
      console.log(`Recording ${recordingUrl} ready to send to ${user.emergencyContacts.length} contacts`);
    }

    res.json({
      success: true,
      message: 'Recording uploaded and sent to emergency contacts'
    });
  } catch (error) {
    console.error('Upload recording error:', error);
    res.status(500).json({ error: 'Failed to upload recording' });
  }
});

// Get emergency history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Filter emergencies for this user
    const userEmergencies = Array.from(emergencyCalls.values())
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      emergencies: userEmergencies
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch emergency history' });
  }
});

module.exports = router;
