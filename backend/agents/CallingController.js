import twilio from "twilio";
import { getCallingReply } from "./agent.js";

// Reuse a single Twilio client instance across all calls to avoid reconnect overhead
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

function getClient() {
  return twilioClient;
}

// Helper to send SMS directly without AI generation for speed
async function sendEmergencySMS(to, userName, situation, location) {
  try {
    const locationStr = location 
      ? `Location: https://maps.google.com/?q=${location.latitude},${location.longitude}` 
      : 'Location: Unknown';
    
    const message = `🚨 EMERGENCY ALERT: ${userName} is in emergency. ${situation.substring(0, 80)}. ${locationStr}. Please respond immediately or call 112.`;
    
    const result = await getClient().messages.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: message,
    });

    console.log(`✉️  SMS sent to ${to} - SID: ${result.sid}`);
    return { messageSid: result.sid, status: result.status, body: message };
  } catch (error) {
    console.error(`❌ SMS error for ${to}:`, error.message);
    throw error;
  }
}

// ── In-memory call sessions ──────────────────────────────────────────────────
const callSessions = new Map();

// ── TwiML builder ────────────────────────────────────────────────────────────
function buildGatherTwiML(sayText, actionUrl) {
  const twiml = new twilio.twiml.VoiceResponse();

  const gather = twiml.gather({
    input: "speech",
    action: actionUrl,
    method: "POST",
    speechTimeout: "auto",
    language: "en-IN",
    timeout: 12,
    hints: "yes, no, okay, help, coming, who is this, what happened, where, thank you, goodbye",
  });

  gather.say({ voice: "Polly.Aditi", language: "en-IN" }, sayText);

  twiml.say(
    { voice: "Polly.Aditi", language: "en-IN" },
    "I could not hear you. Please call one one two for emergency assistance. Goodbye."
  );
  twiml.hangup();

  return twiml.toString();
}

// ── Exported helper: trigger a call from ChatController ─────────────────────
export async function triggerCall(to, situation, context) {
  const baseUrl = process.env.PUBLIC_URL;
  if (!baseUrl) throw new Error("Set PUBLIC_URL in .env (ngrok URL)");

  try {
    console.log(`⏳ Preparing call for ${to}...`);
    
    // Extract user name from context for faster message
    const nameMatch = context.match(/Emergency contact of ([^.]+)/);
    const userName = nameMatch ? nameMatch[1] : 'a LifeLink user';
    
    // Use immediate fallback message - no AI delay
    const openingReply = `Hello, this is LifeLink Emergency Service. ${userName} is in an emergency situation. ${situation}. Please provide immediate assistance.`;
    
    console.log(`✅ Message ready: "${openingReply.substring(0, 60)}..."`);

    const tempKey = `tmp_${Date.now()}`;
    callSessions.set(tempKey, {
      situation,
      context,
      conversationHistory: [{ role: "assistant", content: openingReply }],
      phoneNumber: to,
      openingReply,
    });

    console.log(`📞 Initiating Twilio call to ${to}...`);
    const call = await getClient().calls.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: `${baseUrl}/twiml/answer?session=${tempKey}`,
      method: "GET",
      statusCallback: `${baseUrl}/twiml/status`,
      statusCallbackMethod: "POST",
    });

    const data = callSessions.get(tempKey);
    callSessions.delete(tempKey);
    callSessions.set(call.sid, data);

    console.log(`📞 Call placed! SID: ${call.sid} Status: ${call.status}`);
    return { callSid: call.sid, status: call.status, to, openingMessage: openingReply };
  } catch (error) {
    console.error(`❌ Error in triggerCall for ${to}:`, error.message);
    throw error;
  }
}

