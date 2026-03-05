import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from '../hooks/useTranslation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AuthScreen({ navigation }) {
  const { t } = useTranslation();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Attempting login to:', `${API_URL}/api/auth/login`);
      console.log('📧 Email:', email);
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        timeout: 10000
      });

      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `Login failed (${response.status})`);
      }

      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      // Role-based navigation
      if (data.user.role === 'superadmin') {
        navigation.replace('SuperAdminDashboard');
      } else {
        navigation.replace('HomeScreen');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('Error message:', error.message);
      console.error('Error type:', error.constructor.name);
      
      let errorMessage = error.message || 'Login failed';
      
      // Provide more specific error messages
      if (error.message.includes('Network')) {
        errorMessage = `Network Error: Cannot connect to ${API_URL}\n\nMake sure:\n1. Backend server is running\n2. IP address is correct\n3. Device is on same network`;
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Server error: Invalid response from backend';
      }
      
      Alert.alert('Login Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Name, email and password are required');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      console.log('📝 Attempting signup to:', `${API_URL}/api/auth/register`);
      console.log('👤 Name:', name);
      console.log('📧 Email:', email);
      console.log('👨‍⚕️ Role:', role);
      
      const requestBody = { email, password, name, role };

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        timeout: 10000
      });

      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `Signup failed (${response.status})`);
      }

      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      // Role-based navigation
      if (data.user.role === 'superadmin') {
        navigation.replace('SuperAdminDashboard');
      } else {
        navigation.replace('HomeScreen');
      }
    } catch (error) {
      console.error('❌ Signup error:', error);
      console.error('Error message:', error.message);
      console.error('Error type:', error.constructor.name);
      
      let errorMessage = error.message || 'Signup failed';
      
      // Provide more specific error messages
      if (error.message.includes('Network')) {
        errorMessage = `Network Error: Cannot connect to ${API_URL}\n\nMake sure:\n1. Backend server is running\n2. IP address is correct\n3. Device is on same network`;
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Server error: Invalid response from backend';
      } else if (error.message.includes('already exists')) {
        errorMessage = 'Email already registered. Please login or use a different email.';
      }
      
      Alert.alert('Signup Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (userEmail, userPassword) => {
    setEmail(userEmail);
    setPassword(userPassword);
    setIsSignup(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="heart-pulse" size={28} color="#ef4444" />
          <Text style={styles.headerTitle}>LifeLink</Text>
        </View>
        <LanguageSwitcher iconColor="#64748b" iconSize={22} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.title}>{isSignup ? t('auth.signup') : t('auth.login')}</Text>
        <Text style={styles.subtitle}>{isSignup ? t('auth.dontHaveAccount') : t('dashboard.welcome')}</Text>
      </View>

      <View style={styles.formSection}>
        {isSignup && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('auth.selectRole')}</Text>
              <View style={styles.roleGrid}>
                <TouchableOpacity 
                  style={[styles.roleCard, role === 'patient' && styles.roleCardActive]}
                  onPress={() => setRole('patient')}
                  disabled={loading}
                >
                  <MaterialCommunityIcons name="account" size={20} color={role === 'patient' ? '#ef4444' : '#94a3b8'} />
                  <Text style={[styles.roleText, role === 'patient' && styles.roleTextActive]}>{t('auth.patient')}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.roleCard, role === 'superadmin' && styles.roleCardActive]}
                  onPress={() => setRole('superadmin')}
                  disabled={loading}
                >
                  <MaterialCommunityIcons name="shield-crown" size={20} color={role === 'superadmin' ? '#fbbf24' : '#94a3b8'} />
                  <Text style={[styles.roleText, role === 'superadmin' && styles.roleTextActive]}>{t('auth.admin')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('auth.name')}</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="account-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.name')}
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
            </View>


          </>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('auth.email')}</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.email')}
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('auth.password')}</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.password')}
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <MaterialCommunityIcons 
                name={showPassword ? "eye-off" : "eye"} 
                size={20} 
                color="#94a3b8" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {isSignup && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('auth.confirmPassword')}</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock-check-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.confirmPassword')}
                placeholderTextColor="#94a3b8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <MaterialCommunityIcons 
                  name={showConfirmPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#94a3b8" 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={isSignup ? handleSignup : handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isSignup ? t('auth.signup') : t('auth.login')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.switchModeBtn}
          onPress={() => setIsSignup(!isSignup)}
          disabled={loading}
        >
          <Text style={styles.switchModeText}>
            {isSignup ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
            {' '}
            <Text style={styles.switchModeLink}>{isSignup ? t('auth.login') : t('auth.signup')}</Text>
          </Text>
        </TouchableOpacity>

        {!isSignup && (
          <View style={styles.quickLoginSection}>
            <Text style={styles.quickLoginTitle}>Quick Login (Demo)</Text>
            <View style={styles.quickLoginGrid}>
              <TouchableOpacity 
                style={styles.quickLoginBtn}
                onPress={() => quickLogin('patient@life.app', 'password123')}
                disabled={loading}
              >
                <MaterialCommunityIcons name="account" size={18} color="#ef4444" />
                <Text style={styles.quickLoginText}>{t('auth.patient')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickLoginBtn}
                onPress={() => quickLogin('superadmin@life.app', 'password123')}
                disabled={loading}
              >
                <MaterialCommunityIcons name="shield-crown" size={18} color="#fbbf24" />
                <Text style={styles.quickLoginText}>{t('auth.admin')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By {isSignup ? 'signing up' : 'signing in'}, you agree to our{'\n'}
          <Text 
            style={styles.link}
            onPress={() => navigation.navigate('TermsOfService')}
          >
            Terms of Service
          </Text> and{' '}
          <Text 
            style={styles.link}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            Privacy Policy
          </Text>
        </Text>
      </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SCREEN_WIDTH * 0.06,
    paddingTop: 20,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: SCREEN_WIDTH * 0.08,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: SCREEN_WIDTH * 0.04,
    color: '#94a3b8',
  },
  roleSection: {
    marginBottom: 24,
  },
  formSection: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    height: 48,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#0f172a',
    fontSize: 16,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  button: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickLoginSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickLoginTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 12,
    textAlign: 'center',
  },
  quickLoginGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickLoginBtn: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickLoginText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '600',
  },
  switchModeBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  switchModeLink: {
    color: '#ef4444',
    fontWeight: '600',
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  roleCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  roleCardActive: {
    borderColor: '#ef4444',
    borderWidth: 2,
    backgroundColor: '#fee2e2',
  },
  roleText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#ef4444',
  },
  verificationNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(251,191,36,0.1)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#fbbf24',
  },
  verificationNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#fbbf24',
    lineHeight: 18,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  link: {
    color: '#ef4444',
    fontWeight: '500',
  },
});
