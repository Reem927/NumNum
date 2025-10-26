import { apiService } from '@/services/api';
import { User, UserPreferences } from '@/types/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signUp: (userData: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePreferences: (preferences: UserPreferences) => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData: any) => {
    setLoading(true);
    try {
      const response = await apiService.signUp(userData);
      const newUser = {...response.data.user,isNewUser: true,hasCompletedOnboarding: false};

      // Store auth data
      await AsyncStorage.setItem('auth_token', response.data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
      
      setUser(response.data.user);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiService.signIn(email, password);
      const existingUser = { ...response.data.user, isNewUser: false };
      
      // Store auth data
      await AsyncStorage.setItem('auth_token', response.data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
      
      setUser(response.data.user);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await apiService.signOut();
      
      // Clear auth data
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (preferences: UserPreferences) => {
    if (!user) return;
    
    try {
      const response = await apiService.updateUserPreferences(user.id, preferences);
      
      // Update local user data
      const updatedUser = { ...user, preferences: response.data.preferences };
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Update preferences error:', error);
      throw error;
    }
  };

  const updateProfile = async (profileData: Partial<User>) => {
    if (!user) return;
    
    try {
      // Update local user data
      const updatedUser = { ...user, ...profileData };
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    
    try {
      const response = await apiService.completeOnboarding(user.id);
      
      // Update local user data
      const completedUser = { ...user, hasCompletedOnboarding: true };
      await AsyncStorage.setItem('user_data', JSON.stringify(completedUser));
      setUser(completedUser);
    } catch (error) {
      console.error('Complete onboarding error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signUp,
      signIn,
      signOut,
      updatePreferences,
      updateProfile,
      completeOnboarding,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};


