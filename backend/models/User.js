const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'hospital', 'superadmin'], required: true },
  phone: String,
  bloodType: String,
  age: Number,
  address: String,
  // Doctor-specific fields
  qualification: String,
  nmcCode: String,
  stateMedicalCouncil: String,
  isVerified: { type: Boolean, default: false },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'], 
    default: 'pending' 
  },
  verifiedAt: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // General fields
  medicalHistory: [String],
  allergies: [String],
  emergencyContacts: [{
    name: String,
    phone: String,
    relation: String
  }],
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
