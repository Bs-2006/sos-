/**
 * LifeLink AI Health Assistant Service
 * Implements guided symptom assessment and medical guidance
 */

// Symptom to specialist mapping
const SYMPTOM_SPECIALIST_MAP = {
  'chest pain': 'Cardiologist',
  'heart attack': 'Cardiologist',
  'palpitations': 'Cardiologist',
  'shortness of breath': 'Pulmonologist',
  'difficulty breathing': 'Pulmonologist',
  'choking': 'ENT Specialist',
  'stroke': 'Neurologist',
  'seizure': 'Neurologist',
  'headache': 'Neurologist',
  'dizziness': 'Neurologist',
  'unconscious': 'Neurologist',
  'fracture': 'Orthopedic Doctor',
  'broken bone': 'Orthopedic Doctor',
  'sprain': 'Orthopedic Doctor',
  'injury': 'Orthopedic Doctor',
  'accident': 'Emergency Medicine',
  'bleeding': 'Emergency Medicine',
  'wound': 'Emergency Medicine',
  'abdominal pain': 'Gastroenterologist',
  'stomach pain': 'Gastroenterologist',
  'nausea': 'Gastroenterologist',
  'vomiting': 'Gastroenterologist',
  'fever': 'General Physician',
  'cold': 'General Physician',
  'cough': 'General Physician',
  'flu': 'General Physician',
  'skin issue': 'Dermatologist',
  'rash': 'Dermatologist',
  'burn': 'Burn Specialist',
  'poisoning': 'Toxicologist',
  'overdose': 'Toxicologist',
  'snake bite': 'Toxicologist'
};

// Emergency keywords that require immediate SOS
const CRITICAL_EMERGENCY_KEYWORDS = [
  'chest pain', 'heart attack', 'stroke', 'unconscious', 'not breathing',
  'severe bleeding', 'choking', 'drowning', 'seizure', 'dying',
  'can\'t breathe', 'cannot breathe', 'severe pain'
];

// Conversation stages
const CONVERSATION_STAGES = {
  INITIAL: 'initial',
  LOCATION_CLARIFICATION: 'location_clarification',
  SEVERITY_ASSESSMENT: 'severity_assessment',
  ASSOCIATED_SYMPTOMS: 'associated_symptoms',
  DURATION_ASSESSMENT: 'duration_assessment',
  RECOMMENDATION: 'recommendation'
};

// First aid guidance for common conditions
const FIRST_AID_GUIDANCE = {
  'chest pain': {
    steps: [
      'Stop all activity and sit down immediately',
      'Loosen tight clothing',
      'Take slow, deep breaths',
      'Chew aspirin if available (300mg)',
      'Call emergency services (108) immediately'
    ],
    warning: 'This could be a medical emergency. Please press the SOS button or call 108 immediately.'
  },
  'severe bleeding': {
    steps: [
      'Apply direct pressure with clean cloth',
      'Elevate the injured area above heart if possible',
      'Do NOT remove embedded objects',
      'Apply tourniquet if limb bleeding heavily',
      'Call 108 for ambulance'
    ],
    warning: 'This is a medical emergency. Call 108 immediately.'
  },
  'choking': {
    steps: [
      'Encourage coughing if possible',
      'Perform Heimlich maneuver if trained',
      'Do NOT hit back if object is visible',
      'Call 108 if object not dislodged',
      'Keep person upright'
    ],
    warning: 'This is a medical emergency. Call 108 immediately.'
  },
  'minor burns': {
    steps: [
      'Run cool water over the burn for 10 minutes',
      'Avoid applying ice directly',
      'Remove tight jewelry or clothing',
      'Cover with clean, dry cloth',
      'Take pain relief if needed'
    ],
    warning: 'For severe burns, call 108 immediately.'
  },
  'mild fever': {
    steps: [
      'Drink plenty of fluids (water, juice, soup)',
      'Rest and avoid strenuous activity',
      'Monitor temperature regularly',
      'Take paracetamol if needed (follow dosage)',
      'Seek medical help if fever persists beyond 3 days'
    ],
    warning: 'If fever is very high (>104°F) or accompanied by severe symptoms, seek immediate medical care.'
  },
  'fracture': {
    steps: [
      'Immobilize the injured area',
      'Apply ice wrapped in cloth (15 min intervals)',
      'Elevate if possible',
      'Do NOT move the injured limb',
      'Call 108 for ambulance'
    ],
    warning: 'Do not attempt to straighten the bone. Seek immediate medical attention.'
  }
};

/**
 * Detect if user's message indicates a critical emergency
 */
function isCriticalEmergency(message) {
  const lower = message.toLowerCase();
  return CRITICAL_EMERGENCY_KEYWORDS.some(keyword => lower.includes(keyword));
}

/**
 * Extract primary symptom from user message
 */
function extractPrimarySymptom(message) {
  const lower = message.toLowerCase();
  for (const symptom of Object.keys(SYMPTOM_SPECIALIST_MAP)) {
    if (lower.includes(symptom)) {
      return symptom;
    }
  }
  return null;
}

