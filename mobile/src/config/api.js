// API Configuration
// Backend running locally

// Local Development API (direct connection)
// Update this IP to match your backend server's IP address
// For local testing: http://localhost:3000 (if on same machine)
// For network testing: http://YOUR_MACHINE_IP:3000
// For production: Use ngrok URL or deployed backend URL

const LOCAL_API_URL = 'https://unwading-onomatopoeically-taren.ngrok-free.dev'; // ngrok URL for port 3000

// Use local URL - AI calling will work when ngrok is properly configured
const API_BASE_URL = LOCAL_API_URL;

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  
  // Emergency
  EMERGENCY_REQUEST: `${API_BASE_URL}/api/emergency/request`,
  
  // Health Check
  HEALTH: `${API_BASE_URL}/health`,
};

export const API_URL = API_BASE_URL;
export default API_BASE_URL;

// Note: AI calling requires ngrok for Twilio callbacks
// The backend will handle Twilio calls using PUBLIC_URL from .env
