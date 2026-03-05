import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
  ScrollView,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Circle } from 'react-native-maps';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function UserLocationScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accuracy, setAccuracy] = useState(null);
  const [altitude, setAltitude] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [heading, setHeading] = useState(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      
      // Check permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to show your location.',
          [
            { text: 'Cancel', onPress: () => navigation.goBack() },
            { text: 'Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      // Get current position with high accuracy
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setLocation(coords);
      setAccuracy(position.coords.accuracy);
      setAltitude(position.coords.altitude);
      setSpeed(position.coords.speed);
      setHeading(position.coords.heading);

      // Get address from coordinates
      const addressData = await Location.reverseGeocodeAsync(coords);
      if (addressData && addressData.length > 0) {
        setAddress(addressData[0]);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = () => {
    if (location) {
      const url = Platform.select({
        ios: `maps:0,0?q=${location.latitude},${location.longitude}`,
        android: `geo:0,0?q=${location.latitude},${location.longitude}`,
        default: `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`,
      });
      Linking.openURL(url);
    }
  };

  const shareLocation = async () => {
    if (location) {
      const message = `My current location:\nhttps://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
      try {
        await Share.share({
          message: message,
          title: 'My Location',
        });
      } catch (error) {
        console.error('Error sharing location:', error);
      }
    }
  };

  const formatAddress = () => {
    if (!address) return 'Address not available';
    
    const parts = [];
    if (address.name) parts.push(address.name);
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.region) parts.push(address.region);
    if (address.postalCode) parts.push(address.postalCode);
    if (address.country) parts.push(address.country);
    
    return parts.join(', ') || 'Address not available';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Location</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Location</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={getCurrentLocation}
        >
          <MaterialCommunityIcons name="refresh" size={24} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Map View */}
        {location && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation={true}
              showsMyLocationButton={false}
            >
              <Marker
                coordinate={location}
                title="You are here"
                description={formatAddress()}
              >
                <View style={styles.markerContainer}>
                  <MaterialCommunityIcons name="account-circle" size={40} color="#ef4444" />
                </View>
              </Marker>
              
              {accuracy && (
                <Circle
                  center={location}
                  radius={accuracy}
                  fillColor="rgba(239, 68, 68, 0.1)"
                  strokeColor="rgba(239, 68, 68, 0.3)"
                  strokeWidth={2}
                />
              )}
            </MapView>
          </View>
        )}

        {/* Location Details */}
        <View style={styles.detailsContainer}>
          {/* Address Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="map-marker" size={24} color="#ef4444" />
              <Text style={styles.cardTitle}>Address</Text>
            </View>
            <Text style={styles.addressText}>{formatAddress()}</Text>
          </View>

          {/* Coordinates Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#3b82f6" />
              <Text style={styles.cardTitle}>Coordinates</Text>
            </View>
            <View style={styles.coordinatesRow}>
              <View style={styles.coordinateItem}>
                <Text style={styles.coordinateLabel}>Latitude</Text>
                <Text style={styles.coordinateValue}>
                  {location?.latitude.toFixed(6)}°
                </Text>
              </View>
              <View style={styles.coordinateItem}>
                <Text style={styles.coordinateLabel}>Longitude</Text>
                <Text style={styles.coordinateValue}>
                  {location?.longitude.toFixed(6)}°
                </Text>
              </View>
            </View>
          </View>

          {/* Additional Info */}
          <View style={styles.infoGrid}>
            {accuracy && (
              <View style={styles.infoCard}>
                <MaterialCommunityIcons name="target" size={20} color="#64748b" />
                <Text style={styles.infoLabel}>Accuracy</Text>
                <Text style={styles.infoValue}>{accuracy.toFixed(0)}m</Text>
              </View>
            )}
            
            {altitude !== null && (
              <View style={styles.infoCard}>
                <MaterialCommunityIcons name="elevation-rise" size={20} color="#64748b" />
                <Text style={styles.infoLabel}>Altitude</Text>
                <Text style={styles.infoValue}>{altitude.toFixed(0)}m</Text>
              </View>
            )}
            
            {speed !== null && speed > 0 && (
              <View style={styles.infoCard}>
                <MaterialCommunityIcons name="speedometer" size={20} color="#64748b" />
                <Text style={styles.infoLabel}>Speed</Text>
                <Text style={styles.infoValue}>{(speed * 3.6).toFixed(1)} km/h</Text>
              </View>
            )}
            
            {heading !== null && (
              <View style={styles.infoCard}>
                <MaterialCommunityIcons name="compass" size={20} color="#64748b" />
                <Text style={styles.infoLabel}>Heading</Text>
                <Text style={styles.infoValue}>{heading.toFixed(0)}°</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={openInMaps}
            >
              <MaterialCommunityIcons name="map" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Open in Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={shareLocation}
            >
              <MaterialCommunityIcons name="share-variant" size={24} color="#ef4444" />
              <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                Share Location
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <MaterialCommunityIcons name="information" size={20} color="#3b82f6" />
            <Text style={styles.infoBannerText}>
              Your location is used for emergency services to find you quickly in case of an emergency.
            </Text>
          </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    height: 300,
    backgroundColor: '#e2e8f0',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  addressText: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 16,
  },
  coordinateItem: {
    flex: 1,
  },
  coordinateLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  coordinateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 56) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  actionButtonTextSecondary: {
    color: '#ef4444',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});
