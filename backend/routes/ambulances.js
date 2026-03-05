const express = require('express');
const router = express.Router();
const Ambulance = require('../models/Ambulance');

// Get nearby ambulances
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    const ambulances = await Ambulance.find({
      status: 'available',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: radius * 1000
        }
      }
    }).populate('driverId hospitalId');
    
    res.json(ambulances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ambulance by ID
router.get('/:id', async (req, res) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id)
      .populate('driverId hospitalId');
    if (!ambulance) return res.status(404).json({ error: 'Ambulance not found' });
    res.json(ambulance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update ambulance location
router.patch('/:id/location', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const ambulance = await Ambulance.findByIdAndUpdate(
      req.params.id,
      { location: { type: 'Point', coordinates: [lng, lat] } },
      { new: true }
    );
    res.json(ambulance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update ambulance status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const ambulance = await Ambulance.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(ambulance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register new ambulance
router.post('/', async (req, res) => {
  try {
    const ambulance = new Ambulance(req.body);
    await ambulance.save();
    res.status(201).json(ambulance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
