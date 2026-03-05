import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { FallDetectionProvider } from './src/contexts/FallDetectionContext';
import SplashScreen from './src/screens/SplashScreen';
import AuthScreen from './src/screens/AuthScreen';
// import PatientDashboard from './src/screens/PatientDashboard';
// import DoctorDashboard from './src/screens/DoctorDashboard';
// import HospitalDashboard from './src/screens/HospitalDashboard';
import SuperAdminDashboard from './src/screens/SuperAdminDashboard';
import EmergencyScreen from './src/screens/EmergencyScreen';
import AmbulanceTracking from './src/screens/AmbulanceTracking';
import ProfileScreen from './src/screens/ProfileScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
// Doctor-specific screens removed
// import DoctorSchedule from './src/screens/DoctorSchedule';
// import DoctorPatients from './src/screens/DoctorPatients';
// import DoctorStats from './src/screens/DoctorStats';
// Hospital-specific screens removed
// import FleetManagement from './src/screens/FleetManagement';
// import InventoryManagement from './src/screens/InventoryManagement';
import EditProfile from './src/screens/EditProfile';
import About from './src/screens/About';
import LanguageSettingsScreen from './src/screens/LanguageSettingsScreen';
import TermsOfService from './src/screens/TermsOfService';
import PrivacyPolicy from './src/screens/PrivacyPolicy';
// import DoctorVerificationScreen from './src/screens/DoctorVerificationScreen';
import FallDetectedScreen from './src/screens/FallDetectedScreen';
import FallDetectionSettingsScreen from './src/screens/FallDetectionSettingsScreen';
import EmergencyContactsSetup from './src/screens/EmergencyContactsSetup';
import ViewEmergencyContactsScreen from './src/screens/ViewEmergencyContactsScreen';
import EmergencyCallScreen from './src/screens/EmergencyCallScreen';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TrackScreen from './src/screens/trackScreen';
import UserLocationScreen from './src/screens/UserLocationScreen';
import TextEmergencyScreen from './src/screens/TextEmergencyScreen';
import EmergencyTrackScreen from './src/screens/EmergencyTrackScreen';
import VoiceEmergencyScreen from './src/screens/VoiceEmergencyScreen';
import EmergencyChatbotScreen from './src/screens/EmergencyChatbotScreen';

const Stack = createNativeStackNavigator();

// Custom transition configurations
const screenOptions = {
  headerShown: false,
  animation: 'default',
  animationDuration: 300,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
};

const modalScreenOptions = {
  headerShown: false,
  presentation: 'modal',
  animation: 'slide_from_bottom',
  animationDuration: 300,
  gestureEnabled: true,
  gestureDirection: 'vertical',
};

const fadeScreenOptions = {
  headerShown: false,
  animation: 'fade',
  animationDuration: 200,
};

export default function App() {
  return (
    <LanguageProvider>
      <NavigationContainer>
        <FallDetectionProvider>
          <Stack.Navigator 
            initialRouteName="Splash"
            screenOptions={screenOptions}
          >
          <Stack.Screen 
            name="Splash" 
            component={SplashScreen}
            options={fadeScreenOptions}
          />
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen}
            options={fadeScreenOptions}
          />
          <Stack.Screen 
            name="PatientDashboard" 
            component={HomeScreen}
            options={{
              ...screenOptions,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="DoctorDashboard" 
            component={HomeScreen}
            options={{
              ...screenOptions,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="HospitalDashboard" 
            component={HomeScreen}
            options={{
              ...screenOptions,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="SuperAdminDashboard" 
            component={SuperAdminDashboard}
            options={{
              ...screenOptions,
              animation: 'slide_from_right',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="Emergency" 
            component={EmergencyScreen}
            options={{
              ...modalScreenOptions,
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen 
            name="TextEmergency" 
            component={TextEmergencyScreen}
            options={{
              ...modalScreenOptions,
              animation: 'slide_from_bottom',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="EmergencyCall" 
            component={EmergencyCallScreen}
            options={{
              ...modalScreenOptions,
              animation: 'slide_from_bottom',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="AmbulanceTracking" 
            component={AmbulanceTracking}
            options={{
              ...screenOptions,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{
              ...screenOptions,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="Notifications" 
            component={NotificationsScreen}
            options={{
              ...modalScreenOptions,
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen 
            name="ProfileScreen" 
            component={ProfileScreen}
            options={{
              ...screenOptions,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="EditProfile" 
            component={EditProfile}
            options={{
              ...screenOptions,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="About" 
            component={About}
            options={{
              ...screenOptions,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="LanguageSettings" 
            component={LanguageSettingsScreen}
            options={{
              ...screenOptions,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="TermsOfService" 
            component={TermsOfService}
            options={{
              ...screenOptions,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="PrivacyPolicy" 
            component={PrivacyPolicy}
            options={{
              ...screenOptions,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="FallDetected" 
            component={FallDetectedScreen}
            options={{
              ...modalScreenOptions,
              animation: 'fade',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="FallDetectionSettings" 
            component={FallDetectionSettingsScreen}
            options={{
              ...screenOptions,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="EmergencyContactsSetup" 
            component={EmergencyContactsSetup}
            options={{
              ...screenOptions,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="ViewEmergencyContacts" 
            component={ViewEmergencyContactsScreen}
            options={{
              ...screenOptions,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="HomeScreen" 
            component={HomeScreen}
            options={{
              ...screenOptions,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              ...screenOptions,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="TrackScreen" 
            component={EmergencyTrackScreen}
            options={{
              ...screenOptions,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="UserLocation" 
            component={UserLocationScreen}
            options={{
              ...screenOptions,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="VoiceEmergency" 
            component={VoiceEmergencyScreen}
            options={{
              ...modalScreenOptions,
              animation: 'slide_from_bottom',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="EmergencyChatbot" 
            component={EmergencyChatbotScreen}
            options={{
              ...modalScreenOptions,
              animation: 'slide_from_bottom',
              gestureEnabled: false,
            }}
          />
        </Stack.Navigator>
        </FallDetectionProvider>
      </NavigationContainer>
    </LanguageProvider>
  );
}
