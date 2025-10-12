import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

// import the extra attribute from expo config
const extra = Constants.expoConfig?.extra;
const supabaseUrl = extra?.supabaseUrl as string;
const supabaseAnonKey = extra?.supabaseAnonKey as string;

const memoryStore: Record<string, string | null> = {};
const memoryStorage = {
    getItem: async (k: string) => memoryStore[k] ?? null,
    setItem: async (k: string, v: string) => { memoryStore[k] = v; },
    removeItem: async (k: string) => { delete memoryStore[k]; },
};

// switch to the in-memory storage for SSR 
const storage = 
    Platform.OS !== 'web'
    ? AsyncStorage
    : (typeof window === 'undefined' ? memoryStorage : undefined)

// creates a new supabase client, given the url + anonkey
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage,
        //{
        //    getItem: (key) => AsyncStorage.getItem(key),
        //    setItem: (key, value) => AsyncStorage.setItem(key, value),
        //    removeItem: (key) => AsyncStorage.removeItem(key),
        //},
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
    }
});