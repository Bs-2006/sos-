import AsyncStorage from '@react-native-async-storage/async-storage';
import { Accelerometer } from 'expo-sensors';
import { useAudioPlayer, AudioSource } from 'expo-audio';
import { Alert } from 'react-native';

const SETTINGS_KEY = 'app_settings';

class SettingsService {
  constructor() {
    this.settings = {
      powerButtonTrigger: true,
      shakeDetection: false,
      alertSound: true,
      pushNotifications: true,
      testMode: false,
    };
    this.shakeSubscription = null;
    this.soundObject = null;
    this.onSOSTrigger = null;
  }

  async loadSettings() {
    try {
      const saved = await AsyncStorage.getItem(SETTINGS_KEY);
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
      return this.settings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.settings;
    }
  }

  async saveSetting(key, value) {
    try {
      this.settings[key] = value;
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      
      // Apply setting immediately
      this.applySettings();
      
      return true;
    } catch (error) {
      console.error('Error saving setting:', error);
      return false;
    }
  }

  async applySettings() {
    // Apply shake detection
    if (this.settings.shakeDetection) {
      this.enableShakeDetection();
    } else {
      this.disableShakeDetection();
    }

    // Prepare alert sound
    if (this.settings.alertSound) {
      await this.prepareAlertSound();
    }
  }

  enableShakeDetection() {
    if (this.shakeSubscription) return;

    Accelerometer.setUpdateInterval(100);
    
    let lastShake = 0;
    const SHAKE_THRESHOLD = 3.5;
    const SHAKE_COOLDOWN = 3000; // 3 seconds between shakes

    this.shakeSubscription = Accelerometer.addListener(({ x, y, z }) => {
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (acceleration > SHAKE_THRESHOLD && now - lastShake > SHAKE_COOLDOWN) {
        lastShake = now;
        console.log('Shake detected!');
        if (this.onSOSTrigger) {
          this.onSOSTrigger('shake');
        }
      }
    });
  }

  disableShakeDetection() {
    if (this.shakeSubscription) {
      this.shakeSubscription.remove();
      this.shakeSubscription = null;
    }
  }

  async prepareAlertSound() {
    try {
      if (!this.settings.alertSound) return;
      
      console.log('Alert sound system ready');
    } catch (error) {
      console.error('Error preparing alert sound:', error);
    }
  }

  async playAlertSound() {
    if (!this.settings.alertSound) return;

    try {
      // In production, you would use a local audio file
      // For now, just show an alert as fallback
      Alert.alert('Emergency Alert', 'SOS Activated!');
    } catch (error) {
      console.error('Error playing alert sound:', error);
      Alert.alert('Emergency Alert', 'SOS Activated!');
    }
  }

  setSOSTriggerCallback(callback) {
    this.onSOSTrigger = callback;
  }

  getSettings() {
    return this.settings;
  }

  isTestMode() {
    return this.settings.testMode;
  }

  cleanup() {
    this.disableShakeDetection();
    if (this.soundObject) {
      this.soundObject.unloadAsync();
    }
  }
}

export default new SettingsService();
