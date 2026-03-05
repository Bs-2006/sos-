import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export default function ViewEmergencyContactsScreen({ navigation }) {
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Load contacts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadEmergencyContacts();
    }, [])
  );

  const loadEmergencyContacts = async () => {
    try {
      setLoading(true);
      
      // Load from local storage first
      const localContacts = await AsyncStorage.getItem('emergencyContacts');
      if (localContacts) {
        const contacts = JSON.parse(localContacts);
        setEmergencyContacts(contacts);
        console.log('✅ Loaded emergency contacts:', contacts.length, 'contacts');
      } else {
        setEmergencyContacts([]);
        console.log('⚠️ No emergency contacts found');
      }

      // Try to sync with backend
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const response = await fetch(`${API_URL}/api/users/emergency-contacts`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            timeout: 5000,
          });

          if (response.ok) {
            const data = await response.json();
            if (data.emergencyContacts && data.emergencyContacts.length > 0) {
              setEmergencyContacts(data.emergencyContacts);
              console.log('🔄 Synced emergency contacts from backend');
            }
          }
        }
      } catch (backendError) {
        console.log('⚠️ Backend sync failed:', backendError.message);
      }
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
      Alert.alert('Error', 'Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleEditContact = (index) => {
    navigation.navigate('EmergencyContactsSetup');
  };

  const handleAddMore = () => {
    navigation.navigate('EmergencyContactsSetup');
  };

  const handleRefresh = async () => {
    setSyncing(true);
    await loadEmergencyContacts();
    setSyncing(false);
  };

  const renderContactCard = (contact, index) => (
    <View key={index} style={styles.contactCard}>
      <View style={styles.contactCardHeader}>
        <View style={styles.contactCardInfo}>
          <View style={styles.contactAvatar}>
            <Text style={styles.contactAvatarText}>
              {contact.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.contactCardText}>
            <Text style={styles.contactCardName}>{contact.name}</Text>
            <Text style={styles.contactCardPhone}>{contact.phone}</Text>
            {contact.relation && (
              <Text style={styles.contactCardRelation}>{contact.relation}</Text>
            )}
          </View>
        </View>
        <View style={styles.contactCardActions}>
          <MaterialCommunityIcons name="phone" size={20} color="#10b981" />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator size="small" color="#0f172a" />
          ) : (
            <MaterialCommunityIcons name="refresh" size={24} color="#0f172a" />
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ef4444" />
            <Text style={styles.loadingText}>Loading your contacts...</Text>
          </View>
        ) : emergencyContacts.length > 0 ? (
          <>
            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryContent}>
                <MaterialCommunityIcons name="account-multiple-check" size={32} color="#10b981" />
                <View style={styles.summaryText}>
                  <Text style={styles.summaryTitle}>Contacts Added</Text>
                  <Text style={styles.summaryCount}>{emergencyContacts.length}</Text>
                </View>
              </View>
              <View style={styles.summaryBadge}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
              </View>
            </View>

            {/* Contacts List */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="contacts" size={20} color="#0f172a" />
                <Text style={styles.sectionTitle}>Your Emergency Contacts</Text>
              </View>

              {emergencyContacts.map((contact, index) => renderContactCard(contact, index))}
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={20} color="#3b82f6" />
              <Text style={styles.infoText}>
                These contacts will be notified immediately when you activate emergency services.
              </Text>
            </View>

            {/* Add More Button */}
            <TouchableOpacity 
              style={styles.addMoreButton}
              onPress={handleAddMore}
            >
              <MaterialCommunityIcons name="plus-circle" size={20} color="#fff" />
              <Text style={styles.addMoreButtonText}>Add More Contacts</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyStateContainer}>
            <MaterialCommunityIcons name="account-multiple-off" size={64} color="#cbd5e1" />
            <Text style={styles.emptyStateTitle}>No Emergency Contacts</Text>
            <Text style={styles.emptyStateText}>
              You haven't added any emergency contacts yet. Add contacts to ensure help reaches you quickly in case of emergency.
            </Text>
            <TouchableOpacity 
              style={styles.addContactButton}
              onPress={handleAddMore}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addContactButtonText}>Add Emergency Contact</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('HomeScreen')}
        >
          <MaterialCommunityIcons name="home" size={24} color="#94a3b8" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="account-group" size={24} color="#ef4444" />
          <Text style={styles.navTextActive}>Contacts</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('TrackScreen')}
        >
          <MaterialCommunityIcons name="map-marker" size={24} color="#94a3b8" />
          <Text style={styles.navText}>Track</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <MaterialCommunityIcons name="account" size={24} color="#94a3b8" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <MaterialCommunityIcons name="cog" size={24} color="#94a3b8" />
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10b981',
  },
  summaryBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  contactCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  contactCardText: {
    flex: 1,
  },
  contactCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  contactCardPhone: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
  },
  contactCardRelation: {
    fontSize: 12,
    color: '#94a3b8',
  },
  contactCardActions: {
    padding: 8,
  },
  infoBox: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
    fontWeight: '500',
    flex: 1,
  },
  addMoreButton: {
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  addMoreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginHorizontal: 16,
    lineHeight: 20,
  },
  addContactButton: {
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  addContactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500',
  },
  navTextActive: {
    fontSize: 11,
    color: '#ef4444',
    marginTop: 4,
    fontWeight: '600',
  },
});
