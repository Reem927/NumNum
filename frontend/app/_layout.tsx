import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/AuthContext';
import { SavedListProvider } from '@/context/SavedListContext';
import { PostProvider } from '@/context/PostContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <SavedListProvider>
          <PostProvider>
            <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="Filters" options={{ presentation: 'modal', headerShown: false}} />
            <Stack.Screen name="SavedList" options={{ headerShown: false }} />
            <Stack.Screen name="Search" options={{ presentation: 'fullScreenModal', animation: "slide_from_bottom", headerShown: false, gestureEnabled: true}} />
            <Stack.Screen name="user/[userId]" options={{ headerShown: false }} />
            <Stack.Screen name="post/[postId]" options={{ headerShown: false }} />
            <Stack.Screen name="create-post" options={{ headerShown: false, presentation: 'modal' }} />
          </Stack>
          <StatusBar style="auto" />
          </PostProvider>
        </SavedListProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
