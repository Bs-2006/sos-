import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomNavigation from '../components/BottomNavigation';

// Conditional import for maps
let MapView, Marker;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
} catch (e) {
  console.log('Maps not available, using placeholder');
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TrackScreen({ navigation }) {
  const [activeTracking, setActiveTracking] = useState(true); // Set to true to show tracking

  // Mock tracking data
  const mockTracking = {
    ambulanceNumber: 'AMB-204',
    driverName: 'Rajesh Kumar',
    eta: '4 mins',
    distance: '1.2 km',
    status: 'On the way',
    phone: '+91 98765 43210'
  };

  // Mock locations
  const userLocation = {
    latitude: 37.78825,
    longitude: -122.4324,
  };

  const ambulanceLocation = {
    latitude: 37.79325,
    longitude: -122.4374,
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Emergency</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Map */}
        <View style={styles.mapContainer}>
          {MapView ? (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: 37.79,
                longitude: -122.435,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
            >
              {/* User marker */}
              <Marker coordinate={userLocation}>
                <View style={styles.userMarker}>
                  <MaterialCommunityIcons name="account" size={20} color="#fff" />
                </View>
              </Marker>
              
              {/* Ambulance marker */}
              {activeTracking && (
                <Marker coordinate={ambulanceLocation}>
                  <View style={styles.ambulanceMarker}>
                    <MaterialCommunityIcons name="ambulance" size={24} color="#fff" />
                  </View>
                </Marker>
              )}
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <MaterialCommunityIcons name="map" size={80} color="#94a3b8" />
              <Text style={styles.mapText}>Live Location Tracking</Text>
              <Text style={styles.mapSubtext}>Run: npx expo run:android</Text>
            </View>
          )}
          
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Tracking Info */}
        {activeTracking ? (
          <View style={styles.trackingCard}>
            <View style={styles.trackingHeader}>
              <View style={styles.ambulanceIcon}>
                <MaterialCommunityIcons name="ambulance" size={32} color="#ef4444" />
              </View>
              <View style={styles.trackingInfo}>
                <Text style={styles.ambulanceNumber}>{mockTracking.ambulanceNumber}</Text>
                <Text style={styles.driverName}>{mockTracking.driverName}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{mockTracking.status}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="clock-outline" size={20} color="#64748b" />
                <Text style={styles.detailLabel}>ETA</Text>
                <Text style={styles.detailValue}>{mockTracking.eta}</Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="map-marker-distance" size={20} color="#64748b" />
                <Text style={styles.detailLabel}>Distance</Text>
                <Text style={styles.detailValue}>{mockTracking.distance}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.callButton}>
              <MaterialCommunityIcons name="phone" size={20} color="#fff" />
              <Text style={styles.callButtonText}>Call Driver</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noTrackingCard}>
            <MaterialCommunityIcons name="map-marker-off" size={64} color="#94a3b8" />
            <Text style={styles.noTrackingTitle}>No Active Tracking</Text>
            <Text style={styles.noTrackingText}>
              When you request emergency assistance, you'll be able to track the ambulance location here in real-time.
            </Text>
            <TouchableOpacity 
              style={styles.requestButton}
              onPress={() => navigation.navigate('EmergencyCall')}
            >
              <MaterialCommunityIcons name="alert-circle" size={20} color="#fff" />
              <Text style={styles.requestButtonText}>Request Emergency</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Emergencies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Emergencies</Text>
          
          <View style={styles.historyCard}>
            <View style={styles.historyIcon}>
              <MaterialCommunityIcons name="ambulance" size={24} color="#10b981" />
            </View>
            <View style={styles.historyInfo}>
              <Text style={styles.historyTitle}>Emergency Call</Text>
              <Text style={styles.historyDate}>2 days ago</Text>
            </View>
            <View style={styles.historyStatus}>
              <Text style={styles.historyStatusText}>Completed</Text>
            </View>
          </View>

          <View style={styles.historyCard}>
            <View style={styles.historyIcon}>
              <MaterialCommunityIcons name="alert-circle" size={24} color="#fbbf24" />
            </View>
            <View style={styles.historyInfo}>
              <Text style={styles.historyTitle}>Fall Detection Alert</Text>
              <Text style={styles.historyDate}>1 week ago</Text>
            </View>
            <View style={styles.historyStatus}>
              <Text style={styles.historyStatusText}>Resolved</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation navigation={navigation} activeRoute="TrackScreen" />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
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
  content: {
    flex: 1,
  },
  mapContainer: {
    height: 300,
    backgroundColor: '#e2e8f0',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
  },
  mapSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  userMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  ambulanceMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  liveIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  trackingCard: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ambulanceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  trackingInfo: {
    flex: 1,
  },
  ambulanceNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  driverName: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 4,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  noTrackingCard: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noTrackingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 16,
  },
  noTrackingText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  requestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  historyDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  historyStatus: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  historyStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065f46',
  },
});
