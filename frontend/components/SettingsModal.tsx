import { useAuth } from '@/context/AuthContext';
import PrivacySettingsModal from '@/components/PrivacySettingsModal';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface SettingsSection {
  id: string;
  title: string;
  icon: string;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  onPress?: () => void;
  isDestructive?: boolean;
}

export default function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            onClose();
            router.replace('/auth/Login');
          }
        }
      ]
    );
  };

  const handleEditPreferences = () => {
    onClose();
    router.push('/onboarding/Survey');
  };

  const settingsSections: SettingsSection[] = [
    {
      id: 'general',
      title: 'General',
      icon: 'settings',
      items: [
        {
          id: 'language',
          title: 'Language & Region',
          description: 'Choose app language, units like miles/km, currency, etc.',
          onPress: () => Alert.alert('Coming Soon', 'Language settings will be available soon')
        },
        {
          id: 'theme',
          title: 'Theme / Appearance',
          description: 'Light, dark, or system default',
          onPress: () => Alert.alert('Coming Soon', 'Theme settings will be available soon')
        },
        {
          id: 'notifications',
          title: 'Notifications',
          description: 'Enable/disable push, email, or in-app notifications for follows, likes, comments, etc.',
          onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available soon')
        },
        {
          id: 'location',
          title: 'Location Settings',
          description: 'Allow location for nearby restaurants / spots',
          onPress: () => Alert.alert('Coming Soon', 'Location settings will be available soon')
        }
      ]
    },
    {
      id: 'account',
      title: 'Account',
      icon: 'person',
      items: [
        {
          id: 'profile',
          title: 'Profile Settings',
          description: 'Edit username, display name, bio, avatar',
          onPress: () => Alert.alert('Coming Soon', 'Profile settings will be available soon')
        },
        {
          id: 'privacy',
          title: 'Privacy Settings',
          description: 'Make account public/private, control who can comment or follow, hide activity status',
          onPress: () => setPrivacyModalVisible(true)
        },
        {
          id: 'connected',
          title: 'Connected Accounts',
          description: 'Google, Apple, Email, or social logins',
          onPress: () => Alert.alert('Coming Soon', 'Connected accounts will be available soon')
        },
        {
          id: 'security',
          title: 'Password & Security',
          description: 'Change password, 2-Factor Authentication, manage trusted devices',
          onPress: () => Alert.alert('Coming Soon', 'Security settings will be available soon')
        },
        {
          id: 'delete',
          title: 'Delete / Deactivate Account',
          isDestructive: true,
          onPress: () => Alert.alert('Coming Soon', 'Account deletion will be available soon')
        }
      ]
    },
    {
      id: 'content',
      title: 'Content & Preferences',
      icon: 'chatbubbles',
      items: [
        {
          id: 'preferences',
          title: 'Cuisine & Dietary Preferences',
          description: 'Editable from onboarding survey',
          onPress: handleEditPreferences
        },
        {
          id: 'feed',
          title: 'Feed Preferences',
          description: 'Filter by distance / type / popularity, enable/disable NSFW or explicit reviews',
          onPress: () => Alert.alert('Coming Soon', 'Feed preferences will be available soon')
        },
        {
          id: 'blocked',
          title: 'Blocked Users & Hidden Spots',
          onPress: () => Alert.alert('Coming Soon', 'Blocked users will be available soon')
        },
        {
          id: 'saved',
          title: 'Saved Lists Management',
          onPress: () => Alert.alert('Coming Soon', 'Saved lists management will be available soon')
        }
      ]
    },
    {
      id: 'privacy',
      title: 'Privacy & Data',
      icon: 'lock-closed',
      items: [
        {
          id: 'download',
          title: 'Download My Data',
          onPress: () => Alert.alert('Coming Soon', 'Data download will be available soon')
        },
        {
          id: 'clear-search',
          title: 'Clear Search History',
          onPress: () => Alert.alert('Coming Soon', 'Clear search history will be available soon')
        },
        {
          id: 'clear-cache',
          title: 'Clear Cache',
          onPress: () => Alert.alert('Coming Soon', 'Clear cache will be available soon')
        },
        {
          id: 'analytics',
          title: 'App Analytics / Tracking Consent',
          onPress: () => Alert.alert('Coming Soon', 'Analytics settings will be available soon')
        },
        {
          id: 'terms',
          title: 'Terms of Service',
          onPress: () => Alert.alert('Coming Soon', 'Terms of service will be available soon')
        },
        {
          id: 'privacy-policy',
          title: 'Privacy Policy',
          onPress: () => Alert.alert('Coming Soon', 'Privacy policy will be available soon')
        }
      ]
    },
    {
      id: 'support',
      title: 'Support',
      icon: 'help-circle',
      items: [
        {
          id: 'help',
          title: 'Help Center',
          onPress: () => Alert.alert('Coming Soon', 'Help center will be available soon')
        },
        {
          id: 'bug',
          title: 'Report a Bug',
          onPress: () => Alert.alert('Coming Soon', 'Bug reporting will be available soon')
        },
        {
          id: 'contact',
          title: 'Contact Support',
          onPress: () => Alert.alert('Coming Soon', 'Contact support will be available soon')
        },
        {
          id: 'rate',
          title: 'Rate Us on App Store / Play Store',
          onPress: () => Alert.alert('Coming Soon', 'App rating will be available soon')
        },
        {
          id: 'about',
          title: 'About NumNum (version, build info)',
          onPress: () => Alert.alert('About NumNum', 'Version 1.0.0\nBuild 1')
        }
      ]
    }
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {settingsSections.map((section) => (
            <View key={section.id} style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection(section.id)}
              >
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name={section.icon as any} size={20} color="#e65332" />
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                <Ionicons
                  name={expandedSections.includes(section.id) ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>

              {expandedSections.includes(section.id) && (
                <View style={styles.sectionContent}>
                  {section.items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.settingsItem}
                      onPress={item.onPress}
                    >
                      <View style={styles.itemContent}>
                        {item.icon && (
                          <Ionicons 
                            name={item.icon as any} 
                            size={18} 
                            color={item.isDestructive ? '#ff4444' : '#666'} 
                            style={styles.itemIcon}
                          />
                        )}
                        <View style={styles.itemTextContainer}>
                          <Text style={[
                            styles.itemTitle,
                            item.isDestructive && styles.destructiveText
                          ]}>
                            {item.title}
                          </Text>
                          {item.description && (
                            <Text style={styles.itemDescription}>{item.description}</Text>
                          )}
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#ccc" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="#ff4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      <PrivacySettingsModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 12,
  },
  sectionContent: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    marginRight: 12,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  destructiveText: {
    color: '#ff4444',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff4444',
    marginTop: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff4444',
    marginLeft: 8,
  },
});





