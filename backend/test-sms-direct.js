/**
 * Direct SMS test - bypasses AI to test SMS delivery immediately
 */

import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function testDirectSMS() {
  const testData = {
    to: process.env.TEST_PHONE_NUMBER || '+918897536435', // Set in .env
    userName: 'Rajesh Kumar',
    situation: 'Severe chest pain and difficulty breathing',
    location: {
      latitude: 17.3850,
      longitude: 78.4867
    }
  };

  console.log('\n📱 Testing Direct SMS Send...\n');
  console.log('Test Data:');
  console.log(`  To: ${testData.to}`);
  console.log(`  User: ${testData.userName}`);
  console.log(`  Situation: ${testData.situation}`);
  console.log(`  Location: ${testData.location.latitude}, ${testData.location.longitude}\n`);

  try {
    const locationStr = `Location: https://maps.google.com/?q=${testData.location.latitude},${testData.location.longitude}`;
    
    const messageBody = `🚨 EMERGENCY ALERT: ${testData.userName} is in emergency. ${testData.situation.substring(0, 80)}. ${locationStr}. Please respond immediately or call 112.`;
    
    console.log('Message to send:');
    console.log(`"${messageBody}"\n`);
    console.log(`Length: ${messageBody.length} characters\n`);
    
    console.log('Sending SMS...');
    const message = await client.messages.create({
      to: testData.to,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: messageBody,
    });

    console.log('\n✅ SMS SENT SUCCESSFULLY!');
    console.log(`   SID: ${message.sid}`);
    console.log(`   Status: ${message.status}`);
    console.log(`   To: ${message.to}`);
    console.log(`   From: ${message.from}\n`);
    
  } catch (error) {
    console.error('\n❌ SMS FAILED:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    console.error(`   More info: ${error.moreInfo || 'N/A'}\n`);
    
    if (error.code === 21608) {
      console.log('💡 This number is not verified. In Twilio trial:');
      console.log('   1. Go to https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
      console.log('   2. Add and verify the test phone number');
      console.log('   3. Or upgrade your Twilio account\n');
    }
  }
}

testDirectSMS();
