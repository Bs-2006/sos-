import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function EmergencyTrackScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('hospital');
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'hospital', label: 'Hospitals', icon: 'hospital-building', color: '#ef4444' },
    { id: 'police', label: 'Police', icon: 'shield-account', color: '#3b82f6' },
    { id: 'pharmacy', label: 'Pharmacy', icon: 'pill', color: '#f59e0b' },
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (location) {
      fetchNearbyPlaces();
    }
  }, [location, selectedCategory]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      setLoading(false);
    }
  };

  const fetchNearbyPlaces = () => {
    // Mock data - In production, use Google Places API
    const mockPlaces = {
      hospital: [
        {
          id: 1,
          name: 'City General Hospital',
          type: 'Hospital',
          distance: '0.4 km',
          phone: '044-12345678',
          latitude: location.latitude + 0.003,
          longitude: location.longitude + 0.003,
        },
        {
          id: 2,
          name: 'Apollo Clinic',
          type: 'Hospital',
          distance: '1.1 km',
          phone: '044-98765432',
          latitude: location.latitude - 0.008,
          longitude: location.longitude + 0.008,
        },
        {
          id: 3,
          name: 'Emergency Care Center',
          type: 'Hospital',
          distance: '1.5 km',
          phone: '044-55555555',
          latitude: location.latitude + 0.01,
          longitude: location.longitude - 0.01,
        },
      ],
      police: [
        {
          id: 1,
          name: 'Central Police Station',
          type: 'Police Station',
          distance: '0.6 km',
          phone: '100',
          latitude: location.latitude + 0.005,
          longitude: location.longitude - 0.005,
        },
        {
          id: 2,
          name: 'Traffic Police',
          type: 'Police Station',
          distance: '1.2 km',
          phone: '100',
          latitude: location.latitude - 0.009,
          longitude: location.longitude - 0.009,
        },
      ],
      pharmacy: [
        {
          id: 1,
          name: 'MedPlus Pharmacy',
          type: 'Pharmacy',
          distance: '0.3 km',
          phone: '044-11111111',
          latitude: location.latitude + 0.002,
          longitude: location.longitude + 0.002,
        },
        {
          id: 2,
          name: 'Apollo Pharmacy',
          type: 'Pharmacy',
          distance: '0.8 km',
          phone: '044-22222222',
          latitude: location.latitude - 0.006,
          longitude: location.longitude + 0.006,
        },
        {
          id: 3,
          name: '24/7 Medical Store',
          type: 'Pharmacy',
          distance: '1.0 km',
          phone: '044-33333333',
          latitude: location.latitude + 0.007,
          longitude: location.longitude - 0.007,
        },
      ],
    };

    setNearbyPlaces(mockPlaces[selectedCategory] || []);
  };

  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleNavigate = (place) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    Linking.openURL(url);
  };

  const getCategoryIcon = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.icon : 'map-marker';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Hospitals or address..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                selectedCategory === category.id && { backgroundColor: category.color },
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <MaterialCommunityIcons
                name={category.icon}
                size={20}
                color={selectedCategory === category.id ? '#fff' : '#64748b'}
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Map */}
        <View style={styles.mapContainer}>
        {location && (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={location}
            showsUserLocation
            showsMyLocationButton
          >
            {/* User location marker */}
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="You are here"
            >
              <View style={styles.userMarker}>
                <MaterialCommunityIcons name="account-circle" size={32} color="#3b82f6" />
              </View>
            </Marker>

            {/* Nearby places markers */}
            {nearbyPlaces.map((place) => (
              <Marker
                key={place.id}
                coordinate={{
                  latitude: place.latitude,
                  longitude: place.longitude,
                }}
                title={place.name}
                description={place.type}
              >
                <View style={[styles.placeMarker, { backgroundColor: categories.find(c => c.id === selectedCategory)?.color }]}>
                  <MaterialCommunityIcons 
                    name={getCategoryIcon(selectedCategory)} 
                    size={24} 
                    color="#fff" 
                  />
                </View>
              </Marker>
            ))}
          </MapView>
        )}

        {/* Current Location Button */}
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={getCurrentLocation}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* Places List */}
      <View style={styles.placesContainer}>
        <View style={styles.placesHeader}>
          <MaterialCommunityIcons 
            name={getCategoryIcon(selectedCategory)} 
            size={24} 
            color="#0f172a" 
          />
          <Text style={styles.placesTitle}>
            {categories.find(c => c.id === selectedCategory)?.label} Nearby
          </Text>
          <Text style={styles.placesCount}>{nearbyPlaces.length} found</Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.placesList}
        >
          {nearbyPlaces.map((place) => (
            <View key={place.id} style={styles.placeCard}>
              <View style={styles.placeIcon}>
                <MaterialCommunityIcons
                  name={getCategoryIcon(selectedCategory)}
                  size={32}
                  color={categories.find(c => c.id === selectedCategory)?.color}
                />
              </View>

              <Text style={styles.placeName}>{place.name}</Text>
              <Text style={styles.placeType}>{place.type}</Text>

              <View style={styles.placeInfo}>
                <MaterialCommunityIcons name="map-marker" size={14} color="#64748b" />
                <Text style={styles.placeDistance}>{place.distance}</Text>
              </View>

              <View style={styles.placeInfo}>
                <MaterialCommunityIcons name="phone" size={14} color="#64748b" />
                <Text style={styles.placePhone}>{place.phone}</Text>
              </View>

              <View style={styles.placeActions}>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => handleCall(place.phone)}
                >
                  <Text style={styles.callButtonText}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.goButton}
                  onPress={() => handleNavigate(place)}
                >
                  <Text style={styles.goButtonText}>Go</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('HomeScreen')}
        >
          <MaterialCommunityIcons name="home-outline" size={24} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('EmergencyContactsSetup')}
        >
          <MaterialCommunityIcons name="account-group-outline" size={24} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.sosButton}>
          <MaterialCommunityIcons name="plus" size={32} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="map-marker" size={24} color="#10b981" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <MaterialCommunityIcons name="cog-outline" size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    flexDirection: 'column',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'System',
  },
  mapContainer: {
    height: 300,
    position: 'relative',
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
  userMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  locationButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    fontFamily: 'System',
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  categoryContent: {
    gap: 12,
    paddingRight: 16,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: 'System',
  },
  categoryTextActive: {
    color: '#fff',
  },
  placesContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  placesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  placesTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'System',
  },
  placesCount: {
    fontSize: 13,
    color: '#64748b',
    fontFamily: 'System',
  },
  placesList: {
    gap: 10,
    paddingBottom: 16,
  },
  placeCard: {
    width: 170,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  placeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  placeName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 2,
    fontFamily: 'System',
    letterSpacing: 0.3,
  },
  placeType: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  placeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  placeDistance: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  placePhone: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  placeActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  callButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  callButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#fff',
    fontFamily: 'System',
    letterSpacing: 0.3,
  },
  goButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  goButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#0f172a',
    fontFamily: 'System',
    letterSpacing: 0.3,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  sosButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
