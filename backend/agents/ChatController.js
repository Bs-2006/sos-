import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { getChatReply } from "./agent.js";
import { triggerCall } from "./CallingController.js";
import { sendSMS } from "./MessagingController.js";
import { handleEmergencyWithHospitals, generateCourseOfAction } from "../services/EmergencyResponseService.js";

// ── Emergency Config ─────────────────────────────────────────────────────────
// Fallback number used by the AI chat keyword-trigger (no userId available here).
// For explicit SOS with user contacts use POST /api/sos instead.
const EMERGENCY_CONTACT = "+917330873455";

const EMERGENCY_KEYWORDS = [
  // English
  "injured", "hurt", "bleeding", "accident", "crash", "fell", "fallen",
  "help", "need help", "emergency", "attack", "heart attack", "unconscious",
  "not breathing", "choking", "drowning", "stroke", "seizure", "snake bite",
  "harassed", "stalked", "unsafe", "danger", "threatened", "assaulted",
  "fire", "burning", "trapped", "severe pain", "dying", "fainted",
  "i am hurt", "i got hurt", "i need help", "please help", "save me",
  "cannot breathe", "can't breathe", "chest pain",
  // Telugu
  "సహాయం", "ప్రమాదం", "గాయపడ్డాను",
  // Hindi
  "help karo", "bachao", "madad", "chot lagi",
  // Tamil
  "உதவி", "காயம்", "ஆபத்து",
];

const LOW_MEDIUM_PAIN_KEYWORDS = [
  // English - low/medium pain indicators
  "pain", "ache", "hurt", "sore", "discomfort", "mild pain", "moderate pain",
  "headache", "backache", "stomach ache", "cold", "cough", "fever", "flu",
  "nausea", "dizziness", "tired", "fatigue", "weakness", "joint pain",
  "muscle pain", "cramp", "sprain", "bruise", "minor injury",
  // Telugu
  "నొప్పి", "బాధ", "చేదు",
  // Hindi
  "dard", "takleef", "bukhar",
  // Tamil
  "வலி", "நோய்", "காய்ச்சல்",
];

function isEmergency(message) {
  const lower = message.toLowerCase();
  return EMERGENCY_KEYWORDS.some(kw => lower.includes(kw));
}

function isLowMediumPain(message) {
  const lower = message.toLowerCase();
  return LOW_MEDIUM_PAIN_KEYWORDS.some(kw => lower.includes(kw));
}

function buildSituation(message, history) {
  const userMessages = [
    ...history.filter(m => m.role === "user").map(m => m.content),
    message,
  ].slice(-4).join(" | ");
  return userMessages.length > 300 ? userMessages.slice(0, 300) + "..." : userMessages;
}

async function triggerEmergencyServices(situation) {
  const results = { message: null, call: null };
  const ctx = "Emergency contact of the person in distress. They need immediate assistance.";

  try {
    console.log(`\n🚨 [Emergency] Sending SMS to ${EMERGENCY_CONTACT}...`);
    results.message = await sendSMS(EMERGENCY_CONTACT, situation, ctx, "Emergency Contact");
    console.log(`✅ [Emergency] SMS sent — SID: ${results.message.messageSid}`);
  } catch (err) {
    console.error("❌ [Emergency] SMS failed:", err.message);
    results.message = { error: err.message };
  }

  try {
    console.log(`📞 [Emergency] Placing call to ${EMERGENCY_CONTACT}...`);
    results.call = await triggerCall(EMERGENCY_CONTACT, situation, ctx);
    console.log(`✅ [Emergency] Call placed — SID: ${results.call.callSid}`);
  } catch (err) {
    console.error("❌ [Emergency] Call failed:", err.message);
    results.call = { error: err.message };
  }

  return results;
}

