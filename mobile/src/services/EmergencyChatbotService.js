/**
 * Emergency Chatbot Service
 * Provides intelligent course of action based on patient symptoms via chat
 * Implements severity-based triage with hospital recommendations
 */

import { getCourseOfAction, getEmergencyNumbers, requiresImmediateHospitalization } from './CourseOfActionService';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Symptom keywords for detection
const SYMPTOM_KEYWORDS = {
  cardiac: ['chest pain', 'heart attack', 'palpitations', 'irregular heartbeat', 'shortness of breath', 'difficulty breathing', 'heart pain'],
  neurological: ['stroke', 'seizure', 'unconscious', 'dizziness', 'headache', 'confusion', 'loss of consciousness'],
  trauma: ['fracture', 'broken bone', 'accident', 'fall', 'injury', 'bleeding', 'wound', 'sprain', 'dislocation'],
  respiratory: ['choking', 'drowning', 'can\'t breathe', 'asthma', 'wheezing', 'coughing'],
  gastrointestinal: ['severe pain', 'abdominal pain', 'vomiting', 'poisoning', 'overdose'],
  general: ['help', 'emergency', 'urgent', 'severe', 'critical']
};

// Severity assessment keywords
const SEVERITY_KEYWORDS = {
  critical: ['severe', 'critical', 'can\'t breathe', 'unconscious', 'not breathing', 'chest pain', 'stroke', 'choking', 'bleeding heavily'],
  high: ['moderate', 'intense', 'severe pain', 'difficulty breathing', 'dizziness', 'confusion'],
  medium: ['mild', 'slight', 'some pain', 'discomfort'],
  low: ['minor', 'small', 'slight discomfort']
};

// Chatbot responses
const CHATBOT_RESPONSES = {
  greeting: [
    "Hello! I'm the LifeLink Emergency Assistant. I'm here to help you during this emergency. Can you describe what's happening?",
    "Welcome to LifeLink Emergency Support. Please tell me about your current situation and symptoms.",
    "Hi there! I'm ready to help. What emergency are you experiencing right now?"
  ],
  
  clarification: [
    "Can you tell me more about your symptoms?",
    "I want to make sure I understand correctly. Are you experiencing any other symptoms?",
    "Could you describe the severity of your pain or discomfort?",
    "How long have you been experiencing these symptoms?"
  ],

  severityAssessment: [
    "On a scale of 1-10, how severe is your pain or discomfort? (1=mild, 10=severe)",
    "How would you rate your condition? Is it mild, moderate, or severe?",
    "Is this pain/discomfort mild, moderate, or severe?",
    "How urgent do you feel this situation is?"
  ],

  lowSeverityResponse: [
    "I understand. Based on your symptoms, this appears to be a low-severity situation. Let me find nearby hospitals that can help you.",
    "Your symptoms suggest this is manageable. I'll recommend nearby hospitals with appropriate departments.",
    "This seems like a non-emergency situation. Let me locate nearby healthcare facilities for you."
  ],

  mediumSeverityResponse: [
    "I see. This is a moderate-severity situation. I'll find nearby hospitals that can provide appropriate care.",
    "Your symptoms indicate moderate severity. Let me recommend nearby hospitals with the right specializations.",
    "This requires medical attention. I'll help you find nearby hospitals."
  ],

  highSeverityResponse: [
    "This is a high-severity situation. I'm finding nearby hospitals and asking if you'd like me to call your emergency contacts.",
    "Your symptoms are serious. I'll locate nearby hospitals and can contact your emergency contacts if you'd like.",
    "This requires urgent medical attention. Let me find nearby hospitals and I can alert your emergency contacts."
  ],

  criticalResponse: [
    "This is a CRITICAL emergency! I'm immediately finding nearby hospitals and will contact your emergency contacts.",
    "Your symptoms indicate a life-threatening situation. I'm locating hospitals and alerting emergency contacts NOW.",
    "CRITICAL EMERGENCY! Finding nearest hospitals and contacting emergency services immediately."
  ],

  emergencyContactConfirmation: [
    "Would you like me to call your emergency contacts now?",
    "Should I contact your emergency contacts to inform them of your situation?",
    "Do you want me to call your emergency contacts?"
  ],

  confirmation: [
    "I've understood your situation. Here's what we need to do:",
    "Based on your symptoms, here's the recommended course of action:",
    "I've assessed your condition. Here's what I recommend:"
  ]
};

class EmergencyChatbotService {
  constructor() {
    this.conversationHistory = [];
    this.detectedSymptoms = [];
    this.severity = null;
    this.courseOfAction = null;
    this.conversationStage = 'initial'; // initial, symptoms_collected, severity_assessed, hospital_recommended, emergency_contact_confirmed
    this.userLocation = null;
    this.recommendedHospitals = [];
    this.askingSeverity = false;
    this.askingEmergencyContact = false;
  }

