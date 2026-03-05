import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from '../hooks/useTranslation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const { t } = useTranslation();
  const [progress] = useState(new Animated.Value(50));
  const [loadingText, setLoadingText] = useState('Loading Medical Database...');
  const [percentage, setPercentage] = useState(50);

  useEffect(() => {
    // Animate progress bar from 50% to 100%
    Animated.timing(progress, {
      toValue: 100,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    // Update percentage and text
    const interval = setInterval(() => {
      setPercentage((prev) => {
        const next = prev + 1;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            navigation.replace('Auth');
          }, 200);
        }
        
        // Update loading text based on progress
        if (next < 70) {
          setLoadingText('Loading Medical Database...');
        } else if (next < 90) {
          setLoadingText('Securing Connection...');
        } else {
          setLoadingText('Almost Ready...');
        }
        
        return next;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [navigation]);

  const progressWidth = progress.interpolate({
    inputRange: [50, 100],
    outputRange: ['50%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="heart-pulse" size={60} color="#fff" />
          </View>
          <Text style={styles.title}>LifeLink</Text>
          <Text style={styles.subtitle}>Smart Emergency Healthcare at Your Fingertips</Text>
        </View>

        {/* Loading Section - Centered */}
        <View style={styles.loadingSection}>
          <View style={styles.loadingContainer}>
            <View style={styles.loadingTextRow}>
              <View style={styles.loadingIconContainer}>
                <Animated.View style={{ transform: [{ rotate: progress.interpolate({
                  inputRange: [50, 100],
                  outputRange: ['0deg', '360deg'],
                }) }] }}>
                  <MaterialCommunityIcons name="sync" size={16} color="rgba(255,255,255,0.9)" />
                </Animated.View>
              </View>
              <Text style={styles.loadingText}>{loadingText}</Text>
            </View>
            <Text style={styles.percentage}>{percentage}%</Text>
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDots}>
            <View style={styles.dot} />
            <Text style={styles.footerText}>Secure</Text>
            <View style={styles.dot} />
            <Text style={styles.footerText}>Encrypted</Text>
            <View style={styles.dot} />
            <Text style={styles.footerText}>24/7 AI</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1963eb',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SCREEN_HEIGHT * 0.08,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: SCREEN_HEIGHT * 0.1,
  },
  iconContainer: {
    width: SCREEN_WIDTH * 0.24,
    height: SCREEN_WIDTH * 0.24,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: SCREEN_WIDTH * 0.12,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: SCREEN_WIDTH * 0.045,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    maxWidth: SCREEN_WIDTH * 0.7,
    paddingHorizontal: 20,
  },
  loadingSection: {
    width: '100%',
    paddingHorizontal: SCREEN_WIDTH * 0.1,
    alignItems: 'center',
  },
  loadingContainer: {
    width: '100%',
    marginBottom: 16,
  },
  loadingTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  loadingIconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  percentage: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: '500',
  },
});
