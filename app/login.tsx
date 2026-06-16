import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from '../components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useAlert } from '../context/AlertContext';
import { memberApi, SystemAnnouncement } from '../lib/member-api';
import { AnnouncementPopup } from '../components/AnnouncementPopup';

const logoAsset = require('../assets/logo.png');

export default function LoginScreen() {
  const { theme } = useTheme();
  const { login, isBiometricsEnabled, setBiometricsEnabled, authenticateBiometrics } = useAuth();
  const { showAlert } = useAlert();
  const [memberId, setMemberId] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [announcement, setAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  React.useEffect(() => {
    const checkAnnouncement = async () => {
      try {
        const data = await memberApi.getActiveAnnouncement();
        if (data) {
          setAnnouncement(data as any);
          setShowAnnouncement(true);
        }
      } catch (e) {
        console.error("Failed to fetch announcements:", e);
      }
    };
    
    checkAnnouncement();
  }, []);

  const handleLogin = async () => {
    if (!memberId || !phone) {
      showAlert('Error', 'Please enter both Member ID and Phone number.', 'error');
      return;
    }
    setLoading(true);
    try {
      const success = await login(memberId, phone);
      if (!success) {
        showAlert('Not Found', 'Member not found with these credentials.', 'error');
        setLoading(false);
        return;
      }
      
      // Login succeeded — keep loading=true so the form doesn't flash
      // before navigation to (tabs) kicks in from _layout.tsx
      
      if (!isBiometricsEnabled) {
         const hasHardware = await LocalAuthentication.hasHardwareAsync();
         const isEnrolled = await LocalAuthentication.isEnrolledAsync();
         if (hasHardware && isEnrolled) {
            Alert.alert(
              'Enable Quick Login',
              'Would you like to use Face ID / Touch ID for quicker logins next time?',
              [
                { text: 'No Thanks', style: 'cancel' },
                { 
                  text: 'Enable', 
                  onPress: () => setBiometricsEnabled(true) 
                }
              ]
            );
         }
      }
    } catch (e: any) {
      setLoading(false);
      const msg = e.message || '';
      if (msg.includes('Network request failed')) {
        showAlert('No Internet', 'Please check your internet connection and try again.', 'error');
      } else {
        showAlert('Login Error', msg || 'An unexpected error occurred.', 'error');
      }
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}><Image source={logoAsset} style={styles.logo} resizeMode="contain" /></View>
          <ThemedText type="title" style={[styles.title, { color: theme.primary }]}>Merahe Tsidk</ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>Member Administration Portal</ThemedText>
        </View>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <ThemedText type="caption" style={styles.label}>Member ID</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}><Ionicons name="card-outline" size={20} color={theme.textMuted} style={styles.inputIcon} /><TextInput value={memberId} onChangeText={setMemberId} placeholder="e.g. MEM-001" placeholderTextColor={theme.textMuted} autoCapitalize="characters" style={[styles.input, { color: theme.text }]} /></View>
          </View>
          <View style={styles.inputContainer}>
            <ThemedText type="caption" style={styles.label}>Phone Number</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}><Ionicons name="phone-portrait-outline" size={20} color={theme.textMuted} style={styles.inputIcon} /><TextInput value={phone} onChangeText={setPhone} placeholder="e.g. 091****678" placeholderTextColor={theme.textMuted} keyboardType="phone-pad" style={[styles.input, { color: theme.text }]} /></View>
          </View>
          <TouchableOpacity onPress={handleLogin} disabled={loading} style={[styles.button, { backgroundColor: theme.primary }]}>
            {loading ? <ActivityIndicator color="white" /> : <><ThemedText style={styles.buttonText}>Check Balance</ThemedText><Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} /></>}
          </TouchableOpacity>
          
          {isBiometricsEnabled && (
             <TouchableOpacity onPress={async () => {
               const success = await authenticateBiometrics();
               if (!success) {
                 showAlert('Error', 'Biometric authentication failed. Please login manually.', 'error');
               }
             }} style={[styles.button, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border, marginTop: -8 }]}>
               <Ionicons name="finger-print" size={20} color={theme.text} style={{ marginRight: 8 }} />
               <ThemedText style={{ color: theme.text, fontWeight: '800' }}>Quick Login</ThemedText>
             </TouchableOpacity>
          )}

          <View style={styles.footer}><ThemedText type="caption" style={{ color: theme.textMuted }}>Don't have an account?</ThemedText><Link href="/register" asChild><TouchableOpacity><ThemedText style={[styles.link, { color: theme.primary }]}>Register New Member</ThemedText></TouchableOpacity></Link></View>
        </View>
      </ScrollView>

      <AnnouncementPopup 
        visible={showAnnouncement}
        onClose={() => setShowAnnouncement(false)}
        announcement={announcement}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 48 },
  logoContainer: {
    width: 160,
    height: 160,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: 'white',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: { width: '100%', height: '100%' },
  title: { textAlign: 'center', marginBottom: 4 },
  subtitle: { textAlign: 'center', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, opacity: 0.6 },
  form: { gap: 20 },
  inputContainer: { gap: 8 },
  label: { marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', height: 60, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '600' },
  button: { height: 60, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, elevation: 4 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 5 },
  link: { fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
});
