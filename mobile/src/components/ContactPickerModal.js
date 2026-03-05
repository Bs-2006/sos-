import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';

export default function ContactPickerModal({ visible, onClose, onSelectContact }) {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadContacts();
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant contacts permission.');
        onClose();
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      const contactsWithPhone = data
        .filter(c => c.phoneNumbers && c.phoneNumbers.length > 0)
        .map(c => ({
          id: c.id,
          name: c.name || 'Unknown',
          phone: c.phoneNumbers[0].number,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setContacts(contactsWithPhone);
      setFilteredContacts(contactsWithPhone);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContact = (contact) => {
    onSelectContact({
      name: contact.name,
      phone: contact.phone.replace(/[^0-9+]/g, ''),
    });
    onClose();
  };

  const renderContact = ({ item }) => (
    <TouchableOpacity style={styles.contactItem} onPress={() => handleSelectContact(item)}>
      <View style={styles.contactAvatar}>
        <MaterialCommunityIcons name="account" size={24} color="#64748b" />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phone}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#94a3b8" />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Contact</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ef4444" />
          </View>
        ) : (
          <FlatList
            data={filteredContacts}
            renderItem={renderContact}
            keyExtractor={(item) => item.id}
            style={styles.list}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff' },
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  placeholder: { width: 40 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 20, paddingHorizontal: 16, height: 48, borderRadius: 12, gap: 12 },
  searchInput: { flex: 1, fontSize: 16, color: '#0f172a' },
  list: { flex: 1 },
  contactItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, marginHorizontal: 20, marginBottom: 8, borderRadius: 12 },
  contactAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  contactPhone: { fontSize: 14, color: '#64748b', marginTop: 2 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
