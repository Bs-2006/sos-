import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from '../hooks/useTranslation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function EmergencyScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { autoTriggered = false, reason = null } = route.params || {};
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <MaterialCommunityIcons name="hospital-box" size={20} color="#ef4444" />
          <Text style={styles.logoText}>LIFELINK</Text>
        </View>
        <View style={styles.criticalBadge}>
          <Text style={styles.criticalText}>CRITICAL</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.pulseContainer}>
          <View style={styles.pulseOuter} />
          <View style={styles.pulseMiddle} />
          <View style={styles.countdownCircle}>
            <Text style={styles.countdownNumber}>{countdown}</Text>
            <Text style={styles.countdownLabel}>SECONDS</Text>
          </View>
        </View>

        <Text style={styles.title}>
          {autoTriggered && reason === 'fall_detected' ? 'Fall Detected - SOS Activated' : 'SOS Activated'}
        </Text>

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <MaterialCommunityIcons name="ambulance" size={24} color="#ef4444" />
            <Text style={styles.statusTitle}>
              {autoTriggered ? 'Auto-connecting to nearest ambulance...' : 'Connecting to nearest ambulance...'}
            </Text>
          </View>
          <Text style={styles.statusSubtitle}>
            {autoTriggered 
              ? 'Fall detected with no response. Sending your live location and medical profile encrypted to emergency responders.'
              : 'Sending your live location and medical profile encrypted to emergency responders.'
            }
          </Text>
        </View>

        <View style={styles.locationStatus}>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#94a3b8" />
            <Text style={styles.locationText}>TRACKING LIVE LOCATION</Text>
          </View>
          <View style={styles.locationProgress}>
            <View style={[styles.locationProgressFill, { width: '66%' }]} />
          </View>
        </View>
      </View>

      <View style={styles.bottom}>
        <View style={styles.profileCard}>
          <View style={styles.profileIcon}>
            <MaterialCommunityIcons name="medical-bag" size={20} color="#ef4444" />
          </View>
          <View>
            <Text style={styles.profileLabel}>PROFILE SHARED</Text>
            <Text style={styles.profileInfo}>Blood Type: O+ | Diabetic</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>I AM SAFE (CANCEL)</Text>
        </TouchableOpacity>

        <Text style={styles.autoTrigger}>AUTO-TRIGGERING IN {countdown} SECONDS</Text>
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
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 2,
  },
  criticalBadge: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  criticalText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ef4444',
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pulseContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  pulseOuter: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.64,
    height: SCREEN_WIDTH * 0.64,
    borderRadius: SCREEN_WIDTH * 0.32,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  pulseMiddle: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.48,
    height: SCREEN_WIDTH * 0.48,
    borderRadius: SCREEN_WIDTH * 0.24,
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  countdownCircle: {
    width: SCREEN_WIDTH * 0.4,
    height: SCREEN_WIDTH * 0.4,
    borderRadius: SCREEN_WIDTH * 0.2,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#e2e8f0',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  countdownNumber: {
    fontSize: SCREEN_WIDTH * 0.18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  countdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 3,
    marginTop: 4,
  },
  title: {
    fontSize: SCREEN_WIDTH * 0.09,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  statusCard: {
    backgroundcolor: '#0f172a',
    borderRadius: 16,
    padding: SCREEN_WIDTH * 0.06,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    maxWidth: 384,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  statusTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  locationStatus: {
    marginTop: 32,
    alignItems: 'center',
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 3,
  },
  locationProgress: {
    width: 64,
    height: 4,
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  locationProgressFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 2,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundcolor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 4,
  },
  profileInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  cancelBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  autoTrigger: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94a3b8',
    textAlign: 'center',
    letterSpacing: 2,
    paddingTop: 8,
  },
});
