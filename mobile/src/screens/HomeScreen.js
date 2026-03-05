import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { API_URL } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';
import SettingsService from '../services/SettingsService';
import SOSService from '../services/SOSService';
import ChatbotButton from '../components/ChatbotButton';
import BottomNavigation from '../components/BottomNavigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [pulseAnim] = useState(new Animated.Value(1));
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Checking...');
  const [userData, setUserData] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastTestDate, setLastTestDate] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  
  // Countdown timer states
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const countdownInterval = useRef(null);

  // Pulse animation for SOS button
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    
    // Initialize settings service
    SettingsService.loadSettings().then(() => {
      SettingsService.applySettings();
      SettingsService.setSOSTriggerCallback((trigger) => {
        console.log('SOS triggered by:', trigger);
        handleSOSPress();
      });
    });
    
    return () => {
      pulse.stop();
      // Cleanup countdown interval on unmount
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
      SettingsService.cleanup();
    };
  }, []);

  // Check location status
  useEffect(() => {
    checkLocationStatus();
    loadUserData();
    loadEmergencyContacts();
  }, [checkLocationStatus, loadUserData, loadEmergencyContacts]);

  // Reload contacts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadEmergencyContacts();
    }, [loadEmergencyContacts])
  );

  const loadUserData = useCallback(async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserData(user);
      }
      
      // Check backend connectivity
      try {
        const response = await fetch(`${API_URL}/health`, { timeout: 5000 });
        setIsOnline(response.ok);
      } catch (error) {
        setIsOnline(false);
        console.log('Backend offline, running in local mode');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEmergencyContacts = useCallback(async () => {
    try {
      // Always load from local storage first (primary source)
      const localContacts = await AsyncStorage.getItem('emergencyContacts');
      console.log('📱 Checking AsyncStorage for emergencyContacts...');
      console.log('Raw value:', localContacts);
      
      if (localContacts) {
        try {
          const contacts = JSON.parse(localContacts);
          console.log('✅ Loaded emergency contacts from local storage:', contacts.length, 'contacts');
          console.log('Contacts:', contacts);
          setEmergencyContacts(contacts);
        } catch (parseError) {
          console.error('❌ Error parsing emergency contacts:', parseError);
          setEmergencyContacts([]);
        }
      } else {
        console.log('⚠️ No emergency contacts found in AsyncStorage');
        setEmergencyContacts([]);
      }

      // Then try to sync with backend (optional)
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const response = await fetch(`${API_URL}/api/users/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            timeout: 5000,
          });

          if (response.ok) {
            const data = await response.json();
            if (data.emergencyContacts && data.emergencyContacts.length > 0) {
              console.log('🔄 Syncing emergency contacts from backend:', data.emergencyContacts.length);
              setEmergencyContacts(data.emergencyContacts);
              // Update local storage with backend data
              await AsyncStorage.setItem('emergencyContacts', JSON.stringify(data.emergencyContacts));
              console.log('✅ Synced emergency contacts from backend');
            }
            if (data.lastEmergencyTest) {
              setLastTestDate(new Date(data.lastEmergencyTest));
            }
            setIsOnline(true);
          }
        }
      } catch (backendError) {
        console.log('Backend unavailable, using local contacts');
        setIsOnline(false);
      }
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
      setIsOnline(false);
    }
  }, []);

  const checkLocationStatus = useCallback(async () => {
    try {
      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setLocationStatus('Disabled');
        return;
      }

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('No Permission');
        return;
      }

      // Get current location
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setLocationStatus('Active');
    } catch (error) {
      console.log('Location check error:', error);
      setLocationStatus('Error');
    }
  }, []);

  const handleLocationPress = async () => {
    // Navigate to UserLocation screen
    navigation.navigate('UserLocation');
  };

  const openInMaps = () => {
    if (location) {
      const url = Platform.select({
        ios: `maps:0,0?q=${location.latitude},${location.longitude}`,
        android: `geo:0,0?q=${location.latitude},${location.longitude}`,
        default: `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`,
      });
      Linking.openURL(url);
    }
  };

  const handleSOSPress = async () => {
    console.log('🆘 SOS Button Pressed');
    
    // Check if emergency contacts exist
    const contactsStr = await AsyncStorage.getItem('emergencyContacts');
    const emergencyContacts = contactsStr ? JSON.parse(contactsStr) : [];
    
    if (emergencyContacts.length === 0) {
      Alert.alert(
        'No Emergency Contacts',
        'Please add emergency contacts before using SOS.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Contacts', onPress: () => navigation.navigate('EmergencyContactsSetup') },
        ]
      );
      return;
    }

    // Show 5-second countdown
    setShowCountdown(true);
    setCountdown(5);
    
    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current);
          setShowCountdown(false);
          // Activate SOS after countdown
          triggerSOSEmergency();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    setShowCountdown(false);
    setCountdown(5);
  };

  const triggerSOSEmergency = async () => {
    try {
      console.log('🚀 Triggering SOS Emergency via SOSService...');
      
      // Activate SOS using the service
      const result = await SOSService.activateSOS();

      if (result.success) {
        console.log('✅ SOS activated successfully');
        
        // Navigate to emergency call screen with results
        navigation.navigate('EmergencyCall', {
          situation: result.situation,
          voiceActivated: false,
          contacts: result.contacts,
          location: result.location,
          autoTriggered: true,
          sosInitiated: true,
          emergencyId: result.emergencyId,
          callResults: result.callResults,
          successCount: result.successCount,
          failureCount: result.failureCount,
          isLoading: false
        });
      } else {
        console.error('❌ SOS activation failed:', result.error);
        Alert.alert(
          'Error',
          result.error || 'Failed to initiate emergency calls. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error triggering SOS:', error);
      Alert.alert(
        'Error',
        'Could not trigger emergency. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>LifeLink</Text>
          <Text style={styles.appSubtitle}>
            {userData ? `Welcome, ${userData.name}` : 'Emergency SOS'}
          </Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialCommunityIcons 
              name={locationStatus === 'Active' ? 'wifi' : 'wifi-off'} 
              size={20} 
              color={locationStatus === 'Active' ? '#10b981' : '#94a3b8'} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialCommunityIcons name="battery-80" size={20} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <MaterialCommunityIcons name="bell-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Safe Status Banner */}
      <View style={[styles.statusBanner, !isOnline && styles.statusBannerOffline]}>
        <MaterialCommunityIcons 
          name={isOnline ? "check-circle" : "cloud-off-outline"} 
          size={20} 
          color={isOnline ? "#10b981" : "#f59e0b"} 
        />
        <Text style={[styles.statusText, !isOnline && styles.statusTextOffline]}>
          {isOnline ? "You are safe" : "Offline Mode - Emergency features active"}
        </Text>
        <TouchableOpacity 
          style={styles.refreshBtn}
          onPress={() => {
            loadUserData();
            loadEmergencyContacts();
            checkLocationStatus();
          }}
        >
          <MaterialCommunityIcons 
            name="refresh" 
            size={18} 
            color={isOnline ? "#065f46" : "#92400e"} 
          />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* SOS Button */}
        <View style={styles.sosContainer}>
          <View style={styles.pulseRing1} />
          <View style={styles.pulseRing2} />
          <Animated.View style={[styles.sosButtonWrapper, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity
              style={styles.sosButton}
              onPress={handleSOSPress}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="shield-alert" size={56} color="#fff" />
              <Text style={styles.sosText}>SOS</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Text style={styles.instruction}>Tap the SOS button to alert your{'\n'}emergency contacts</Text>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('ViewEmergencyContacts')}
          >
            <MaterialCommunityIcons name="shield-account" size={24} color="#64748b" />
            <Text style={styles.statNumber}>{emergencyContacts.length}</Text>
            <Text style={styles.statLabel}>Contacts</Text>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="bell-ring" size={24} color="#64748b" />
            <Text style={styles.statNumber}>
              {lastTestDate ? getTimeAgo(lastTestDate) : 'Never'}
            </Text>
            <Text style={styles.statLabel}>Last Test</Text>
          </View>

          <TouchableOpacity 
            style={styles.statCard}
            onPress={handleLocationPress}
          >
            <MaterialCommunityIcons 
              name={locationStatus === 'Active' ? 'map-marker-check' : 'map-marker-off'} 
              size={24} 
              color={locationStatus === 'Active' ? '#10b981' : '#94a3b8'} 
            />
            <Text style={styles.statNumber}>{locationStatus}</Text>
            <Text style={styles.statLabel}>Location</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chatbot Button */}
      <ChatbotButton />

      {/* Bottom Navigation */}
      <BottomNavigation navigation={navigation} activeRoute="HomeScreen" />

      {/* Countdown Modal */}
      <Modal
        visible={showCountdown}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelCountdown}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.countdownContainer}>
            <MaterialCommunityIcons name="alert-circle" size={80} color="#ef4444" />
            
            <Text style={styles.countdownTitle}>Emergency SOS Activated</Text>
            <Text style={styles.countdownSubtitle}>
              AI agent will call your emergency contacts in
            </Text>
            
            <View style={styles.countdownCircle}>
              <Text style={styles.countdownNumber}>{countdown}</Text>
            </View>
            
            <Text style={styles.countdownInfo}>
              • AI will call {emergencyContacts.length} emergency contact(s){'\n'}
              • AI will explain your emergency situation{'\n'}
              • Your location will be shared
            </Text>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={cancelCountdown}
            >
              <MaterialCommunityIcons name="close-circle" size={24} color="#fff" />
              <Text style={styles.cancelButtonText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  appSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 10,
  },
  statusBannerOffline: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
  },
  statusTextOffline: {
    color: '#92400e',
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 95, 70, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  sosContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  pulseRing1: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.65,
    height: SCREEN_WIDTH * 0.65,
    borderRadius: SCREEN_WIDTH * 0.325,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  pulseRing2: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.52,
    height: SCREEN_WIDTH * 0.52,
    borderRadius: SCREEN_WIDTH * 0.26,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  sosButtonWrapper: {
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  sosButton: {
    width: SCREEN_WIDTH * 0.42,
    height: SCREEN_WIDTH * 0.42,
    borderRadius: SCREEN_WIDTH * 0.21,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 6,
    letterSpacing: 4,
  },
  instruction: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 110,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 10,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  countdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  countdownTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 20,
    textAlign: 'center',
  },
  countdownSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  countdownCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 32,
    borderWidth: 8,
    borderColor: '#fee2e2',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  countdownNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#fff',
  },
  countdownInfo: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
});
