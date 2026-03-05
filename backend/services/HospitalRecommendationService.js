const Hospital = require('../models/Hospital');

// Symptom to specialization mapping
const SYMPTOM_SPECIALIZATION_MAP = {
  // Cardiac symptoms
  'chest pain': ['Cardiology', 'Emergency'],
  'heart attack': ['Cardiology', 'Emergency'],
  'palpitations': ['Cardiology'],
  'shortness of breath': ['Cardiology', 'Pulmonology', 'Emergency'],
  
  // Neurological symptoms
  'stroke': ['Neurology', 'Emergency'],
  'seizure': ['Neurology', 'Emergency'],
  'headache': ['Neurology'],
  'dizziness': ['Neurology', 'Emergency'],
  'unconscious': ['Neurology', 'Emergency'],
  
  // Trauma/Orthopedic
  'fracture': ['Orthopedics', 'Emergency'],
  'broken bone': ['Orthopedics', 'Emergency'],
  'sprain': ['Orthopedics'],
  'injury': ['Emergency', 'Orthopedics'],
  'accident': ['Emergency', 'Trauma'],
  'bleeding': ['Emergency', 'Trauma'],
  'wound': ['Emergency'],
  
  // Respiratory
  'choking': ['Emergency', 'Pulmonology'],
  'drowning': ['Emergency', 'Pulmonology'],
  'difficulty breathing': ['Emergency', 'Pulmonology'],
  
  // Gastrointestinal
  'severe pain': ['Emergency', 'Gastroenterology'],
  'abdominal pain': ['Gastroenterology', 'Emergency'],
  'vomiting': ['Gastroenterology', 'Emergency'],
  
  // Poisoning/Toxicology
  'poisoning': ['Emergency', 'Toxicology'],
  'overdose': ['Emergency', 'Toxicology'],
  'snake bite': ['Emergency', 'Toxicology'],
  
  // General
  'fall': ['Emergency', 'Orthopedics'],
  'injury': ['Emergency'],
  'help': ['Emergency'],
  'emergency': ['Emergency']
};

// Severity levels based on keywords
const SEVERITY_KEYWORDS = {
  critical: ['dying', 'unconscious', 'not breathing', 'severe bleeding', 'heart attack', 'stroke', 'critical'],
  high: ['severe', 'urgent', 'emergency', 'accident', 'injury', 'bleeding', 'choking'],
  medium: ['pain', 'hurt', 'injured', 'fell', 'help'],
  low: ['help', 'assistance']
};

/**
 * Analyze emergency situation and extract symptoms
 */
function extractSymptoms(situation) {
  const lowerSituation = situation.toLowerCase();
  const symptoms = [];
  
  for (const [symptom, specs] of Object.entries(SYMPTOM_SPECIALIZATION_MAP)) {
    if (lowerSituation.includes(symptom)) {
      symptoms.push({ symptom, specializations: specs });
    }
  }
  
  return symptoms;
}

/**
 * Determine severity level from situation
 */
