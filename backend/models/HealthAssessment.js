const mongoose = require('mongoose');

const healthAssessmentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  
  // Symptom Information
  primarySymptom: { type: String, required: true },
  symptomDetails: {
    location: String,
    severity: { type: Number, min: 1, max: 10 },
    duration: String,
    onset: String, // sudden, gradual
    associatedSymptoms: [String],
    frequency: String // constant, intermittent
  },
  
  // Assessment Results
  urgencyLevel: { 
    type: String, 
    enum: ['critical', 'high', 'medium', 'low'],
    required: true 
  },
  recommendedSpecialist: String,
  
  // Hospital Recommendations
  recommendedHospitals: [{
    hospitalId: mongoose.Schema.Types.ObjectId,
    name: String,
    distance: Number,
    rating: Number,
    specializations: [String],
    phone: String,
    address: String
  }],
  
  // First Aid Guidance
  firstAidGuidance: {
    condition: String,
    steps: [String],
    warning: String
  },
  
  // Conversation History
  conversationHistory: [{
    role: { type: String, enum: ['user', 'assistant'] },
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],
  
  // User Location
  userLocation: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  
  // Emergency Status
  emergencyDetected: { type: Boolean, default: false },
  sosTriggered: { type: Boolean, default: false },
  sosTriggeredAt: Date,
  
  // Follow-up
  followUpRequired: { type: Boolean, default: false },
  followUpDate: Date,
  notes: String,
  
  // Metadata
  language: { type: String, default: 'en-IN' },
  duration: Number, // in seconds
  status: { 
    type: String, 
    enum: ['active', 'completed', 'escalated'],
    default: 'active'
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for quick user lookups
healthAssessmentSchema.index({ userId: 1, createdAt: -1 });
healthAssessmentSchema.index({ urgencyLevel: 1 });
healthAssessmentSchema.index({ emergencyDetected: 1 });

module.exports = mongoose.model('HealthAssessment', healthAssessmentSchema);
