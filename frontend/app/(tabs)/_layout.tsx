import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';


export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#e65332',  // Red/orange for ACTIVE tabs
        tabBarInactiveTintColor: '#666',   // Grey for INACTIVE tabs
        tabBarShowLabel: false,  // Remove all labels under buttons
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
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              borderWidth: 2.5,
              borderColor: color, // Uses active/inactive color
              backgroundColor: '#fff',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <MaterialCommunityIcons name="plus" size={24} color={color} />
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