// ── POST /api/sos-call ── SOS Emergency Call to all contacts ──────────────────
export async function initiateSOSCall(req, res) {
  const { emergencyContacts, situation, location, userName } = req.body;

  if (!emergencyContacts || !Array.isArray(emergencyContacts) || emergencyContacts.length === 0) {
    return res.status(400).json({ error: "Missing: emergencyContacts (array)" });
  }

  if (!situation) {
    return res.status(400).json({ error: "Missing: situation" });
  }

  if (!process.env.PUBLIC_URL) {
    return res.status(500).json({ error: "Set PUBLIC_URL in .env (ngrok URL)" });
  }

  try {
    console.log(`\n🆘 SOS EMERGENCY: Notifying ${emergencyContacts.length} emergency contacts...`);
    
    // Limit to 3 simultaneous calls
    const contactsToCall = emergencyContacts.slice(0, 3);
    
    // Build location string
    const locationStr = location 
      ? `${location.latitude}, ${location.longitude}` 
      : 'Unknown';
    
    // Build context message with user name
    const context = `Emergency contact of ${userName || 'LifeLink user'}. They have activated emergency SOS. Location: ${locationStr}. Please provide immediate assistance.`;
    
    console.log(`📋 Contacts: ${contactsToCall.map(c => c.name).join(', ')}`);
    console.log(`� User: ${userName || 'Unknown'}`);
    console.log(`�📍 Location: ${locationStr}`);
    console.log(`� Situation: ${situation.substring(0, 100)}...`);
    
    // Make parallel calls AND SMS to all contacts
    const contactPromises = contactsToCall.map(async (contact) => {
      try {
        let phoneNumber = contact.phone || contact.phoneNumber;
        
        if (!phoneNumber) {
          console.warn(`⚠️ Contact ${contact.name} has no phone number`);
          return {
            success: false,
            name: contact.name,
            phone: 'N/A',
            relation: contact.relation || 'Emergency Contact',
            error: 'No phone number provided'
          };
        }
        
        // Ensure E.164 format
        if (!phoneNumber.startsWith('+')) {
          const cleaned = phoneNumber.replace(/\D/g, '');
          phoneNumber = '+91' + cleaned.slice(-10); // Assume India +91
        }
        
        console.log(`\n📞 Contacting ${contact.name} (${contact.relation || 'Emergency Contact'}) at ${phoneNumber}...`);
        
        // Send SMS first (faster), then call
        const smsPromise = sendEmergencySMS(phoneNumber, userName || 'LifeLink user', situation, location);
        const callPromise = triggerCall(phoneNumber, situation, context);
        
        const [smsResult, callResult] = await Promise.allSettled([smsPromise, callPromise]);
        
        const result = {
          name: contact.name,
          phone: phoneNumber,
          relation: contact.relation || 'Emergency Contact',
          sms: smsResult.status === 'fulfilled' ? {
            success: true,
            messageSid: smsResult.value.messageSid,
            status: smsResult.value.status,
            body: smsResult.value.body
          } : { 
            success: false,
            error: smsResult.reason?.message 
          },
          call: callResult.status === 'fulfilled' ? {
            success: true,
            callSid: callResult.value.callSid,
            status: callResult.value.status,
            openingMessage: callResult.value.openingMessage
          } : { 
            success: false,
            error: callResult.reason?.message 
          }
        };
        
        result.success = result.sms.success || result.call.success;
        
        if (result.sms.success) {
          console.log(`✅ SMS sent to ${contact.name}`);
        }
        if (result.call.success) {
          console.log(`✅ Call initiated to ${contact.name}`);
        }
        
        return result;
      } catch (error) {
        console.error(`❌ Failed to contact ${contact.name}:`, error.message);
        return {
          success: false,
          name: contact.name,
          phone: contact.phone || contact.phoneNumber || 'N/A',
          relation: contact.relation || 'Emergency Contact',
          error: error.message
        };
      }
    });

    const contactResults = await Promise.all(contactPromises);
    const successCount = contactResults.filter(r => r.success).length;
    const failureCount = contactResults.filter(r => !r.success).length;
    const smsCount = contactResults.filter(r => r.sms?.success).length;
    const callCount = contactResults.filter(r => r.call?.success).length;

    console.log(`\n✅ Emergency notifications complete:`);
    console.log(`   📱 SMS sent: ${smsCount}/${contactsToCall.length}`);
    console.log(`   📞 Calls initiated: ${callCount}/${contactsToCall.length}`);
    console.log(`   ✓ Total success: ${successCount}, ✗ Failed: ${failureCount}\n`);

    res.json({
      success: true,
      message: `Emergency SOS activated. Notified ${successCount} contact(s) via call and SMS.`,
      totalContacts: emergencyContacts.length,
      contactsNotified: contactsToCall.length,
      successCount,
      failureCount,
      smsCount,
      callCount,
      contactResults
    });
  } catch (error) {
    console.error('❌ SOS error:', error.message);
    res.status(500).json({ error: error.message });
  }
}

