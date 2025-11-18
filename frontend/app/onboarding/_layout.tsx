import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack>
      <Stack.Screen name="Welcome" options={{ headerShown: false }} />
      <Stack.Screen name="DiscoverSlide" options={{ headerShown: false }} />
      <Stack.Screen name="MapSlide" options={{ headerShown: false }} />
      <Stack.Screen name="CommunitySlide" options={{ headerShown: false }} />
      <Stack.Screen name="ProfileSlide" options={{ headerShown: false }} />
      <Stack.Screen name="Survey" options={{ headerShown: false }} />
    </Stack>
  );
}







