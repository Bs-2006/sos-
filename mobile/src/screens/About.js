import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from '../hooks/useTranslation';

export default function About({ navigation }) {
  const { t } = useTranslation();
  const appInfo = [
    { label: 'Version', value: '1.0.0' },
    { label: 'Build', value: '2026.02.001' },
    { label: 'Last Updated', value: 'February 26, 2026' },
  ];

  const legalLinks = [
    { icon: 'file-document', title: 'Terms of Service', url: 'https://lifelink.com/terms' },
    { icon: 'shield-check', title: 'Privacy Policy', url: 'https://lifelink.com/privacy' },
    { icon: 'license', title: 'Licenses', url: 'https://lifelink.com/licenses' },
  ];

  const socialLinks = [
    { icon: 'web', title: 'Website', url: 'https://lifelink.com' },
    { icon: 'twitter', title: 'Twitter', url: 'https://twitter.com/lifelink' },
    { icon: 'facebook', title: 'Facebook', url: 'https://facebook.com/lifelink' },
    { icon: 'instagram', title: 'Instagram', url: 'https://instagram.com/lifelink' },
  ];

  const handleLinkPress = (url) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="heart-pulse" size={64} color="#ef4444" />
          </View>
          <Text style={styles.appName}>LifeLink</Text>
          <Text style={styles.appTagline}>Your Health, Our Priority</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>App Information</Text>
          {appInfo.map((item, index) => (
            <View key={index} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About LifeLink</Text>
          <Text style={styles.description}>
            LifeLink is a comprehensive healthcare platform that connects patients with healthcare providers, 
            enabling seamless appointment booking, emergency services, and medical record management. 
            Our mission is to make quality healthcare accessible to everyone.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          {legalLinks.map((link, index) => (
            <TouchableOpacity
              key={index}
              style={styles.linkCard}
              onPress={() => handleLinkPress(link.url)}
            >
              <MaterialCommunityIcons name={link.icon} size={20} color="#ef4444" />
              <Text style={styles.linkText}>{link.title}</Text>
              <MaterialCommunityIcons name="open-in-new" size={18} color="#64748b" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>
          <View style={styles.socialGrid}>
            {socialLinks.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={styles.socialCard}
                onPress={() => handleLinkPress(link.url)}
              >
                <MaterialCommunityIcons name={link.icon} size={28} color="#ef4444" />
                <Text style={styles.socialText}>{link.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.copyright}>© 2026 LifeLink. All rights reserved.</Text>
      </ScrollView>
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
    borderBottomColor: '#334155',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundcolor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239, 68, 68,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 14,
    color: '#94a3b8',
  },
  infoCard: {
    backgroundcolor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  infoLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  section: {
    marginBottom: 24,
  },
  description: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 22,
    backgroundcolor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundcolor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialCard: {
    width: '48%',
    backgroundcolor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  socialText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  copyright: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
});
