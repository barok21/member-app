import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function IndexRedirect() {
  const { member, isLoading } = useAuth();
  const { isLoaded } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !isLoaded) return;

    if (member) {
      router.replace('/(tabs)');
    } else {
      router.replace('/login');
    }
  }, [isLoading, isLoaded, member, router]);

  // Show a minimal loading spinner while auth/theme load
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00387B' }}>
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
}
