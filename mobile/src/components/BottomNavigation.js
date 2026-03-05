import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const BottomNavigation = ({ navigation, activeRoute }) => {
  const navItems = [
    { name: 'Home', icon: 'home-outline', route: 'HomeScreen' },
    { name: 'Contacts', icon: 'account-group-outline', route: 'EmergencyContactsSetup' },
    { name: 'Track', icon: 'map-marker-outline', route: 'TrackScreen' },
    { name: 'Profile', icon: 'account-outline', route: 'Profile' },
    { name: 'Settings', icon: 'cog-outline', route: 'Settings' },
  ];

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => {
        const isActive = activeRoute === item.route;
        return (
          <TouchableOpacity
            key={item.route}
            style={styles.navItem}
            onPress={() => navigation.navigate(item.route)}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color={isActive ? '#ef4444' : '#94a3b8'}
            />
            <Text style={[styles.navText, isActive && styles.navTextActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 8,
    paddingBottom: 16,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  navTextActive: {
    color: '#ef4444',
    fontWeight: '600',
  },
});

export default BottomNavigation;