/**
 * Determine appropriate specialist based on symptom
 */
function getRecommendedSpecialist(symptom) {
  return SYMPTOM_SPECIALIST_MAP[symptom.toLowerCase()] || 'General Physician';
}

/**
 * Generate follow-up questions based on symptom
 */
function generateFollowUpQuestions(symptom) {
  const lower = symptom.toLowerCase();
  
  // Chest pain specific questions
  if (lower.includes('chest')) {
    return [
      'Are you experiencing shortness of breath?',
      'Do you feel pressure or tightness in the chest?',
      'Does the pain spread to your arm, jaw, or back?'
    ];
  }
  
  // Abdominal pain specific questions
  if (lower.includes('stomach') || lower.includes('abdominal')) {
    return [
      'Is the pain in upper abdomen or lower abdomen?',
      'Do you feel nausea or vomiting?',
      'Do you have fever?'
    ];
  }
  
  // Head pain specific questions
  if (lower.includes('head')) {
    return [
      'Is the pain sharp, dull, or throbbing?',
      'Are you experiencing dizziness or blurred vision?',
      'Did the pain start suddenly?'
    ];
  }
  
  // Injury specific questions
  if (lower.includes('injury') || lower.includes('fracture') || lower.includes('sprain')) {
    return [
      'Is there swelling or bleeding?',
      'Are you able to move the affected area?',
      'Did the injury occur due to a fall or accident?'
    ];
  }
  
  // General questions for other symptoms
  return [
    'Where exactly is the pain located?',
    'When did the pain start?',
    'How severe is the pain from 1 to 10?'
  ];
}

/**
 * Assess urgency level based on symptoms and responses
 */
function assessUrgency(symptom, responses = {}) {
  const lower = symptom.toLowerCase();
  
  // Critical urgency
  if (CRITICAL_EMERGENCY_KEYWORDS.some(kw => lower.includes(kw))) {
    return 'critical';
  }
  
  // High urgency indicators
  if (lower.includes('severe') || lower.includes('bleeding') || lower.includes('accident')) {
    return 'high';
  }
  
  // Medium urgency
  if (lower.includes('pain') || lower.includes('injury') || lower.includes('fever')) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Generate hospital recommendation message
 */
function generateHospitalRecommendation(specialist, hospitals = []) {
  let message = `\n\n📋 Recommended Doctor Type: ${specialist}\n`;
  
  if (hospitals && hospitals.length > 0) {
    message += '\n🏥 Nearby Hospitals:\n';
    hospitals.slice(0, 3).forEach((hospital, index) => {
      message += `\n${index + 1}. ${hospital.name}\n`;
      message += `   Distance: ${hospital.distance.toFixed(1)} km\n`;
      message += `   Rating: ${hospital.rating || 'N/A'}/5\n`;
      message += `   Specialization: ${hospital.specializations?.join(', ') || 'Multi-specialty'}\n`;
      if (hospital.phone) message += `   Phone: ${hospital.phone}\n`;
    });
  }
  
  return message;
}

/**
 * Generate first aid guidance
 */
function getFirstAidGuidance(symptom) {
  const lower = symptom.toLowerCase();
  
  for (const [condition, guidance] of Object.entries(FIRST_AID_GUIDANCE)) {
    if (lower.includes(condition)) {
      return guidance;
    }
  }
  
  return null;
}

/**
 * Build comprehensive health assessment response
 */
function buildHealthAssessmentResponse(symptom, urgency, specialist, followUpQuestions) {
  let response = '';
  
  // Acknowledgment
  response += `I understand you're experiencing ${symptom}. `;
  
  // Urgency warning if needed
  if (urgency === 'critical') {
    response += '\n\n🚨 This could be a medical emergency. Please press the SOS button in LifeLink or contact emergency services (108) immediately.\n';
  } else if (urgency === 'high') {
    response += '\n\n⚠️ This requires prompt medical attention. ';
  }
  
  // Follow-up questions
  response += '\n\nTo better understand your condition, please answer:\n';
  followUpQuestions.forEach((q, i) => {
    response += `${i + 1}. ${q}\n`;
  });
  
  return response;
}

/**
 * Generate emergency guidance message
 */
function generateEmergencyGuidance() {
  return '\n\n🚨 EMERGENCY DETECTED\n\nThis could be a medical emergency. Please:\n1. Press the SOS button in LifeLink\n2. Call emergency services: 108 (Ambulance)\n3. Inform them of your symptoms\n4. Stay calm and follow their instructions\n\nWe are notifying your emergency contacts immediately.';
}

module.exports = {
  isCriticalEmergency,
  extractPrimarySymptom,
  getRecommendedSpecialist,
  generateFollowUpQuestions,
  assessUrgency,
  generateHospitalRecommendation,
  getFirstAidGuidance,
  buildHealthAssessmentResponse,
  generateEmergencyGuidance,
  CONVERSATION_STAGES,
  SYMPTOM_SPECIALIST_MAP,
  CRITICAL_EMERGENCY_KEYWORDS,
  FIRST_AID_GUIDANCE
};
