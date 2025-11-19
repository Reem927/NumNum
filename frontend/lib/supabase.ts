// frontend/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qqmilwmhvdhwvewwraci.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbWlsd21odmRod3Zld3dyYWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMTk0OTQsImV4cCI6MjA3NzY5NTQ5NH0.rAqbr0BdG0q5iA2uGmlwPQ2hZ72MF8KhNPmjOVIE-AQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // On native (iOS/Android), use AsyncStorage to save the session
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
