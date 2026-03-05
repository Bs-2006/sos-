/**
 * Course of Action Service
 * Provides best course of action based on patient's current situation and symptoms
 */

// Symptom severity mapping
const SYMPTOM_SEVERITY = {
  // Critical symptoms (immediate life threat)
  critical: [
    'unconscious', 'not breathing', 'no pulse', 'severe bleeding', 'choking',
    'chest pain', 'heart attack', 'stroke', 'severe allergic reaction',
    'poisoning', 'overdose', 'drowning', 'electrocution', 'severe burns'
  ],
  
  // High severity (urgent, needs immediate attention)
  high: [
    'difficulty breathing', 'severe pain', 'head injury', 'spinal injury',
    'fracture', 'dislocation', 'severe wound', 'heavy bleeding', 'shock',
    'seizure', 'loss of consciousness', 'severe allergic reaction',
    'poisoning', 'severe burns', 'hypothermia', 'heatstroke'
  ],
  
  // Medium severity (needs attention soon)
  medium: [
    'moderate pain', 'minor bleeding', 'minor burns', 'sprains', 'strains',
    'nausea', 'vomiting', 'diarrhea', 'fever', 'cough', 'sore throat',
    'headache', 'dizziness', 'weakness', 'fatigue'
  ],
  
  // Low severity (can wait)
  low: [
    'minor cuts', 'bruises', 'minor headache', 'mild pain', 'general discomfort'
  ]
};

