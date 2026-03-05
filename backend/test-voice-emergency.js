// Test script for voice emergency feature
const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';

async function testVoiceEmergency() {
  console.log('🧪 Testing Voice Emergency Feature...\n');

  // Test data
  const testData = {
    // Simulated audio (in real app, this would be base64 encoded audio)
    audio: 'test_audio_base64',
    userName: 'Test User',
    location: {
      latitude: 17.385044,
      longitude: 78.486671
    },
    contacts: [
      {
        name: 'Paakie',
        phone: '+918074649809',
        relationship: 'Emergency Contact'
      }
    ]
  };

  try {
    console.log('📞 Sending voice emergency request...');
    console.log('User:', testData.userName);
    console.log('Contacts:', testData.contacts.length);
    console.log('Location:', testData.location);
    console.log('');

    const response = await fetch(`${API_URL}/api/agents/voice-emergency`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Error:', error);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Voice Emergency Response:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Recognized Text:', result.recognizedText || 'N/A');
    console.log('Extracted Situation:', result.situation || 'N/A');
    console.log('Calls Initiated:', result.successCount, '/', result.totalContacts);
    console.log('');
    
    if (result.callResults) {
      console.log('Call Results:');
      result.callResults.forEach((call, index) => {
        const status = call.success ? '✅' : '❌';
        console.log(`  ${status} ${call.contact}: ${call.success ? call.callSid : call.error}`);
      });
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Make sure backend server is running (npm start)');
    console.log('2. Check if Azure Speech Services credentials are correct');
    console.log('3. Verify Twilio credentials are configured');
    console.log('4. Ensure ngrok is running and PUBLIC_URL is updated');
  }
}

// Check if services are configured
async function checkConfiguration() {
  console.log('🔍 Checking Configuration...\n');
  
  const requiredEnvVars = [
    'GITHUB_TOKEN',
    'AZURE_SPEECH_KEY',
    'AZURE_SPEECH_REGION',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'PUBLIC_URL'
  ];

  const missing = [];
  
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.log('⚠️  Missing environment variables:');
    missing.forEach(v => console.log(`   - ${v}`));
    console.log('');
    console.log('Please configure these in backend/.env file');
    return false;
  }

  console.log('✅ All required environment variables are set');
  console.log('');
  return true;
}

// Run tests
(async () => {
  require('dotenv').config();
  
  const isConfigured = await checkConfiguration();
  
  if (isConfigured) {
    await testVoiceEmergency();
  }
})();
