import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export default function TextEmergencyScreen({ navigation }) {
  const [situation, setSituation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const quickSituations = [
    { text: 'I fell and hurt myself', icon: 'human-handsdown' },
    { text: 'Medical emergency - chest pain', icon: 'heart-pulse' },
    { text: 'Car accident', icon: 'car-crash' },
    { text: 'Feeling unsafe', icon: 'shield-alert' },
    { text: 'Need immediate help', icon: 'alert-circle' },
  ];

  const handleSubmit = async () => {
    if (!situation.trim()) {
      Alert.alert('Required', 'Please describe your emergency');
      return;
    }

    setIsProcessing(true);

    try {
      // Get location
      const { status } = await Location.requestForegroundPermissionsAsync();
      let location = null;
      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({});
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      }

      // Navigate to emergency call screen with the situation
      navigation.replace('EmergencyCall', {
        situation: situation.trim(),
        voiceActivated: false,
      });
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Could not process emergency. Proceeding with standard call.');
      navigation.replace('EmergencyCall');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isProcessing}
          >
            <MaterialCommunityIcons name="close" size={28} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Describe Emergency</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#ef4444" />
          
          <Text style={styles.title}>What's your emergency?</Text>
          <Text style={styles.subtitle}>
            Describe your situation so AI can explain it to your emergency contacts
          </Text>

          {/* Quick Situations */}
          <View style={styles.quickSituations}>
            <Text style={styles.quickTitle}>Quick Select:</Text>
            {quickSituations.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickButton}
                onPress={() => setSituation(item.text)}
              >
                <MaterialCommunityIcons name={item.icon} size={20} color="#3b82f6" />
                <Text style={styles.quickButtonText}>{item.text}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Text Input */}
          <TextInput
            style={styles.input}
            placeholder="Or type your emergency here..."
            placeholderTextColor="#94a3b8"
            value={situation}
            onChangeText={setSituation}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={200}
          />

          <Text style={styles.charCount}>{situation.length}/200</Text>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, !situation.trim() && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!situation.trim() || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="phone-alert" size={24} color="#fff" />
                <Text style={styles.submitButtonText}>Call Emergency Contacts</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              AI will call your emergency contacts and explain this situation to them
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  quickSituations: {
    width: '100%',
    marginBottom: 20,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  quickButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
    borderWidth: 2,
    borderColor: '#3b82f6',
    minHeight: 120,
    marginBottom: 8,
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    gap: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
});
