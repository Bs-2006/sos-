import { getChatReply } from "./agent.js";
import { 
  isCriticalEmergency,
  extractPrimarySymptom,
  getRecommendedSpecialist,
  generateFollowUpQuestions,
  assessUrgency,
  generateHospitalRecommendation,
  getFirstAidGuidance,
  buildHealthAssessmentResponse,
  generateEmergencyGuidance,
  CONVERSATION_STAGES
} from "../services/HealthAssistantService.js";

/**
 * Health Assistant Chat Handler
 * Implements the 7-step conversation flow for symptom assessment
 */
export async function healthAssistantChat(req, res) {
  const { 
    message, 
    history = [], 
    userLocation = null,
    emergencyContacts = [],
    userId = null 
  } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    // Step 1: Check for critical emergency
    if (isCriticalEmergency(message)) {
      const emergencyGuidance = generateEmergencyGuidance();
      
      return res.json({
        success: true,
        reply: emergencyGuidance,
        stage: 'emergency',
        emergencyDetected: true,
        shouldTriggerSOS: true,
        conversationHistory: [
          ...history,
          { role: "user", content: message },
          { role: "assistant", content: emergencyGuidance }
        ]
      });
    }

    // Step 2: Extract primary symptom
    const primarySymptom = extractPrimarySymptom(message);
    
    if (!primarySymptom) {
      // No symptom detected, ask for clarification
      const clarificationPrompt = `You are LifeLink Health Assistant. The user mentioned a health concern but it's not clear what the main symptom is. Ask them to clarify their main symptom or complaint in a friendly, empathetic way. Keep it to 1-2 sentences.`;
      
      const reply = await getChatReply([
        { role: "system", content: clarificationPrompt },
        ...history.slice(-4),
        { role: "user", content: message }
      ], { maxTokens: 150, temperature: 0.4 });

      return res.json({
        success: true,
        reply,
        stage: 'symptom_clarification',
        conversationHistory: [
          ...history,
          { role: "user", content: message },
          { role: "assistant", content: reply }
        ]
      });
    }

    // Step 3: Assess urgency
    const urgency = assessUrgency(primarySymptom);

    // Step 4: Get recommended specialist
    const specialist = getRecommendedSpecialist(primarySymptom);

    // Step 5: Generate follow-up questions
    const followUpQuestions = generateFollowUpQuestions(primarySymptom);

    // Step 6: Check if we have enough symptom details
    const hasDetailedSymptomInfo = history.some(m => 
      m.content.toLowerCase().includes('severity') ||
      m.content.toLowerCase().includes('duration') ||
      m.content.toLowerCase().includes('started') ||
      m.content.toLowerCase().includes('fever') ||
      m.content.toLowerCase().includes('nausea') ||
      m.content.toLowerCase().includes('swelling')
    );

    let reply;
    let stage;
    let hospitalRecommendations = null;
    let firstAidGuidance = null;

    if (!hasDetailedSymptomInfo) {
      // First interaction: Ask clarifying questions
      reply = buildHealthAssessmentResponse(
        primarySymptom,
        urgency,
        specialist,
        followUpQuestions
      );
      stage = 'symptom_assessment';
    } else {
      // Second interaction: Provide recommendations
      const systemPrompt = `You are LifeLink Health Assistant. Based on the user's symptoms and answers, provide:
1. A brief assessment of their condition
2. Recommended specialist: ${specialist}
3. When to seek immediate care vs. schedule an appointment
4. Any relevant first aid guidance

Be empathetic, clear, and concise. Keep response under 300 words.`;

      reply = await getChatReply([
        { role: "system", content: systemPrompt },
        ...history.slice(-8),
        { role: "user", content: message }
      ], { maxTokens: 300, temperature: 0.4 });

      // Add specialist recommendation
      reply += `\n\n📋 Recommended Doctor Type: ${specialist}`;

      // Get hospital recommendations if location available
      if (userLocation) {
        try {
          const { getRecommendedHospitals } = await import('../services/HospitalRecommendationService.js');
          const hospitalData = await getRecommendedHospitals(primarySymptom, userLocation, 3);
          hospitalRecommendations = hospitalData.recommendations || [];
          
          if (hospitalRecommendations.length > 0) {
            reply += generateHospitalRecommendation(specialist, hospitalRecommendations);
          }
        } catch (error) {
          console.error('Error fetching hospital recommendations:', error);
        }
      }

      // Add first aid guidance if applicable
      firstAidGuidance = getFirstAidGuidance(primarySymptom);
      if (firstAidGuidance) {
        reply += `\n\n🏥 First Aid Guidance:\n`;
        firstAidGuidance.steps.forEach((step, i) => {
          reply += `${i + 1}. ${step}\n`;
        });
        if (firstAidGuidance.warning) {
          reply += `\n⚠️ ${firstAidGuidance.warning}`;
        }
      }

      // Add emergency support message
      reply += `\n\n💙 If your symptoms worsen, you can press the SOS button in LifeLink and we will immediately notify your emergency contacts and dispatch help.`;

      stage = 'recommendation';
    }

    // Step 7: Return comprehensive response
    res.json({
      success: true,
      reply,
      stage,
      symptom: primarySymptom,
      specialist,
      urgency,
      emergencyDetected: false,
      shouldTriggerSOS: urgency === 'critical',
      hospitalRecommendations,
      firstAidGuidance,
      conversationHistory: [
        ...history,
        { role: "user", content: message },
        { role: "assistant", content: reply }
      ]
    });

  } catch (error) {
    console.error('Health Assistant Chat Error:', error);
    res.status(500).json({ 
      error: 'Failed to process health assessment',
      details: error.message 
    });
  }
}

/**
 * Get symptom assessment for specific body part
 */
export async function getSymptomAssessment(req, res) {
  const { bodyPart, symptoms = [] } = req.body;

  if (!bodyPart) {
    return res.status(400).json({ error: "Body part not specified" });
  }

  try {
    const specialist = getRecommendedSpecialist(bodyPart);
    const followUpQuestions = generateFollowUpQuestions(bodyPart);
    const urgency = assessUrgency(bodyPart);

    res.json({
      success: true,
      bodyPart,
      specialist,
      followUpQuestions,
      urgency,
      firstAidGuidance: getFirstAidGuidance(bodyPart)
    });
  } catch (error) {
    console.error('Symptom Assessment Error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get first aid guidance for specific condition
 */
export async function getFirstAidGuidanceEndpoint(req, res) {
  const { condition } = req.body;

  if (!condition) {
    return res.status(400).json({ error: "Condition not specified" });
  }

  try {
    const guidance = getFirstAidGuidance(condition);

    if (!guidance) {
      return res.status(404).json({ 
        error: "No first aid guidance available for this condition" 
      });
    }

    res.json({
      success: true,
      condition,
      guidance
    });
  } catch (error) {
    console.error('First Aid Guidance Error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Assess emergency level
 */
export async function assessEmergencyLevel(req, res) {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message not provided" });
  }

  try {
    const isCritical = isCriticalEmergency(message);
    const symptom = extractPrimarySymptom(message);
    const urgency = assessUrgency(symptom || message);

    res.json({
      success: true,
      isCritical,
      urgency,
      symptom,
      shouldTriggerSOS: isCritical
    });
  } catch (error) {
    console.error('Emergency Assessment Error:', error);
    res.status(500).json({ error: error.message });
  }
}
