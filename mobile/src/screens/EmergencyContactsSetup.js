import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { getDeviceContacts, requestContactsPermission, formatPhoneNumber } from '../utils/contactsUtils';

export default function EmergencyContactsSetup({ navigation, route }) {
  const [addedContacts, setAddedContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [deviceContacts, setDeviceContacts] = useState([]);
  const [showDeviceContactsList, setShowDeviceContactsList] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualFormData, setManualFormData] = useState({ name: '', phone: '', relation: '' });

  React.useEffect(() => {
    initializeContacts();
  }, []);

  // Load saved contacts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSavedContacts();
    }, [])
  );

  const loadSavedContacts = async () => {
    try {
      const savedContacts = await AsyncStorage.getItem('emergencyContacts');
      if (savedContacts) {
        const contacts = JSON.parse(savedContacts);
        setAddedContacts(contacts);
        console.log('✅ Loaded saved emergency contacts:', contacts.length, 'contacts');
      }
    } catch (error) {
      console.error('Error loading saved contacts:', error);
    }
  };

  const initializeContacts = async () => {
    try {
      setIsInitializing(true);
      const hasPermission = await requestContactsPermission();
      
      if (hasPermission) {
        const allContacts = await getDeviceContacts();
        setDeviceContacts(allContacts);
        console.log('✓ Loaded', allContacts.length, 'contacts from device');
      } else {
        console.log('⚠️ Contacts permission denied');
      }
    } catch (error) {
      console.error('Error initializing contacts:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const updateContact = (index, field, value) => {
    const newContacts = [...addedContacts];
    newContacts[index][field] = value;
    setAddedContacts(newContacts);
  };

  const removeContact = async (index) => {
    const updatedContacts = addedContacts.filter((_, i) => i !== index);
    setAddedContacts(updatedContacts);
    
    // Update storage immediately
    try {
      await AsyncStorage.setItem('emergencyContacts', JSON.stringify(updatedContacts));
      console.log('✅ Contact removed and saved');
    } catch (error) {
      console.error('Error saving after removal:', error);
    }
  };

  const handleSelectContact = (contact) => {
    const newContact = {
      name: contact.name,
      phone: formatPhoneNumber(contact.phone),
      relation: ''
    };
    setAddedContacts([...addedContacts, newContact]);
    setShowDeviceContactsList(false);
    setSearchQuery('');
  };

  const handleManualSave = () => {
    if (!manualFormData.name.trim() || !manualFormData.phone.trim()) {
      Alert.alert('Required', 'Please enter name and phone number');
      return;
    }

    setAddedContacts([...addedContacts, {
      name: manualFormData.name,
      phone: formatPhoneNumber(manualFormData.phone),
      relation: manualFormData.relation
    }]);
    
    setShowManualForm(false);
    setManualFormData({ name: '', phone: '', relation: '' });
  };

  const getFilteredContacts = () => {
    if (!searchQuery.trim()) {
      return deviceContacts;
    }
    
    const query = searchQuery.toLowerCase();
    return deviceContacts.filter(contact =>
      contact.name.toLowerCase().includes(query) ||
      contact.phone.includes(query)
    );
  };

  const handleSave = async () => {
    if (addedContacts.length === 0) {
      Alert.alert('Required', 'Please add at least one emergency contact');
      return;
    }

    setLoading(true);
    try {
      console.log('💾 Saving emergency contacts...');
      console.log('Contacts to save:', addedContacts);
      
      const contactsJSON = JSON.stringify(addedContacts);
      await AsyncStorage.setItem('emergencyContacts', contactsJSON);
      console.log('✅ Emergency contacts saved to AsyncStorage:', addedContacts.length, 'contacts');
      
      // Verify contacts were saved
      const verifyContacts = await AsyncStorage.getItem('emergencyContacts');
      console.log('✅ Verification - Contacts in AsyncStorage:', verifyContacts);
      
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const response = await fetch(`${API_URL}/api/users/emergency-contacts`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ emergencyContacts: addedContacts }),
            timeout: 5000,
          });
          
          if (response.ok) {
            console.log('✅ Contacts synced to backend');
          } else {
            console.log('⚠️ Backend sync failed, but contacts saved locally');
          }
        }
      } catch (backendError) {
        console.log('⚠️ Backend unavailable, contacts saved locally:', backendError.message);
      }

      Alert.alert('Success', 'Emergency contacts saved successfully');
      navigation.replace('HomeScreen');
    } catch (error) {
      console.error('❌ Save error:', error);
      Alert.alert('Error', 'Failed to save emergency contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Setup?',
      'Emergency contacts are important for your safety. You can add them later.',
      [
        { text: 'Go Back', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => navigation.replace('HomeScreen')
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.topTitle}>Add Your Contacts</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowDeviceContactsList(true)}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={styles.importButton}
          onPress={() => setShowDeviceContactsList(true)}
        >
          <Text style={styles.importButtonText}>Import from Phone</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.manualButton}
          onPress={() => setShowManualForm(true)}
        >
          <Text style={styles.manualButtonText}>+ Manual</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#cbd5e1" />
        <TextInput
          style={styles.searchBar}
          placeholder="Search contacts..."
          placeholderTextColor="#cbd5e1"
          editable={false}
        />
      </View>

      {/* Contacts List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isInitializing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ef4444" />
            <Text style={styles.loadingText}>Loading your contacts...</Text>
          </View>
        ) : (
          <>
            {/* Added Contacts Section */}
            {addedContacts.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#10b981" />
                  <Text style={styles.sectionTitle}>Added Contacts</Text>
                  <Text style={styles.contactCount}>
                    {addedContacts.length}
                  </Text>
                </View>

                {addedContacts.map((contact, index) => (
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
                      <TouchableOpacity 
                        onPress={() => removeContact(index)}
                        style={styles.deleteButton}
                      >
                        <MaterialCommunityIcons name="close-circle" size={24} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Empty State */}
            {addedContacts.length === 0 && (
              <View style={styles.emptyStateContainer}>
                <MaterialCommunityIcons name="account-multiple" size={64} color="#cbd5e1" />
                <Text style={styles.emptyStateText}>No contacts added yet.</Text>
                <Text style={styles.emptyStateSubtext}>Tap "Import from Phone" or "+ Manual" to add contacts</Text>
              </View>
            )}

            {/* Action Buttons */}
            {addedContacts.length > 0 && (
              <>
                <TouchableOpacity
                  style={[styles.saveButton, loading && styles.buttonDisabled]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                      <Text style={styles.saveButtonText}>Save Emergency Contacts</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipButton} onPress={handleSkip} disabled={loading}>
                  <Text style={styles.skipButtonText}>Skip for Now</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Device Contacts Modal */}
      <Modal
        visible={showDeviceContactsList}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowDeviceContactsList(false);
          setSearchQuery('');
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => {
                setShowDeviceContactsList(false);
                setSearchQuery('');
              }}
            >
              <MaterialCommunityIcons name="close" size={24} color="#0f172a" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Contact</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or phone..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={getFilteredContacts()}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.contactListItem}
                onPress={() => handleSelectContact(item)}
              >
                <View style={styles.contactListItemContent}>
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.contactListItemText}>
                    <Text style={styles.contactListItemName}>{item.name}</Text>
                    <Text style={styles.contactListItemPhone}>{item.phone}</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="account-off" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No contacts found' : 'No contacts available'}
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />
        </SafeAreaView>
      </Modal>

      {/* Manual Form Modal */}
      <Modal
        visible={showManualForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowManualForm(false);
          setManualFormData({ name: '', phone: '', relation: '' });
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => {
                setShowManualForm(false);
                setManualFormData({ name: '', phone: '', relation: '' });
              }}
            >
              <MaterialCommunityIcons name="close" size={24} color="#0f172a" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Contact</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Name *</Text>
              <View style={styles.formInputContainer}>
                <MaterialCommunityIcons name="account-outline" size={20} color="#94a3b8" />
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter contact name"
                  placeholderTextColor="#94a3b8"
                  value={manualFormData.name}
                  onChangeText={(text) => setManualFormData({ ...manualFormData, name: text })}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone Number *</Text>
              <View style={styles.formInputContainer}>
                <MaterialCommunityIcons name="phone-outline" size={20} color="#94a3b8" />
                <TextInput
                  style={styles.formInput}
                  placeholder="+91 XXXXX XXXXX"
                  placeholderTextColor="#94a3b8"
                  value={manualFormData.phone}
                  onChangeText={(text) => setManualFormData({ ...manualFormData, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Relation</Text>
              <View style={styles.formInputContainer}>
                <MaterialCommunityIcons name="heart-outline" size={20} color="#94a3b8" />
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Father, Mother, Spouse"
                  placeholderTextColor="#94a3b8"
                  value={manualFormData.relation}
                  onChangeText={(text) => setManualFormData({ ...manualFormData, relation: text })}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.formSaveButton}
              onPress={handleManualSave}
            >
              <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
              <Text style={styles.formSaveButtonText}>Add Contact</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.formCancelButton}
              onPress={() => {
                setShowManualForm(false);
                setManualFormData({ name: '', phone: '', relation: '' });
              }}
            >
              <Text style={styles.formCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    textAlign: 'center',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  topTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  addButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  importButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 24,
    paddingVertical: 12,
    gap: 8,
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  manualButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  manualButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  contactCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94a3b8',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#cbd5e1',
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
  deleteButton: {
    padding: 8,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 12,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    alignItems: 'center',
    marginBottom: 32,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  contactListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  contactListItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  contactListItemText: {
    flex: 1,
  },
  contactListItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  contactListItemPhone: {
    fontSize: 13,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  formInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 48,
    gap: 12,
  },
  formInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  formSaveButton: {
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 12,
    gap: 8,
  },
  formSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formCancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 32,
  },
  formCancelButtonText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
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
