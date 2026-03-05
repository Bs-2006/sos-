/**
 * SOS Emergency Service
 * Handles emergency SOS activation with AI-powered calling to emergency contacts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { API_URL } from '../config/api';
import { getAddressFromCoordinates } from '../utils/locationUtils';

class SOSService {
  constructor() {
    this.isActivating = false;
    this.currentEmergencyId = null;
    this.callResults = [];
  }

  /**
   * Activate SOS emergency
   * Calls /api/agents/sos-call endpoint with emergency contacts
   */
  async activateSOS() {
    if (this.isActivating) {
      console.warn('⚠️ SOS already activating');
      return { success: false, error: 'SOS already activating' };
    }

    this.isActivating = true;
    this.callResults = [];

    try {
      console.log('🆘 Activating SOS Emergency...');

      // Step 1: Get emergency contacts
      const contacts = await this.getEmergencyContacts();
      if (contacts.length === 0) {
        throw new Error('No emergency contacts configured');
      }

      // Step 2: Get user location
      const location = await this.getUserLocation();
      const locationAddress = await this.getLocationAddress(location);

      // Step 3: Get user data
      const user = await this.getUserData();

      // Step 4: Build situation description
      const situation = `Emergency SOS activated by ${user?.name || 'LifeLink user'}. Location: ${locationAddress}. Immediate assistance required.`;

      console.log(`📞 Calling ${contacts.length} emergency contacts...`);
      console.log(`🌐 API URL: ${API_URL}/api/agents/sos-call`);

      // Step 5: Call the SOS endpoint with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

      try {
        const response = await fetch(`${API_URL}/api/agents/sos-call`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            emergencyContacts: contacts,
            situation: situation,
            location: location,
            userName: user?.name || 'LifeLink user'
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('✅ Response received from backend');

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to initiate SOS calls (${response.status})`);
        }

        const data = await response.json();

        console.log(`✅ SOS activated successfully:`, data);

        this.currentEmergencyId = data.emergencyId || `sos_${Date.now()}`;
        this.callResults = data.callResults || [];

        return {
          success: true,
          emergencyId: this.currentEmergencyId,
          situation: situation,
          location: location,
          locationAddress: locationAddress,
          contacts: contacts,
          callResults: this.callResults,
          successCount: data.successCount,
          failureCount: data.failureCount,
          message: data.message
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }

    } catch (error) {
      console.error('❌ SOS activation failed:', error.message);
      console.error('Error details:', error);
      return {
        success: false,
        error: error.message,
        emergencyId: this.currentEmergencyId
      };
    } finally {
      this.isActivating = false;
      console.log('🔄 SOS state reset - isActivating:', this.isActivating);
    }
  }

  /**
   * Get emergency contacts from AsyncStorage
   */
  async getEmergencyContacts() {
    try {
      const contactsStr = await AsyncStorage.getItem('emergencyContacts');
      const contacts = contactsStr ? JSON.parse(contactsStr) : [];
      
      if (contacts.length === 0) {
        console.warn('⚠️ No emergency contacts found');
        return [];
      }

      // Validate phone numbers
      const validContacts = contacts.filter(contact => {
        if (!contact.phone) {
          console.warn(`⚠️ Contact ${contact.name} has no phone number`);
          return false;
        }
        return true;
      });

      console.log(`✅ Loaded ${validContacts.length} emergency contacts`);
      return validContacts;
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
      return [];
    }
  }

  /**
   * Get user's current location
   */
  async getUserLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('⚠️ Location permission not granted');
        return { latitude: 0, longitude: 0 };
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return { latitude: 0, longitude: 0 };
    }
  }

  /**
   * Get readable address from coordinates
   */
  async getLocationAddress(location) {
    try {
      if (location.latitude === 0 && location.longitude === 0) {
        return 'Location unavailable';
      }

      const address = await getAddressFromCoordinates(
        location.latitude,
        location.longitude
      );
      return address;
    } catch (error) {
      console.error('Error getting address:', error);
      return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
    }
  }

  /**
   * Get user data from AsyncStorage
   */
  async getUserData() {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error loading user data:', error);
      return null;
    }
  }

  /**
   * Get current SOS status
   */
  getSOSStatus() {
    return {
      isActivating: this.isActivating,
      emergencyId: this.currentEmergencyId,
      callResults: this.callResults
    };
  }

  /**
   * Reset SOS state
   */
  resetSOS() {
    this.isActivating = false;
    this.currentEmergencyId = null;
    this.callResults = [];
  }

  /**
   * Get call result for a specific contact
   */
  getCallResult(contactName) {
    return this.callResults.find(result => result.name === contactName);
  }

  /**
   * Get successful calls count
   */
  getSuccessfulCallsCount() {
    return this.callResults.filter(result => result.success).length;
  }

  /**
   * Get failed calls count
   */
  getFailedCallsCount() {
    return this.callResults.filter(result => !result.success).length;
  }
}

export default new SOSService();
