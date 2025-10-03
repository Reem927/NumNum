import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState('Reviews');

  const renderReviewsContent = () => (
    <View style={styles.contentGrid}>
      {Array.from({ length: 9 }).map((_, index) => (
        <TouchableOpacity key={index} style={styles.gridItem}>
          <View style={styles.gridPlaceholder}>
            <IconSymbol name="photo" size={30} color="#ccc" />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderThreadsContent = () => (
    <View style={styles.threadsContainer}>
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={index} style={styles.threadItem}>
          <View style={styles.threadHeader}>
            <View style={styles.threadAvatar}>
              <IconSymbol name="person.fill" size={20} color="#666" />
            </View>
            <View style={styles.threadInfo}>
              <ThemedText style={styles.threadUsername}>username{index + 1}</ThemedText>
              <ThemedText style={styles.threadTime}>2h</ThemedText>
            </View>
            <TouchableOpacity>
              <IconSymbol name="ellipsis" size={16} color="#666" />
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.threadText}>
            This is a sample thread post #{index + 1}. It can contain multiple lines of text and will wrap naturally.
          </ThemedText>
          <View style={styles.threadActions}>
            <TouchableOpacity style={styles.threadAction}>
              <IconSymbol name="heart" size={16} color="#666" />
              <ThemedText style={styles.actionText}>12</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.threadAction}>
              <IconSymbol name="bubble.left" size={16} color="#666" />
              <ThemedText style={styles.actionText}>3</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.threadAction}>
              <IconSymbol name="arrow.2.squarepath" size={16} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.threadAction}>
              <IconSymbol name="paperplane" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Profile page</ThemedText>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        {/* Profile Picture and Name Row */}
        <View style={styles.profileTopRow}>
          <View style={styles.profilePictureContainer}>
            <View style={styles.profilePicture}>
              <IconSymbol name="person.fill" size={40} color="#666" />
            </View>
          </View>
          
          <View style={styles.nameAndStats}>
            <ThemedText style={styles.name}>Name</ThemedText>
            
            {/* Stats Row */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>10</ThemedText>
                <ThemedText style={styles.statLabel}>Reviews</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>100</ThemedText>
                <ThemedText style={styles.statLabel}>Followers</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>200</ThemedText>
                <ThemedText style={styles.statLabel}>Following</ThemedText>
              </View>
            </View>
          </View>

          {/* Action Icons */}
          <View style={styles.actionIcons}>
            <TouchableOpacity style={styles.actionIcon}>
              <IconSymbol name="plus.square" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon}>
              <IconSymbol name="line.3.horizontal" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.bioSection}>
          <ThemedText style={styles.bioText}>Bio</ThemedText>
          <ThemedText style={styles.bioPlaceholder}>Add your bio here...</ThemedText>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editButton}>
            <ThemedText style={styles.buttonText}>Edit profile</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <ThemedText style={styles.buttonText}>Share profile</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Reviews' && styles.activeTab]}
          onPress={() => setActiveTab('Reviews')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'Reviews' && styles.activeTabText]}>
            Reviews
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Threads' && styles.activeTab]}
          onPress={() => setActiveTab('Threads')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'Threads' && styles.activeTabText]}>
            Threads
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {activeTab === 'Reviews' ? renderReviewsContent() : renderThreadsContent()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  profileSection: {
    padding: 20,
    backgroundColor: '#fff',
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  profilePictureContainer: {
    marginRight: 15,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  nameAndStats: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#000',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionIcon: {
    padding: 5,
  },
  bioSection: {
    marginBottom: 15,
  },
  bioText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#000',
  },
  bioPlaceholder: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },
  contentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 2,
    backgroundColor: '#fff',
  },
  gridItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 2,
  },
  gridPlaceholder: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  // Threads styles
  threadsContainer: {
    backgroundColor: '#fff',
    padding: 10,
  },
  threadItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  threadAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  threadInfo: {
    flex: 1,
  },
  threadUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  threadTime: {
    fontSize: 12,
    color: '#666',
  },
  threadText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
    marginBottom: 10,
  },
  threadActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  threadAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
  },
});