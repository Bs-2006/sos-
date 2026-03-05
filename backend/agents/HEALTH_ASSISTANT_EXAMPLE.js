/**
 * LifeLink Health Assistant - Complete Example Usage
 * This file demonstrates how to use the Health Assistant API
 */

// ============================================================================
// EXAMPLE 1: Emergency Detection
// ============================================================================

async function exampleEmergencyDetection() {
  const userMessage = "I have severe chest pain and can't breathe";
  
  const response = await fetch('http://localhost:3000/api/agents/health-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: userMessage,
      history: [],
      userLocation: {
        latitude: 17.3850,
        longitude: 78.4867
      }
    })
  });

  const data = await response.json();
  
  console.log('Emergency Detection Result:');
  console.log('- Emergency Detected:', data.emergencyDetected);
  console.log('- Should Trigger SOS:', data.shouldTriggerSOS);
  console.log('- Urgency Level:', data.urgency);
  console.log('- Response:', data.reply);
  
  // Expected output:
  // Emergency Detected: true
  // Should Trigger SOS: true
  // Urgency Level: critical
  // Response: 🚨 This could be a medical emergency...
}

// ============================================================================
// EXAMPLE 2: Symptom Assessment Flow
// ============================================================================

async function exampleSymptomAssessmentFlow() {
  const conversationHistory = [];
  
  // Step 1: User mentions symptom
  console.log('\n=== STEP 1: User mentions symptom ===');
  const userMessage1 = "I have a headache";
  
  let response = await fetch('http://localhost:3000/api/agents/health-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: userMessage1,
      history: conversationHistory
    })
  });

  let data = await response.json();
  conversationHistory.push({ role: 'user', content: userMessage1 });
  conversationHistory.push({ role: 'assistant', content: data.reply });
  
  console.log('Assistant:', data.reply);
  console.log('Stage:', data.stage);
  console.log('Specialist:', data.specialist);
  
  // Step 2: User provides more details
  console.log('\n=== STEP 2: User provides details ===');
  const userMessage2 = "The pain is sharp and started suddenly";
  
  response = await fetch('http://localhost:3000/api/agents/health-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: userMessage2,
      history: conversationHistory,
      userLocation: {
        latitude: 17.3850,
        longitude: 78.4867
      }
    })
  });

  data = await response.json();
  conversationHistory.push({ role: 'user', content: userMessage2 });
  conversationHistory.push({ role: 'assistant', content: data.reply });
  
  console.log('Assistant:', data.reply);
  console.log('Stage:', data.stage);
  console.log('Hospitals Found:', data.hospitalRecommendations?.length || 0);
}

// ============================================================================
// EXAMPLE 3: Hospital Recommendations
// ============================================================================

async function exampleHospitalRecommendations() {
  const response = await fetch('http://localhost:3000/api/agents/health-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "I have severe stomach pain and nausea",
      history: [
        { role: 'user', content: 'I have stomach pain' },
        { role: 'assistant', content: 'I understand...' }
      ],
      userLocation: {
        latitude: 17.3850,
        longitude: 78.4867
      }
    })
  });

  const data = await response.json();
  
  console.log('\n=== Hospital Recommendations ===');
  console.log('Recommended Specialist:', data.specialist);
  console.log('Urgency Level:', data.urgency);
  
  if (data.hospitalRecommendations?.length > 0) {
    console.log('\nNearby Hospitals:');
    data.hospitalRecommendations.forEach((hospital, index) => {
      console.log(`\n${index + 1}. ${hospital.name}`);
      console.log(`   Distance: ${hospital.distance.toFixed(1)} km`);
      console.log(`   Rating: ${hospital.rating}/5`);
      console.log(`   Specializations: ${hospital.specializations?.join(', ')}`);
      console.log(`   Phone: ${hospital.phone}`);
    });
  }
}

// ============================================================================
// EXAMPLE 4: First Aid Guidance
// ============================================================================

