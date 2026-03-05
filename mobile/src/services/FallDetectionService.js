import { DeviceMotion } from 'expo-sensors';
import { Vibration, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class FallDetectionService {
  constructor() {
    this.subscription = null;
    this.isEnabled = false;
    this.sensitivity = 'medium';
    this.fallCallback = null;
    this.lastAcceleration = { x: 0, y: 0, z: 0 };
    this.accelerationHistory = [];
    this.maxHistorySize = 30; // Keep last 3 seconds of data (at 100ms intervals)
    
    // Very high thresholds to prevent false positives - only detect serious falls
    this.fallThresholds = {
      low: 8.0,    // Extremely high - only very severe impacts
      medium: 6.5, // Very high - only strong impacts
      high: 5.5,   // High - significant impacts only
    };
    
    // Minimum gravity deviation required (m/s²)
    this.minGravityDeviation = 7.0; // Increased from 5.0
    
    // Minimum impact magnitude required
    this.minImpactMagnitude = 20.0; // Increased from 15.0
    
    // Minimum free fall duration (number of samples)
    this.minFreeFallSamples = 3; // Must have at least 3 consecutive low readings
  }

  async loadSettings() {
    try {
      const enabled = await AsyncStorage.getItem('fallDetectionEnabled');
      const sensitivity = await AsyncStorage.getItem('fallDetectionSensitivity');
      
      // Default to enabled if not set
      this.isEnabled = enabled === null ? true : enabled === 'true';
      this.sensitivity = sensitivity || 'medium';
      
      // Save default if first time
      if (enabled === null) {
        await AsyncStorage.setItem('fallDetectionEnabled', 'true');
      }
      
      return { enabled: this.isEnabled, sensitivity: this.sensitivity };
    } catch (error) {
      console.error('Error loading fall detection settings:', error);
      return { enabled: true, sensitivity: 'medium' };
    }
  }

  async saveSettings(enabled, sensitivity) {
    try {
      await AsyncStorage.setItem('fallDetectionEnabled', enabled.toString());
      await AsyncStorage.setItem('fallDetectionSensitivity', sensitivity);
      
      this.isEnabled = enabled;
      this.sensitivity = sensitivity;
      
      console.log('Fall detection settings saved:', { enabled, sensitivity });
      
      if (enabled) {
        await this.start();
      } else {
        this.stop();
      }
    } catch (error) {
      console.error('Error saving fall detection settings:', error);
    }
  }

  setFallCallback(callback) {
    this.fallCallback = callback;
  }

  calculateMagnitude(x, y, z) {
    return Math.sqrt(x * x + y * y + z * z);
  }

  detectFall(acceleration) {
    const { x, y, z } = acceleration;
    const magnitude = this.calculateMagnitude(x, y, z);
    const threshold = this.fallThresholds[this.sensitivity];
    
    // Add to history
    this.accelerationHistory.push({ x, y, z, magnitude, timestamp: Date.now() });
    if (this.accelerationHistory.length > this.maxHistorySize) {
      this.accelerationHistory.shift();
    }
    
    // Need at least 15 samples (1.5 seconds) to detect pattern
    if (this.accelerationHistory.length < 15) {
      this.lastAcceleration = { x, y, z };
      return false;
    }
    
    // Calculate change in acceleration from last reading
    const deltaX = Math.abs(x - this.lastAcceleration.x);
    const deltaY = Math.abs(y - this.lastAcceleration.y);
    const deltaZ = Math.abs(z - this.lastAcceleration.z);
    const totalDelta = this.calculateMagnitude(deltaX, deltaY, deltaZ);
    
    // Store current acceleration for next comparison
    this.lastAcceleration = { x, y, z };
    
    // STRICT CONDITIONS - All must be met:
    // 1. Very strong impact (high delta AND very high magnitude)
    // 2. Significant gravity deviation
    // 3. Clear free fall pattern (multiple consecutive low readings)
    // 4. Vertical component must be significant (not horizontal movement)
    
    const gravityDeviation = Math.abs(magnitude - 9.8);
    
    // Check if current reading shows VERY strong impact
    const isVeryStrongImpact = totalDelta > threshold && magnitude > this.minImpactMagnitude;
    
    if (!isVeryStrongImpact) {
      return false;
    }
    
    // Check gravity deviation is significant
    if (gravityDeviation < this.minGravityDeviation) {
      return false;
    }
    
    // Check for sustained free fall period (not just one spike)
    // Look for consecutive readings with low acceleration
    const recentHistory = this.accelerationHistory.slice(-15); // Last 1.5 seconds
    let consecutiveFreeFall = 0;
    let maxConsecutiveFreeFall = 0;
    
    for (let i = 0; i < recentHistory.length - 1; i++) {
      if (recentHistory[i].magnitude < 4.0) { // Free fall threshold
        consecutiveFreeFall++;
        maxConsecutiveFreeFall = Math.max(maxConsecutiveFreeFall, consecutiveFreeFall);
      } else {
        consecutiveFreeFall = 0;
      }
    }
    
    const hadSustainedFreeFall = maxConsecutiveFreeFall >= this.minFreeFallSamples;
    
    // Check if the movement has significant vertical component
    // Falls typically have strong Z-axis (vertical) component
    const verticalComponent = Math.abs(deltaZ);
    const hasVerticalMovement = verticalComponent > 3.0;
    
    // Fall detected ONLY if ALL conditions met:
    if (isVeryStrongImpact && 
        gravityDeviation > this.minGravityDeviation && 
        hadSustainedFreeFall && 
        hasVerticalMovement) {
      
      console.log('Fall detected!', { 
        totalDelta: totalDelta.toFixed(2), 
        magnitude: magnitude.toFixed(2), 
        gravityDeviation: gravityDeviation.toFixed(2),
        maxConsecutiveFreeFall,
        verticalComponent: verticalComponent.toFixed(2)
      });
      
      // Clear history to prevent immediate re-trigger
      this.accelerationHistory = [];
      return true;
    }
    
    return false;
  }

  async start() {
    if (this.subscription) {
      console.log('Fall detection already running');
      return;
    }

    try {
      const available = await DeviceMotion.isAvailableAsync();
      if (!available) {
        console.warn('Device motion not available on this device');
        Alert.alert(
          'Sensor Not Available',
          'Fall detection requires motion sensors which are not available on this device.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('Starting fall detection service...');
      console.log('Current settings:', { isEnabled: this.isEnabled, sensitivity: this.sensitivity });
      DeviceMotion.setUpdateInterval(100); // Update every 100ms

      let sampleCount = 0;
      this.subscription = DeviceMotion.addListener((data) => {
        if (!this.isEnabled) return;

        // Log first few samples to verify sensor is working
        if (sampleCount < 3) {
          console.log('Sensor sample:', data.acceleration);
          sampleCount++;
        }

        const { acceleration } = data;
        if (acceleration && acceleration.x !== null && acceleration.y !== null && acceleration.z !== null) {
          const fallDetected = this.detectFall(acceleration);
          
          if (fallDetected && this.fallCallback) {
            console.log('Fall callback triggered');
            // Vibrate to alert user
            Vibration.vibrate([0, 500, 200, 500]);
            
            // Prevent multiple triggers within 30 seconds (increased cooldown)
            this.isEnabled = false;
            this.fallCallback();
            
            // Re-enable after 30 seconds
            setTimeout(() => {
              this.isEnabled = true;
              console.log('Fall detection re-enabled after cooldown');
            }, 30000); // 30 seconds cooldown
          }
        }
      });
      
      console.log('Fall detection service started successfully');
    } catch (error) {
      console.error('Error starting fall detection:', error);
      Alert.alert(
        'Error',
        'Failed to start fall detection: ' + error.message,
        [{ text: 'OK' }]
      );
    }
  }

  stop() {
    if (this.subscription) {
      console.log('Stopping fall detection service');
      this.subscription.remove();
      this.subscription = null;
    }
  }

  async getEmergencyContacts() {
    try {
      const contacts = await AsyncStorage.getItem('emergencyContacts');
      return contacts ? JSON.parse(contacts) : [];
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
      return [];
    }
  }

  async saveEmergencyContacts(contacts) {
    try {
      await AsyncStorage.setItem('emergencyContacts', JSON.stringify(contacts));
    } catch (error) {
      console.error('Error saving emergency contacts:', error);
    }
  }
}

export default new FallDetectionService();
