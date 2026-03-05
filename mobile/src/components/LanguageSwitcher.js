import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { languages } from '../locales';

const { width } = Dimensions.get('window');

const LanguageSwitcher = ({ style, iconSize = 24, iconColor = '#fff' }) => {
  const { currentLanguage, changeLanguage } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));

  const openModal = () => {
    setModalVisible(true);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const handleLanguageSelect = (languageCode) => {
    changeLanguage(languageCode);
    closeModal();
  };

  const getCurrentLanguageName = () => {
    const lang = languages.find(l => l.code === currentLanguage);
    return lang ? lang.code.toUpperCase() : 'EN';
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.languageButton, style]}
        onPress={openModal}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="translate" size={iconSize} color={iconColor} />
        <Text style={[styles.languageCode, { color: iconColor }]}>
          {getCurrentLanguageName()}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="translate" size={28} color="#2563eb" />
              <Text style={styles.modalTitle}>Select Language</Text>
              <Text style={styles.modalSubtitle}>भाषा चुनें / భాష ఎంచుకోండి</Text>
            </View>

            <View style={styles.languageList}>
              {languages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    currentLanguage === language.code && styles.selectedLanguage,
                  ]}
                  onPress={() => handleLanguageSelect(language.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageName}>{language.name}</Text>
                    <Text style={styles.languageNative}>{language.nativeName}</Text>
                  </View>
                  {currentLanguage === language.code && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={24}
                      color="#2563eb"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeModal}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  languageCode: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width - 40,
    maxWidth: 400,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  languageList: {
    gap: 12,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedLanguage: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  languageNative: {
    fontSize: 14,
    color: '#6b7280',
  },
  closeButton: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
});

export default LanguageSwitcher;
