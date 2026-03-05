import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomNavigation from '../components/BottomNavigation';
import { useTranslation } from '../hooks/useTranslation';

export default function NotificationsScreen({ navigation }) {
  const { t } = useTranslation();
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'appointment',
      title: 'Appointment Reminder',
      message: 'Your appointment with Dr. Sarah James is tomorrow at 10:30 AM',
      time: '2 hours ago',
      read: false,
      icon: 'calendar-clock',
      color: '#ef4444'
    },
    {
      id: 2,
      type: 'report',
      title: 'Lab Results Ready',
      message: 'Your blood test results are now available to view',
      time: '5 hours ago',
      read: false,
      icon: 'file-document',
      color: '#10b981'
    },
    {
      id: 3,
      type: 'medicine',
      title: 'Medicine Reminder',
      message: 'Time to take your medication - Paracetamol 500mg',
      time: '1 day ago',
      read: true,
      icon: 'pill',
      color: '#f59e0b'
    },
    {
      id: 4,
      type: 'emergency',
      title: 'Emergency Alert',
      message: 'Ambulance Unit #204 is now 2 minutes away from your location',
      time: '2 days ago',
      read: true,
      icon: 'ambulance',
      color: '#ef4444'
    },
    {
      id: 5,
      type: 'payment',
      title: 'Payment Successful',
      message: 'Your payment of $50 for Dr. Michael Chen consultation has been processed',
      time: '3 days ago',
      read: true,
      icon: 'check-circle',
      color: '#10b981'
    }
  ]);

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <MaterialCommunityIcons name="check-all" size={24} color="#ef4444" />
        </TouchableOpacity>
      </Animated.View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <MaterialCommunityIcons name="bell-badge" size={20} color="#ef4444" />
          <Text style={styles.unreadText}>
            You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bell-off-outline" size={64} color="#334155" />
            <Text style={styles.emptyStateText}>No notifications</Text>
            <Text style={styles.emptyStateSubtext}>You're all caught up!</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.notificationCardUnread
              ]}
              onPress={() => markAsRead(notification.id)}
            >
              <View style={[styles.notificationIcon, { backgroundColor: `${notification.color}15` }]}>
                <MaterialCommunityIcons 
                  name={notification.icon} 
                  size={24} 
                  color={notification.color} 
                />
              </View>
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  {!notification.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteNotification(notification.id)}
              >
                <MaterialCommunityIcons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation navigation={navigation} activeRoute="Notifications" />
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
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68,0.1)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68,0.2)',
  },
  unreadText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundcolor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  notificationCardUnread: {
    backgroundColor: 'rgba(239, 68, 68,0.05)',
    borderColor: 'rgba(239, 68, 68,0.2)',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#64748b',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