// First aid actions by symptom
const FIRST_AID_ACTIONS = {
  'unconscious': {
    priority: 'IMMEDIATE',
    actions: [
      'Check for responsiveness - tap shoulders and shout',
      'Call emergency services (108) immediately',
      'Check airway - tilt head back slightly',
      'Check breathing - look for chest movement',
      'If not breathing, start CPR (30 chest compressions, 2 rescue breaths)',
      'Place in recovery position if breathing',
      'Do not move if spinal injury suspected',
      'Keep warm with blankets'
    ]
  },
  
  'not breathing': {
    priority: 'IMMEDIATE',
    actions: [
      'Call emergency services (108) immediately',
      'Start CPR - 30 chest compressions at 100-120 per minute',
      'Give 2 rescue breaths after every 30 compressions',
      'Continue CPR until ambulance arrives or person starts breathing',
      'If available, use AED (Automated External Defibrillator)',
      'Do not stop CPR unless told by medical professional'
    ]
  },
  
  'choking': {
    priority: 'IMMEDIATE',
    actions: [
      'Encourage coughing if able to cough',
      'Perform Heimlich maneuver:',
      '  1. Stand behind the person',
      '  2. Place fist above navel, below ribcage',
      '  3. Grasp fist with other hand',
      '  4. Thrust upward and inward quickly',
      '  5. Repeat 5 times',
      'If unsuccessful, call emergency services (108)',
      'Continue alternating between coughing and Heimlich'
    ]
  },
  
  'severe bleeding': {
    priority: 'IMMEDIATE',
    actions: [
      'Call emergency services (108) immediately',
      'Apply direct pressure with clean cloth',
      'Do not remove embedded objects',
      'Elevate injured area above heart if possible',
      'Apply pressure to artery if bleeding continues',
      'Use tourniquet if limb bleeding cannot be controlled',
      'Keep person warm and calm',
      'Monitor for signs of shock'
    ]
  },
  
  'chest pain': {
    priority: 'IMMEDIATE',
    actions: [
      'Call emergency services (108) immediately',
      'Sit or lie down in comfortable position',
      'Loosen tight clothing',
      'Chew aspirin if available and not allergic',
      'Stay calm and breathe slowly',
      'Do not exert yourself',
      'Have someone stay with you',
      'If unconscious, start CPR'
    ]
  },
  
  'stroke': {
    priority: 'IMMEDIATE',
    actions: [
      'Note the time symptoms started (critical for treatment)',
      'Call emergency services (108) immediately',
      'Do not give food or water',
      'Keep person calm and reassured',
      'Position on side if unconscious',
      'Monitor breathing and consciousness',
      'Do not move unnecessarily',
      'Have medical history ready for ambulance'
    ]
  },
  
  'severe allergic reaction': {
    priority: 'IMMEDIATE',
    actions: [
      'Call emergency services (108) immediately',
      'Use epinephrine auto-injector if available',
      'Lie person down with legs elevated',
      'Remove allergen if possible',
      'Loosen tight clothing',
      'Monitor breathing and consciousness',
      'Be prepared to perform CPR',
      'Keep person warm'
    ]
  },
  
  'fracture': {
    priority: 'URGENT',
    actions: [
      'Immobilize the injured area',
      'Apply ice if available (wrapped in cloth)',
      'Elevate if possible',
      'Do not move the injured area',
      'Remove jewelry and tight clothing',
      'Call emergency services (108)',
      'Monitor for circulation below injury',
      'Keep person calm and warm'
    ]
  },
  
  'head injury': {
    priority: 'URGENT',
    actions: [
      'Call emergency services (108)',
      'Do not move person if spinal injury suspected',
      'Apply ice to reduce swelling',
      'Monitor consciousness and breathing',
      'Watch for vomiting, confusion, or seizures',
      'Keep person calm and still',
      'Do not remove any embedded objects',
      'Note time of injury'
    ]
  },
  
  'severe burns': {
    priority: 'URGENT',
    actions: [
      'Call emergency services (108) immediately',
      'Stop the burning - remove from heat source',
      'Cool the burn with cool (not cold) water for 10-20 minutes',
      'Remove jewelry and tight clothing',
      'Cover with clean, dry cloth',
      'Do not apply ice directly',
      'Do not apply ointments or oils',
      'Elevate burned area if possible'
    ]
  },
  
  'poisoning': {
    priority: 'IMMEDIATE',
    actions: [
      'Call emergency services (108) immediately',
      'Call poison control center if available',
      'Remove from source of poison',
      'Do not induce vomiting',
      'If swallowed, have poison container ready',
      'If inhaled, move to fresh air',
      'If on skin, rinse with water',
      'Monitor breathing and consciousness'
    ]
  },
  
  'drowning': {
    priority: 'IMMEDIATE',
    actions: [
      'Remove from water carefully',
      'Call emergency services (108) immediately',
      'Clear airway of debris',
      'If not breathing, start CPR immediately',
      'Place in recovery position if breathing',
      'Keep warm with blankets',
      'Do not move if spinal injury suspected',
      'Monitor breathing and consciousness'
    ]
  },
  
  'shock': {
    priority: 'URGENT',
    actions: [
      'Call emergency services (108) immediately',
      'Lay person down',
      'Elevate legs 12 inches (unless head/spinal injury)',
      'Keep person warm with blankets',
      'Do not give food or water',
      'Monitor breathing and consciousness',
      'Reassure and keep calm',
      'Loosen tight clothing'
    ]
  },
  
  'seizure': {
    priority: 'URGENT',
    actions: [
      'Call emergency services (108)',
      'Do not restrain the person',
      'Clear area of dangerous objects',
      'Place something soft under head',
      'Turn head to side to keep airway clear',
      'Do not put anything in mouth',
      'Time the seizure',
      'Stay with person until fully conscious'
    ]
  },
  
  'difficulty breathing': {
    priority: 'URGENT',
    actions: [
      'Call emergency services (108)',
      'Sit person upright',
      'Loosen tight clothing',
      'Keep calm and reassure',
      'If asthma, use inhaler if available',
      'Monitor breathing rate',
      'Be prepared to perform CPR',
      'Do not lie person down'
    ]
  },
  
  'severe pain': {
    priority: 'URGENT',
    actions: [
      'Call emergency services (108)',
      'Identify location and type of pain',
      'Do not move injured area',
      'Apply ice if appropriate',
      'Keep person calm',
      'Monitor vital signs',
      'Do not give food or water',
      'Have person describe pain characteristics'
    ]
  },
  
  'fall': {
    priority: 'URGENT',
    actions: [
      'Do not move person if spinal injury suspected',
      'Call emergency services (108)',
      'Check for injuries',
      'Apply ice to swelling',
      'Monitor consciousness',
      'Keep person warm',
      'Reassure and stay with person',
      'Note what caused the fall'
    ]
  }
};