async function triggerEmergencyServicesForContacts(situation, emergencyContacts) {
  const results = { messages: [], calls: [] };
  const ctx = "Emergency contact of the person in distress. They need immediate assistance.";

  // If no contacts provided, use fallback
  if (!emergencyContacts || emergencyContacts.length === 0) {
    console.log('⚠️ No emergency contacts provided, using fallback');
    return triggerEmergencyServices(situation);
  }

  // Process all contacts in parallel
  const contactPromises = emergencyContacts.map(async (contact) => {
    const phoneNumber = contact.phone || contact.phoneNumber;
    const name = contact.name || "Emergency Contact";
    
    if (!phoneNumber) {
      console.log(`⚠️ Skipping contact ${name} - no phone number`);
      return null;
    }

    const contactResults = { name, phone: phoneNumber, message: null, call: null };

    // Send SMS
    try {
      console.log(`\n🚨 [Emergency] Sending SMS to ${name} (${phoneNumber})...`);
      contactResults.message = await sendSMS(phoneNumber, situation, ctx, name);
      console.log(`✅ [Emergency] SMS sent to ${name} — SID: ${contactResults.message.messageSid}`);
    } catch (err) {
      console.error(`❌ [Emergency] SMS to ${name} failed:`, err.message);
      contactResults.message = { error: err.message };
    }

    // Place call
    try {
      console.log(`📞 [Emergency] Placing call to ${name} (${phoneNumber})...`);
      contactResults.call = await triggerCall(phoneNumber, situation, ctx);
      console.log(`✅ [Emergency] Call placed to ${name} — SID: ${contactResults.call.callSid}`);
    } catch (err) {
      console.error(`❌ [Emergency] Call to ${name} failed:`, err.message);
      contactResults.call = { error: err.message };
    }

    return contactResults;
  });

  const contactResults = await Promise.all(contactPromises);
  
  // Filter out null results and organize
  contactResults.filter(r => r !== null).forEach(result => {
    if (result.message) results.messages.push(result.message);
    if (result.call) results.calls.push(result.call);
  });

  console.log(`\n✅ Emergency services triggered for ${contactResults.filter(r => r !== null).length} contacts`);
  
  return { ...results, contactResults: contactResults.filter(r => r !== null) };
}

// ── Language Detection ───────────────────────────────────────────────────────
export function detectLanguage(text) {
  if (/[\u0C00-\u0C7F]/.test(text)) return { code: "te-IN", name: "Telugu" };
  if (/[\u0B80-\u0BFF]/.test(text)) return { code: "ta-IN", name: "Tamil" };
  if (/[\u0C80-\u0CFF]/.test(text)) return { code: "kn-IN", name: "Kannada" };
  if (/[\u0900-\u097F]/.test(text)) return { code: "hi-IN", name: "Hindi" };
  return { code: "en-IN", name: "English" };
}

// ── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are LifeLink — a calm, authoritative AI emergency response agent for South India.
You assist with:
1. ROAD ACCIDENTS — first aid guidance, ambulance coordination, bystander help
2. HEALTH CRISES — heart attack, stroke, seizure, choking, drowning, snake bite
3. WOMEN'S SAFETY — harassment, assault, stalking, unsafe situations
4. LOW/MEDIUM PAIN CASES — symptom assessment and hospital recommendations

CRITICAL RULES:
- Always respond in the SAME LANGUAGE the user speaks (Telugu, Tamil, Kannada, Hindi, or English)
- Be CALM, CLEAR, AUTHORITATIVE — you are their lifeline right now
- Give step-by-step instructions, most critical action FIRST
- Always include relevant emergency numbers when appropriate:
  * Ambulance / Medical: 108
  * Police: 100
  * Women's Helpline: 1091
  * Fire: 101
  * National Emergency: 112
- Keep responses SHORT (2-4 sentences) — this is a real-time voice interface
- If someone is in immediate danger, begin with the single most critical action

FOR LOW/MEDIUM PAIN CASES:
- Ask 2-3 clarifying questions about symptoms (location, duration, severity, associated symptoms)
- Be empathetic and reassuring
- After understanding symptoms, recommend nearby hospitals with relevant specializations
- Suggest when to seek immediate care vs. when to schedule an appointment

