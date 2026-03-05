import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Conditional import for maps - gracefully handle if not installed
let MapView, Marker, Polyline;
let mapsAvailable = false;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
  mapsAvailable = true;
} catch (e) {
  console.log('react-native-maps not installed - using placeholder view');
  mapsAvailable = false;
}

// Dark map style for Google Maps
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1e293b" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94a3b8" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0f172a" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#475569" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94a3b8" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#475569" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cbd5e1" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0f172a" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#475569" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0f172a" }],
  },
];

export default function AmbulanceTracking({ navigation }) {
  const mapRef = useRef(null);
  
  // User's current location
  const [userLocation] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
  });
  
  // Ambulance location (simulated moving)
  const [ambulanceLocation, setAmbulanceLocation] = useState({
    latitude: 37.79825,
    longitude: -122.4424,
  });
  
  // Route coordinates
  const routeCoordinates = [
    { latitude: 37.79825, longitude: -122.4424 },
    { latitude: 37.79525, longitude: -122.4374 },
    { latitude: 37.79125, longitude: -122.4354 },
    { latitude: 37.78825, longitude: -122.4324 },
  ];
  
  // Simulate ambulance movement
  useEffect(() => {
    if (!mapsAvailable) return;
    
    const interval = setInterval(() => {
      setAmbulanceLocation(prev => ({
        latitude: prev.latitude - 0.0001,
        longitude: prev.longitude + 0.0001,
      }));
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Center map on both markers
  useEffect(() => {
    if (!mapsAvailable) return;
    
    if (mapRef.current) {
      mapRef.current.fitToCoordinates([userLocation, ambulanceLocation], {
        edgePadding: { top: 100, right: 50, bottom: 400, left: 50 },
        animated: true,
      });
    }
  }, [ambulanceLocation, userLocation]);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        {mapsAvailable && MapView ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: 37.79,
              longitude: -122.43,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            customMapStyle={darkMapStyle}
          >
            {/* Route polyline */}
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#ef4444"
              strokeWidth={4}
              lineDashPattern={[1]}
            />
            
            {/* User marker */}
            <Marker coordinate={userLocation}>
              <View style={styles.userMarker}>
                <MaterialCommunityIcons name="account" size={24} color="#0f172a" />
              </View>
            </Marker>
            
            {/* Ambulance marker */}
            <Marker coordinate={ambulanceLocation}>
              <View style={styles.ambulanceMarker}>
                <MaterialCommunityIcons name="ambulance" size={28} color="#0f172a" />
              </View>
            </Marker>
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <MaterialCommunityIcons name="map-outline" size={64} color="#64748b" />
            <Text style={styles.placeholderText}>Map View Unavailable</Text>
            <Text style={styles.placeholderSubtext}>Install react-native-maps to enable tracking</Text>
          </View>
        )}
      </View>

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Tracking Ambulance</Text>
          <Text style={styles.headerSubtitle}>LifeLink AI Emergency Services</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn}>
          <MaterialCommunityIcons name="share-variant" size={24} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.mapControlBtn}>
          <MaterialCommunityIcons name="layers" size={24} color="#0f172a" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapControlBtn}>
          <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.handle} />

        <View style={styles.etaSection}>
          <View>
            <Text style={styles.etaLabel}>ESTIMATED ARRIVAL</Text>
            <View style={styles.etaRow}>
              <Text style={styles.etaNumber}>08</Text>
              <Text style={styles.etaUnit}>mins</Text>
            </View>
          </View>
          <View style={styles.distanceCard}>
            <Text style={styles.distanceNumber}>1.2 km</Text>
            <Text style={styles.distanceLabel}>DISTANCE</Text>
          </View>
        </View>

        <View style={styles.driverCard}>
          <View style={styles.driverInfo}>
            <View style={styles.driverImageContainer}>
              <View style={styles.driverImage}>
                <MaterialCommunityIcons name="account" size={32} color="#ef4444" />
              </View>
              <View style={styles.onlineBadge} />
            </View>
            <View>
              <Text style={styles.driverName}>Dr. Marcus Chen</Text>
              <View style={styles.driverRating}>
                <MaterialCommunityIcons name="star" size={14} color="#fbbf24" />
                <Text style={styles.ratingText}>4.9 • Senior Paramedic</Text>
              </View>
            </View>
          </View>
          <View style={styles.licensePlate}>
            <Text style={styles.licensePlateLabel}>LICENSE PLATE</Text>
            <View style={styles.licensePlateBox}>
              <Text style={styles.licensePlateText}>AMB-9922</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.callBtn}>
            <MaterialCommunityIcons name="phone" size={20} color="#0f172a" />
            <Text style={styles.callBtnText}>Call Driver</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatBtn}>
            <MaterialCommunityIcons name="message-text" size={20} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('HomeScreen')}
        >
          <MaterialCommunityIcons name="home-outline" size={24} color="#94a3b8" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemActive}>
          <MaterialCommunityIcons name="navigation" size={24} color="#ef4444" />
          <Text style={styles.navTextActive}>Track</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('History')}
        >
          <MaterialCommunityIcons name="history" size={24} color="#94a3b8" />
          <Text style={styles.navText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <MaterialCommunityIcons name="account-circle-outline" size={24} color="#94a3b8" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundcolor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 16,
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  userMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    bordercolor: '#0f172a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  ambulanceMarker: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    bordercolor: '#0f172a',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    gap: 16,
  },
  headerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16,22,34,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  mapControls: {
    position: 'absolute',
    right: 24,
    bottom: 420,
    gap: 12,
  },
  mapControlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16,22,34,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailsCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(28,31,39,0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
  },
  handle: {
    width: 48,
    height: 6,
    backgroundColor: 'rgba(100,116,139,0.5)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  etaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  etaLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 2,
    marginBottom: 4,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  etaNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  etaUnit: {
    fontSize: 20,
    fontWeight: '500',
    color: '#cbd5e1',
  },
  distanceCard: {
    backgroundColor: 'rgba(239, 68, 68,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68,0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  distanceNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  distanceLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: 'rgba(239, 68, 68,0.7)',
    letterSpacing: 1,
  },
  driverCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  driverImageContainer: {
    position: 'relative',
  },
  driverImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(239, 68, 68,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#101622',
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  licensePlate: {
    alignItems: 'flex-end',
  },
  licensePlateLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  licensePlateBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  licensePlateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  callBtn: {
    flex: 4,
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  callBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  chatBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navItemActive: {
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94a3b8',
  },
  navTextActive: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ef4444',
  },
});