async function exampleFirstAidGuidance() {
  const response = await fetch('http://localhost:3000/api/agents/health-assistant/first-aid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      condition: 'minor burns'
    })
  });

  const data = await response.json();
  
  console.log('\n=== First Aid Guidance ===');
  console.log('Condition:', data.condition);
  console.log('\nSteps:');
  data.guidance.steps.forEach((step, index) => {
    console.log(`${index + 1}. ${step}`);
  });
  console.log('\nWarning:', data.guidance.warning);
}

// ============================================================================
// EXAMPLE 5: Symptom Assessment Endpoint
// ============================================================================

async function exampleSymptomAssessmentEndpoint() {
  const response = await fetch(
    'http://localhost:3000/api/agents/health-assistant/symptom-assessment',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bodyPart: 'chest',
        symptoms: ['pain', 'shortness of breath']
      })
    }
  );

  const data = await response.json();
  
  console.log('\n=== Symptom Assessment ===');
  console.log('Body Part:', data.bodyPart);
  console.log('Specialist:', data.specialist);
  console.log('Urgency:', data.urgency);
  console.log('\nFollow-up Questions:');
  data.followUpQuestions.forEach((q, i) => {
    console.log(`${i + 1}. ${q}`);
  });
}

// ============================================================================
// EXAMPLE 6: Emergency Assessment
// ============================================================================

async function exampleEmergencyAssessment() {
  const testCases = [
    "I have severe chest pain",
    "I have a mild headache",
    "I can't breathe",
    "I have a fever"
  ];

  console.log('\n=== Emergency Assessment ===');
  
  for (const message of testCases) {
    const response = await fetch(
      'http://localhost:3000/api/agents/health-assistant/emergency-assessment',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      }
    );

    const data = await response.json();
    console.log(`\nMessage: "${message}"`);
    console.log(`- Is Critical: ${data.isCritical}`);
    console.log(`- Urgency: ${data.urgency}`);
    console.log(`- Should Trigger SOS: ${data.shouldTriggerSOS}`);
  }
}

// ============================================================================
// EXAMPLE 7: Assessment History
// ============================================================================

async function exampleAssessmentHistory() {
  const token = 'your_jwt_token_here';
  
  // Get all assessments
  const response = await fetch('http://localhost:3000/api/health-assessments', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  
  console.log('\n=== Assessment History ===');
  console.log('Total Assessments:', data.pagination.total);
  
  data.assessments.forEach((assessment, index) => {
    console.log(`\n${index + 1}. ${assessment.primarySymptom}`);
    console.log(`   Urgency: ${assessment.urgencyLevel}`);
    console.log(`   Specialist: ${assessment.recommendedSpecialist}`);
    console.log(`   Date: ${new Date(assessment.createdAt).toLocaleDateString()}`);
  });
}

// ============================================================================
// EXAMPLE 8: Create Assessment Record
// ============================================================================

async function exampleCreateAssessment() {
  const token = 'your_jwt_token_here';
  
  const response = await fetch('http://localhost:3000/api/health-assessments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      primarySymptom: 'chest pain',
      symptomDetails: {
        location: 'center of chest',
        severity: 8,
        duration: '15 minutes',
        onset: 'sudden',
        associatedSymptoms: ['shortness of breath', 'sweating'],
        frequency: 'constant'
      },
      urgencyLevel: 'critical',
      recommendedSpecialist: 'Cardiologist',
      emergencyDetected: true,
      sosTriggered: true,
      userLocation: {
        latitude: 17.3850,
        longitude: 78.4867
      }
    })
  });

  const data = await response.json();
  
  console.log('\n=== Assessment Created ===');
  console.log('Assessment ID:', data.assessmentId);
  console.log('Status:', data.message);
}

// ============================================================================
// EXAMPLE 9: Get Assessment Statistics
// ============================================================================