- For Telugu: respond in fluent Telugu script
- You have a warm, trustworthy South Indian personality — never robotic, never panicked`;

// ── System Prompt for Symptom Assessment ────────────────────────────────────
const SYMPTOM_ASSESSMENT_PROMPT = `You are a medical triage assistant. Based on the user's pain description, ask 2-3 specific follow-up questions to better understand their condition.

Focus on:
1. Location of pain (where exactly)
2. Duration (how long has it been)
3. Severity (on scale of 1-10, or mild/moderate/severe)
4. Associated symptoms (fever, nausea, swelling, etc.)

Keep questions concise and in the same language as the user. Be empathetic and reassuring.`;

// ── POST /api/chat ───────────────────────────────────────────────────────────
// Performance monitoring
const performanceMetrics = {
  totalRequests: 0,
  avgResponseTime: 0,
  slowRequests: [],
  lastReset: Date.now()
};

function recordMetric(duration, type) {
  performanceMetrics.totalRequests++;
  performanceMetrics.avgResponseTime = 
    (performanceMetrics.avgResponseTime * (performanceMetrics.totalRequests - 1) + duration) / 
    performanceMetrics.totalRequests;
  
  if (duration > 5000) {
    performanceMetrics.slowRequests.push({
      type,
      duration,
      timestamp: new Date().toISOString()
    });
    if (performanceMetrics.slowRequests.length > 100) {
      performanceMetrics.slowRequests.shift();
    }
  }
  
  if (performanceMetrics.totalRequests % 50 === 0) {
    console.log(`📊 Performance: Avg ${performanceMetrics.avgResponseTime.toFixed(0)}ms | Slow: ${performanceMetrics.slowRequests.length}`);
  }
}

// Cache for hospital recommendations (TTL: 5 minutes)
const hospitalCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCacheKey(location) {
  return `${location.latitude},${location.longitude}`;
}

function getCachedHospitals(location) {
  const key = getCacheKey(location);
  const cached = hospitalCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedHospitals(location, data) {
  const key = getCacheKey(location);
  hospitalCache.set(key, { data, timestamp: Date.now() });
}

export async function chat(req, res) {
    
  const startTime = Date.now();
  const { message, history = [], emergencyAlreadyTriggered = false, emergencyContacts = [], userLocation = null } = req.body;
  if (!message) return res.status(400).json({ error: "No message provided" });

  const detectedInputLang = detectLanguage(message);
  const emergencyDetected = !emergencyAlreadyTriggered && isEmergency(message);
  const lowMediumPainDetected = !emergencyDetected && isLowMediumPain(message);

  try {
    let reply;
    let emergencyActions = null;
    let courseOfAction = null;
    let hospitalRecommendations = null;
    let symptomAssessmentNeeded = false;

    // Optimize history slicing - do it once
    const recentHistory = history.slice(-8);
    const shortHistory = history.slice(-4);
    let situationSummary = null;
    const getSituationSummary = () => {
      if (!situationSummary) {
        situationSummary = buildSituation(message, history);
      }
      return situationSummary;
    };

    // Handle low/medium pain cases
    if (lowMediumPainDetected) {
      // Check if we already have symptom details in history
      const hasSymptomDetails = history.some(m => 
        m.content.toLowerCase().includes('location') || 
        m.content.toLowerCase().includes('duration') ||
        m.content.toLowerCase().includes('fever') ||
        m.content.toLowerCase().includes('nausea')
      );

      if (!hasSymptomDetails) {
        // First response: ask for symptom details
        const messages = [
          { role: "system", content: SYMPTOM_ASSESSMENT_PROMPT },
          ...shortHistory,
          { role: "user", content: message },
        ];
        reply = await getChatReply(messages, { maxTokens: 200, temperature: 0.4 });
        symptomAssessmentNeeded = true;
      } else {
        // Second response: provide hospital recommendations
        const messages = [
          { role: "system", content: SYSTEM_PROMPT },
          ...recentHistory,
          { role: "user", content: message },
        ];
        
        // Get AI reply and hospital recommendations in parallel
        const [aiReply, hospitals] = await Promise.all([
          getChatReply(messages),
          userLocation ? (async () => {
            // Check cache first
            let cached = getCachedHospitals(userLocation);
            if (cached) return cached;
            
            const situation = getSituationSummary();
            const { getRecommendedHospitals } = await import('../services/HospitalRecommendationService.js');
            const hospitalData = await getRecommendedHospitals(situation, userLocation, 5);
            const recommendations = hospitalData.recommendations || [];
            setCachedHospitals(userLocation, recommendations);
            return recommendations;
          })() : Promise.resolve([])
        ]);
        
        reply = aiReply;
        hospitalRecommendations = hospitals;
        
        // Append hospital info to reply
        if (hospitalRecommendations.length > 0) {
          const topHospital = hospitalRecommendations[0];
          reply += `\n\n📍 Recommended Hospital: ${topHospital.name} (${topHospital.distance} km away)\nPhone: ${topHospital.phone}\nSpecializations: ${topHospital.specializations.join(', ')}`;
        }
      }
    } else {
      // Handle emergency cases
      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...recentHistory,
        { role: "user", content: message },
      ];

      // Fire AI reply and emergency services in parallel
      [reply, emergencyActions, courseOfAction] = await Promise.all([
        getChatReply(messages),
        emergencyDetected && userLocation
          ? handleEmergencyWithHospitals(getSituationSummary(), userLocation, emergencyContacts)
          : emergencyDetected
          ? triggerEmergencyServicesForContacts(getSituationSummary(), emergencyContacts)
          : Promise.resolve(null),
        emergencyDetected && userLocation
          ? generateCourseOfAction(getSituationSummary(), [])
          : Promise.resolve(null)
      ]);

      if (emergencyDetected) {
        console.log(`\n🆘 Emergency triggered for: "${message.slice(0, 60)}"\n`);
      }
    }

    const duration = Date.now() - startTime;
    recordMetric(duration, emergencyDetected ? 'emergency' : lowMediumPainDetected ? 'pain' : 'general');

    res.json({
      reply,
      detectedInputLang,
      replyLang: detectedInputLang,
      emergencyTriggered: emergencyDetected,
      lowMediumPainDetected,
      symptomAssessmentNeeded,
      emergencyActions,
      courseOfAction: courseOfAction || null,
      hospitalRecommendations: hospitalRecommendations || emergencyActions?.hospitalRecommendations || null,
      responseTime: duration
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    recordMetric(duration, 'error');
    
    console.error("Chat error:", err.message);
    res.status(500).json({
      error: "Agent temporarily unavailable.",
      fallback: "Please call 112 for immediate emergency assistance.",
      responseTime: duration
    });
  }
}

// ── POST /api/speak ──────────────────────────────────────────────────────────
export async function speak(req, res) {
  const { text, lang } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });

  const voiceMap = {
    "te-IN": "te-IN-ShrutiNeural",
    "ta-IN": "ta-IN-PallaviNeural",
    "kn-IN": "kn-IN-SapnaNeural",
    "hi-IN": "hi-IN-SwaraNeural",
    "en-IN": "en-IN-NeerjaNeural",
  };

  const voiceName = voiceMap[lang] || "en-IN-NeerjaNeural";

  try {
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY,
      process.env.AZURE_SPEECH_REGION
    );
    speechConfig.speechSynthesisVoiceName = voiceName;
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

    synthesizer.speakTextAsync(
      text,
      (result) => {
        synthesizer.close();
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          const buf = Buffer.from(result.audioData);
          res.set("Content-Type", "audio/mpeg");
          res.set("Content-Length", buf.length);
          res.send(buf);
        } else {
          console.error("TTS failed:", result.errorDetails);
          res.status(500).json({ error: "Speech synthesis failed" });
        }
      },
      (err) => {
        synthesizer.close();
        console.error("TTS exception:", err);
        res.status(500).json({ error: "Speech service error" });
      }
    );
  } catch (err) {
    console.error("Speak error:", err);
    res.status(500).json({ error: "Speech service unavailable" });
  }
}

// ── POST /api/voice-emergency ────────────────────────────────────────────────
export async function voiceEmergency(req, res) {
  const { audio, userName, location, contacts } = req.body;
  
  if (!audio) return res.status(400).json({ error: "No audio provided" });
  if (!contacts || contacts.length === 0) {
    return res.status(400).json({ error: "No emergency contacts provided" });
  }

  try {
    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audio, 'base64');
    
    // Use Azure Speech-to-Text
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY,
      process.env.AZURE_SPEECH_REGION
    );
    speechConfig.speechRecognitionLanguage = "en-IN";
    
    // Create audio config from buffer
    const pushStream = sdk.AudioInputStream.createPushStream();
    pushStream.write(audioBuffer);
    pushStream.close();
    
    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    
    // Recognize speech
    const recognizedText = await new Promise((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        (result) => {
          recognizer.close();
          if (result.reason === sdk.ResultReason.RecognizedSpeech) {
            resolve(result.text);
          } else {
            reject(new Error("Speech not recognized"));
          }
        },
        (err) => {
          recognizer.close();
          reject(err);
        }
      );
    });

    console.log(`🎤 Recognized speech: "${recognizedText}"`);

    // Use AI to extract and understand the emergency situation
    const extractionPrompt = `You are an emergency response AI. A person has activated emergency SOS and said:

