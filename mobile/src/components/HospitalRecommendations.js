import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HospitalRecommendations({ situation, location, onHospitalSelect }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseOfAction, setCourseOfAction] = useState([]);

  useEffect(() => {
    fetchRecommendations();
  }, [situation, location]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/hospitals/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          situation,
          location,
          limit: 5,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setCourseOfAction(data.courseOfAction || []);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleDirections = (hospital) => {
    const url = `https://www.google.com/maps/search/${encodeURIComponent(hospital.name)}/@${location.latitude},${location.longitude}`;
    Linking.openURL(url);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return 'alert-octagon';
      case 'high':
        return 'alert-circle';
      case 'medium':
        return 'alert';
      default:
        return 'information';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={styles.loadingText}>Finding best hospitals...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchRecommendations}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Course of Action */}
      {courseOfAction.length > 0 && (
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Recommended Actions</Text>
          {courseOfAction.map((action, index) => (
            <View key={index} style={styles.actionCard}>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(action.priority) }]}>
                <Text style={styles.priorityText}>{action.priority}</Text>
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{action.action}</Text>
                <Text style={styles.actionDetails}>{action.details}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Hospital Recommendations */}
      <View style={styles.recommendationsSection}>
        <Text style={styles.sectionTitle}>Recommended Hospitals</Text>
        
        {recommendations.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <MaterialCommunityIcons name="hospital-building" size={48} color="#cbd5e1" />
            <Text style={styles.noResultsText}>No hospitals found nearby</Text>
          </View>
        ) : (
          recommendations.map((hospital, index) => (
            <TouchableOpacity
              key={hospital.id}
              style={[styles.hospitalCard, index === 0 && styles.topRecommendation]}
              onPress={() => onHospitalSelect && onHospitalSelect(hospital)}
            >
              {index === 0 && (
                <View style={styles.topRecommendationBadge}>
                  <MaterialCommunityIcons name="star" size={16} color="#fbbf24" />
                  <Text style={styles.topRecommendationText}>Top Recommendation</Text>
                </View>
              )}

              <View style={styles.hospitalHeader}>
                <View style={styles.hospitalInfo}>
                  <Text style={styles.hospitalName}>{hospital.name}</Text>
                  <View style={styles.ratingContainer}>
                    <MaterialCommunityIcons name="star" size={14} color="#fbbf24" />
                    <Text style={styles.rating}>{hospital.rating.toFixed(1)}</Text>
                  </View>
                </View>
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreLabel}>Match</Text>
                  <Text style={styles.score}>{hospital.score}%</Text>
                </View>
              </View>

              <View style={styles.hospitalDetails}>
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="map-marker" size={16} color="#64748b" />
                  <Text style={styles.detailText}>{hospital.distance} km away</Text>
                </View>
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="phone" size={16} color="#64748b" />
                  <Text style={styles.detailText}>{hospital.phone}</Text>
                </View>
                {hospital.availableBeds > 0 && (
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="bed" size={16} color="#64748b" />
                    <Text style={styles.detailText}>{hospital.availableBeds} beds available</Text>
                  </View>
                )}
                {hospital.availableICUBeds > 0 && (
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="hospital-box" size={16} color="#64748b" />
                    <Text style={styles.detailText}>{hospital.availableICUBeds} ICU beds available</Text>
                  </View>
                )}
              </View>

              {hospital.specializations && hospital.specializations.length > 0 && (
                <View style={styles.specializationsContainer}>
                  <Text style={styles.specializationsLabel}>Specializations:</Text>
                  <View style={styles.specializationsList}>
                    {hospital.specializations.slice(0, 3).map((spec, i) => (
                      <View key={i} style={styles.specializationTag}>
                        <Text style={styles.specializationText}>{spec}</Text>
                      </View>
                    ))}
                    {hospital.specializations.length > 3 && (
                      <View style={styles.specializationTag}>
                        <Text style={styles.specializationText}>+{hospital.specializations.length - 3}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {hospital.reason && (
                <View style={styles.reasonContainer}>
                  <MaterialCommunityIcons name="check-circle" size={14} color="#10b981" />
                  <Text style={styles.reasonText}>{hospital.reason}</Text>
                </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => handleCall(hospital.phone)}
                >
                  <MaterialCommunityIcons name="phone" size={18} color="#fff" />
                  <Text style={styles.callButtonText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={() => handleDirections(hospital)}
                >
                  <MaterialCommunityIcons name="directions" size={18} color="#fff" />
                  <Text style={styles.directionsButtonText}>Directions</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function getPriorityColor(priority) {
  switch (priority) {
    case 'IMMEDIATE':
      return '#ef4444';
    case 'URGENT':
      return '#f97316';
    case 'NEXT':
      return '#3b82f6';
    default:
      return '#6b7280';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  actionSection: {
    marginBottom: 24,
  },
  recommendationsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  actionDetails: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noResultsText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
  },
  hospitalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topRecommendation: {
    borderColor: '#fbbf24',
    borderWidth: 2,
    backgroundColor: '#fffbeb',
  },
  topRecommendationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  topRecommendationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 4,
  },
  hospitalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scoreLabel: {
    fontSize: 10,
    color: '#0369a1',
    fontWeight: '600',
  },
  score: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  hospitalDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#64748b',
  },
  specializationsContainer: {
    marginBottom: 12,
  },
  specializationsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  specializationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specializationTag: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  specializationText: {
    fontSize: 11,
    color: '#4f46e5',
    fontWeight: '500',
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  reasonText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  callButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  directionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  directionsButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