function determineSeverity(situation) {
  const lowerSituation = situation.toLowerCase();
  
  for (const keyword of SEVERITY_KEYWORDS.critical) {
    if (lowerSituation.includes(keyword)) return 'critical';
  }
  
  for (const keyword of SEVERITY_KEYWORDS.high) {
    if (lowerSituation.includes(keyword)) return 'high';
  }
  
  for (const keyword of SEVERITY_KEYWORDS.medium) {
    if (lowerSituation.includes(keyword)) return 'medium';
  }
  
  return 'low';
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
* Score hospital based on multiple factors
*/
function scoreHospital(hospital, severity, requiredSpecs, distance) {
  let score = 0;

  // Distance score (closer is better, max 30 points). Distance is precomputed once per hospital.
  const distanceScore = Math.max(0, 30 - distance * 2);
  score += distanceScore;

  // Specialization match (max 30 points) — reuse requiredSpecs across hospitals
  let specializationMatch = 0;
  const hospitalSpecs = new Set(hospital.specializations || []);
  const matchedSpecs = [...requiredSpecs].filter((spec) => hospitalSpecs.has(spec))
    .length;
  specializationMatch =
    (matchedSpecs / Math.max(1, requiredSpecs.size)) * 30;
  score += specializationMatch;

  // Facility availability (max 20 points)
  let facilityScore = 0;
  if (severity === "critical" || severity === "high") {
    if (hospital.emergency) facilityScore += 10;
    if (hospital.icu && hospital.availableICUBeds > 0) facilityScore += 10;
  } else {
    if (hospital.availableBeds > 0) facilityScore += 10;
    if (hospital.emergency) facilityScore += 10;
  }
  score += facilityScore;

  // Rating (max 10 points)
  score += ((hospital.rating || 0) / 5) * 10;

  // Response time (max 10 points)
  const responseScore = Math.max(
    0,
    10 - (hospital.averageResponseTime || 0) / 5
  );
  score += responseScore;

  // Accepting emergencies (max 5 points)
  if (hospital.acceptingEmergencies) score += 5;

  return score;
}

/**
 * Get recommended hospitals based on patient situation
 */
async function getRecommendedHospitals(situation, userLocation, limit = 5) {
  try {
    // Extract symptoms and severity
    const symptoms = extractSymptoms(situation);
    const severity = determineSeverity(situation);
    const requiredSpecs = new Set();
    symptoms.forEach((s) =>
      s.specializations.forEach((spec) => requiredSpecs.add(spec))
    );
    
    // Get nearby hospitals (within 10km)
    const hospitals = await Hospital.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [userLocation.longitude, userLocation.latitude]
          },
          $maxDistance: 10000 // 10km in meters
        }
      },
      acceptingEmergencies: true
    }).limit(20);
    
    if (hospitals.length === 0) {
      return {
        success: false,
        message: 'No hospitals found nearby',
        recommendations: []
      };
    }
    
    // Score and sort hospitals
    const scoredHospitals = hospitals
      .map((hospital) => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          hospital.location.coordinates[1],
          hospital.location.coordinates[0]
        );

        const score = scoreHospital(
          hospital,
          severity,
          requiredSpecs,
          distance
        );

        return {
          ...hospital.toObject(),
          score,
          distance,
        };
      })
      .sort((a, b) => b.score - a.score);
    
    // Get top recommendations
    const recommendations = scoredHospitals.slice(0, limit).map(h => ({
      id: h._id,
      name: h.name,
      phone: h.phone,
      address: h.address,
      distance: h.distance.toFixed(2),
      rating: h.rating,
      emergency: h.emergency,
      icu: h.icu,
      availableBeds: h.availableBeds,
      availableICUBeds: h.availableICUBeds,
      specializations: h.specializations,
      facilities: h.facilities,
      averageResponseTime: h.averageResponseTime,
      score: h.score.toFixed(2),
      reason: generateRecommendationReason(h, symptoms, severity)
    }));
    
    return {
      success: true,
      severity,
      symptoms: symptoms.map(s => s.symptom),
      recommendations,
      courseOfAction: generateCourseOfAction(severity, symptoms, recommendations)
    };
  } catch (error) {
    console.error('Hospital recommendation error:', error);
    return {
      success: false,
      message: error.message,
      recommendations: []
    };
  }
}

/**
 * Generate reason for hospital recommendation
 */
function generateRecommendationReason(hospital, symptoms, severity) {
  const reasons = [];
  
  if (severity === 'critical' && hospital.icu) {
    reasons.push('Has ICU for critical care');
  }
  
  if (hospital.specializations && hospital.specializations.length > 0) {
    const requiredSpecs = new Set();
    symptoms.forEach(s => s.specializations.forEach(spec => requiredSpecs.add(spec)));
    const matched = hospital.specializations.filter(spec => requiredSpecs.has(spec));
    if (matched.length > 0) {
      reasons.push(`Specializes in ${matched.join(', ')}`);
    }
  }
  
  if (hospital.rating >= 4.5) {
    reasons.push('Highly rated facility');
  }
  
  if (hospital.averageResponseTime < 10) {
    reasons.push('Fast response time');
  }
  
  return reasons.length > 0 ? reasons.join(' • ') : 'Nearest available hospital';
}

