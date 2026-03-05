import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import FallDetectionService from '../services/FallDetectionService';
import { useNavigation } from '@react-navigation/native';

const FallDetectionContext = createContext();

export const useFallDetection = () => {
  const context = useContext(FallDetectionContext);
  if (!context) {
    throw new Error('useFallDetection must be used within FallDetectionProvider');
  }
  return context;
};

export const FallDetectionProvider = ({ children }) => {
  const navigation = useNavigation();
  const [isEnabled, setIsEnabled] = useState(false);
  const [sensitivity, setSensitivity] = useState('medium');

  useEffect(() => {
    // Load settings and start service if enabled
    const initializeFallDetection = async () => {
      const settings = await FallDetectionService.loadSettings();
      setIsEnabled(settings.enabled);
      setSensitivity(settings.sensitivity);

      console.log('Fall detection initialized:', settings);

      if (settings.enabled) {
        await FallDetectionService.start();
      }
    };

    initializeFallDetection();

    // Set up fall callback
    FallDetectionService.setFallCallback(() => {
      console.log('Fall detected - navigating to FallDetected screen');
      // Navigate to fall detected screen
      navigation.navigate('FallDetected');
    });

    // Handle app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && isEnabled) {
        console.log('App active - restarting fall detection');
        FallDetectionService.start();
      } else if (nextAppState === 'background') {
        // Keep running in background for fall detection
        console.log('App in background - fall detection continues');
      }
    });

    return () => {
      subscription.remove();
      FallDetectionService.stop();
    };
  }, []);

  // Watch for changes in isEnabled state
  useEffect(() => {
    if (isEnabled) {
      console.log('Fall detection enabled - starting service');
      FallDetectionService.start();
    } else {
      console.log('Fall detection disabled - stopping service');
      FallDetectionService.stop();
    }
  }, [isEnabled]);

  const updateSettings = async (enabled, newSensitivity) => {
    await FallDetectionService.saveSettings(enabled, newSensitivity);
    setIsEnabled(enabled);
    setSensitivity(newSensitivity);
  };

  return (
    <FallDetectionContext.Provider
      value={{
        isEnabled,
        sensitivity,
        updateSettings,
      }}
    >
      {children}
    </FallDetectionContext.Provider>
  );
};