// ── POST /api/call ───────────────────────────────────────────────────────────
export async function initiateCall(req, res) {
  let { to, situation, context } = req.body;

  // If no 'to' number provided, use fallback from .env
  if (!to) {
    to = process.env.EMERGENCY_CONTACT_NUMBER;
    console.log(`⚠️ No contact number provided, using fallback: ${to}`);
  }

  if (!to)        return res.status(400).json({ error: "Missing: to (e.g. +91XXXXXXXXXX) and no EMERGENCY_CONTACT_NUMBER in .env" });
  if (!situation) return res.status(400).json({ error: "Missing: situation" });
  if (!process.env.PUBLIC_URL)
    return res.status(500).json({ error: "Set PUBLIC_URL in .env (ngrok URL)" });

  try {
    console.log(`\n⏳ Generating opening for ${to}...`);
    const result = await triggerCall(to, situation, context || "A contact who may assist");
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("❌ Call error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ── GET /twiml/answer ── person picks up ─────────────────────────────────────
export function twimlAnswer(req, res) {
  const { session, CallSid } = req.query;

  let sessionData = callSessions.get(session) || callSessions.get(CallSid);

  if (!sessionData) {
    const vr = new twilio.twiml.VoiceResponse();
    vr.say({ voice: "Polly.Aditi" }, "Hello, this is LifeLink Emergency Service. Please call one one two immediately.");
    vr.hangup();
    return res.type("text/xml").send(vr.toString());
  }

  if (CallSid && !callSessions.has(CallSid)) {
    callSessions.set(CallSid, sessionData);
    callSessions.delete(session);
  }

  const activeSid = CallSid || session;
  const twiml = buildGatherTwiML(
    sessionData.openingReply,
    `${process.env.PUBLIC_URL}/twiml/respond?callSid=${activeSid}`
  );
  res.type("text/xml").send(twiml);
}

// ── POST /twiml/respond ── each time person speaks ───────────────────────────
export async function twimlRespond(req, res) {
  const { callSid }  = req.query;
  const speechResult = (req.body.SpeechResult || "").trim();
  const confidence   = parseFloat(req.body.Confidence || "0");

  console.log(`🗣  [${callSid}] Person: "${speechResult}" (${(confidence * 100).toFixed(0)}%)`);

  const session = callSessions.get(callSid);
  if (!session) {
    const vr = new twilio.twiml.VoiceResponse();
    vr.say({ voice: "Polly.Aditi" }, "Thank you. Please call one one two for assistance. Goodbye.");
    vr.hangup();
    return res.type("text/xml").send(vr.toString());
  }

  const endWords = ["bye", "goodbye", "ok thanks", "thank you bye", "on my way",
    "coming now", "i will come", "i'll be there", "understood", "will do"];
  const wantsToEnd = endWords.some(w => speechResult.toLowerCase().includes(w));

  if (speechResult) {
    session.conversationHistory.push({ role: "user", content: speechResult });
  }

  if (wantsToEnd) {
    const farewell = "Thank you so much. Please hurry. Your help means everything right now. Stay safe.";
    const vr = new twilio.twiml.VoiceResponse();
    vr.say({ voice: "Polly.Aditi", language: "en-IN" }, farewell);
    vr.hangup();
    console.log(`📴 [${callSid}] Ended gracefully\n`);
    callSessions.delete(callSid);
    return res.type("text/xml").send(vr.toString());
  }

  let agentReply;
  try {
    agentReply = await getCallingReply(session.situation, session.context, session.conversationHistory);
  } catch (err) {
    console.error("Agent error:", err.message);
    agentReply = "I apologize for the difficulty. Please call one one two immediately. Thank you.";
  }

  session.conversationHistory.push({ role: "assistant", content: agentReply });
  console.log(`🤖 [${callSid}] Agent: "${agentReply}"\n`);

  const twiml = buildGatherTwiML(
    agentReply,
    `${process.env.PUBLIC_URL}/twiml/respond?callSid=${callSid}`
  );
  res.type("text/xml").send(twiml);
}

// ── POST /twiml/status ── call lifecycle events ──────────────────────────────
export function twimlStatus(req, res) {
  const { CallSid, CallStatus, Duration } = req.body;
  const icons = { ringing: "🔔", answered: "✅", completed: "✅", "no-answer": "❌", busy: "📵", failed: "💥" };
  console.log(`${icons[CallStatus] || "📊"} [${CallSid}] ${CallStatus}${Duration ? ` — ${Duration}s` : ""}`);

  if (["completed", "failed", "busy", "no-answer", "canceled"].includes(CallStatus)) {
    callSessions.delete(CallSid);
  }
  res.sendStatus(200);
}

// ── GET /api/sessions ── debug ───────────────────────────────────────────────
export function getSessions(req, res) {
  const list = [];
  for (const [sid, d] of callSessions.entries()) {
    list.push({ callSid: sid, to: d.phoneNumber, situation: d.situation, turns: d.conversationHistory.length });
  }
  res.json({ count: list.length, sessions: list });
}
