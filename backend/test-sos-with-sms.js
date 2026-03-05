/**
 * Test script for SOS emergency call with SMS notifications
 * 
 * This demonstrates the updated emergency system that:
 * 1. Calls emergency contacts with personalized message
 * 2. Sends SMS with user name, situation, and location
 * 3. Provides tracking information to contacts
 */

import dotenv from 'dotenv';
dotenv.config();

// Mock emergency scenario
const testEmergencyData = {
  userName: "Rajesh Kumar",
  situation: "Severe chest pain and difficulty breathing. Patient is conscious but in distress.",
  location: {
    latitude: 17.3850,
    longitude: 78.4867
  },
  emergencyContacts: [
    {
      name: "Priya Kumar",
      phone: "+919876543210",
      relation: "Wife"
    },
    {
      name: "Dr. Sharma",
      phone: "+919876543211",
      relation: "Family Doctor"
    }
  ]
};

console.log('\n🧪 Testing SOS Emergency System with SMS\n');
console.log('Emergency Details:');
console.log(`  User: ${testEmergencyData.userName}`);
console.log(`  Situation: ${testEmergencyData.situation}`);
console.log(`  Location: ${testEmergencyData.location.latitude}, ${testEmergencyData.location.longitude}`);
console.log(`  Contacts: ${testEmergencyData.emergencyContacts.map(c => `${c.name} (${c.relation})`).join(', ')}`);

console.log('\n📋 Expected Behavior:');
console.log('  1. Voice call to each contact with message:');
console.log('     "Hello, this is LifeLink Emergency Service. Rajesh Kumar is in emergency..."');
console.log('  2. SMS to each contact with:');
console.log('     "🚨 EMERGENCY ALERT: Rajesh Kumar is in emergency. [Situation]. Location: 17.3850, 78.4867..."');
console.log('  3. Both call and SMS sent in parallel for faster notification');

console.log('\n✅ To test this live:');
console.log('  1. Ensure Twilio credentials are set in .env');
console.log('  2. Start the backend server: npm start');
console.log('  3. Make POST request to /api/sos-call with the test data above');
console.log('  4. Check that contacts receive both call and SMS with user name and location\n');

// Example API call
console.log('Example API Request:');
console.log('POST http://localhost:5000/api/sos-call');
console.log('Content-Type: application/json\n');
console.log(JSON.stringify(testEmergencyData, null, 2));