// Hospital specializations needed by symptom
const SYMPTOM_SPECIALIZATIONS = {
  'chest pain': ['Cardiology', 'Emergency'],
  'heart attack': ['Cardiology', 'Emergency'],
  'stroke': ['Neurology', 'Emergency'],
  'seizure': ['Neurology', 'Emergency'],
  'head injury': ['Neurology', 'Emergency'],
  'fracture': ['Orthopedics', 'Emergency'],
  'severe burns': ['Burn Unit', 'Emergency'],
  'poisoning': ['Toxicology', 'Emergency'],
  'severe allergic reaction': ['Allergy', 'Emergency'],
  'difficulty breathing': ['Pulmonology', 'Emergency'],
  'drowning': ['Pulmonology', 'Emergency'],
  'severe bleeding': ['Trauma', 'Emergency'],
  'shock': ['Emergency', 'ICU'],
  'unconscious': ['Neurology', 'Emergency', 'ICU'],
  'not breathing': ['Emergency', 'ICU'],
  'choking': ['Emergency', 'ENT']
};

/**
 * Determine severity level from symptoms
 */
export function determineSeverity(symptoms) {
  const lowerSymptoms = symptoms.map(s => s.toLowerCase());
  
  for (const symptom of lowerSymptoms) {
    if (SYMPTOM_SEVERITY.critical.some(s => symptom.includes(s))) {
      return 'critical';
    }
  }
  
  for (const symptom of lowerSymptoms) {
    if (SYMPTOM_SEVERITY.high.some(s => symptom.includes(s))) {
      return 'high';
    }
  }
  
  for (const symptom of lowerSymptoms) {
    if (SYMPTOM_SEVERITY.medium.some(s => symptom.includes(s))) {
      return 'medium';
    }
  }
  
  return 'low';
}

/**
 * Get first aid actions for symptoms
 */
