const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema({
  vehiclePlate: { type: String, required: true, unique: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['available', 'dispatched', 'busy', 'maintenance'], default: 'available' },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  currentBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmergencyBooking' },
  createdAt: { type: Date, default: Date.now }
});

ambulanceSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Ambulance', ambulanceSchema);