"${recognizedText}"

Extract and summarize the emergency situation in 1-2 clear sentences. Include:
- What happened (injury, accident, medical emergency, etc.)
- Current condition if mentioned
- Any immediate dangers

Be concise and factual. This will be read to emergency contacts.`;

    const situation = await getChatReply([
      { role: "system", content: "You are an emergency response AI that extracts critical information from emergency descriptions." },
      { role: "user", content: extractionPrompt }
    ], { maxTokens: 150, temperature: 0.3 });

    console.log(`🚨 Extracted situation: "${situation}"`);

    // Build context for emergency contacts
    const locationStr = location 
      ? `Location: ${location.latitude}, ${location.longitude}` 
      : "Location unavailable";
    
    const fullContext = `${userName} has activated emergency SOS. ${situation}. ${locationStr}. Immediate assistance required.`;

    // Trigger calls to all emergency contacts
    const callResults = await Promise.all(
      contacts.map(async (contact) => {
        try {
          const contactContext = `Emergency contact for ${userName}. Relationship: ${contact.relationship || 'Emergency contact'}. They need immediate help.`;
          
          const result = await triggerCall(
            contact.phone,
            fullContext,
            contactContext
          );
          
          console.log(`✅ Call initiated to ${contact.name}: ${result.callSid}`);
          return { success: true, contact: contact.name, ...result };
        } catch (error) {
          console.error(`❌ Failed to call ${contact.name}:`, error.message);
          return { success: false, contact: contact.name, error: error.message };
        }
      })
    );

    const successCount = callResults.filter(r => r.success).length;
    
    console.log(`\n📞 Voice Emergency: ${successCount}/${contacts.length} calls initiated\n`);

    res.json({
      success: true,
      recognizedText,
      situation,
      callResults,
      successCount,
      totalContacts: contacts.length,
    });

  } catch (error) {
    console.error("Voice emergency error:", error);
    res.status(500).json({
      error: "Failed to process voice emergency",
      details: error.message,
    });
  }
}

// ── GET /api/speech-token ────────────────────────────────────────────────────
export async function speechToken(req, res) {
  try {
    const response = await fetch(
      `${process.env.AZURE_ENDPOINT}sts/v1.0/issueToken`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.AZURE_SPEECH_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    if (!response.ok) throw new Error("Token fetch failed: " + response.status);
    const token = await response.text();
    res.json({ token, region: process.env.AZURE_SPEECH_REGION });
  } catch (err) {
    console.error("Speech token error:", err);
    res.status(500).json({ error: "Failed to get speech token" });
  }
}
