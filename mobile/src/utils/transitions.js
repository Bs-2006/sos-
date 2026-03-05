import { Animated, Easing } from 'react-native';

// Reusable animation configurations
export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 400,
};

export const EASING = {
  easeInOut: Easing.bezier(0.4, 0.0, 0.2, 1),
  easeOut: Easing.bezier(0.0, 0.0, 0.2, 1),
  easeIn: Easing.bezier(0.4, 0.0, 1, 1),
  spring: Easing.elastic(1),
};

// Fade in animation
export const fadeIn = (animatedValue, duration = ANIMATION_DURATION.normal) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    easing: EASING.easeOut,
    useNativeDriver: true,
  });
};

// Fade out animation
export const fadeOut = (animatedValue, duration = ANIMATION_DURATION.normal) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: EASING.easeIn,
    useNativeDriver: true,
  });
};

// Slide in from bottom
export const slideInFromBottom = (animatedValue, duration = ANIMATION_DURATION.normal) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: EASING.easeOut,
    useNativeDriver: true,
  });
};

// Slide out to bottom
export const slideOutToBottom = (animatedValue, distance = 100, duration = ANIMATION_DURATION.normal) => {
  return Animated.timing(animatedValue, {
    toValue: distance,
    duration,
    easing: EASING.easeIn,
    useNativeDriver: true,
  });
};

// Scale animation
export const scaleIn = (animatedValue, duration = ANIMATION_DURATION.normal) => {
  return Animated.spring(animatedValue, {
    toValue: 1,
    friction: 8,
    tension: 40,
    useNativeDriver: true,
  });
};

// Scale out animation
export const scaleOut = (animatedValue, duration = ANIMATION_DURATION.fast) => {
  return Animated.timing(animatedValue, {
    toValue: 0.9,
    duration,
    easing: EASING.easeIn,
    useNativeDriver: true,
  });
};

// Button press animation
export const buttonPressAnimation = (animatedValue) => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.spring(animatedValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }),
  ]);
};

// Parallel animations for screen entrance
export const screenEntranceAnimation = (fadeValue, slideValue, scaleValue) => {
  return Animated.parallel([
    fadeIn(fadeValue, ANIMATION_DURATION.normal),
    slideInFromBottom(slideValue, ANIMATION_DURATION.normal),
    scaleIn(scaleValue),
  ]);
};

// Stagger animation for list items
export const staggerAnimation = (animatedValues, delay = 50) => {
  return Animated.stagger(
    delay,
    animatedValues.map((value) => fadeIn(value, ANIMATION_DURATION.fast))
  );
};

// Pulse animation (for notifications, alerts)
export const pulseAnimation = (animatedValue, minScale = 0.95, maxScale = 1.05) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: maxScale,
        duration: 1000,
        easing: EASING.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: minScale,
        duration: 1000,
        easing: EASING.easeInOut,
        useNativeDriver: true,
      }),
    ])
  );
};

// Shake animation (for errors)
export const shakeAnimation = (animatedValue) => {
  return Animated.sequence([
    Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: 0, duration: 50, useNativeDriver: true }),
  ]);
};

// Rotate animation
export const rotateAnimation = (animatedValue, duration = 1000) => {
  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
};

// Modal entrance animation
export const modalEntranceAnimation = (fadeValue, slideValue) => {
  return Animated.parallel([
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: ANIMATION_DURATION.normal,
      easing: EASING.easeOut,
      useNativeDriver: true,
    }),
    Animated.spring(slideValue, {
      toValue: 0,
      friction: 9,
      tension: 50,
      useNativeDriver: true,
    }),
  ]);
};

// Modal exit animation
export const modalExitAnimation = (fadeValue, slideValue, distance = 100) => {
  return Animated.parallel([
    Animated.timing(fadeValue, {
      toValue: 0,
      duration: ANIMATION_DURATION.fast,
      easing: EASING.easeIn,
      useNativeDriver: true,
    }),
    Animated.timing(slideValue, {
      toValue: distance,
      duration: ANIMATION_DURATION.fast,
      easing: EASING.easeIn,
      useNativeDriver: true,
    }),
  ]);
};

// Interpolate for rotation
export const interpolateRotation = (animatedValue) => {
  return animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
};

// Interpolate for opacity
export const interpolateOpacity = (animatedValue, inputRange = [0, 1], outputRange = [0, 1]) => {
  return animatedValue.interpolate({
    inputRange,
    outputRange,
  });
};
