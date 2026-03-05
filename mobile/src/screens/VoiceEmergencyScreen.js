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

export default function VoiceEmergencyScreen({ navigation, route }) {
  const { autoActivate } = route.params || {};
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('ready'); // ready, listening, processing, calling
  const [statusMessage, setStatusMessage] = useState('Tap to describe your emergency');
  const [pulseAnim] = useState(new Animated.Value(1));
  const [emergencySituation, setEmergencySituation] = useState('');
  const [location, setLocation] = useState(null);
  const recordingTimeoutRef = useRef(null);

  useEffect(() => {
    initializeScreen();
    
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);

  const initializeScreen = async () => {
    try {
      // Request permissions
      await requestPermissions();
      
      // Setup audio
      await setupAudio();
      
      // Get location
      await getLocation();
      
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
      
      // Auto-activate recording if triggered from SOS
      if (autoActivate) {
        setTimeout(() => {
          startRecording();
          // Auto-stop after 15 seconds
          recordingTimeoutRef.current = setTimeout(() => {
            stopRecording();
          }, 15000);
        }, 500);
      }
    } catch (error) {
      console.error('Failed to initialize screen:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      // Request microphone permission
      const { status: micStatus } = await Audio.requestPermissionsAsync();
      if (micStatus !== 'granted') {
        Alert.alert(
          'Microphone Permission Required',
          'Please enable microphone access in your device settings to use voice emergency.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  };

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        android: {
          interruptionMode: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          shouldDuckAndroid: true,
        },
      });
      return true;
    } catch (error) {
      console.error('Failed to setup audio:', error);
      return false;
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Failed to get location:', error);
    }
  };

  const startRecording = async () => {
    try {
      // Check permissions first
      const { status } = await Audio.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Audio.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'Microphone permission is required to use voice emergency. Please enable it in your device settings.'
          );
          return;
        }
      }

      // Setup audio mode
      await setupAudio();

      setIsRecording(true);
      setStatus('listening');
      setStatusMessage('🎤 Listening... Describe your emergency clearly');

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      
      setRecording(recording);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Could not start voice recording. Please check microphone permissions in your device settings.');
      setIsRecording(false);
      setStatus('ready');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) {
        console.warn('No recording in progress');
        setStatus('ready');
        return;
      }

      setIsRecording(false);
      setStatus('processing');
      setStatusMessage('Processing your emergency...');

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      // Process the audio
      await processEmergencyAudio(uri);
      
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Could not process recording');
      setStatus('ready');
      setRecording(null);
    }
  };

  const processEmergencyAudio = async (audioUri) => {
    try {
      setIsProcessing(true);

      // Get user data
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      // Load emergency contacts
      const contactsStr = await AsyncStorage.getItem('emergencyContacts');
      const contacts = contactsStr ? JSON.parse(contactsStr) : [];

      if (contacts.length === 0) {
        Alert.alert(
          'No Emergency Contacts',
          'Please add emergency contacts before using voice emergency.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      // Convert audio to base64
      const audioBlob = await fetch(audioUri).then(r => r.blob());
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        
        try {
          // Send to backend for speech-to-text and AI processing
          const response = await fetch(`${API_URL}/api/agents/voice-emergency`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              audio: base64Audio,
              userName: user?.name || 'User',
              location: location,
              contacts: contacts,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to process emergency');
          }

          const data = await response.json();
          
          setEmergencySituation(data.situation);
          setStatus('calling');
          setStatusMessage(`📞 Calling ${contacts.length} emergency contact(s)...`);

          // Show what was understood
          Alert.alert(
            '🚨 Emergency Detected',
            `Situation Understood:\n"${data.situation}"\n\nCalling your ${contacts.length} emergency contact(s) now...\n\nAI will explain the situation to them.`,
            [{ text: 'OK' }]
          );

          // Navigate to emergency call screen with the situation
          setTimeout(() => {
            navigation.replace('EmergencyCall', {
              situation: data.situation,
              voiceActivated: true,
              contacts: contacts,
              location: location,
            });
          }, 2000);
        } catch (error) {
          console.error('Failed to process emergency audio:', error);
          
          // Fallback: Use generic emergency message
          const genericSituation = 'Emergency SOS activated. User needs immediate assistance.';
          setEmergencySituation(genericSituation);
          setStatus('calling');
          setStatusMessage(`📞 Calling ${contacts.length} emergency contact(s)...`);
          
          Alert.alert(
            '🚨 Emergency Activated',
            `Calling your ${contacts.length} emergency contact(s)...\n\nAI will explain the emergency situation to them.`,
            [{ text: 'OK' }]
          );

          setTimeout(() => {
            navigation.replace('EmergencyCall', {
              situation: genericSituation,
              voiceActivated: true,
              contacts: contacts,
              location: location,
            });
          }, 2000);
        }
      };

      reader.readAsDataURL(audioBlob);

    } catch (error) {
      console.error('Failed to process emergency audio:', error);
      Alert.alert(
        'Processing Error',
        'Could not process your emergency. Proceeding with standard emergency call.',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('EmergencyCall'),
          },
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'listening': return '#3b82f6';
      case 'processing': return '#f59e0b';
      case 'calling': return '#10b981';
      default: return '#ef4444';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'listening': return 'microphone';
      case 'processing': return 'brain';
      case 'calling': return 'phone';
      default: return 'microphone-outline';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isRecording || isProcessing}
        >
          <MaterialCommunityIcons name="close" size={28} color="#64748b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Emergency</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Emergency Voice Assistant</Text>
        <Text style={styles.subtitle}>{statusMessage}</Text>

        {/* Voice Button */}
        <View style={styles.micContainer}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                backgroundColor: `${getStatusColor()}20`,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <TouchableOpacity
            style={[styles.micButton, { backgroundColor: getStatusColor() }]}
            onPress={handleMicPress}
            disabled={isProcessing || status === 'calling'}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <MaterialCommunityIcons
                name={getStatusIcon()}
                size={64}
                color="#fff"
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <View style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              Microphone is active - describe your emergency
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              AI understands your situation
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              AI calls contacts and explains the emergency
            </Text>
          </View>
        </View>

        {emergencySituation ? (
          <View style={styles.situationBox}>
            <MaterialCommunityIcons name="alert-circle" size={24} color="#ef4444" />
            <Text style={styles.situationText}>{emergencySituation}</Text>
          </View>
        ) : null}
      </View>

      {/* Status Indicator */}
      <View style={[styles.statusBar, { backgroundColor: getStatusColor() }]}>
        <MaterialCommunityIcons name={getStatusIcon()} size={20} color="#fff" />
        <Text style={styles.statusBarText}>{statusMessage}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 60,
    textAlign: 'center',
  },
  micContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
  },
  pulseRing: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  micButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  instructions: {
    width: '100%',
    gap: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: '#475569',
  },
  situationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 12,
  },
  situationText: {
    flex: 1,
    fontSize: 14,
    color: '#991b1b',
    fontWeight: '500',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  statusBarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
