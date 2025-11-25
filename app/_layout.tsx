import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AdminProvider } from './contexts/AdminContext';
import { AppearanceProvider } from './contexts/AppearanceContext';
import { LocalizationProvider } from './contexts/LocalizationContext';
import { UserProvider } from './contexts/UserContext';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
    }
  }, []);

  return (
    <AppearanceProvider>
      <LocalizationProvider>
        <UserProvider>
          <AdminProvider>
            <>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="sign-in" />
                <Stack.Screen name="sign-up" />
                <Stack.Screen name="home" options={{ gestureEnabled: false }} />
                <Stack.Screen name="profile" />
                <Stack.Screen name="edit-profile" />
                <Stack.Screen name="chat" />
                <Stack.Screen name="notifications" />
                <Stack.Screen name="settingspanel" />
                <Stack.Screen name="request-detail" />
                <Stack.Screen name="admin-login" />
                <Stack.Screen name="admin-dashboard" options={{ gestureEnabled: false }} />
                <Stack.Screen name="admin-users" />
                <Stack.Screen name="admin-hospitals" />
                <Stack.Screen name="admin-inventory" />
                <Stack.Screen name="admin-requests" />
                <Stack.Screen name="admin-notifications" />
                <Stack.Screen name="admin-settings" />
              </Stack>
            </>
          </AdminProvider>
        </UserProvider>
      </LocalizationProvider>
    </AppearanceProvider>
  );
}
