import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { languages } from '../locales';
import { useTranslation } from '../hooks/useTranslation';

const LanguageSettingsScreen = ({ navigation }) => {
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.language')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>
          {t('profile.language')} / भाषा / భాష
        </Text>
        <Text style={styles.sectionDescription}>
          Select your preferred language for the app
        </Text>

        <View style={styles.languageList}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageCard,
                currentLanguage === language.code && styles.selectedCard,
              ]}
              onPress={() => handleLanguageChange(language.code)}
              activeOpacity={0.7}
            >
              <View style={styles.languageContent}>
                <View style={styles.languageIcon}>
                  <MaterialCommunityIcons
                    name="translate"
                    size={28}
                    color={currentLanguage === language.code ? '#2563eb' : '#6b7280'}
                  />
                </View>
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>{language.name}</Text>
                  <Text style={styles.languageNative}>{language.nativeName}</Text>
                </View>
              </View>
              {currentLanguage === language.code && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={28}
                  color="#2563eb"
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={24} color="#2563eb" />
          <Text style={styles.infoText}>
            The app will restart to apply the language changes
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  languageList: {
    gap: 12,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  languageNative: {
    fontSize: 16,
    color: '#6b7280',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});

export default LanguageSettingsScreen;