/**
 * Generate course of action based on situation
 */
function generateCourseOfAction(severity, symptoms, recommendations) {
  const actions = [];
  
  // Immediate actions based on severity
  if (severity === 'critical') {
    actions.push({
      priority: 'IMMEDIATE',
      action: 'Call 108 (Ambulance) immediately',
      details: 'Critical condition detected. Ambulance dispatch is urgent.'
    });
    actions.push({
      priority: 'IMMEDIATE',
      action: 'Notify emergency contacts',
      details: 'Alert all emergency contacts about the critical situation.'
    });
  } else if (severity === 'high') {
    actions.push({
      priority: 'URGENT',
      action: 'Call 108 (Ambulance)',
      details: 'High-priority emergency. Ambulance should be dispatched.'
    });
  } else {
    actions.push({
      priority: 'NORMAL',
      action: 'Contact nearest hospital',
      details: 'Reach out to recommended hospital for guidance.'
    });
  }
  
  // Hospital-specific actions
  if (recommendations.length > 0) {
    const topHospital = recommendations[0];
    actions.push({
      priority: 'NEXT',
      action: `Head to ${topHospital.name}`,
      details: `Distance: ${topHospital.distance} km. Phone: ${topHospital.phone}`
    });
  }
  
  // Symptom-specific first aid
  const firstAidActions = generateFirstAidActions(symptoms);
  actions.push(...firstAidActions);
  
  return actions;
}

/**
 * Generate first aid recommendations based on symptoms
 */
function generateFirstAidActions(symptoms) {
  const actions = [];
  const symptomList = symptoms.map(s => s.symptom).join(', ');
  
  // Cardiac symptoms
  if (symptomList.includes('chest pain') || symptomList.includes('heart attack')) {
    actions.push({
      priority: 'IMMEDIATE',
      action: 'First Aid: Chest Pain/Heart Attack',
      details: 'Sit down, loosen tight clothing, chew aspirin if available, stay calm and wait for ambulance.'
    });
  }
  
  // Stroke symptoms
  if (symptomList.includes('stroke')) {
    actions.push({
      priority: 'IMMEDIATE',
      action: 'First Aid: Stroke',
      details: 'Note time of symptom onset, keep person calm, do not give food/water, position on side if unconscious.'
    });
  }
  
  // Choking
  if (symptomList.includes('choking')) {
    actions.push({
      priority: 'IMMEDIATE',
      action: 'First Aid: Choking',
      details: 'Perform Heimlich maneuver: Stand behind person, place fist above navel, thrust upward.'
    });
  }
  
  // Bleeding
  if (symptomList.includes('bleeding')) {
    actions.push({
      priority: 'IMMEDIATE',
      action: 'First Aid: Severe Bleeding',
      details: 'Apply direct pressure with clean cloth, elevate injured area, do not remove embedded objects.'
    });
  }
  
  // Fractures
  if (symptomList.includes('fracture') || symptomList.includes('broken bone')) {
    actions.push({
      priority: 'URGENT',
      action: 'First Aid: Fracture',
      details: 'Immobilize the injured area, apply ice if available, elevate if possible, avoid movement.'
    });
  }
  
  // Drowning
  if (symptomList.includes('drowning')) {
    actions.push({
      priority: 'IMMEDIATE',
      action: 'First Aid: Drowning',
      details: 'Remove from water, clear airway, perform CPR if not breathing, keep warm.'
    });
  }
  
  return actions;
}

module.exports = {
  getRecommendedHospitals,
  extractSymptoms,
  determineSeverity,
  calculateDistance
};
