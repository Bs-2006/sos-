import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export default function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Hello! I\'m your LifeLink assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [pulseAnim] = useState(new Animated.Value(1));
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  // Pulse animation for the button
  React.useEffect(() => {
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
    return () => pulse.stop();
  }, []);

  const handleSend = async () => {
    if (inputText.trim() === '') return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages([...messages, userMessage]);
    
    // Add to conversation history
    const newHistory = [...conversationHistory, { role: 'user', content: inputText }];
    setConversationHistory(newHistory);
    
    const currentInput = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      // Load emergency contacts from AsyncStorage
      const contactsStr = await AsyncStorage.getItem('emergencyContacts');
      const emergencyContacts = contactsStr ? JSON.parse(contactsStr) : [];
      
      // Call the AI agent API
      const response = await fetch(`${API_URL}/api/agents/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          history: newHistory,
          emergencyContacts: emergencyContacts,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI agent');
      }

      const data = await response.json();
      
      // Add bot response
      const botMessage = {
        id: messages.length + 2,
        text: data.reply || 'I apologize, I couldn\'t process that. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
        emergencyTriggered: data.emergencyTriggered,
      };
      
      setMessages((prev) => [...prev, botMessage]);
      
      // Update conversation history
      setConversationHistory([...newHistory, { role: 'assistant', content: data.reply }]);
      
      // Show alert if emergency was triggered
      if (data.emergencyTriggered) {
        setTimeout(() => {
          Alert.alert(
            'Emergency Alert Triggered',
            `Emergency services have been notified. Calling ${emergencyContacts.length} emergency contact(s).`,
            [{ text: 'OK' }]
          );
        }, 500);
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback to local responses
      const botResponse = getBotResponse(currentInput);
      const botMessage = {
        id: messages.length + 2,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getBotResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('sos') || input.includes('emergency')) {
      return 'To trigger an SOS alert, tap the red SOS button on the home screen. Make sure you have emergency contacts set up first.';
    } else if (input.includes('contact')) {
      return 'You can manage your emergency contacts by going to the Contacts tab in the bottom navigation.';
    } else if (input.includes('location') || input.includes('gps')) {
      return 'Your location is shared with emergency contacts when you trigger an SOS. Make sure location services are enabled in your device settings.';
    } else if (input.includes('help') || input.includes('how')) {
      return 'I can help you with:\n• Emergency SOS features\n• Managing contacts\n• Location settings\n• App navigation\n\nWhat would you like to know?';
    } else if (input.includes('test')) {
      return 'You can test the emergency system in Settings > Fall Detection Settings. Enable Test Mode to avoid sending real alerts.';
    } else {
      return 'I\'m here to help! You can ask me about emergency features, contacts, location settings, or general app usage.';
    }
  };

  return (
    <>
      {/* Floating Chatbot Button */}
      <Animated.View style={[styles.floatingButton, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => setIsOpen(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="robot" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Chatbot Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.chatContainer}>
            {/* Header */}
            <View style={styles.chatHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.botAvatar}>
                  <MaterialCommunityIcons name="robot" size={24} color="#fff" />
                </View>
                <View>
                  <Text style={styles.chatTitle}>LifeLink Assistant</Text>
                  <Text style={styles.chatStatus}>Online</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}
              >
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
            >
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    message.sender === 'user' ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  {message.emergencyTriggered && (
                    <View style={styles.emergencyBadge}>
                      <MaterialCommunityIcons name="alert-circle" size={14} color="#fff" />
                      <Text style={styles.emergencyBadgeText}>Emergency Alert Sent</Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      message.sender === 'user' ? styles.userText : styles.botText,
                    ]}
                  >
                    {message.text}
                  </Text>
                  <Text
                    style={[
                      styles.timestamp,
                      message.sender === 'user' ? styles.userTimestamp : styles.botTimestamp,
                    ]}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              ))}
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#3b82f6" />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </View>
              )}
            </ScrollView>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => setInputText('How do I use SOS?')}
                >
                  <Text style={styles.quickActionText}>How to use SOS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => setInputText('Add emergency contacts')}
                >
                  <Text style={styles.quickActionText}>Add contacts</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => setInputText('Location settings')}
                >
                  <Text style={styles.quickActionText}>Location help</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type your message..."
                placeholderTextColor="#94a3b8"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.sendButton, inputText.trim() === '' && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={inputText.trim() === ''}
              >
                <MaterialCommunityIcons
                  name="send"
                  size={20}
                  color={inputText.trim() === '' ? '#cbd5e1' : '#fff'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    zIndex: 1000,
  },
  chatButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  chatContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  chatStatus: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#0f172a',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  botTimestamp: {
    color: '#94a3b8',
  },
  quickActions: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  quickActionBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  quickActionText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 16,
    gap: 8,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 8,
  },
  emergencyBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
});