  /**
   * Initialize chatbot conversation
   */
  initializeConversation() {
    this.conversationHistory = [];
    this.detectedSymptoms = [];
    this.severity = null;
    this.courseOfAction = null;
    this.conversationStage = 'initial';
    this.askingSeverity = false;
    this.askingEmergencyContact = false;
    
    const greeting = this.getRandomResponse(CHATBOT_RESPONSES.greeting);
    this.conversationHistory.push({
      role: 'assistant',
      message: greeting,
      timestamp: new Date()
    });
    
    return greeting;
  }

  /**
   * Extract symptoms from user message
   */
  extractSymptoms(message) {
    const lowerMessage = message.toLowerCase();
    const symptoms = [];

    for (const [category, keywords] of Object.entries(SYMPTOM_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          symptoms.push(keyword);
        }
      }
    }

    return symptoms;
  }

  /**
   * Process user message and provide response
   */
  async processUserMessage(userMessage) {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        message: userMessage,
        timestamp: new Date()
      });

      let response = '';

      // Stage 1: Collect symptoms
      if (this.conversationStage === 'initial') {
        const newSymptoms = this.extractSymptoms(userMessage);
        
        if (newSymptoms.length === 0) {
          // No symptoms detected yet
          response = this.getRandomResponse(CHATBOT_RESPONSES.clarification);
        } else {
          // Symptoms detected - move to severity assessment
          this.detectedSymptoms = [...new Set([...this.detectedSymptoms, ...newSymptoms])];
          this.conversationStage = 'severity_assessment';
          this.askingSeverity = true;
          response = this.getRandomResponse(CHATBOT_RESPONSES.severityAssessment);
        }
      }
      // Stage 2: Assess severity
      else if (this.conversationStage === 'severity_assessment' && this.askingSeverity) {
        this.severity = this.assessSeverityFromResponse(userMessage);
        this.conversationStage = 'hospital_recommended';
        this.askingSeverity = false;

        // Get user location for hospital recommendations
        await this.getUserLocation();

        // Generate response based on severity
        response = await this.generateSeverityBasedResponse();
      }
      // Stage 3: Handle emergency contact confirmation
      else if (this.conversationStage === 'hospital_recommended' && this.askingEmergencyContact) {
        const wantsEmergencyCall = this.parseYesNoResponse(userMessage);
        
        if (wantsEmergencyCall) {
          this.conversationStage = 'emergency_contact_confirmed';
          response = "Perfect! I'm preparing to call your emergency contacts now.";
          // This will trigger the emergency call flow
        } else {
          response = "Understood. You can call them manually or I can help you find the nearest hospital. Would you like hospital directions?";
        }
      }
      // Continue conversation
      else {
        response = this.getRandomResponse(CHATBOT_RESPONSES.clarification);
      }

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        message: response,
        timestamp: new Date()
      });

      return {
        message: response,
        symptoms: this.detectedSymptoms,
        severity: this.severity,
        courseOfAction: this.courseOfAction,
        recommendedHospitals: this.recommendedHospitals,
        requiresEmergency: this.conversationStage === 'emergency_contact_confirmed' || (this.severity === 'critical'),
        conversationStage: this.conversationStage
      };
    } catch (error) {
      console.error('Error processing user message:', error);
      return {
        message: 'I encountered an error processing your message. Please try again or call 108 immediately.',
        error: error.message
      };
    }
  }

  /**
   * Assess severity from user response
   */
  assessSeverityFromResponse(response) {
    const lowerResponse = response.toLowerCase();
    
    // Check for critical indicators
    for (const keyword of SEVERITY_KEYWORDS.critical) {
      if (lowerResponse.includes(keyword)) {
        return 'critical';
      }
    }

    // Check for high severity
    if (lowerResponse.includes('9') || lowerResponse.includes('10') || lowerResponse.includes('severe') || lowerResponse.includes('high')) {
      return 'high';
    }

    // Check for medium severity
    if (lowerResponse.includes('5') || lowerResponse.includes('6') || lowerResponse.includes('7') || lowerResponse.includes('8') || lowerResponse.includes('moderate')) {
      return 'medium';
    }

    // Default to low
    return 'low';
  }

  /**
   * Parse yes/no response
   */
  parseYesNoResponse(response) {
    const lowerResponse = response.toLowerCase();
    return lowerResponse.includes('yes') || lowerResponse.includes('yeah') || lowerResponse.includes('ok') || lowerResponse.includes('sure') || lowerResponse.includes('please');
  }

  /**
   * Get user location
   */
  async getUserLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        this.userLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };
      }
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  }

  /**
   * Generate severity-based response with hospital recommendations
   */
  async generateSeverityBasedResponse() {
    let response = '';

    // Add severity-specific message
    if (this.severity === 'critical') {
      response += this.getRandomResponse(CHATBOT_RESPONSES.criticalResponse) + '\n\n';
    } else if (this.severity === 'high') {
      response += this.getRandomResponse(CHATBOT_RESPONSES.highSeverityResponse) + '\n\n';
    } else if (this.severity === 'medium') {
      response += this.getRandomResponse(CHATBOT_RESPONSES.mediumSeverityResponse) + '\n\n';
    } else {
      response += this.getRandomResponse(CHATBOT_RESPONSES.lowSeverityResponse) + '\n\n';
    }

    // Add hospital recommendations if location available
    if (this.userLocation) {
      response += await this.getHospitalRecommendationsText();
    }

    // For high and critical severity, ask about emergency contacts
    if (this.severity === 'high' || this.severity === 'critical') {
      response += '\n\n' + this.getRandomResponse(CHATBOT_RESPONSES.emergencyContactConfirmation);
      this.askingEmergencyContact = true;
    }

    return response;
  }

  /**
   * Get hospital recommendations as formatted text
   */
  async getHospitalRecommendationsText() {
    try {
      // Get auth token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');

      // Call backend API to get hospital recommendations
      const response = await fetch('http://localhost:3000/api/hospitals/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          situation: this.detectedSymptoms.join(', '),
          location: this.userLocation,
          severity: this.severity
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.recommendedHospitals = data.hospitals || [];

        let text = '🏥 NEARBY HOSPITALS:\n\n';
        data.hospitals.slice(0, 3).forEach((hospital, index) => {
          text += `${index + 1}. ${hospital.name}\n`;
          text += `   📍 ${hospital.distance.toFixed(1)} km away\n`;
          text += `   🏷️ ${hospital.specializations.join(', ')}\n`;
          text += `   ⭐ Rating: ${hospital.rating}/5\n\n`;
        });

        return text;
      }
    } catch (error) {
      console.error('Error getting hospital recommendations:', error);
    }

    return '🏥 Finding nearby hospitals...\n';
  }

  /**
   * Generate course of action response
   */
  async generateCourseOfActionResponse() {
    try {
      // Get course of action
      this.courseOfAction = getCourseOfAction(
        this.detectedSymptoms.join(', '),
        this.detectedSymptoms
      );

      this.severity = this.courseOfAction.severity;

      // Build response message
      let response = '';

      // Add severity indicator
      if (this.severity === 'critical') {
        response += this.getRandomResponse(CHATBOT_RESPONSES.critical) + '\n\n';
      } else if (this.severity === 'high') {
        response += this.getRandomResponse(CHATBOT_RESPONSES.urgent) + '\n\n';
      }

      // Add confirmation
      response += this.getRandomResponse(CHATBOT_RESPONSES.confirmation) + '\n\n';

      // Add course of action
      response += this.formatCourseOfAction(this.courseOfAction);

      // Add emergency numbers if critical
      if (this.severity === 'critical' || this.severity === 'high') {
        response += '\n\n' + this.formatEmergencyNumbers();
      }

      return response;
    } catch (error) {
      console.error('Error generating course of action:', error);
      return 'Based on your symptoms, please call 108 (Ambulance) immediately for emergency assistance.';
    }
  }

  /**
   * Format course of action for display
   */
  formatCourseOfAction(courseOfAction) {
    let formatted = '';

    // Add summary
    formatted += `📋 Summary: ${courseOfAction.summary}\n\n`;

    // Add immediate actions
    formatted += '🚨 IMMEDIATE ACTIONS:\n';
    const immediateActions = courseOfAction.courseOfAction.filter(a => a.priority === 'IMMEDIATE');
    immediateActions.forEach((action, index) => {
      formatted += `${index + 1}. ${action.action}\n`;
      formatted += `   ${action.details}\n\n`;
    });

    // Add urgent actions
    if (courseOfAction.courseOfAction.some(a => a.priority === 'URGENT')) {
      formatted += '\n⚠️ URGENT ACTIONS:\n';
      const urgentActions = courseOfAction.courseOfAction.filter(a => a.priority === 'URGENT');
      urgentActions.forEach((action, index) => {
        formatted += `${index + 1}. ${action.action}\n`;
        formatted += `   ${action.details}\n\n`;
      });
    }

    // Add next steps
    if (courseOfAction.courseOfAction.some(a => a.priority === 'NEXT')) {
      formatted += '\n➡️ NEXT STEPS:\n';
      const nextActions = courseOfAction.courseOfAction.filter(a => a.priority === 'NEXT');
      nextActions.forEach((action, index) => {
        formatted += `${index + 1}. ${action.action}\n`;
        formatted += `   ${action.details}\n\n`;
      });
    }

    // Add hospital specializations
    if (courseOfAction.specializations.length > 0) {
      formatted += `\n🏥 Required Hospital Specializations:\n`;
      formatted += courseOfAction.specializations.join(', ') + '\n';
    }

    return formatted;
  }

  /**
   * Format emergency numbers
   */
  formatEmergencyNumbers() {
    const numbers = getEmergencyNumbers();
    let formatted = '📞 EMERGENCY NUMBERS:\n';
    formatted += `🚑 Ambulance: ${numbers.ambulance}\n`;
    formatted += `🚔 Police: ${numbers.police}\n`;
    formatted += `🔥 Fire: ${numbers.fire}\n`;
    formatted += `👩 Women Helpline: ${numbers.womenHelpline}\n`;
    formatted += `☠️ Poison Control: ${numbers.poisonControl}\n`;
    return formatted;
  }

  /**
   * Get random response from array
   */
  getRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Get conversation history
   */
  getConversationHistory() {
    return this.conversationHistory;
  }

  /**
   * Get current assessment
   */
  getCurrentAssessment() {
    return {
      symptoms: this.detectedSymptoms,
      severity: this.severity,
      courseOfAction: this.courseOfAction,
      requiresEmergency: requiresImmediateHospitalization(this.severity)
    };
  }

  /**
   * Reset conversation
   */
  resetConversation() {
    this.conversationHistory = [];
    this.detectedSymptoms = [];
    this.severity = null;
    this.courseOfAction = null;
  }

  /**
   * Get follow-up question based on symptoms
   */
  getFollowUpQuestion() {
    if (this.detectedSymptoms.length === 0) {
      return "Can you describe what's happening right now?";
    }

    const questions = [
      "How long have you been experiencing these symptoms?",
      "Is the pain getting worse or staying the same?",
      "Are you having any difficulty breathing?",
      "Have you lost consciousness at any point?",
      "Are you experiencing any bleeding?",
      "Do you have any allergies we should know about?",
      "Are you taking any medications?",
      "Have you experienced this before?",
      "Is anyone with you right now?",
      "Can you move all your limbs?"
    ];

    return questions[Math.floor(Math.random() * questions.length)];
  }

  /**
   * Provide first aid guidance for specific symptom
   */
  getFirstAidGuidance(symptom) {
    const guidance = {
      'chest pain': [
        '1. Sit or lie down in a comfortable position',
        '2. Loosen any tight clothing',
        '3. Chew aspirin if available and not allergic',
        '4. Stay calm and breathe slowly',
        '5. Do not exert yourself',
        '6. Call 108 immediately'
      ],
      'choking': [
        '1. Encourage coughing if able',
        '2. Perform Heimlich maneuver:',
        '   - Stand behind the person',
        '   - Place fist above navel',
        '   - Thrust upward quickly',
        '3. Repeat if necessary',
        '4. Call 108 if unsuccessful'
      ],
      'severe bleeding': [
        '1. Apply direct pressure with clean cloth',
        '2. Do not remove embedded objects',
        '3. Elevate injured area above heart',
        '4. Apply pressure to artery if needed',
        '5. Use tourniquet if necessary',
        '6. Call 108 immediately'
      ],
      'unconscious': [
        '1. Check responsiveness',
        '2. Call 108 immediately',
        '3. Check airway and breathing',
        '4. If not breathing, start CPR',
        '5. Place in recovery position if breathing',
        '6. Keep warm and monitor'
      ],
      'fracture': [
        '1. Immobilize the injured area',
        '2. Apply ice if available',
        '3. Elevate if possible',
        '4. Do not move the injured area',
        '5. Remove jewelry and tight clothing',
        '6. Call 108'
      ]
    };

    const lowerSymptom = symptom.toLowerCase();
    for (const [key, steps] of Object.entries(guidance)) {
      if (lowerSymptom.includes(key)) {
        return steps.join('\n');
      }
    }

    return 'Please call 108 for emergency assistance.';
  }

  /**
   * Check if emergency services should be called
   */
  shouldCallEmergency() {
    return this.severity === 'critical' || this.severity === 'high';
  }

  /**
   * Get hospital recommendation summary
   */
  getHospitalRecommendationSummary() {
    if (!this.courseOfAction) {
      return null;
    }

    return {
      specializations: this.courseOfAction.specializations,
      severity: this.severity,
      urgency: this.severity === 'critical' ? 'IMMEDIATE' : this.severity === 'high' ? 'URGENT' : 'SOON'
    };
  }
}

// Export singleton instance
export default new EmergencyChatbotService();
