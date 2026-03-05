import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export default function SuperAdminDashboard({ navigation }) {
  const [emergencyNumbers, setEmergencyNumbers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', number: '', icon: 'phone', color: '#3b82f6' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalNumbers: 0,
    activeNumbers: 0,
    totalCalls: 0,
    recentUpdates: 0,
  });

  useEffect(() => {
    loadEmergencyNumbers();
  }, []);

  const loadEmergencyNumbers = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('emergencyNumbers');
      if (stored) {
        const numbers = JSON.parse(stored);
        setEmergencyNumbers(numbers);
        updateStats(numbers);
      } else {
        // Initialize with default numbers
        const defaultNumbers = [
          { id: '1', name: 'Ambulance', number: '108', icon: 'ambulance', color: '#ef4444', enabled: true },
          { id: '2', name: 'Police', number: '100', icon: 'police-badge', color: '#3b82f6', enabled: true },
          { id: '3', name: 'Fire Department', number: '101', icon: 'fire-truck', color: '#f59e0b', enabled: true },
          { id: '4', name: 'Women Helpline', number: '1091', icon: 'human-female', color: '#ec4899', enabled: true },
          { id: '5', name: 'Child Helpline', number: '1098', icon: 'baby-face', color: '#8b5cf6', enabled: true },
          { id: '6', name: 'Disaster Management', number: '108', icon: 'alert-circle', color: '#f97316', enabled: true },
        ];
        setEmergencyNumbers(defaultNumbers);
        await AsyncStorage.setItem('emergencyNumbers', JSON.stringify(defaultNumbers));
        updateStats(defaultNumbers);
      }
    } catch (error) {
      console.error('Error loading emergency numbers:', error);
      Alert.alert('Error', 'Failed to load emergency numbers');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEmergencyNumbers();
    setRefreshing(false);
  };

  const updateStats = (numbers) => {
    const activeCount = numbers.filter(n => n.enabled).length;
    setStats({
      totalNumbers: numbers.length,
      activeNumbers: activeCount,
      totalCalls: stats.totalCalls,
      recentUpdates: stats.recentUpdates,
    });
  };

  const saveEmergencyNumbers = async (numbers) => {
    try {
      await AsyncStorage.setItem('emergencyNumbers', JSON.stringify(numbers));
      setEmergencyNumbers(numbers);
      updateStats(numbers);
    } catch (error) {
      Alert.alert('Error', 'Failed to save emergency numbers');
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({ name: '', number: '', icon: 'phone', color: '#3b82f6' });
    setModalVisible(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ name: item.name, number: item.number, icon: item.icon, color: item.color });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.number) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    let updatedNumbers;
    if (editingItem) {
      updatedNumbers = emergencyNumbers.map(item =>
        item.id === editingItem.id ? { ...item, ...formData } : item
      );
    } else {
      const newItem = {
        id: Date.now().toString(),
        ...formData,
        enabled: true,
      };
      updatedNumbers = [...emergencyNumbers, newItem];
    }

    saveEmergencyNumbers(updatedNumbers);
    setModalVisible(false);
    Alert.alert('Success', editingItem ? 'Emergency number updated' : 'Emergency number added');
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Emergency Number',
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedNumbers = emergencyNumbers.filter(num => num.id !== item.id);
            saveEmergencyNumbers(updatedNumbers);
          },
        },
      ]
    );
  };

  const toggleEnabled = (item) => {
    const updatedNumbers = emergencyNumbers.map(num =>
      num.id === item.id ? { ...num, enabled: !num.enabled } : num
    );
    saveEmergencyNumbers(updatedNumbers);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            navigation.replace('Auth');
          },
        },
      ]
    );
  };

  const iconOptions = [
    { name: 'ambulance', label: 'Ambulance' },
    { name: 'police-badge', label: 'Police' },
    { name: 'fire-truck', label: 'Fire' },
    { name: 'phone', label: 'Phone' },
    { name: 'hospital-building', label: 'Hospital' },
    { name: 'alert-circle', label: 'Alert' },
    { name: 'human-female', label: 'Women' },
    { name: 'baby-face', label: 'Child' },
  ];

  const colorOptions = ['#ef4444', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#f97316', '#06b6d4'];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading emergency numbers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Super Admin</Text>
          <Text style={styles.headerSubtitle}>Emergency Numbers Management</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="phone-in-talk" size={24} color="#3b82f6" />
            <Text style={styles.statNumber}>{stats.totalNumbers}</Text>
            <Text style={styles.statLabel}>Total Numbers</Text>
          </View>
          
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
            <Text style={styles.statNumber}>{stats.activeNumbers}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="phone-outgoing" size={24} color="#f59e0b" />
            <Text style={styles.statNumber}>{stats.totalCalls}</Text>
            <Text style={styles.statLabel}>Total Calls</Text>
          </View>
        </View>

        {/* Add New Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
          <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add New Emergency Number</Text>
        </TouchableOpacity>

        {/* Emergency Numbers List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Emergency Numbers</Text>
          
          {emergencyNumbers.map((item) => (
            <View key={item.id} style={[styles.numberCard, !item.enabled && styles.numberCardDisabled]}>
              <View style={styles.numberCardLeft}>
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                  <MaterialCommunityIcons name={item.icon} size={28} color={item.color} />
                </View>
                <View style={styles.numberInfo}>
                  <Text style={styles.numberName}>{item.name}</Text>
                  <Text style={styles.numberValue}>{item.number}</Text>
                </View>
              </View>
              
              <View style={styles.numberCardRight}>
                <TouchableOpacity
                  style={[styles.toggleBtn, item.enabled ? styles.toggleBtnActive : styles.toggleBtnInactive]}
                  onPress={() => toggleEnabled(item)}
                >
                  <MaterialCommunityIcons 
                    name={item.enabled ? 'check' : 'close'} 
                    size={16} 
                    color="#fff" 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item)}>
                  <MaterialCommunityIcons name="pencil" size={18} color="#64748b" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
                  <MaterialCommunityIcons name="delete" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Emergency Number' : 'Add Emergency Number'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Service Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Ambulance, Police"
                  placeholderTextColor="#94a3b8"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 108, 100"
                  placeholderTextColor="#94a3b8"
                  value={formData.number}
                  onChangeText={(text) => setFormData({ ...formData, number: text })}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Icon</Text>
                <View style={styles.iconGrid}>
                  {iconOptions.map((icon) => (
                    <TouchableOpacity
                      key={icon.name}
                      style={[
                        styles.iconOption,
                        formData.icon === icon.name && styles.iconOptionSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, icon: icon.name })}
                    >
                      <MaterialCommunityIcons name={icon.name} size={24} color="#64748b" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Color</Text>
                <View style={styles.colorGrid}>
                  {colorOptions.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        formData.color === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingItem ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  numberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  numberCardDisabled: {
    opacity: 0.5,
  },
  numberCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  numberInfo: {
    flex: 1,
  },
  numberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  numberValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  numberCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#10b981',
  },
  toggleBtnInactive: {
    backgroundColor: '#94a3b8',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  iconOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#dbeafe',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#0f172a',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
  },
});
