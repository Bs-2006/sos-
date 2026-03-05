const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const auth = require('../middleware/auth');
const { getRecommendedHospitals } = require('../services/HospitalRecommendationService');

// Get recommended hospitals based on emergency situation
router.post('/recommend', auth, async (req, res) => {
  try {
    const { situation, location, limit = 5 } = req.body;

    if (!situation) {
      return res.status(400).json({ error: 'Situation description is required' });
    }

    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({ error: 'User location is required' });
    }

    const recommendations = await getRecommendedHospitals(
      situation,
      location,
      limit
    );

    res.json(recommendations);
  } catch (error) {
    console.error('Hospital recommendation error:', error);
    res.status(500).json({ error: 'Failed to get hospital recommendations' });
  }
});

// Get nearby hospitals (without recommendation logic)
router.get('/nearby', auth, async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const hospitals = await Hospital.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    }).limit(10);

    res.json({
      success: true,
      count: hospitals.length,
      hospitals: hospitals.map(h => ({
        id: h._id,
        name: h.name,
        phone: h.phone,
        address: h.address,
        rating: h.rating,
        emergency: h.emergency,
        facilities: h.facilities
      }))
    });
  } catch (error) {
    console.error('Nearby hospitals error:', error);
    res.status(500).json({ error: 'Failed to fetch nearby hospitals' });
  }
});

// Get hospital details
router.get('/:id', auth, async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    res.json({
      success: true,
      hospital: {
        id: hospital._id,
        name: hospital.name,
        phone: hospital.phone,
        email: hospital.email,
        address: hospital.address,
        rating: hospital.rating,
        beds: hospital.beds,
        availableBeds: hospital.availableBeds,
        emergency: hospital.emergency,
        icu: hospital.icu,
        availableICUBeds: hospital.availableICUBeds,
        bloodBank: hospital.bloodBank,
        facilities: hospital.facilities,
        specializations: hospital.specializations,
        ambulances: hospital.ambulances,
        averageResponseTime: hospital.averageResponseTime
      }
    });
  } catch (error) {
    console.error('Hospital details error:', error);
    res.status(500).json({ error: 'Failed to fetch hospital details' });
  }
});

// Admin: Create hospital
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only admins can create hospitals' });
    }

    const { name, location, phone, email, address, facilities, specializations } = req.body;

    if (!name || !location || !location.latitude || !location.longitude) {
      return res.status(400).json({ error: 'Name and location are required' });
    }

    const hospital = new Hospital({
      name,
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      },
      phone,
      email,
      address,
      facilities: facilities || [],
      specializations: specializations || []
    });

    await hospital.save();

    res.status(201).json({
      success: true,
      message: 'Hospital created successfully',
      hospital: hospital
    });
  } catch (error) {
    console.error('Create hospital error:', error);
    res.status(500).json({ error: 'Failed to create hospital' });
  }
});

// Admin: Update hospital
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only admins can update hospitals' });
    }

    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    res.json({
      success: true,
      message: 'Hospital updated successfully',
      hospital
    });
  } catch (error) {
    console.error('Update hospital error:', error);
    res.status(500).json({ error: 'Failed to update hospital' });
  }
});

module.exports = router;
