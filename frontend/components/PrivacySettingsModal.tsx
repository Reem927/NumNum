import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface PrivacySettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrivacySettingsModal({ visible, onClose }: PrivacySettingsModalProps) {
  const { user, updateProfile } = useAuth();
  const [isPrivate, setIsPrivate] = useState(user?.isPublic === false);

  const handleTogglePrivate = async (value: boolean) => {
    setIsPrivate(value);
    // TODO: Update via API
    if (updateProfile) {
      await updateProfile({ isPublic: !value });
    }
  };

  const interactionOptions = [
    { id: 'messages', title: 'Messages and story replies', icon: 'chatbubble-ellipses-outline' },
    { id: 'tags', title: 'Tags and mentions', icon: 'at-outline' },
    { id: 'comments', title: 'Comments', icon: 'chatbubble-outline' },
    { id: 'sharing', title: 'Sharing', icon: 'repeat-outline' },
    { id: 'restricted', title: 'Restricted', icon: 'person-remove-outline', count: 0 },
    { id: 'follow', title: 'Follow and invite friends', icon: 'person-add-outline' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account privacy</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {/* Private Account Toggle */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Private account</Text>
            <Switch
              value={isPrivate}
              onValueChange={handleTogglePrivate}
              trackColor={{ false: '#e0e0e0', true: '#e65332' }}
              thumbColor="#fff"
            />
          </View>

          {/* Description Text */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              When your account is public, your profile and posts can be seen by anyone, on or off NumNum, even if they don{"'"}t have a NumNum account.
            </Text>
            <Text style={styles.descriptionText}>
              When your account is private, only the followers you approve can see what you share, including your reviews on hashtag and location pages, and your followers and following lists. Certain info on your profile, like your profile picture and username, is visible to everyone on and off NumNum. 
              <Text style={styles.linkText}> Learn more</Text>
            </Text>
          </View>

          {/* How others can interact with you */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How others can interact with you</Text>
            {interactionOptions.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionItem,
                  index === interactionOptions.length - 1 && styles.lastOptionItem
                ]}
              >
                <Ionicons name={option.icon as any} size={24} color="#000" />
                <Text style={styles.optionText}>{option.title}</Text>
                {option.count !== undefined && (
                  <Text style={styles.optionCount}>{option.count}</Text>
                )}
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
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
  backButton: {
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
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  linkText: {
    color: '#007AFF',
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastOptionItem: {
    borderBottomWidth: 0,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    marginLeft: 16,
  },
  optionCount: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
});




