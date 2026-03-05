import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Vibration, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from '../hooks/useTranslation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FallDetectedScreen({ navigation, route }) {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(10);
  const pulseAnim = useState(new Animated.Value(1))[0];
  const shakeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Strong vibration pattern
    Vibration.vibrate([0, 500, 200, 500, 200, 500], false);

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shake animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      Vibration.cancel();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleEmergency();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSafe = () => {
    Vibration.cancel();
    navigation.goBack();
  };

  const handleEmergency = () => {
    Vibration.cancel();
    // Navigate to emergency screen with auto-trigger
    navigation.replace('Emergency', { autoTriggered: true, reason: 'fall_detected' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.overlay} />
      
      <Animated.View 
        style={[
          styles.content,
          { transform: [{ translateX: shakeAnim }] }
        ]}
      >
        <Animated.View 
          style={[
            styles.alertIcon,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <MaterialCommunityIcons name="alert-octagon" size={80} color="#ef4444" />
        </Animated.View>

        <Text style={styles.title}>Fall Detected!</Text>
        <Text style={styles.subtitle}>Are you okay?</Text>

        <View style={styles.countdownContainer}>
          <View style={styles.countdownCircle}>
            <Text style={styles.countdownNumber}>{countdown}</Text>
          </View>
          <Text style={styles.countdownText}>
            Auto-triggering emergency in {countdown} seconds
          </Text>
        </View>

        <View style={styles.warningBox}>
          <MaterialCommunityIcons name="information" size={20} color="#f59e0b" />
          <Text style={styles.warningText}>
            If you don't respond, we'll automatically call an ambulance and notify your emergency contacts
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.safeButton}
            onPress={handleSafe}
          >
            <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
            <Text style={styles.safeButtonText}>I'm Safe</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={handleEmergency}
          >
            <MaterialCommunityIcons name="ambulance" size={24} color="#fff" />
            <Text style={styles.emergencyButtonText}>Send Emergency Help</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  alertIcon: {
    marginBottom: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 80,
    padding: 20,
    borderWidth: 4,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 32,
    textAlign: 'center',
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  countdownCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  countdownText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#f59e0b',
    lineHeight: 18,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  safeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingVertical: 20,
    gap: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  safeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingVertical: 20,
    gap: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emergencyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
