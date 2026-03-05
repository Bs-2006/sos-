import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from '../hooks/useTranslation';
import FallDetectionService from '../services/FallDetectionService';

export default function FallDetectionSettingsScreen({ navigation }) {
  const { t } = useTranslation();
  const [isEnabled, setIsEnabled] = useState(false);
  const [sensitivity, setSensitivity] = useState('medium');
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await FallDetectionService.loadSettings();
    setIsEnabled(settings.enabled);
    setSensitivity(settings.sensitivity);
    
    const contacts = await FallDetectionService.getEmergencyContacts();
    setEmergencyContacts(contacts);
  };

  const handleToggle = async (value) => {
    if (value && emergencyContacts.length === 0) {
      Alert.alert(
        'Add Emergency Contacts',
        'Please add at least one emergency contact before enabling fall detection.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsEnabled(value);
    await FallDetectionService.saveSettings(value, sensitivity);
    
    if (value) {
      Alert.alert(
        'Fall Detection Enabled',
        'Your device will now monitor for falls and automatically alert emergency services if needed.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSensitivityChange = async (level) => {
    setSensitivity(level);
    await FallDetectionService.saveSettings(isEnabled, level);
  };

  const handleAddContact = () => {
    navigation.navigate('EmergencyContactsSetup');
  };

  const handleTestFallDetection = () => {
    Alert.alert(
      'Test Fall Detection',
      'This will simulate a fall detection. The fall detected screen will appear with a 10-second countdown.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test',
          onPress: () => {
            navigation.navigate('FallDetected');
          },
        },
      ]
    );
  };

  const sensitivityLevels = [
    { 
      id: 'low', 
      label: 'Low', 
      description: 'Only extremely severe falls (Recommended)',
      icon: 'speedometer-slow',
    },
    { 
      id: 'medium', 
      label: 'Medium', 
      description: 'Very strong impacts only',
      icon: 'speedometer-medium',
    },
    { 
      id: 'high', 
      label: 'High', 
      description: 'Strong falls (May trigger occasionally)',
      icon: 'speedometer',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fall Detection</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="shield-alert" size={48} color="#ef4444" />
          <Text style={styles.infoTitle}>Stay Protected</Text>
          <Text style={styles.infoText}>
            Fall detection uses advanced sensors to detect serious falls with strong impact. The system requires a clear free fall pattern followed by significant impact and vertical movement. Only dangerous falls will trigger alerts. If detected and you don't respond within 10 seconds, emergency services will be contacted.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.toggleCard}>
            <View style={styles.toggleLeft}>
              <MaterialCommunityIcons 
                name={isEnabled ? "shield-check" : "shield-off"} 
                size={24} 
                color={isEnabled ? "#10b981" : "#64748b"} 
              />
              <View style={styles.toggleContent}>
                <Text style={styles.toggleTitle}>Enable Fall Detection</Text>
                <Text style={styles.toggleSubtitle}>
                  {isEnabled ? 'Active and monitoring' : 'Currently disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={handleToggle}
              trackColor={{ false: '#334155', true: '#10b981' }}
              thumbColor={isEnabled ? '#fff' : '#94a3b8'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sensitivity Level</Text>
          <Text style={styles.sectionSubtitle}>
            Adjust how sensitive the fall detection should be
          </Text>
          
          {sensitivityLevels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.sensitivityCard,
                sensitivity === level.id && styles.sensitivityCardActive,
              ]}
              onPress={() => handleSensitivityChange(level.id)}
              disabled={!isEnabled}
            >
              <View style={styles.sensitivityLeft}>
                <View style={[
                  styles.sensitivityIcon,
                  sensitivity === level.id && styles.sensitivityIconActive,
                ]}>
                  <MaterialCommunityIcons 
                    name={level.icon} 
                    size={24} 
                    color={sensitivity === level.id ? '#ef4444' : '#64748b'} 
                  />
                </View>
                <View style={styles.sensitivityContent}>
                  <Text style={[
                    styles.sensitivityLabel,
                    sensitivity === level.id && styles.sensitivityLabelActive,
                  ]}>
                    {level.label}
                  </Text>
                  <Text style={styles.sensitivityDescription}>
                    {level.description}
                  </Text>
                </View>
              </View>
              {sensitivity === level.id && (
                <MaterialCommunityIcons name="check-circle" size={24} color="#ef4444" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auto-Trigger Timer</Text>
          <View style={styles.timerCard}>
            <MaterialCommunityIcons name="timer-sand" size={24} color="#ef4444" />
            <View style={styles.timerContent}>
              <Text style={styles.timerLabel}>Response Time</Text>
              <Text style={styles.timerValue}>10 seconds (Fixed)</Text>
            </View>
            <View style={styles.timerBadge}>
              <Text style={styles.timerBadgeText}>OPTIMAL</Text>
            </View>
          </View>
          <Text style={styles.timerNote}>
            This is the optimal time to respond without delaying emergency help
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <Text style={styles.sectionSubtitle}>
            These contacts will be notified if a fall is detected
          </Text>
          
          {emergencyContacts.length > 0 ? (
            emergencyContacts.map((contact, index) => (
              <View key={index} style={styles.contactCard}>
                <View style={styles.contactIcon}>
                  <MaterialCommunityIcons name="account" size={24} color="#ef4444" />
                </View>
                <View style={styles.contactContent}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </View>
                <MaterialCommunityIcons name="phone" size={20} color="#10b981" />
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="account-alert" size={48} color="#64748b" />
              <Text style={styles.emptyText}>No emergency contacts added</Text>
            </View>
          )}
          
          <TouchableOpacity style={styles.addContactBtn} onPress={handleAddContact}>
            <MaterialCommunityIcons name="plus-circle" size={20} color="#ef4444" />
            <Text style={styles.addContactText}>Add Emergency Contact</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.testBtn, !isEnabled && styles.testBtnDisabled]} 
          onPress={handleTestFallDetection}
          disabled={!isEnabled}
        >
          <MaterialCommunityIcons 
            name="test-tube" 
            size={20} 
            color={isEnabled ? "#fff" : "#64748b"} 
          />
          <Text style={[styles.testBtnText, !isEnabled && styles.testBtnTextDisabled]}>
            Test Fall Detection
          </Text>
        </TouchableOpacity>

        <View style={styles.debugSection}>
          <Text style={styles.debugTitle}>Debug Information</Text>
          <Text style={styles.debugText}>
            Status: {isEnabled ? 'Enabled ✓' : 'Disabled ✗'}
          </Text>
          <Text style={styles.debugText}>
            Sensitivity: {sensitivity}
          </Text>
          <Text style={styles.debugText}>
            Emergency Contacts: {emergencyContacts.length}
          </Text>
          <Text style={styles.debugNote}>
            If fall detection is not working:
            {'\n'}1. Make sure it's enabled above
            {'\n'}2. Check that motion sensors are available
            {'\n'}3. Try the test button to verify navigation
            {'\n'}4. Check console logs for sensor data
          </Text>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 16,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  toggleContent: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  sensitivityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sensitivityCardActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
  },
  sensitivityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  sensitivityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensitivityIconActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  sensitivityContent: {
    flex: 1,
  },
  sensitivityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  sensitivityLabelActive: {
    color: '#ef4444',
  },
  sensitivityDescription: {
    fontSize: 12,
    color: '#94a3b8',
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  timerContent: {
    flex: 1,
  },
  timerLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 2,
  },
  timerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  timerBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timerBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#10b981',
    letterSpacing: 1,
  },
  timerNote: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    fontStyle: 'italic',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactContent: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: '#94a3b8',
  },
  emptyCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
  },
  addContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  addContactText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginTop: 32,
    marginBottom: 32,
    gap: 8,
  },
  testBtnDisabled: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  testBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  testBtnTextDisabled: {
    color: '#64748b',
  },
  debugSection: {
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#334155',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  debugText: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  debugNote: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
