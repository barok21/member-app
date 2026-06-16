import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

export async function registerForPushNotificationsAsync() {
  // Push notifications are not supported in Expo Go since SDK 53
  if (isExpoGo) {
    console.log('Push notifications are not supported in Expo Go. Use a development build.');
    return null;
  }

  // Dynamically require to prevent errors on startup in Expo Go
  const Notifications = require('expo-notifications');
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted.');
        return null;
      }
      
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      if (!projectId) {
        console.warn("No Expo Project ID found. Push notifications disabled. Please run 'npx eas project:init' to link your account.");
        return null;
      }

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e: any) {
      if (e.message?.includes('EXPERIENCE_NOT_FOUND')) {
        console.warn("Expo Experience Not Found: The projectId in app.json is likely invalid or unlinked. Run 'npx eas project:init' to fix.");
      } else {
        console.error("Error getting Expo push token:", e);
      }
      return null;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
    return null;
  }

  return token;
}

// Global handler for incoming notifications (only configured when not in Expo Go)
if (!isExpoGo) {
  try {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    console.error("Failed to initialize expo-notifications handler:", e);
  }
}
