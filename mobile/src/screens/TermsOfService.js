import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from '../hooks/useTranslation';

export default function TermsOfService({ navigation }) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: March 1, 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.text}>
            By accessing and using LifeLink ("the App"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Medical Disclaimer</Text>
          <Text style={styles.text}>
            LifeLink is designed to assist in emergency healthcare situations and provide medical information. However, it is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
          </Text>
          <Text style={styles.highlight}>
            In case of a medical emergency, call your local emergency services immediately.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
          <Text style={styles.text}>You agree to:</Text>
          <Text style={styles.bulletPoint}>• Provide accurate and complete information</Text>
          <Text style={styles.bulletPoint}>• Keep your account credentials secure</Text>
          <Text style={styles.bulletPoint}>• Use the App only for lawful purposes</Text>
          <Text style={styles.bulletPoint}>• Not misuse or abuse the emergency services</Text>
          <Text style={styles.bulletPoint}>• Respect the privacy of other users</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Doctor Verification</Text>
          <Text style={styles.text}>
            Doctors registering on LifeLink must provide valid NMC (National Medical Commission) registration codes. We reserve the right to verify credentials and suspend accounts that provide false information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. AI Services</Text>
          <Text style={styles.text}>
            LifeLink uses artificial intelligence for medicine detection, dosage analysis, and medical recommendations. While we strive for accuracy, AI-generated information should be verified with healthcare professionals before taking action.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Data Usage</Text>
          <Text style={styles.text}>
            By using LifeLink, you consent to the collection and use of your data as described in our Privacy Policy. This includes medical history, location data for emergency services, and usage analytics.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Emergency Services</Text>
          <Text style={styles.text}>
            LifeLink provides ambulance tracking and emergency response coordination. Response times may vary based on location, availability, and traffic conditions. We are not liable for delays in emergency response.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
          <Text style={styles.text}>
            LifeLink and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Changes to Terms</Text>
          <Text style={styles.text}>
            We reserve the right to modify these terms at any time. Continued use of the App after changes constitutes acceptance of the modified terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Contact Information</Text>
          <Text style={styles.text}>
            For questions about these Terms of Service, please contact us at:
          </Text>
          <Text style={styles.contact}>Email: support@lifelink.app</Text>
          <Text style={styles.contact}>Phone: +1 (800) LIFELINK</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using LifeLink, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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
  text: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
    marginBottom: 8,
  },
  highlight: {
    fontSize: 14,
    color: '#fbbf24',
    lineHeight: 22,
    fontWeight: '600',
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#fbbf24',
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
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68,0.3)',
  },
  footerText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
    textAlign: 'center',
  },
});