export function getFirstAidActions(symptoms) {
  const actions = [];
  const addedActions = new Set();
  
  for (const symptom of symptoms) {
    const lowerSymptom = symptom.toLowerCase();
    
    // Find matching first aid action
    for (const [key, action] of Object.entries(FIRST_AID_ACTIONS)) {
      if (lowerSymptom.includes(key) && !addedActions.has(key)) {
        actions.push({
          symptom: key,
          ...action
        });
        addedActions.add(key);
      }
    }
  }
  
  // Sort by priority
  const priorityOrder = { 'IMMEDIATE': 0, 'URGENT': 1, 'SOON': 2 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return actions;
}

/**
 * Get recommended hospital specializations
 */
export function getRequiredSpecializations(symptoms) {
  const specializations = new Set();
  
  for (const symptom of symptoms) {
    const lowerSymptom = symptom.toLowerCase();
    
    for (const [key, specs] of Object.entries(SYMPTOM_SPECIALIZATIONS)) {
      if (lowerSymptom.includes(key)) {
        specs.forEach(spec => specializations.add(spec));
      }
    }
  }
  
  return Array.from(specializations);
}

/**
 * Get comprehensive course of action
 */
export function getCourseOfAction(situation, symptoms) {
  const severity = determineSeverity(symptoms);
  const firstAidActions = getFirstAidActions(symptoms);
  const specializations = getRequiredSpecializations(symptoms);
  
  const courseOfAction = [];
  
  // Add immediate actions based on severity
  if (severity === 'critical') {
    courseOfAction.push({
      priority: 'IMMEDIATE',
      action: 'Call Emergency Services',
      details: 'Call 108 (Ambulance) immediately. This is a life-threatening emergency.',
      icon: 'phone-emergency'
    });
    
    courseOfAction.push({
      priority: 'IMMEDIATE',
      action: 'Notify Emergency Contacts',
      details: 'Alert all emergency contacts about the critical situation.',
      icon: 'alert-circle'
    });
  } else if (severity === 'high') {
    courseOfAction.push({
      priority: 'URGENT',
      action: 'Call Emergency Services',
      details: 'Call 108 (Ambulance) immediately. This is an urgent emergency.',
      icon: 'phone-emergency'
    });
  } else if (severity === 'medium') {
    courseOfAction.push({
      priority: 'URGENT',
      action: 'Contact Hospital',
      details: 'Call nearest hospital emergency department for guidance.',
      icon: 'hospital-building'
    });
  }
  
  // Add first aid actions
  for (const action of firstAidActions) {
    courseOfAction.push({
      priority: action.priority,
      action: `First Aid: ${action.symptom.charAt(0).toUpperCase() + action.symptom.slice(1)}`,
      details: action.actions.join('\n'),
      icon: 'medical-bag'
    });
  }
  
  // Add hospital navigation
  if (severity === 'critical' || severity === 'high') {
    courseOfAction.push({
      priority: 'NEXT',
      action: 'Head to Nearest Hospital',
      details: `Required specializations: ${specializations.join(', ')}`,
      icon: 'directions'
    });
  }
  
  // Add monitoring instructions
  if (severity === 'critical') {
    courseOfAction.push({
      priority: 'ONGOING',
      action: 'Monitor Vital Signs',
      details: 'Monitor breathing, pulse, consciousness, and bleeding until ambulance arrives.',
      icon: 'heart-pulse'
    });
  }
  
  return {
    severity,
    symptoms,
    specializations,
    courseOfAction,
    summary: generateSummary(severity, symptoms)
  };
}

/**
 * Generate summary text
 */
function generateSummary(severity, symptoms) {
  const summaries = {
    critical: `CRITICAL EMERGENCY: ${symptoms.join(', ')}. Immediate medical intervention required. Call 108 now.`,
    high: `URGENT EMERGENCY: ${symptoms.join(', ')}. Requires immediate medical attention. Call 108.`,
    medium: `EMERGENCY: ${symptoms.join(', ')}. Requires medical attention soon. Contact hospital.`,
    low: `ASSISTANCE NEEDED: ${symptoms.join(', ')}. Monitor condition and seek medical advice if worsens.`
  };
  
  return summaries[severity] || summaries.low;
}

/**
 * Get emergency contact numbers
 */
export function getEmergencyNumbers() {
  return {
    ambulance: '108',
    police: '100',
    fire: '101',
    womenHelpline: '1091',
    poisonControl: '1800-11-6117',
    mentalHealth: '9152987821'
  };
}

/**
 * Check if situation requires immediate hospitalization
 */
export function requiresImmediateHospitalization(severity) {
  return severity === 'critical' || severity === 'high';
}

/**
 * Get vital signs to monitor
 */
export function getVitalSignsToMonitor(symptoms) {
  const vitals = new Set();
  
  const lowerSymptoms = symptoms.map(s => s.toLowerCase()).join(' ');
  
  if (lowerSymptoms.includes('breathing') || lowerSymptoms.includes('chest')) {
    vitals.add('Respiratory Rate');
  }
  
  if (lowerSymptoms.includes('heart') || lowerSymptoms.includes('chest') || lowerSymptoms.includes('pain')) {
    vitals.add('Heart Rate');
    vitals.add('Blood Pressure');
  }
  
  if (lowerSymptoms.includes('unconscious') || lowerSymptoms.includes('head')) {
    vitals.add('Consciousness Level');
    vitals.add('Pupil Response');
  }
  
  if (lowerSymptoms.includes('bleeding') || lowerSymptoms.includes('shock')) {
    vitals.add('Blood Pressure');
    vitals.add('Pulse');
  }
  
  if (lowerSymptoms.includes('fever') || lowerSymptoms.includes('burn')) {
    vitals.add('Body Temperature');
  }
  
  // Always monitor these
  vitals.add('Consciousness');
  vitals.add('Breathing');
  
  return Array.from(vitals);
}

export default {
  determineSeverity,
  getFirstAidActions,
  getRequiredSpecializations,
  getCourseOfAction,
  getEmergencyNumbers,
  requiresImmediateHospitalization,
  getVitalSignsToMonitor
};
