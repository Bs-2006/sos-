import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { useTranslation } from '../hooks/useTranslation';

export default function EditProfile({ navigation }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserId(user._id);
        setName(user.name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setBloodType(user.bloodType || '');
        setAge(user.age ? user.age.toString() : '');
        setAddress(user.address || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const updateData = {
        name,
        email,
        phone,
        bloodType,
        age: age ? parseInt(age) : undefined,
        address
      };

      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update local storage
      await AsyncStorage.setItem('user', JSON.stringify(data));

      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={48} color="#ef4444" />
          </View>
          <TouchableOpacity style={styles.changePhotoBtn}>
            <MaterialCommunityIcons name="camera" size={16} color="#fff" />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#94a3b8" />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#64748b"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#94a3b8" />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="phone-outline" size={20} color="#94a3b8" />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Blood Type</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="water" size={20} color="#94a3b8" />
              <TextInput
                style={styles.input}
                value={bloodType}
                onChangeText={setBloodType}
                placeholder="Enter blood type"
                placeholderTextColor="#64748b"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="calendar-outline" size={20} color="#94a3b8" />
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="Enter your age"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color="#94a3b8" />
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your address"
                placeholderTextColor="#64748b"
                multiline
              />
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}
        >
          <MaterialCommunityIcons name="home-outline" size={24} color="#94a3b8" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('EmergencyContactsSetup')}
        >
          <MaterialCommunityIcons name="account-group" size={24} color="#94a3b8" />
          <Text style={styles.navText}>Contacts</Text>
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
          <MaterialCommunityIcons name="account" size={24} color="#ef4444" />
          <Text style={styles.navTextActive}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <MaterialCommunityIcons name="cog-outline" size={24} color="#94a3b8" />
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
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ef4444',
    marginBottom: 16,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  formSection: {
    paddingHorizontal: 24,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 56,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    color: '#0f172a',
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginTop: 32,
    marginBottom: 32,
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  navText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  navTextActive: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
  },
});
