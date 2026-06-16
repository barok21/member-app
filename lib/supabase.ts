import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://bwacrcpcorvuafdhjqti.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3YWNyY3Bjb3J2dWFmZGhqcXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTQwMDcsImV4cCI6MjA3NTA5MDAwN30.qQIBBayLfK1OJN1ybw3LPQo1j3mEDP2e8yM_G2BttyI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
