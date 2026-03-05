import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const INFERENCE_URL = "https://models.github.ai/inference";
const REQUEST_TIMEOUT = 30000; // 30 seconds timeout
const MODEL_ID = "openai/gpt-4o-mini";

// Reuse a single client instance across requests to avoid repeatedly creating HTTP plumbing
const client = ModelClient(INFERENCE_URL, new AzureKeyCredential(process.env.GITHUB_TOKEN));

// Helper to add timeout to promises and ensure timer cleanup
function withTimeout(promise, ms) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`Request timeout after ${ms}ms`)),
      ms
    );
  });

  return Promise.race([
    promise.then(
      (result) => {
        clearTimeout(timeoutId);
        return result;
      },
      (error) => {
        clearTimeout(timeoutId);
        throw error;
      }
    ),
    timeoutPromise,
  ]);
}

async function callChatCompletions({ messages, maxTokens, temperature }) {
  try {
    const response = await withTimeout(
      client.path("/chat/completions").post({
        body: {
          model: MODEL_ID,
          messages,
          max_tokens: maxTokens,
          temperature,
        },
      }),
      REQUEST_TIMEOUT
    );

    if (isUnexpected(response)) {
      const message = response.body?.error?.message || "Model API error";
      console.error("❌ Model API error:", message);
      console.error("Response status:", response.status);
      throw new Error(message);
    }

    const content = response.body?.choices?.[0]?.message?.content;
    if (!content) {
      // Fail fast with a clear error if the model returns an unexpected shape
      console.error("❌ Model API returned no content");
      throw new Error("Model API returned no content");
    }

    return content.trim();
  } catch (error) {
    console.error("❌ Chat completion error:", error.message);
    throw error;
  }
}

// ── Chat Agent (LifeLink emergency assistant) ────────────────────────────────
export async function getChatReply(
  messages,
  { maxTokens = 350, temperature = 0.35 } = {}
) {
  // Delegate to a shared helper to avoid duplicated response handling logic
  return callChatCompletions({ messages, maxTokens, temperature });
}

// ── Calling Agent (voice call to emergency contact) ──────────────────────────
export async function getCallingReply(situation, context, conversationHistory) {
  const systemPrompt = `You are LifeLink, an AI emergency voice agent making a phone call in South India.
  
EMERGENCY SITUATION: ${situation}

ABOUT THE PERSON YOU ARE CALLING: ${context}

RULES:
- First message: introduce yourself as "LifeLink Emergency Service", clearly state WHO is in emergency (extract name from context), explain the situation, and ask for immediate help
- Be calm, clear, and urgent — this is a live phone call
- Max 2-3 sentences per response — it's a phone call, not a chat
- No markdown, no lists — natural spoken sentences only
- If they reply in Telugu, Hindi, or Tamil — respond in that language
- If they confirm they're coming/helping — thank them and prepare to end
- Always mention the person's name who is in emergency in your first message`;

  const messages = [
    { role: "system", content: systemPrompt },
    // Only send the most recent messages to the model to keep prompts small and fast
    ...conversationHistory.slice(-10),
    {
      role: "user",
      content: "Generate the opening message for this emergency call now.",
    },
  ];

  return getChatReply(messages, { maxTokens: 180, temperature: 0.4 });
}

// ── Messaging Agent (AI-generated SMS content) ───────────────────────────────
export async function generateSMSMessage(situation, context, recipientName) {
  const systemPrompt = `You are LifeLink, an AI emergency messaging service in South India.
  
EMERGENCY SITUATION: ${situation}

ABOUT THE RECIPIENT: ${context}
RECIPIENT NAME: ${recipientName || "contact"}

RULES:
- Write a clear, urgent SMS message
- Start with "🚨 EMERGENCY ALERT:"
- Clearly state WHO is in emergency (extract name from context)
- Include the situation briefly
- Include location if available in context (format: "Location: lat, long")
- Ask recipient to respond or come immediately
- Keep it under 160 characters if possible, max 300 characters
- No markdown — plain text only
- Be direct and urgent but calm
- Example format: "🚨 EMERGENCY ALERT: [Name] is in emergency. [Situation]. Location: [coordinates]. Please respond immediately or call 112."`;

  return getChatReply(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate the emergency SMS message now." },
    ],
    { maxTokens: 150, temperature: 0.3 }
  );
}
