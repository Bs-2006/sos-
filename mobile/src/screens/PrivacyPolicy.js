import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from '../hooks/useTranslation';

export default function PrivacyPolicy({ navigation }) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: March 1, 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.text}>
            LifeLink ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          
          <Text style={styles.subTitle}>Personal Information:</Text>
          <Text style={styles.bulletPoint}>• Name, email address, and phone number</Text>
          <Text style={styles.bulletPoint}>• Date of birth and age</Text>
          <Text style={styles.bulletPoint}>• Blood type and medical history</Text>
          <Text style={styles.bulletPoint}>• Emergency contact information</Text>
          <Text style={styles.bulletPoint}>• For doctors: NMC registration code and credentials</Text>

          <Text style={styles.subTitle}>Health Information:</Text>
          <Text style={styles.bulletPoint}>• Medical reports and prescriptions</Text>
          <Text style={styles.bulletPoint}>• Appointment history</Text>
          <Text style={styles.bulletPoint}>• Medicine usage and allergies</Text>
          <Text style={styles.bulletPoint}>• Symptoms and health queries</Text>

          <Text style={styles.subTitle}>Location Data:</Text>
          <Text style={styles.bulletPoint}>• Real-time location for emergency services</Text>
          <Text style={styles.bulletPoint}>• Location history for ambulance tracking</Text>
          <Text style={styles.bulletPoint}>• Nearby hospitals and doctors</Text>

          <Text style={styles.subTitle}>Usage Data:</Text>
          <Text style={styles.bulletPoint}>• App interactions and features used</Text>
          <Text style={styles.bulletPoint}>• Device information and IP address</Text>
          <Text style={styles.bulletPoint}>• Crash reports and performance data</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
          <Text style={styles.text}>We use your information to:</Text>
          <Text style={styles.bulletPoint}>• Provide emergency medical services</Text>
          <Text style={styles.bulletPoint}>• Connect you with doctors and hospitals</Text>
          <Text style={styles.bulletPoint}>• Process appointments and medical reports</Text>
          <Text style={styles.bulletPoint}>• Analyze medicines using AI technology</Text>
          <Text style={styles.bulletPoint}>• Send notifications about appointments and emergencies</Text>
          <Text style={styles.bulletPoint}>• Improve our services and user experience</Text>
          <Text style={styles.bulletPoint}>• Comply with legal obligations</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Sharing and Disclosure</Text>
          <Text style={styles.text}>We may share your information with:</Text>
          
          <Text style={styles.subTitle}>Healthcare Providers:</Text>
          <Text style={styles.text}>
            Doctors, hospitals, and ambulance services need access to your medical information to provide care.
          </Text>

          <Text style={styles.subTitle}>Service Providers:</Text>
          <Text style={styles.text}>
            Third-party services that help us operate the app (cloud storage, analytics, payment processing).
          </Text>

          <Text style={styles.subTitle}>Legal Requirements:</Text>
          <Text style={styles.text}>
            When required by law, court order, or government regulations.
          </Text>

          <Text style={styles.highlight}>
            We never sell your personal or medical information to third parties.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data Security</Text>
          <Text style={styles.text}>
            We implement industry-standard security measures to protect your data:
          </Text>
          <Text style={styles.bulletPoint}>• End-to-end encryption for sensitive data</Text>
          <Text style={styles.bulletPoint}>• Secure servers with regular backups</Text>
          <Text style={styles.bulletPoint}>• Access controls and authentication</Text>
          <Text style={styles.bulletPoint}>• Regular security audits and updates</Text>
          <Text style={styles.bulletPoint}>• HIPAA-compliant data handling</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Your Rights</Text>
          <Text style={styles.text}>You have the right to:</Text>
          <Text style={styles.bulletPoint}>• Access your personal and medical data</Text>
          <Text style={styles.bulletPoint}>• Correct inaccurate information</Text>
          <Text style={styles.bulletPoint}>• Request deletion of your data</Text>
          <Text style={styles.bulletPoint}>• Opt-out of non-essential data collection</Text>
          <Text style={styles.bulletPoint}>• Export your data in a portable format</Text>
          <Text style={styles.bulletPoint}>• Withdraw consent at any time</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Data Retention</Text>
          <Text style={styles.text}>
            We retain your data for as long as your account is active or as needed to provide services. Medical records are retained according to legal requirements (typically 7-10 years).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
          <Text style={styles.text}>
            LifeLink is not intended for children under 13. We do not knowingly collect data from children. If you believe a child has provided us with personal information, please contact us.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. International Data Transfers</Text>
          <Text style={styles.text}>
            Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Changes to Privacy Policy</Text>
          <Text style={styles.text}>
            We may update this Privacy Policy periodically. We will notify you of significant changes via email or app notification.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Contact Us</Text>
          <Text style={styles.text}>
            For privacy-related questions or to exercise your rights:
          </Text>
          <Text style={styles.contact}>Email: privacy@lifelink.app</Text>
          <Text style={styles.contact}>Phone: +1 (800) LIFELINK</Text>
          <Text style={styles.contact}>Address: 123 Healthcare Ave, Medical District</Text>
        </View>

        <View style={styles.footer}>
          <MaterialCommunityIcons name="shield-check" size={32} color="#10b981" style={{ alignSelf: 'center', marginBottom: 12 }} />
          <Text style={styles.footerText}>
            Your privacy and security are our top priorities. We are committed to protecting your sensitive medical information.
          </Text>
        </View>
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
    paddingVertical: 16,
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
    paddingHorizontal: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 16,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginTop: 12,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
    marginBottom: 8,
  },
  highlight: {
    fontSize: 14,
    color: '#10b981',
    lineHeight: 22,
    fontWeight: '600',
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  bulletPoint: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
    marginLeft: 16,
    marginBottom: 4,
  },
  contact: {
    fontSize: 14,
    color: '#ef4444',
    lineHeight: 22,
    marginLeft: 16,
  },
  footer: {
    marginTop: 16,
    marginBottom: 32,
    padding: 20,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  footerText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
    textAlign: 'center',
  },
});
