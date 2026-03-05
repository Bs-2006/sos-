import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { API_URL } from '../config/api';
import { getAddressFromCoordinates } from '../utils/locationUtils';

export default function VoiceAssistantScreen({ navigation, route }) {
  const { autoActivated = false } = route?.params || {};
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState('initializing'); // initializing, listening, processing, speaking, completed
  const [statusMessage, setStatusMessage] = useState('Initializing voice assistant...');
  const [pulseAnim] = useState(new Animated.Value(1));
  const [location, setLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const soundRef = useRef(null);

  useEffect(() => {
    initializeAssistant();
    
    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    
    return () => {
      pulse.stop();
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const initializeAssistant = async () => {
    try {
      // Setup audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Get location
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus === 'granted') {
        const position = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        
        const address = await getAddressFromCoordinates(
          position.coords.latitude,
          position.coords.longitude
        );
        setLocationAddress(address);
      }

      setStatus('listening');
      setStatusMessage('Listening... Describe your emergency');
      
      if (autoActivated) {
        // Auto-start listening
        startListening();
      }
    } catch (error) {
      console.error('Initialization error:', error);
      setStatus('error');
      setStatusMessage('Failed to initialize. Please try again.');
    }
  };

  const startListening = async () => {
    try {
      setIsListening(true);
      setStatus('listening');
      setStatusMessage('Listening... Describe your emergency');
      
      // In a real app, you would use speech-to-text here
      // For now, we'll simulate listening for 5 seconds
      setTimeout(() => {
        stopListening();
      }, 5000);
    } catch (error) {
      console.error('Listening error:', error);
      setIsListening(false);
      Alert.alert('Error', 'Failed to start listening');
    }
  };

  const stopListening = async () => {
    setIsListening(false);
    setStatus('processing');
    setStatusMessage('Processing your request...');
    
    // Simulate processing
    setTimeout(() => {
      speakResponse();
    }, 1000);
  };

  const speakResponse = async () => {
    try {
      setIsSpeaking(true);
      setStatus('speaking');
      setStatusMessage('Speaking: "Emergency services have been notified. Help is on the way."');
      
      // Simulate speaking for 3 seconds
      setTimeout(() => {
        setIsSpeaking(false);
        setStatus('completed');
        setStatusMessage('Emergency assistance activated');
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      }, 3000);
    } catch (error) {
      console.error('Speaking error:', error);
      setIsSpeaking(false);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Status Indicator */}
        <Animated.View style={[styles.statusIndicator, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[
            styles.statusDot,
            {
              backgroundColor: 
                status === 'listening' ? '#3b82f6' :
                status === 'speaking' ? '#10b981' :
                status === 'processing' ? '#f59e0b' :
                status === 'completed' ? '#10b981' :
                '#ef4444'
            }
          ]} />
        </Animated.View>

        {/* Main Icon */}
        <View style={styles.iconContainer}>
          {status === 'listening' && (
            <MaterialCommunityIcons name="microphone" size={64} color="#3b82f6" />
          )}
          {status === 'speaking' && (
            <MaterialCommunityIcons name="speaker" size={64} color="#10b981" />
          )}
          {status === 'processing' && (
            <ActivityIndicator size="large" color="#f59e0b" />
          )}
          {status === 'completed' && (
            <MaterialCommunityIcons name="check-circle" size={64} color="#10b981" />
          )}
        </View>

        {/* Status Message */}
        <Text style={styles.statusText}>{statusMessage}</Text>

        {/* Location Info */}
        {locationAddress && (
          <View style={styles.locationCard}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#ef4444" />
            <Text style={styles.locationText}>{locationAddress}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {isListening && (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopListening}
            >
              <MaterialCommunityIcons name="stop-circle" size={24} color="#fff" />
              <Text style={styles.buttonText}>Stop Listening</Text>
            </TouchableOpacity>
          )}
          
          {!isListening && !isSpeaking && status !== 'completed' && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={startListening}
            >
              <MaterialCommunityIcons name="microphone" size={24} color="#fff" />
              <Text style={styles.buttonText}>Start Listening</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statusIndicator: {
    marginBottom: 40,
  },
  statusDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  iconContainer: {
    marginBottom: 40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 24,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stopButton: {
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
});
