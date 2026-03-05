import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import EmergencyChatbot from '../components/EmergencyChatbot';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EmergencyChatbotScreen({ navigation }) {
  const [showChatbot, setShowChatbot] = useState(true);
  const [emergencyData, setEmergencyData] = useState(null);

  const handleEmergencyDetected = async (assessment) => {
    try {
      setEmergencyData(assessment);

      // Only proceed if user confirmed emergency contact call
      if (assessment.conversationStage !== 'emergency_contact_confirmed') {
        return;
      }

      // Get emergency contacts
      const contactsStr = await AsyncStorage.getItem('emergencyContacts');
      const contacts = contactsStr ? JSON.parse(contactsStr) : [];

      if (contacts.length === 0) {
        Alert.alert(
          'No Emergency Contacts',
          'Please add emergency contacts before activating emergency.',
          [
            { text: 'Add Contacts', onPress: () => navigation.navigate('EmergencyContactsSetup') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      // Navigate to emergency call screen
      navigation.replace('EmergencyCall', {
        situation: assessment.courseOfAction?.summary || `Emergency: ${assessment.symptoms.join(', ')}`,
        voiceActivated: false,
        contacts: contacts,
        location: null,
        autoTriggered: true,
        symptoms: assessment.symptoms,
        severity: assessment.severity,
        recommendedHospitals: assessment.recommendedHospitals
      });
    } catch (error) {
      console.error('Error handling emergency:', error);
      Alert.alert('Error', 'Failed to activate emergency services.');
    }
  };

  const handleCloseChatbot = () => {
    Alert.alert(
      'Close Emergency Assistant?',
      'Are you sure you want to close the emergency assistant?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          style: 'destructive',
          onPress: () => {
            setShowChatbot(false);
            navigation.goBack();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {showChatbot ? (
        <EmergencyChatbot
          onEmergencyDetected={handleEmergencyDetected}
          onClose={handleCloseChatbot}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="robot" size={64} color="#cbd5e1" />
          <Text style={styles.emptyText}>Emergency Assistant Closed</Text>
          <TouchableOpacity
            style={styles.reopenButton}
            onPress={() => setShowChatbot(true)}
          >
            <Text style={styles.reopenButtonText}>Reopen Assistant</Text>
          </TouchableOpacity>
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  reopenButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#ef4444',
    borderRadius: 8,
  },
  reopenButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
