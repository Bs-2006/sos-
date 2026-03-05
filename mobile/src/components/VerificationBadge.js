import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function VerificationBadge({ isVerified, verificationStatus, size = 'medium' }) {
  if (!verificationStatus || verificationStatus === 'pending') {
    return (
      <View style={[styles.badge, styles.pendingBadge, size === 'small' && styles.badgeSmall]}>
        <MaterialCommunityIcons 
          name="clock-outline" 
          size={size === 'small' ? 12 : 14} 
          color="#fbbf24" 
        />
        <Text style={[styles.badgeText, styles.pendingText, size === 'small' && styles.badgeTextSmall]}>
          Pending Verification
        </Text>
      </View>
    );
  }

  if (verificationStatus === 'rejected') {
    return (
      <View style={[styles.badge, styles.rejectedBadge, size === 'small' && styles.badgeSmall]}>
        <MaterialCommunityIcons 
          name="close-circle" 
          size={size === 'small' ? 12 : 14} 
          color="#ef4444" 
        />
        <Text style={[styles.badgeText, styles.rejectedText, size === 'small' && styles.badgeTextSmall]}>
          Verification Failed
        </Text>
      </View>
    );
  }

  if (isVerified && verificationStatus === 'verified') {
    return (
      <View style={[styles.badge, styles.verifiedBadge, size === 'small' && styles.badgeSmall]}>
        <MaterialCommunityIcons 
          name="check-decagram" 
          size={size === 'small' ? 12 : 14} 
          color="#10b981" 
        />
        <Text style={[styles.badgeText, styles.verifiedText, size === 'small' && styles.badgeTextSmall]}>
          NMC Verified
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextSmall: {
    fontSize: 10,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  verifiedText: {
    color: '#10b981',
  },
  pendingBadge: {
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderColor: 'rgba(251,191,36,0.3)',
  },
  pendingText: {
    color: '#fbbf24',
  },
  rejectedBadge: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  rejectedText: {
    color: '#ef4444',
  },
});
