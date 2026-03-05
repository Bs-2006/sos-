import twilio from "twilio";
import { generateSMSMessage } from "./agent.js";

// Reuse a single Twilio client instance instead of creating one per request
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

function getClient() {
  return twilioClient;
}

// ── Exported helper: trigger SMS from ChatController ─────────────────────────
export async function sendSMS(to, situation, context, recipientName) {
  const body = await generateSMSMessage(
    situation,
    context || "A contact who may assist",
    recipientName
  );

  const message = await getClient().messages.create({
    to,
    from: process.env.TWILIO_PHONE_NUMBER,
    body,
  });

  console.log(`✉️  SMS sent  SID: ${message.sid}  To: ${to}`);
  return { messageSid: message.sid, status: message.status, to, body };
}

// ── POST /api/message ────────────────────────────────────────────────────────
export async function sendMessage(req, res) {
  const { to, situation, context, recipientName, customMessage } = req.body;

  if (!to) return res.status(400).json({ error: "Missing: to (e.g. +91XXXXXXXXXX)" });
  if (!situation && !customMessage)
    return res.status(400).json({ error: "Missing: situation or customMessage" });

  try {
    let messageBody;

    if (customMessage) {
      messageBody = customMessage;
      console.log(`\n📝 Using custom message for ${to}`);
    } else {
      console.log(`\n⏳ Generating message for ${to}...`);
      messageBody = await generateSMSMessage(
        situation,
        context || "A contact who may assist",
        recipientName
      );
      console.log(`✅ Message ready: "${messageBody}"`);
    }

    const message = await getClient().messages.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: messageBody,
    });

    console.log(`\n✉️  Message sent!  SID: ${message.sid}  Status: ${message.status}`);
    console.log(`   To: ${to}  Body: "${messageBody}"\n`);

    res.json({ success: true, messageSid: message.sid, status: message.status, to, body: messageBody });
  } catch (err) {
    console.error("❌ Message error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// ── POST /api/message/bulk ───────────────────────────────────────────────────
export async function sendBulk(req, res) {
  const { recipients, situation, context, location, userName } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0)
    return res.status(400).json({ error: "Missing: recipients array" });
  if (!situation)
    return res.status(400).json({ error: "Missing: situation" });

  console.log(`\n📱 Sending bulk SMS to ${recipients.length} recipients...`);

  // Extract user name from situation or use provided userName
  const extractedName = userName || situation.match(/from ([^.]+)/)?.[1] || 'LifeLink user';
  
  // Build location string
  const locationStr = location 
    ? `Location: https://maps.google.com/?q=${location.latitude},${location.longitude}` 
    : '';

  const results = await Promise.allSettled(
    recipients.map(async ({ to, recipientName }) => {
      try {
        // Ensure E.164 format
        let phoneNumber = to;
        if (!phoneNumber.startsWith('+')) {
          const cleaned = phoneNumber.replace(/\D/g, '');
          phoneNumber = '+91' + cleaned.slice(-10); // Assume India +91
        }

        // Fast template-based message (no AI delay)
        const messageBody = `🚨 EMERGENCY ALERT: ${extractedName} is in emergency. ${situation.substring(0, 80)}. ${locationStr}. Please respond immediately or call 112.`;

        const message = await getClient().messages.create({
          to: phoneNumber,
          from: process.env.TWILIO_PHONE_NUMBER,
          body: messageBody,
        });
        
        console.log(`   ✉️  Sent to ${recipientName || phoneNumber}  SID: ${message.sid}`);
        return { to: phoneNumber, messageSid: message.sid, status: message.status, body: messageBody };
      } catch (error) {
        console.error(`   ❌ Failed to send to ${recipientName || to}:`, error.message);
        throw error;
      }
    })
  );

  const sent   = results.filter(r => r.status === "fulfilled").map(r => r.value);
  const failed = results.filter(r => r.status === "rejected").map(r => ({ 
    to: r.reason?.to || 'unknown',
    error: r.reason?.message 
  }));

  console.log(`\n📊 Bulk SMS complete — ${sent.length} sent, ${failed.length} failed\n`);
  res.json({ success: true, sent, failed, total: recipients.length });
}

// ── GET /api/message/status/:sid ─────────────────────────────────────────────
export async function getMessageStatus(req, res) {
  const { sid } = req.params;
  try {
    const message = await getClient().messages(sid).fetch();
    res.json({
      messageSid: message.sid,
      to: message.to,
      from: message.from,
      status: message.status,
      body: message.body,
      dateSent: message.dateSent,
      errorMessage: message.errorMessage || null,
    });
  } catch (err) {
    console.error("❌ Status fetch error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
