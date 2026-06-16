import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { memberApi } from '../lib/member-api';
// notifications is imported dynamically to avoid crashing Expo Go (see registerPush below)
import * as LocalAuthentication from 'expo-local-authentication';

type AuthContextType = {
  member: any | null;
  memberData: any | null;
  isLoading: boolean;
  isBiometricsEnabled: boolean;
  setBiometricsEnabled: (enabled: boolean) => Promise<void>;
  authenticateBiometrics: () => Promise<boolean>;
  login: (memberId: string, phone: string) => Promise<boolean>;
  logout: () => void;
  refreshData: () => Promise<void>;
  showCelebration: boolean;
  setShowCelebration: (show: boolean) => void;
  celebrationMilestone: number;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SECURE_STORE_KEYS = {
  MEMBER_ID: 'member_id',
  PHONE: 'member_phone',
  BIOMETRICS: 'biometrics_enabled',
  LAST_MILESTONE: 'last_milestone_shown'
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<any | null>(null);
  const [memberData, setMemberData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBiometricsEnabledState, setIsBiometricsEnabledState] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState(0);

  useEffect(() => {
    // Add a safety timeout to make sure we don't hang on the splash screen forever
    const safetyTimeout = setTimeout(() => {
      console.warn("[AuthContext] Safety timeout triggered! Forcing isLoading to false.");
      setIsLoading(false);
    }, 6000);

    const loadStoredAuth = async () => {
      console.log("[AuthContext] loadStoredAuth started");
      try {
        console.log("[AuthContext] Reading from SecureStore...");
        const storedId = await SecureStore.getItemAsync(SECURE_STORE_KEYS.MEMBER_ID);
        const storedPhone = await SecureStore.getItemAsync(SECURE_STORE_KEYS.PHONE);
        const biometricsPref = await SecureStore.getItemAsync(SECURE_STORE_KEYS.BIOMETRICS);
        console.log("[AuthContext] Stored credentials loaded:", { storedId, storedPhone, biometricsPref });

        if (biometricsPref === 'true') {
          setIsBiometricsEnabledState(true);
        }

        if (storedId && storedPhone) {
          if (biometricsPref === 'true') {
            console.log("[AuthContext] Checking biometrics hardware...");
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            console.log("[AuthContext] Biometrics info:", { hasHardware, isEnrolled });
            
            if (hasHardware && isEnrolled) {
              console.log("[AuthContext] Authenticating biometrics...");
              const authResult = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Verify identity to login',
                disableDeviceFallback: true,
                cancelLabel: 'Cancel'
              });
              console.log("[AuthContext] Biometrics authResult:", authResult);
              
              if (authResult.success) {
                console.log("[AuthContext] Biometrics succeeded, attempting login...");
                const success = await attemptLogin(storedId, storedPhone);
                console.log("[AuthContext] Auto-login status:", success);
                if (!success) {
                   await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.MEMBER_ID);
                   await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.PHONE);
                }
              } else {
                 console.log("[AuthContext] Biometrics failed or cancelled.");
                 setIsLoading(false);
                 return;
              }
            } else {
                console.log("[AuthContext] Fallback auto-login (no hardware/enrollment)...");
                const success = await attemptLogin(storedId, storedPhone);
                console.log("[AuthContext] Auto-login status:", success);
                if (!success) {
                  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.MEMBER_ID);
                  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.PHONE);
                }
            }
          } else {
            console.log("[AuthContext] Attempting auto-login without biometrics...");
            const success = await attemptLogin(storedId, storedPhone);
            console.log("[AuthContext] Auto-login status:", success);
            if (!success) {
               await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.MEMBER_ID);
               await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.PHONE);
            }
          }
        } else {
          console.log("[AuthContext] No stored credentials found.");
        }
      } catch (e) {
        console.error("[AuthContext] Error loading stored auth:", e);
      } finally {
        clearTimeout(safetyTimeout);
        console.log("[AuthContext] loadStoredAuth finished, setting isLoading to false.");
        setIsLoading(false);
      }
    };
    loadStoredAuth();
  }, []);

  // Handle Push Notification Registration when member is logged in
  // Dynamic import to prevent expo-notifications from loading in Expo Go at bundle time
  useEffect(() => {
    const registerPush = async () => {
      if (member?.id) {
        try {
          const { registerForPushNotificationsAsync } = await import('../lib/notifications');
          const token = await registerForPushNotificationsAsync();
          if (token) {
            await memberApi.updatePushToken(member.id, token);
            console.log("Push token registered successfully");
          }
        } catch (e) {
          console.error("Failed to register push token:", e);
        }
      }
    };
    registerPush();
  }, [member?.id]);

  const attemptLogin = async (memberId: string, phone: string) => {
    try {
      const data = await memberApi.getMemberData(memberId, phone);
      if (data) {
        setMember(data.member);
        setMemberData(data);
        
        // Milestone Detection
        const longestStreak = data.enrollments.reduce((max: number, curr: any) => 
          Math.max(max, curr.longest_streak || 0), 0);
        
        const lastMilestone = await SecureStore.getItemAsync(SECURE_STORE_KEYS.LAST_MILESTONE);
        const lastLevel = lastMilestone ? parseInt(lastMilestone) : 0;
        
        // Find if we just crossed a new milestone
        const MILESTONES = [3, 6, 9, 12, 18, 24];
        const currentMilestone = [...MILESTONES].reverse().find(m => longestStreak >= m) || 0;
        
        if (currentMilestone > lastLevel) {
          setCelebrationMilestone(currentMilestone);
          setShowCelebration(true);
          await SecureStore.setItemAsync(SECURE_STORE_KEYS.LAST_MILESTONE, currentMilestone.toString());
        }

        return true;
      }
      return false;
    } catch (e) {
      console.error("Login attempt failed:", e);
      throw e; // Rethrow to let the UI handle the error type
    }
  };

  const login = async (memberId: string, phone: string) => {
    setIsLoading(true);
    const success = await attemptLogin(memberId, phone);
    if (success) {
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.MEMBER_ID, memberId);
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.PHONE, phone);
    }
    setIsLoading(false);
    return success;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.MEMBER_ID);
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.PHONE);
    // Don't delete biometrics preference so it remembers for next person? Or reset it.
    // Usually a logout means fully resetting. Let's reset biometrics.
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.BIOMETRICS);
    setIsBiometricsEnabledState(false);
    setMember(null);
    setMemberData(null);
  };

  const setBiometricsEnabled = async (enabled: boolean) => {
    if (enabled) {
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.BIOMETRICS, 'true');
      setIsBiometricsEnabledState(true);
    } else {
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.BIOMETRICS);
      setIsBiometricsEnabledState(false);
    }
  };

  const authenticateBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (hasHardware && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify identity to login',
        disableDeviceFallback: true,
        cancelLabel: 'Cancel'
      });
      
      if (result.success) {
         // Re-run the auto login
         const storedId = await SecureStore.getItemAsync(SECURE_STORE_KEYS.MEMBER_ID);
         const storedPhone = await SecureStore.getItemAsync(SECURE_STORE_KEYS.PHONE);
         if (storedId && storedPhone) {
           setIsLoading(true);
           const success = await attemptLogin(storedId, storedPhone);
           setIsLoading(false);
           return success;
         }
      }
    }
    return false;
  };

  const refreshData = async () => {
    if (member) {
      const data = await memberApi.getMemberData(member.member_id, member.phone);
      if (data) {
        setMember(data.member);
        setMemberData(data);
        
        // Milestone Detection on refresh
        const longestStreak = data.enrollments.reduce((max: number, curr: any) => 
          Math.max(max, curr.longest_streak || 0), 0);
        
        const lastMilestone = await SecureStore.getItemAsync(SECURE_STORE_KEYS.LAST_MILESTONE);
        const lastLevel = lastMilestone ? parseInt(lastMilestone) : 0;
        
        const MILESTONES = [3, 6, 9, 12, 18, 24];
        const currentMilestone = [...MILESTONES].reverse().find(m => longestStreak >= m) || 0;
        
        if (currentMilestone > lastLevel) {
          setCelebrationMilestone(currentMilestone);
          setShowCelebration(true);
          await SecureStore.setItemAsync(SECURE_STORE_KEYS.LAST_MILESTONE, currentMilestone.toString());
        }
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      member, 
      memberData, 
      isLoading,
      isBiometricsEnabled: isBiometricsEnabledState,
      setBiometricsEnabled,
      authenticateBiometrics,
      login, 
      logout,
      refreshData,
      showCelebration,
      setShowCelebration,
      celebrationMilestone
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
