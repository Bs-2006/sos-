import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Animated,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import * as Location from 'expo-location';
import { getAddressFromCoordinates } from '../utils/locationUtils';

export default function EmergencyCallScreen({ navigation, route }) {
  const { situation: voiceSituation, voiceActivated, activateChatbot } = route?.params || {};
  const [callStatus, setCallStatus] = useState('initiating'); // initiating, calling, completed
  const [timer, setTimer] = useState(0);
  const [emergencyId, setEmergencyId] = useState(null);
  const [emergencyNumbers, setEmergencyNumbers] = useState([]);
  const [aiCallStatus, setAiCallStatus] = useState([]); // Track AI call status for each contact
  const [locationAddress, setLocationAddress] = useState('Getting location...');
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [callSequence, setCallSequence] = useState([
    { name: 'Preparing Emergency', status: 'pending', icon: 'shield-alert' },
    { name: 'AI Calling Contacts', status: 'pending', icon: 'robot' },
    { name: 'SMS Alerts', status: 'pending', icon: 'message-alert' }
  ]);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // If chatbot should be auto-activated, show voice assistant
    if (activateChatbot) {
      setTimeout(() => {
        setShowVoiceAssistant(true);
      }, 2000);
    }

    // Initialize emergency call
    initiateEmergencyCall();

    // Start timer
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const initiateEmergencyCall = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      // Get user location
      let location = { latitude: 0, longitude: 0 };
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          
          // Get readable address
          const address = await getAddressFromCoordinates(location.latitude, location.longitude);
          setLocationAddress(address);
        }
      } catch (locError) {
        console.log('Could not get location:', locError);
        setLocationAddress('Location unavailable');
      }

      // Load emergency numbers configured by admin
      const storedNumbers = await AsyncStorage.getItem('emergencyNumbers');
      let numbersToCall = [];
      
      if (storedNumbers) {
        const allNumbers = JSON.parse(storedNumbers);
        numbersToCall = allNumbers.filter(num => num.enabled);
        setEmergencyNumbers(numbersToCall);
        console.log('Loaded emergency numbers:', numbersToCall.length);
      } else {
        numbersToCall = [
          { name: 'Ambulance', number: '108', icon: 'ambulance' },
          { name: 'Police', number: '100', icon: 'police-badge' }
        ];
        console.log('Using default emergency numbers');
      }

      // Try to create emergency record
      let emergencyIdValue = `emergency_${Date.now()}`;
      try {
        const response = await fetch(`${API_URL}/api/emergency/initiate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: user?._id,
            location,
            timestamp: new Date().toISOString()
          })
        });

        if (response.ok) {
          const data = await response.json();
          emergencyIdValue = data.emergencyId;
        }
      } catch (apiError) {
        console.log('API not available, continuing with local emergency call');
      }

      setEmergencyId(emergencyIdValue);

      // Step 1: Preparing
      updateCallSequenceStatus('Preparing Emergency', 'calling');
      
      setTimeout(() => {
        updateCallSequenceStatus('Preparing Emergency', 'completed');
      }, 1000);

      // Step 2: Use AI to call emergency contacts immediately
      setTimeout(async () => {
        updateCallSequenceStatus('AI Calling Contacts', 'calling');
        await makeAICallsToContacts(user, location);
      }, 1500);

      // Step 3: Send SMS alerts
      setTimeout(async () => {
        updateCallSequenceStatus('SMS Alerts', 'calling');
        await sendSMSAlerts(user, location);
      }, (numbersToCall.length * 2000) + 2000);

      setCallStatus('calling');

    } catch (error) {
      console.error('Emergency initiation error:', error);
      setCallStatus('calling');
    }
  };

  const makeAICallsToContacts = async (user, location) => {
    try {
      // Load emergency contacts
      let contacts = [];
      const localContacts = await AsyncStorage.getItem('emergencyContacts');
      if (localContacts) {
        contacts = JSON.parse(localContacts);
        console.log('Loaded emergency contacts:', contacts.length);
      }

      if (contacts.length === 0) {
        console.log('⚠️ No emergency contacts found in app, using fallback number from backend');
        
        // Call backend which will use EMERGENCY_CONTACT_NUMBER from .env
        try {
          const situation = voiceSituation || `Emergency alert from ${user?.name || 'LifeLink user'}. Location: ${location.latitude}, ${location.longitude}. Immediate assistance required.`;
          
          const response = await fetch(`${API_URL}/api/agents/call`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: null, // Backend will use EMERGENCY_CONTACT_NUMBER
              situation,
              context: 'Emergency contact - user has no contacts configured in app'
            }),
          });

          const responseData = await response.json();
          
          if (response.ok) {
            console.log('✅ Fallback emergency call initiated:', responseData.callSid);
            Alert.alert(
              'Emergency Call Initiated',
              'Calling emergency contact. Please add your own emergency contacts in settings.',
              [{ text: 'OK' }]
            );
          } else {
            console.error('Fallback call error:', responseData);
            throw new Error(responseData.error || 'Failed to initiate fallback call');
          }
        } catch (error) {
          console.error('Failed to call fallback number:', error.message);
          Alert.alert(
            'Call Error',
            'Could not initiate emergency call. Please ensure you have added emergency contacts.',
            [{ text: 'OK' }]
          );
        }
        
        updateCallSequenceStatus('AI Calling Contacts', 'completed');
        return;
      }

      // Limit to 3 emergency contacts for simultaneous calling
      const contactsToCall = contacts.slice(0, 3);
      console.log(`Calling ${contactsToCall.length} emergency contacts simultaneously (max 3)`);

      // Build situation description
      const situation = voiceSituation || `Emergency alert from ${user?.name || 'LifeLink user'}. Location: ${locationAddress}. Immediate assistance required.`;
      const context = voiceActivated 
        ? `${user?.name || 'User'} activated voice emergency and described their situation as: "${voiceSituation}". Please listen carefully and provide immediate assistance.`
        : 'Emergency contact who needs to provide immediate assistance';

      // Initialize call status tracking for up to 3 contacts
      const initialStatus = contactsToCall.map(contact => ({
        name: contact.name,
        phone: contact.phone,
        relation: contact.relation || 'Emergency Contact',
        status: 'initiating',
        callSid: null
      }));
      setAiCallStatus(initialStatus);

      // Make AI calls to all contacts SIMULTANEOUSLY (not sequentially)
      const callPromises = contactsToCall.map(async (contact, index) => {
        try {
          // Ensure phone number is in E.164 format
          let phoneNumber = contact.phone;
          
          // Remove all non-digit characters
          const cleaned = phoneNumber.replace(/\D/g, '');
          
          // Format to E.164 format
          if (cleaned.length === 10) {
            // Indian 10-digit number
            phoneNumber = `+91${cleaned}`;
          } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
            // Indian number with country code
            phoneNumber = `+${cleaned}`;
          } else if (!phoneNumber.startsWith('+')) {
            // Add + if missing
            phoneNumber = `+${cleaned}`;
          }
          
          console.log(`[${index + 1}/3] Initiating AI call to ${contact.name} (${phoneNumber})...`);
          
          // Update status to calling
          setAiCallStatus(prev => prev.map((item, i) => 
            i === index ? { ...item, status: 'calling' } : item
          ));

          const response = await fetch(`${API_URL}/api/agents/call`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: phoneNumber,
              situation,
              context: `${context}. Contact name: ${contact.name}. Relationship: ${contact.relation || 'Emergency contact'}. This is an automated AI call explaining an emergency situation.`
            }),
          });

          const responseData = await response.json();
          
          if (!response.ok) {
            console.error(`API Error for ${contact.name}:`, responseData);
            throw new Error(responseData.error || `Failed to call ${contact.name}`);
          }

          console.log(`✅ AI call initiated to ${contact.name}:`, responseData.callSid);

          // Update status to connected
          setAiCallStatus(prev => prev.map((item, i) => 
            i === index ? { ...item, status: 'connected', callSid: responseData.callSid } : item
          ));

          return { success: true, contact: contact.name, callSid: responseData.callSid };
        } catch (error) {
          console.error(`❌ Failed to call ${contact.name}:`, error.message);
          
          // Update status to failed
          setAiCallStatus(prev => prev.map((item, i) => 
            i === index ? { ...item, status: 'failed' } : item
          ));

          return { success: false, contact: contact.name, error: error.message };
        }
      });

      // Wait for all 3 calls to complete simultaneously
      const results = await Promise.all(callPromises);
      
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;

      console.log(`🎯 AI Calls completed: ${successCount} successful, ${failedCount} failed out of ${contactsToCall.length}`);
      
      updateCallSequenceStatus('AI Calling Contacts', 'completed');

      // Show summary alert
      setTimeout(() => {
        const message = successCount === contactsToCall.length
          ? `Successfully called all ${successCount} emergency contacts simultaneously!\n\nAI agents are now speaking with your contacts to inform them of the emergency and your location.`
          : `Called ${successCount} of ${contactsToCall.length} emergency contacts.\n\nAI agents are speaking with your contacts to inform them of the emergency.`;
        
        Alert.alert(
          '📞 AI Calls Initiated',
          message,
          [{ text: 'OK' }]
        );
      }, 1000);

      // If more than 3 contacts, notify user about remaining contacts
      if (contacts.length > 3) {
        console.log(`⚠️ ${contacts.length - 3} additional emergency contacts not called (max 3 simultaneous calls)`);
      }

    } catch (error) {
      console.error('Failed to make AI calls:', error);
      updateCallSequenceStatus('AI Calling Contacts', 'failed');
      
      // Don't show alert for AI calling failure - it's optional
      console.log('AI calling service unavailable - continuing with manual calls');
    }
  };

  const sendSMSAlerts = async (user, location) => {
    try {
      // Load emergency contacts
      let contacts = [];
      const localContacts = await AsyncStorage.getItem('emergencyContacts');
      if (localContacts) {
        contacts = JSON.parse(localContacts);
      }

      if (contacts.length === 0) {
        updateCallSequenceStatus('SMS Alerts', 'completed');
        return;
      }

      const situation = `Emergency alert from ${user?.name || 'LifeLink user'}. Location: ${locationAddress}. Immediate assistance required.`;
      const context = 'Emergency contact who needs to provide immediate assistance';

      // Prepare recipients for bulk SMS
      const recipients = contacts.map(contact => ({
        to: contact.phone,
        recipientName: contact.name
      }));

      console.log(`Sending SMS to ${recipients.length} contacts...`);

      const response = await fetch(`${API_URL}/api/agents/message/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients,
          situation,
          context
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`SMS sent: ${data.sent.length} successful, ${data.failed.length} failed`);
        updateCallSequenceStatus('SMS Alerts', 'completed');
      } else {
        throw new Error('Failed to send SMS');
      }

    } catch (error) {
      console.error('Failed to send SMS alerts:', error);
      updateCallSequenceStatus('SMS Alerts', 'failed');
      // Don't show alert - SMS is optional, manual calling still works
      console.log('SMS service unavailable - continuing with manual calls');
    }
  };

  const updateCallSequenceStatus = (name, status) => {
    setCallSequence(prev => 
      prev.map(call => 
        call.name === name ? { ...call, status } : call
      )
    );
  };

  const endCall = async () => {
    Alert.alert(
      'End Emergency Call?',
      'Are you sure you want to end the emergency call?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              
              // Try to end call via API
              try {
                await fetch(`${API_URL}/api/emergency/end`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    emergencyId,
                    duration: timer
                  })
                });
              } catch (apiError) {
                console.log('Could not end call via API');
              }

              setCallStatus('completed');
              setTimeout(() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('HomeScreen');
                }
              }, 2000);
            } catch (error) {
              console.log('Error ending call:', error);
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('HomeScreen');
              }
            }
          }
        }
      ]
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerText}>EMERGENCY CALL</Text>
          <View style={styles.recordingBadge}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>RECORDING</Text>
          </View>
        </View>

        <Animated.View style={[styles.emergencyIcon, { transform: [{ scale: pulseAnim }] }]}>
          <MaterialCommunityIcons name="phone-alert" size={80} color="#0f172a" />
        </Animated.View>

        <Text style={styles.statusText}>
          {callStatus === 'initiating' && 'Initiating emergency response...'}
          {callStatus === 'calling' && 'AI agents calling your emergency contacts'}
          {callStatus === 'completed' && 'Emergency session ended'}
        </Text>

        <Text style={styles.timer}>{formatTime(timer)}</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Emergency Response Status</Text>
          
          {/* Show emergency service numbers being called */}
          {emergencyNumbers.length > 0 && (
            <View style={styles.emergencyNumbersSection}>
              <Text style={styles.sectionLabel}>Emergency Services:</Text>
              {emergencyNumbers.map((service, index) => (
                <View key={index} style={styles.serviceRow}>
                  <MaterialCommunityIcons name={service.icon} size={16} color={service.color} />
                  <Text style={styles.serviceText}>{service.name} - {service.number}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Call sequence status */}
          <ScrollView style={styles.sequenceScroll} nestedScrollEnabled>
            {callSequence.map((call, index) => (
              <View key={index} style={styles.infoRow}>
                <MaterialCommunityIcons 
                  name={
                    call.status === 'pending' ? 'clock-outline' :
                    call.status === 'calling' ? 'phone-in-talk' :
                    call.status === 'completed' ? 'check-circle' :
                    call.status === 'failed' ? 'alert-circle' :
                    'alert-circle'
                  }
                  size={20} 
                  color={
                    call.status === 'pending' ? '#64748b' :
                    call.status === 'calling' ? '#fbbf24' :
                    call.status === 'completed' ? '#10b981' :
                    '#ef4444'
                  }
                />
                <Text style={[
                  styles.infoText,
                  call.status === 'calling' && styles.infoTextActive,
                  call.status === 'completed' && styles.infoTextCompleted
                ]}>
                  {call.name}
                  {call.status === 'calling' && ' - In Progress...'}
                  {call.status === 'completed' && ' - Completed'}
                  {call.status === 'failed' && ' - Failed'}
                </Text>
              </View>
            ))}

            {/* Show individual AI call status */}
            {aiCallStatus.length > 0 && (
              <View style={styles.aiCallsSection}>
                <Text style={styles.sectionLabel}>
                  🤖 AI Calling {aiCallStatus.length} Emergency Contact{aiCallStatus.length !== 1 ? 's' : ''} (Simultaneously)
                </Text>
                {aiCallStatus.map((call, index) => (
                  <View key={index} style={styles.aiCallRow}>
                    <View style={styles.aiCallNumber}>
                      <Text style={styles.aiCallNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.aiCallInfo}>
                      <Text style={styles.aiCallName}>{call.name}</Text>
                      <Text style={styles.aiCallPhone}>{call.phone}</Text>
                      {call.relation && (
                        <Text style={styles.aiCallRelation}>{call.relation}</Text>
                      )}
                    </View>
                    <View style={styles.aiCallStatusContainer}>
                      <MaterialCommunityIcons 
                        name={
                          call.status === 'initiating' ? 'clock-outline' :
                          call.status === 'calling' ? 'phone-in-talk' :
                          call.status === 'connected' ? 'phone-check' :
                          'alert-circle'
                        }
                        size={18} 
                        color={
                          call.status === 'initiating' ? '#64748b' :
                          call.status === 'calling' ? '#3b82f6' :
                          call.status === 'connected' ? '#10b981' :
                          '#ef4444'
                        }
                      />
                      <Text style={[
                        styles.aiCallStatus,
                        call.status === 'calling' && styles.aiCallStatusCalling,
                        call.status === 'connected' && styles.aiCallStatusConnected,
                        call.status === 'failed' && styles.aiCallStatusFailed
                      ]}>
                        {call.status === 'initiating' && 'Initiating'}
                        {call.status === 'calling' && 'Calling'}
                        {call.status === 'connected' && 'Speaking'}
                        {call.status === 'failed' && 'Failed'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="microphone-off" size={28} color="#0f172a" />
            <Text style={styles.actionText}>Mute</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="volume-high" size={28} color="#0f172a" />
            <Text style={styles.actionText}>Speaker</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="map-marker" size={28} color="#0f172a" />
            <Text style={styles.actionText}>Location</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
          <MaterialCommunityIcons name="phone-hangup" size={32} color="#0f172a" />
          <Text style={styles.endCallText}>End Call</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          AI agents are calling up to 3 emergency contacts simultaneously to save time
        </Text>
      </View>

      {/* Voice Assistant Modal */}
      {showVoiceAssistant && (
        <View style={styles.voiceAssistantOverlay}>
          <View style={styles.voiceAssistantCard}>
            <TouchableOpacity 
              style={styles.closeVoiceAssistant}
              onPress={() => setShowVoiceAssistant(false)}
            >
              <MaterialCommunityIcons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            
            <MaterialCommunityIcons name="robot" size={48} color="#3b82f6" />
            <Text style={styles.voiceAssistantTitle}>AI Assistant Active</Text>
            <Text style={styles.voiceAssistantSubtitle}>Speaking with your emergency contacts</Text>
            
            <View style={styles.voiceIndicator}>
              <View style={[styles.voiceBar, { height: '40%' }]} />
              <View style={[styles.voiceBar, { height: '60%' }]} />
              <View style={[styles.voiceBar, { height: '80%' }]} />
              <View style={[styles.voiceBar, { height: '60%' }]} />
              <View style={[styles.voiceBar, { height: '40%' }]} />
            </View>
          </View>
        </View>
      )}
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
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
    letterSpacing: 2,
  },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  recordingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  emergencyIcon: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 16,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#0f172a',
    fontVariant: ['tabular-nums'],
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxHeight: 300,
  },
  sequenceScroll: {
    maxHeight: 200,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  infoTextActive: {
    color: '#fbbf24',
    fontWeight: '600',
  },
  infoTextCompleted: {
    color: '#10b981',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 16,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  endCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 12,
    width: '100%',
  },
  endCallText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  disclaimer: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  emergencyNumbersSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  serviceText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  aiCallsSection: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  aiCallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  aiCallNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCallNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  aiCallInfo: {
    flex: 1,
  },
  aiCallName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  aiCallPhone: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  aiCallRelation: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
    fontStyle: 'italic',
  },
  aiCallStatusContainer: {
    alignItems: 'center',
    gap: 4,
  },
  aiCallStatus: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  aiCallStatusCalling: {
    color: '#3b82f6',
  },
  aiCallStatusConnected: {
    color: '#10b981',
  },
  aiCallStatusFailed: {
    color: '#ef4444',
  },
  aiCallText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  voiceAssistantOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  voiceAssistantCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  closeVoiceAssistant: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceAssistantTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  voiceAssistantSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  voiceIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    height: 60,
    marginTop: 12,
  },
  voiceBar: {
    width: 4,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
});
