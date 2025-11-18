import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function IndexScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/auth/Login');
      } else if (!user.hasCompletedOnboarding) {
        router.replace('/onboarding/Welcome');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, loading, router]);

  // Show loading screen while checking auth state
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#e65332" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});







