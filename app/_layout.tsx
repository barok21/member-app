import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AlertProvider } from '../context/AlertContext';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StatusBar } from 'expo-status-bar';
import { AchievementCelebration } from '../components/AchievementCelebration';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';

function RootLayoutContent() {
  const { member, isLoading, showCelebration, setShowCelebration, celebrationMilestone } = useAuth();
  const { theme, isLoaded, isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !isLoaded) return;

    const rootSegment = segments[0];
    const inAuthGroup = rootSegment === '(tabs)';
    const isSplash = !rootSegment || rootSegment === 'index';

    // If we are on the splash screen, let it handle its own timing and redirection
    if (isSplash) return;

    if (!member && inAuthGroup) {
      // Redirect to login if not authenticated and trying to access tabs
      router.replace('/login');
    } else if (member && !inAuthGroup) {
      // Redirect to dashboard if authenticated and on login/register
      router.replace('/(tabs)');
    }
  }, [member, isLoading, isLoaded, segments]);

  // Sync Android System Navigation Bar with Theme
  useEffect(() => {
    if (Platform.OS === 'android' && isLoaded) {
      (async () => {
        try {
          await NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
          await NavigationBar.setBorderColorAsync(theme.background);
        } catch (e) {
          console.warn('Failed to update navigation bar:', e);
        }
      })();
    }
  }, [theme.background, isDark, isLoaded]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00387B' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent={true} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="register" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      </Stack>

      <AchievementCelebration 
        visible={showCelebration}
        onClose={() => setShowCelebration(false)}
        milestoneLevel={celebrationMilestone}
      />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AlertProvider>
            <RootLayoutContent />
          </AlertProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
