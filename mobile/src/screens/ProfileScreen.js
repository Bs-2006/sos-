import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getUserData, getUserRole, getRoleInfo, getDashboardForRole, clearUserData } from '../utils/userStorage';
import LanguageSwitcher from '../components/LanguageSwitcher';
import BottomNavigation from '../components/BottomNavigation';
import { useTranslation } from '../hooks/useTranslation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];
  
  // State for user data
  const [userData, setUserData] = useState(getUserData());
  const [userRole, setUserRole] = useState(getUserRole());
  const [roleInfo, setRoleInfo] = useState(getRoleInfo(getUserRole()));

  // Reload user data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const freshUserData = getUserData();
      const freshUserRole = getUserRole();
      const freshRoleInfo = getRoleInfo(freshUserRole);
      
      setUserData(freshUserData);
      setUserRole(freshUserRole);
      setRoleInfo(freshRoleInfo);
    }, [])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // Clear user data
            clearUserData();
            // Navigate to Auth screen and reset navigation stack
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleBackToDashboard = () => {
    const dashboard = getDashboardForRole(userRole);
    navigation.navigate(dashboard);
  };

  const menuItems = [
    { id: 0, icon: 'view-dashboard', title: t('dashboard.quickActions'), subtitle: `Return to ${roleInfo.label} dashboard`, route: null, action: 'dashboard', color: roleInfo.color },
    { id: 1, icon: 'account-edit', title: t('profile.editProfile'), subtitle: 'Update your information', route: 'EditProfile' },
    { id: 2, icon: 'shield-alert', title: 'Fall Detection', subtitle: 'Configure fall detection & emergency response', route: 'FallDetectionSettings', color: '#ef4444' },
    { id: 3, icon: 'translate', title: t('profile.language'), subtitle: 'Change app language', route: null, action: 'language' },
    { id: 4, icon: 'shield-check', title: t('profile.privacy'), subtitle: 'Manage your privacy settings', route: null },
    { id: 5, icon: 'bell-ring', title: t('profile.notifications'), subtitle: 'Configure notifications', route: 'Notifications' },
    { id: 6, icon: 'credit-card', title: 'Payment Methods', subtitle: 'Manage payment options', route: null },
    { id: 7, icon: 'help-circle', title: t('profile.helpSupport'), subtitle: 'Get help and support', route: 'HelpSupport' },
    { id: 8, icon: 'information', title: t('profile.about'), subtitle: 'App version and info', route: 'About' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToDashboard}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <LanguageSwitcher iconColor="#64748b" iconSize={22} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View 
          style={[
            styles.profileSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { borderColor: roleInfo.color }]}>
              <MaterialCommunityIcons name={roleInfo.icon} size={48} color={roleInfo.color} />
            </View>
            <TouchableOpacity style={[styles.editAvatarBtn, { backgroundColor: roleInfo.color }]}>
              <MaterialCommunityIcons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{userData.name || 'User'}</Text>
          <Text style={styles.userEmail}>{userData.email || 'user@email.com'}</Text>
          <View style={styles.roleBadge}>
            <MaterialCommunityIcons name={roleInfo.icon} size={16} color={roleInfo.color} />
            <Text style={[styles.roleText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Appointments</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Reports</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>O+</Text>
              <Text style={styles.statLabel}>Blood Type</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.menuItem}
              onPress={() => {
                if (item.action === 'dashboard') {
                  handleBackToDashboard();
                } else if (item.action === 'language') {
                  // Language switcher will be shown in modal via LanguageSwitcher component
                  Alert.alert(
                    t('profile.language'),
                    'Use the language button in the header to change language',
                    [{ text: t('common.ok') }]
                  );
                } else if (item.route) {
                  navigation.navigate(item.route);
                }
              }}
            >
              <View style={[styles.menuIcon, item.color && { backgroundColor: `${item.color}20` }]}>
                <MaterialCommunityIcons name={item.icon} size={24} color={item.color || '#1963eb'} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#64748b" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation navigation={navigation} activeRoute="Profile" />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
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
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#f8fafc',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  menuSection: {
    paddingHorizontal: 24,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 32,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
  },
});
