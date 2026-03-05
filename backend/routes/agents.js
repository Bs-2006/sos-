const express = require('express');
const router = express.Router();

// Import agent controllers (will be converted to CommonJS)
let chatController, callingController, messagingController, healthAssistantController;

// Dynamic import for ES modules
(async () => {
  try {
    chatController = await import('../agents/ChatController.js');
    callingController = await import('../agents/CallingController.js');
    messagingController = await import('../agents/MessagingController.js');
    healthAssistantController = await import('../agents/HealthAssistantController.js');
  } catch (error) {
    console.error('Error loading agent controllers:', error);
  }
})();

// Chat endpoints
router.post('/chat', async (req, res) => {
  if (!chatController) {
    return res.status(503).json({ error: 'Chat service not available' });
  }
  return chatController.chat(req, res);
});

router.post('/voice-emergency', async (req, res) => {
  if (!chatController) {
    return res.status(503).json({ error: 'Voice emergency service not available' });
  }
  return chatController.voiceEmergency(req, res);
});

router.post('/speak', async (req, res) => {
  if (!chatController) {
    return res.status(503).json({ error: 'Speech service not available' });
  }
  return chatController.speak(req, res);
});

router.get('/speech-token', async (req, res) => {
  if (!chatController) {
    return res.status(503).json({ error: 'Speech service not available' });
  }
  return chatController.speechToken(req, res);
});

// Calling endpoints
router.post('/call', async (req, res) => {
  if (!callingController) {
    return res.status(503).json({ error: 'Calling service not available' });
  }
  return callingController.initiateCall(req, res);
});

// SOS Emergency Call - calls all emergency contacts simultaneously
router.post('/sos-call', async (req, res) => {
  if (!callingController) {
    return res.status(503).json({ error: 'Calling service not available' });
  }
  return callingController.initiateSOSCall(req, res);
});

router.get('/sessions', async (req, res) => {
  if (!callingController) {
    return res.status(503).json({ error: 'Calling service not available' });
  }
  return callingController.getSessions(req, res);
});

// TwiML endpoints for Twilio callbacks
router.get('/twiml/answer', async (req, res) => {
  if (!callingController) {
    return res.status(503).send('Service unavailable');
  }
  return callingController.twimlAnswer(req, res);
});

router.post('/twiml/respond', async (req, res) => {
  if (!callingController) {
    return res.status(503).send('Service unavailable');
  }
  return callingController.twimlRespond(req, res);
});

router.post('/twiml/status', async (req, res) => {
  if (!callingController) {
    return res.sendStatus(200);
  }
  return callingController.twimlStatus(req, res);
});

// Messaging endpoints
router.post('/message', async (req, res) => {
  if (!messagingController) {
    return res.status(503).json({ error: 'Messaging service not available' });
  }
  return messagingController.sendMessage(req, res);
});

router.post('/message/bulk', async (req, res) => {
  if (!messagingController) {
    return res.status(503).json({ error: 'Messaging service not available' });
  }
  return messagingController.sendBulk(req, res);
});

router.get('/message/status/:sid', async (req, res) => {
  if (!messagingController) {
    return res.status(503).json({ error: 'Messaging service not available' });
  }
  return messagingController.getMessageStatus(req, res);
});

// Health Assistant endpoints
router.post('/health-assistant', async (req, res) => {
  if (!healthAssistantController) {
    return res.status(503).json({ error: 'Health Assistant service not available' });
  }
  return healthAssistantController.healthAssistantChat(req, res);
});

router.post('/health-assistant/symptom-assessment', async (req, res) => {
  if (!healthAssistantController) {
    return res.status(503).json({ error: 'Health Assistant service not available' });
  }
  return healthAssistantController.getSymptomAssessment(req, res);
});

router.post('/health-assistant/first-aid', async (req, res) => {
  if (!healthAssistantController) {
    return res.status(503).json({ error: 'Health Assistant service not available' });
  }
  return healthAssistantController.getFirstAidGuidanceEndpoint(req, res);
});

router.post('/health-assistant/emergency-assessment', async (req, res) => {
  if (!healthAssistantController) {
    return res.status(503).json({ error: 'Health Assistant service not available' });
  }
  return healthAssistantController.assessEmergencyLevel(req, res);
});

module.exports = router;
