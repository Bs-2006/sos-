const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  phone: String,
  email: String,
  address: String,
  rating: { type: Number, min: 0, max: 5, default: 0 },
  beds: { type: Number, default: 0 },
  availableBeds: { type: Number, default: 0 },
  emergency: { type: Boolean, default: true },
  icu: { type: Boolean, default: false },
  icuBeds: { type: Number, default: 0 },
  availableICUBeds: { type: Number, default: 0 },
  bloodBank: [{
    type: { type: String }, // O+, O-, A+, A-, B+, B-, AB+, AB-
    units: { type: Number, default: 0 }
  }],
  facilities: [String], // ICU, Emergency, Surgery, Lab, Cardiology, etc.
  specializations: [String], // Cardiology, Neurology, Orthopedics, etc.
  ambulances: { type: Number, default: 0 },
  averageResponseTime: { type: Number, default: 0 }, // in minutes
  acceptingEmergencies: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

hospitalSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Hospital', hospitalSchema);
