import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import EmergencyChatbotService from '../services/EmergencyChatbotService';

export default function EmergencyChatbot({ onEmergencyDetected, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    // Initialize chatbot with greeting
    setMessages([{
      id: '1',
      role: 'assistant',
      text: "Hello! I'm the LifeLink Emergency Assistant. I'm here to help you during this emergency. Can you describe what's happening?",
      timestamp: new Date()
    }]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    try {
      setIsLoading(true);

      // Add user message
      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: inputText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      const currentInput = inputText;
      setInputText('');

      // Get emergency contacts
      const contactsStr = await AsyncStorage.getItem('emergencyContacts');
      const emergencyContacts = contactsStr ? JSON.parse(contactsStr) : [];

      // Build conversation history for API
      const history = messages
        .filter(m => m.role === 'assistant')
        .map(m => ({ role: 'assistant', content: m.text }));

      // Call backend API
      const apiResponse = await fetch(`${API_URL}/api/agents/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          history: history,
          emergencyContacts: emergencyContacts,
        }),
      });

      if (!apiResponse.ok) {
        throw new Error('Failed to get response from AI agent');
      }

      const data = await apiResponse.json();

      // Add assistant response
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.reply || 'I apologize, I couldn\'t process that. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Update assessment with emergency data
      const updatedAssessment = {
        message: data.reply,
        emergencyTriggered: data.emergencyTriggered,
        lowMediumPainDetected: data.lowMediumPainDetected,
        courseOfAction: data.courseOfAction,
        hospitalRecommendations: data.hospitalRecommendations,
        severity: data.emergencyTriggered ? 'critical' : (data.lowMediumPainDetected ? 'medium' : 'low'),
        symptoms: data.symptoms || [],
        conversationStage: data.emergencyTriggered ? 'emergency_contact_confirmed' : 'symptoms_collected'
      };
      setAssessment(updatedAssessment);

      // Check if emergency was triggered
      if (data.emergencyTriggered && onEmergencyDetected) {
        setTimeout(() => {
          Alert.alert(
            '🚨 Emergency Confirmed',
            `Emergency services have been notified. Calling ${emergencyContacts.length} emergency contact(s).`,
            [{ text: 'OK' }]
          );
          onEmergencyDetected(updatedAssessment);
        }, 1000);
      }

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to process message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action) => {
    setInputText(action);
    // Simulate sending
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return 'alert-octagon';
      case 'high':
        return 'alert-circle';
      case 'medium':
        return 'alert';
      default:
        return 'information';
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="robot" size={24} color="#ef4444" />
          <Text style={styles.headerTitle}>Emergency Assistant</Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <MaterialCommunityIcons name="close" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Assessment Status */}
      {assessment && assessment.severity && (
        <View style={[styles.assessmentCard, { borderLeftColor: getSeverityColor(assessment.severity) }]}>
          <View style={styles.assessmentHeader}>
            <MaterialCommunityIcons
              name={getSeverityIcon(assessment.severity)}
              size={20}
              color={getSeverityColor(assessment.severity)}
            />
            <Text style={[styles.assessmentTitle, { color: getSeverityColor(assessment.severity) }]}>
              {assessment.severity.toUpperCase()} - {assessment.symptoms.join(', ')}
            </Text>
          </View>
          {assessment.courseOfAction && (
            <Text style={styles.assessmentSummary}>
              {assessment.courseOfAction.summary}
            </Text>
          )}
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageWrapper,
              message.role === 'user' ? styles.userMessageWrapper : styles.assistantMessageWrapper
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userMessage : styles.assistantMessage
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.role === 'user' ? styles.userMessageText : styles.assistantMessageText
                ]}
              >
                {message.text}
              </Text>
            </View>
          </View>
        ))}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ef4444" />
            <Text style={styles.loadingText}>Analyzing your symptoms...</Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsLabel}>Quick Actions:</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('I have severe chest pain')}
            >
              <MaterialCommunityIcons name="heart" size={20} color="#ef4444" />
              <Text style={styles.quickActionText}>Chest Pain</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('I fell down and have injuries')}
            >
              <MaterialCommunityIcons name="human-handsdown" size={20} color="#f97316" />
              <Text style={styles.quickActionText}>Fall</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('I think I am having a stroke')}
            >
              <MaterialCommunityIcons name="brain" size={20} color="#3b82f6" />
              <Text style={styles.quickActionText}>Stroke</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('I am choking')}
            >
              <MaterialCommunityIcons name="throat" size={20} color="#8b5cf6" />
              <Text style={styles.quickActionText}>Choking</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Describe your symptoms..."
          placeholderTextColor="#94a3b8"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={isLoading || !inputText.trim()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialCommunityIcons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  assessmentCard: {
    marginHorizontal: 12,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assessmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  assessmentTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  assessmentSummary: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  messageWrapper: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  assistantMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  userMessage: {
    backgroundColor: '#ef4444',
  },
  assistantMessage: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#0f172a',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748b',
  },
  quickActionsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  quickActionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    gap: 6,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0f172a',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
});
