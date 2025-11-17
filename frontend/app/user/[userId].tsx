import FollowersFollowingModal from '@/components/FollowersFollowingModal';
import LeaderboardModal from '@/components/LeaderboardModal';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { useSavedList } from '@/context/SavedListContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { saved } = useSavedList();
  const [activeTab, setActiveTab] = useState('Reviews');
  const [followersFollowingVisible, setFollowersFollowingVisible] = useState(false);
  const [followersFollowingTab, setFollowersFollowingTab] = useState<'followers' | 'following'>('followers');
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);

  // TODO: Fetch user data from API using userId
  // For now, using mock data
  const user = {
    id: userId,
    username: 'otheruser',
    displayName: 'Other User',
    profileImage: undefined,
    bannerImage: undefined,
    bio: 'This is another user\'s profile',
    reviewCount: 15,
    followersCount: 500,
    followingCount: 200,
    rank: 50,
    preferences: {
      favoriteCuisines: ['Italian', 'Japanese'],
    },
  };

  const isOwnProfile = currentUser?.id === userId;

  const handleFollowersPress = () => {
    setFollowersFollowingTab('followers');
    setFollowersFollowingVisible(true);
  };

  const handleFollowingPress = () => {
    setFollowersFollowingTab('following');
    setFollowersFollowingVisible(true);
  };

  const handleRankPress = () => {
    setLeaderboardVisible(true);
  };

  const renderReviewsContent = () => (
    <View style={styles.contentGrid}>
      {Array.from({ length: 15 }).map((_, index) => (
        <TouchableOpacity key={index} style={styles.gridItem}>
          <View style={styles.gridPlaceholder}>
            <Ionicons name="restaurant" size={30} color="#e65332" />
            <Text style={styles.placeholderText}>Review {index + 1}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderThreadsContent = () => (
    <View style={styles.threadsContainer}>
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.threadItem}>
          <View style={styles.threadHeader}>
            <View style={styles.threadAvatar}>
              <Ionicons name="person" size={20} color="#666" />
            </View>
            <View style={styles.threadInfo}>
              <ThemedText style={styles.threadUsername}>{user.username}</ThemedText>
              <ThemedText style={styles.threadTime}>2h</ThemedText>
            </View>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={16} color="#666" />
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.threadText}>
            This is a sample thread post #{index + 1}.
          </ThemedText>
          <View style={styles.threadActions}>
            <TouchableOpacity style={styles.threadAction}>
              <Ionicons name="heart-outline" size={16} color="#666" />
              <ThemedText style={styles.actionText}>12</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.threadAction}>
              <Ionicons name="chatbubble-outline" size={16} color="#666" />
              <ThemedText style={styles.actionText}>3</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderSavesContent = () => (
    <View style={styles.contentGrid}>
      {saved.length > 0 ? (
        saved.map((restaurant, index) => (
          <TouchableOpacity key={restaurant.id} style={styles.gridItem}>
            <View style={styles.gridPlaceholder}>
              <Ionicons name="heart" size={30} color="#e65332" />
              <Text style={styles.placeholderText}>{restaurant.name}</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={50} color="#ccc" />
          <Text style={styles.emptyStateText}>No saved restaurants yet</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user.username}</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Banner Image */}
        <View style={styles.bannerContainer}>
          {user?.bannerImage ? (
            <Image source={{ uri: user.bannerImage }} style={styles.bannerImage} />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Ionicons name="camera" size={40} color="#ccc" />
            </View>
          )}
        </View>

        {/* Profile Picture */}
        <View style={styles.profilePictureContainer}>
          {user?.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.profilePicture} />
          ) : (
            <View style={styles.profilePicturePlaceholder}>
              <Ionicons name="person" size={40} color="#ccc" />
            </View>
          )}
        </View>

        {/* User Info */}
        <View style={styles.userInfoContainer}>
          <Text style={styles.username}>{user?.username || 'username'}</Text>
          <Text style={styles.displayName}>{user?.displayName || 'User'}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.reviewCount || 0}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={handleFollowersPress}>
            <Text style={styles.statNumber}>{user?.followersCount || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={handleFollowingPress}>
            <Text style={styles.statNumber}>{user?.followingCount || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={handleRankPress}>
            <Text style={styles.statNumber}>🏆 #{user?.rank || 0}</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </TouchableOpacity>
        </View>

        {/* Bio - Centered */}
        <View style={styles.bioContainer}>
          <Text style={styles.bioText}>{user?.bio || 'No bio yet...'}</Text>
        </View>

        {/* User Preferences - Only show if they exist */}
        {user?.preferences?.favoriteCuisines && user.preferences.favoriteCuisines.length > 0 && (
          <View style={styles.preferencesContainer}>
            <View style={styles.preferenceSection}>
              <Text style={styles.preferenceLabel}>Favorite Cuisines:</Text>
              <View style={styles.preferenceChips}>
                {user.preferences.favoriteCuisines.map((cuisine) => (
                  <View key={cuisine} style={styles.preferenceChip}>
                    <Text style={styles.preferenceChipText}>{cuisine}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Follow Button (if not own profile) */}
        {!isOwnProfile && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'Reviews' && styles.activeTab]}
            onPress={() => setActiveTab('Reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'Reviews' && styles.activeTabText]}>
              Reviews
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'Threads' && styles.activeTab]}
            onPress={() => setActiveTab('Threads')}
          >
            <Text style={[styles.tabText, activeTab === 'Threads' && styles.activeTabText]}>
              Threads
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'Saves' && styles.activeTab]}
            onPress={() => setActiveTab('Saves')}
          >
            <Text style={[styles.tabText, activeTab === 'Saves' && styles.activeTabText]}>
              Saves
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Area */}
        {activeTab === 'Reviews' && renderReviewsContent()}
        {activeTab === 'Threads' && renderThreadsContent()}
        {activeTab === 'Saves' && renderSavesContent()}
      </ScrollView>

      {/* Modals */}
      <LeaderboardModal 
        visible={leaderboardVisible} 
        onClose={() => setLeaderboardVisible(false)} 
      />
      <FollowersFollowingModal 
        visible={followersFollowingVisible} 
        onClose={() => setFollowersFollowingVisible(false)}
        initialTab={followersFollowingTab}
        userId={user?.id}
        username={user?.username || 'username'}
      />
    </View>
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
    paddingBottom: 16,
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
  moreButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  bannerContainer: {
    height: 220,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
  },
  bioContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  bioText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
  preferencesContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  preferenceSection: {
    marginBottom: 12,
    alignItems: 'center',
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  preferenceChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  preferenceChip: {
    backgroundColor: '#e65332',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  preferenceChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  followButton: {
    flex: 1,
    backgroundColor: '#e65332',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#e65332',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#e65332',
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
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  placeholderText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  threadsContainer: {
    backgroundColor: '#fff',
    padding: 20,
  },
  threadItem: {
    paddingVertical: 16,
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
    marginRight: 12,
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
    marginBottom: 12,
  },
  threadActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  threadAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
  },
});

