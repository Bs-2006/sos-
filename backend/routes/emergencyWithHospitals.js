const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { handleEmergencyWithHospitals, formatHospitalsForMap } = require('../services/EmergencyResponseService');

/**
 * POST /api/emergency/with-hospitals
 * 
 * Comprehensive emergency response with hospital recommendations
 * 
 * Request body:
 * {
 *   situation: "Heart attack symptoms",
 *   location: { latitude: 17.3850, longitude: 78.4867 },
 *   emergencyContacts: [{ name: "Mom", phone: "+919876543210", relation: "Mother" }]
 * }
 * 
 * Response:
 * {
 *   emergencyId: "EMG-1234567890-abc123",
 *   timestamp: "2024-01-15T10:30:00Z",
 *   hospitalRecommendations: [...],
 *   courseOfAction: { immediateActions: [...], nearestHospital: {...} },
 *   emergencyActions: { messages: [...], calls: [...] }
 * }
 */
router.post('/with-hospitals', auth, async (req, res) => {
  try {
    const { situation, location, emergencyContacts } = req.body;

    // Validate required fields
    if (!situation) {
      return res.status(400).json({ error: 'Situation description is required' });
    }

    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({ error: 'User location (latitude, longitude) is required' });
    }

    // Handle emergency with hospital recommendations
    const emergencyResponse = await handleEmergencyWithHospitals(
      situation,
      location,
      emergencyContacts || []
    );

    res.json({
      success: true,
      ...emergencyResponse
    });
  } catch (error) {
    console.error('Emergency with hospitals error:', error);
    res.status(500).json({
      error: 'Failed to process emergency',
      message: error.message
    });
  }
});

/**
 * GET /api/emergency/hospitals-for-map
 * 
 * Get hospital recommendations formatted for map display
 * 
 * Query params:
 * - situation: Emergency situation description
 * - latitude: User latitude
 * - longitude: User longitude
 * - limit: Number of hospitals to return (default: 5)
 * 
 * Response: Array of hospitals with map-ready coordinates
 */
router.get('/hospitals-for-map', auth, async (req, res) => {
  try {
    const { situation, latitude, longitude, limit = 5 } = req.query;

    if (!situation) {
      return res.status(400).json({ error: 'Situation is required' });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const { getRecommendedHospitals } = require('../services/HospitalRecommendationService');
    
    const hospitalData = await getRecommendedHospitals(
      situation,
      { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
      parseInt(limit)
    );

    const mapFormattedHospitals = formatHospitalsForMap(hospitalData.recommendations || []);

    res.json({
      success: true,
      count: mapFormattedHospitals.length,
      hospitals: mapFormattedHospitals
    });
  } catch (error) {
    console.error('Map hospitals error:', error);
    res.status(500).json({
      error: 'Failed to get hospitals for map',
      message: error.message
    });
  }
});

/**
 * POST /api/emergency/course-of-action
 * 
 * Get step-by-step course of action for emergency situation
 * 
 * Request body:
 * {
 *   situation: "Heart attack symptoms",
 *   location: { latitude: 17.3850, longitude: 78.4867 }
 * }
 * 
 * Response: Immediate actions + hospital guidance
 */
router.post('/course-of-action', auth, async (req, res) => {
  try {
    const { situation, location } = req.body;

    if (!situation) {
      return res.status(400).json({ error: 'Situation is required' });
    }

    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({ error: 'Location is required' });
    }

    const { getRecommendedHospitals } = require('../services/HospitalRecommendationService');
    const { generateCourseOfAction } = require('../services/EmergencyResponseService');

    const hospitalData = await getRecommendedHospitals(
      situation,
      location,
      3
    );

    const courseOfAction = generateCourseOfAction(
      situation,
      hospitalData.recommendations || []
    );

    res.json({
      success: true,
      courseOfAction
    });
  } catch (error) {
    console.error('Course of action error:', error);
    res.status(500).json({
      error: 'Failed to generate course of action',
      message: error.message
    });
  }
});

module.exports = router;