async function exampleAssessmentStatistics() {
  const token = 'your_jwt_token_here';
  
  const response = await fetch(
    'http://localhost:3000/api/health-assessments/stats/summary',
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await response.json();
  
  console.log('\n=== Assessment Statistics ===');
  console.log('Total Assessments:', data.stats.totalAssessments);
  console.log('Emergencies:', data.stats.emergencies);
  console.log('Critical Cases:', data.stats.criticalCases);
  console.log('High Urgency:', data.stats.highUrgency);
  console.log('SOS Triggered:', data.stats.sosTriggered);
  
  console.log('\nUrgency Breakdown:');
  data.urgencyBreakdown.forEach(item => {
    console.log(`- ${item._id}: ${item.count}`);
  });
  
  console.log('\nTop Symptoms:');
  data.topSymptoms.forEach((item, index) => {
    console.log(`${index + 1}. ${item._id}: ${item.count} times`);
  });
}

// ============================================================================
// EXAMPLE 10: Complete Conversation Flow
// ============================================================================

async function exampleCompleteConversationFlow() {
  console.log('\n=== COMPLETE CONVERSATION FLOW ===\n');
  
  const conversationHistory = [];
  const userLocation = {
    latitude: 17.3850,
    longitude: 78.4867
  };

  // Message 1: User describes symptom
  console.log('USER: I have a severe headache');
  let response = await fetch('http://localhost:3000/api/agents/health-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'I have a severe headache',
      history: conversationHistory,
      userLocation
    })
  });

  let data = await response.json();
  conversationHistory.push({ role: 'user', content: 'I have a severe headache' });
  conversationHistory.push({ role: 'assistant', content: data.reply });
  
  console.log('ASSISTANT:', data.reply);
  console.log('STAGE:', data.stage);
  console.log('---\n');

  // Message 2: User provides more details
  console.log('USER: The pain is sharp and started suddenly, and I feel dizzy');
  response = await fetch('http://localhost:3000/api/agents/health-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'The pain is sharp and started suddenly, and I feel dizzy',
      history: conversationHistory,
      userLocation
    })
  });

  data = await response.json();
  conversationHistory.push({ role: 'user', content: 'The pain is sharp and started suddenly, and I feel dizzy' });
  conversationHistory.push({ role: 'assistant', content: data.reply });
  
  console.log('ASSISTANT:', data.reply);
  console.log('STAGE:', data.stage);
  console.log('SPECIALIST:', data.specialist);
  console.log('URGENCY:', data.urgency);
  
  if (data.hospitalRecommendations?.length > 0) {
    console.log('\nRECOMMENDED HOSPITALS:');
    data.hospitalRecommendations.slice(0, 2).forEach((h, i) => {
      console.log(`${i + 1}. ${h.name} (${h.distance.toFixed(1)} km away)`);
    });
  }
}

// ============================================================================
// RUN EXAMPLES
// ============================================================================

async function runAllExamples() {
  try {
    await exampleEmergencyDetection();
    await exampleSymptomAssessmentFlow();
    await exampleHospitalRecommendations();
    await exampleFirstAidGuidance();
    await exampleSymptomAssessmentEndpoint();
    await exampleEmergencyAssessment();
    // await exampleAssessmentHistory(); // Requires valid token
    // await exampleCreateAssessment(); // Requires valid token
    // await exampleAssessmentStatistics(); // Requires valid token
    await exampleCompleteConversationFlow();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export for use in other files
module.exports = {
  exampleEmergencyDetection,
  exampleSymptomAssessmentFlow,
  exampleHospitalRecommendations,
  exampleFirstAidGuidance,
  exampleSymptomAssessmentEndpoint,
  exampleEmergencyAssessment,
  exampleAssessmentHistory,
  exampleCreateAssessment,
  exampleAssessmentStatistics,
  exampleCompleteConversationFlow,
  runAllExamples
};

// Uncomment to run examples
// runAllExamples();
