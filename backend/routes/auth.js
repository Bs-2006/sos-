const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Login with email and password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );
    
    res.json({ 
      token, 
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        bloodType: user.bloodType,
        age: user.age
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, qualification, nmcCode, stateMedicalCouncil } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Validate doctor-specific fields
    if (role === 'doctor') {
      if (!qualification || !nmcCode || !stateMedicalCouncil) {
        return res.status(400).json({ 
          error: 'Qualification, NMC Code, and State Medical Council are required for doctors' 
        });
      }
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const user = new User({
      email,
      password,
      name,
      role: role || 'patient',
      qualification,
      nmcCode,
      stateMedicalCouncil,
      verificationStatus: role === 'doctor' ? 'pending' : 'verified',
      isVerified: role !== 'doctor'
    });
    
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );
    
    res.status(201).json({ 
      token, 
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        qualification: user.qualification,
        nmcCode: user.nmcCode,
        stateMedicalCouncil: user.stateMedicalCouncil,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP (mock - kept for backward compatibility)
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    res.json({ success: true, message: 'OTP verified' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
