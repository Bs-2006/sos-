const { getRecommendedHospitals } = require('./HospitalRecommendationService');
const { sendSMS } = require('../agents/MessagingController');
const { triggerCall } = require('../agents/CallingController');

/**
 * Comprehensive emergency response with hospital recommendations
 * Combines emergency contact notifications + hospital suggestions
 */
async function handleEmergencyWithHospitals(situation, userLocation, emergencyContacts) {
  const results = {
    emergencyId: `EMG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    situation,
    userLocation,
    hospitalRecommendations: [],
    emergencyActions: { messages: [], calls: [] },
    courseOfAction: null
  };

  try {
    // Get hospital recommendations based on situation and location
    const hospitalData = await getRecommendedHospitals(situation, userLocation, 5);
    results.hospitalRecommendations = hospitalData.recommendations || [];

    // Generate course of action with hospital info
    results.courseOfAction = generateCourseOfAction(situation, results.hospitalRecommendations);

    // Notify emergency contacts with hospital info
    if (emergencyContacts && emergencyContacts.length > 0) {
      const contactResults = await notifyContactsWithHospitals(
        situation,
        results.hospitalRecommendations,
        emergencyContacts
      );
      results.emergencyActions = contactResults;
    }

    return results;
  } catch (error) {
    console.error('Emergency response error:', error);
    throw error;
  }
}

/**
 * Generate step-by-step course of action based on symptoms and hospitals
 */
function generateCourseOfAction(situation, hospitals) {
  const lowerSituation = situation.toLowerCase();
  
  // Determine primary action based on symptoms
  let immediateActions = [];
  let hospitalGuidance = '';

  // Heart attack symptoms
  if (lowerSituation.includes('heart attack') || lowerSituation.includes('chest pain')) {
    immediateActions = [
      '1. STOP all activity immediately and sit down',
      '2. Chew aspirin if available (300mg)',
      '3. Loosen tight clothing',
      '4. Take slow, deep breaths',
      '5. Call 108 for ambulance'
    ];
    hospitalGuidance = 'Cardiology specialist hospital recommended';
  }
  // Stroke symptoms
  else if (lowerSituation.includes('stroke') || lowerSituation.includes('facial drooping')) {
    immediateActions = [
      '1. Note the time symptoms started',
      '2. Keep person lying down, head elevated',
      '3. Do NOT give food or water',
      '4. Monitor breathing and consciousness',
      '5. Call 108 immediately'
    ];
    hospitalGuidance = 'Neurology specialist hospital recommended';
  }
  // Choking
  else if (lowerSituation.includes('choking')) {
    immediateActions = [
      '1. Encourage coughing if possible',
      '2. Perform Heimlich maneuver if trained',
      '3. Do NOT hit back if object visible',
      '4. Call 108 if object not dislodged',
      '5. Keep person upright'
    ];
    hospitalGuidance = 'Emergency department with ENT specialist';
  }
  // Severe bleeding
  else if (lowerSituation.includes('bleeding') || lowerSituation.includes('wound')) {
    immediateActions = [
      '1. Apply direct pressure with clean cloth',
      '2. Elevate injured area above heart if possible',
      '3. Do NOT remove embedded objects',
      '4. Apply tourniquet if limb bleeding heavily',
      '5. Call 108 for ambulance'
    ];
    hospitalGuidance = 'Trauma center with blood bank';
  }
  // Fracture/Injury
  else if (lowerSituation.includes('fracture') || lowerSituation.includes('broken')) {
    immediateActions = [
      '1. Immobilize the injured area',
      '2. Apply ice wrapped in cloth (15 min intervals)',
      '3. Elevate if possible',
      '4. Do NOT move the injured limb',
      '5. Call 108 for ambulance'
    ];
    hospitalGuidance = 'Orthopedic specialist hospital recommended';
  }
  // Default emergency
  else {
    immediateActions = [
      '1. Keep person calm and comfortable',
      '2. Monitor vital signs (breathing, pulse)',
      '3. Do NOT move unnecessarily',
      '4. Call 108 for emergency ambulance',
      '5. Inform ambulance of symptoms'
    ];
    hospitalGuidance = 'Nearest emergency department';
  }

  return {
    immediateActions,
    hospitalGuidance,
    nearestHospital: hospitals[0] ? {
      name: hospitals[0].name,
      distance: `${hospitals[0].distance.toFixed(1)} km`,
      specializations: hospitals[0].specializations,
      phone: hospitals[0].phone,
      eta: `${Math.ceil(hospitals[0].distance / 40)} minutes by ambulance`
    } : null,
    alternateHospitals: hospitals.slice(1, 3).map(h => ({
      name: h.name,
      distance: `${h.distance.toFixed(1)} km`,
      specializations: h.specializations
    }))
  };
}

/**
 * Notify emergency contacts with hospital information
 */
async function notifyContactsWithHospitals(situation, hospitals, emergencyContacts) {
  const results = { messages: [], calls: [] };
  const ctx = 'Emergency contact of the person in distress. They need immediate assistance.';

  if (!emergencyContacts || emergencyContacts.length === 0) {
    return results;
  }

  // Build hospital info for SMS
  const hospitalInfo = hospitals.length > 0 
    ? `\n\nNearest Hospital: ${hospitals[0].name} (${hospitals[0].distance.toFixed(1)}km away)\nPhone: ${hospitals[0].phone}`
    : '';

  const smsMessage = `EMERGENCY: ${situation}${hospitalInfo}\n\nCall 108 for ambulance immediately.`;

  // Notify all contacts in parallel
  const contactPromises = emergencyContacts.map(async (contact) => {
    const phoneNumber = contact.phone || contact.phoneNumber;
    const name = contact.name || 'Emergency Contact';

    if (!phoneNumber) {
      console.log(`⚠️ Skipping contact ${name} - no phone number`);
      return null;
    }

    const contactResult = { name, phone: phoneNumber, message: null, call: null };

    // Send SMS with hospital info
    try {
      console.log(`\n🚨 [Emergency] Sending SMS to ${name} (${phoneNumber})...`);
      contactResult.message = await sendSMS(phoneNumber, smsMessage, ctx, name);
      console.log(`✅ [Emergency] SMS sent to ${name} — SID: ${contactResult.message.messageSid}`);
    } catch (err) {
      console.error(`❌ [Emergency] SMS to ${name} failed:`, err.message);
      contactResult.message = { error: err.message };
    }

    // Place call with hospital info in context
    try {
      const callContext = `Emergency contact. Person needs help. Nearest hospital: ${hospitals[0]?.name || 'Emergency services'}. Call 108.`;
      console.log(`📞 [Emergency] Placing call to ${name} (${phoneNumber})...`);
      contactResult.call = await triggerCall(phoneNumber, situation, callContext);
      console.log(`✅ [Emergency] Call placed to ${name} — SID: ${contactResult.call.callSid}`);
    } catch (err) {
      console.error(`❌ [Emergency] Call to ${name} failed:`, err.message);
      contactResult.call = { error: err.message };
    }

    return contactResult;
  });

  const contactResults = await Promise.all(contactPromises);
  
  // Organize results
  contactResults.filter(r => r !== null).forEach(result => {
    if (result.message) results.messages.push(result.message);
    if (result.call) results.calls.push(result.call);
  });

  console.log(`\n✅ Emergency services triggered for ${contactResults.filter(r => r !== null).length} contacts`);
  
  return { ...results, contactResults: contactResults.filter(r => r !== null) };
}

/**
 * Format hospital recommendations for map display
 */
function formatHospitalsForMap(hospitals) {
  return hospitals.map(hospital => ({
    id: hospital._id,
    name: hospital.name,
    latitude: hospital.location.coordinates[1],
    longitude: hospital.location.coordinates[0],
    distance: hospital.distance,
    score: hospital.score,
    specializations: hospital.specializations,
    phone: hospital.phone,
    rating: hospital.rating,
    emergency: hospital.emergency,
    icu: hospital.icu,
    availableBeds: hospital.availableBeds,
    availableICUBeds: hospital.availableICUBeds,
    averageResponseTime: hospital.averageResponseTime
  }));
}

module.exports = {
  handleEmergencyWithHospitals,
  generateCourseOfAction,
  notifyContactsWithHospitals,
  formatHospitalsForMap
};
