import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';


export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: '#e65332',  // Inactive tab color
        tabBarStyle: {
        backgroundColor: '#fff',  // Background color
        borderTopWidth: 1,       // Top border
        borderTopColor: '#e0e0e0', // Border color
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="Map"
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="map-marker" color={color} />,
        }}
      />
      <Tabs.Screen
        name="Create"
        options={{
          tabBarIcon: () => (
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#e65332',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <MaterialCommunityIcons name="plus" size={24} color="#fff" />
            </View>
          ),
        }}
      />  
      <Tabs.Screen
        name="Community"
        options={{
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="text.bubble.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}