import EditProfileModal from '@/components/EditProfileModal';
import LeaderboardModal from '@/components/LeaderboardModal';
import SettingsModal from '@/components/SettingsModal';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { useSavedList } from '@/context/SavedListContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState('Reviews');
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  
  const { user } = useAuth();
  const { saved } = useSavedList();
  const router = useRouter();

  const handleInstagramPress = () => {
    if (user?.instagramHandle) {
      const username = user.instagramHandle.replace('@', '');
      const instagramUrl = `instagram://user?username=${username}`;
      const webUrl = `https://instagram.com/${username}`;
      
      Linking.canOpenURL(instagramUrl).then(supported => {
        if (supported) {
          Linking.openURL(instagramUrl);
        } else {
          Linking.openURL(webUrl);
        }
      }).catch(() => {
        Linking.openURL(webUrl);
      });
    }
  };

  const handleRankPress = () => {
    setLeaderboardVisible(true);
  };

  const handleEditPreferences = () => {
    router.push('/onboarding/Survey');
  };

  const renderReviewsContent = () => (
    <View style={styles.contentGrid}>
      {Array.from({ length: 25 }).map((_, index) => (
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
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={index} style={styles.threadItem}>
          <View style={styles.threadHeader}>
            <View style={styles.threadAvatar}>
              <Ionicons name="person" size={20} color="#666" />
            </View>
            <View style={styles.threadInfo}>
              <ThemedText style={styles.threadUsername}>username{index + 1}</ThemedText>
              <ThemedText style={styles.threadTime}>2h</ThemedText>
            </View>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={16} color="#666" />
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.threadText}>
            This is a sample thread post #{index + 1}. It can contain multiple lines of text and will wrap naturally.
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
            <TouchableOpacity style={styles.threadAction}>
              <Ionicons name="repeat-outline" size={16} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.threadAction}>
              <Ionicons name="paper-plane-outline" size={16} color="#666" />
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
          <Text style={styles.emptyStateSubtext}>Start exploring to save your favorites!</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Banner Image */}
        <TouchableOpacity 
          style={styles.bannerContainer}
          onPress={() => setEditProfileVisible(true)}
        >
          {user?.bannerImage ? (
            <Image source={{ uri: user.bannerImage }} style={styles.bannerImage} />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Ionicons name="camera" size={40} color="#ccc" />
              <Text style={styles.bannerPlaceholderText}>Add Banner Image</Text>
            </View>
          )}
          
          {/* Settings Icon */}
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setSettingsVisible(true)}
          >
            <Ionicons name="settings" size={24} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Profile Picture */}
        <View style={styles.profilePictureContainer}>
          <TouchableOpacity 
            style={styles.profilePictureWrapper}
            onPress={() => setEditProfileVisible(true)}
          >
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.profilePicture} />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <Ionicons name="person" size={40} color="#ccc" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.userInfoContainer}>
          <Text style={styles.displayName}>{user?.displayName || 'User'}</Text>
          <Text style={styles.username}>@{user?.username || 'username'}</Text>
          
          {/* Instagram Handle */}
          {user?.instagramHandle && (
            <TouchableOpacity 
              style={styles.instagramContainer}
              onPress={handleInstagramPress}
            >
              <Ionicons name="logo-instagram" size={16} color="#e65332" />
              <Text style={styles.instagramHandle}>{user.instagramHandle}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.reviewCount || 25}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1.2K</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>340</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={handleRankPress}>
            <Text style={styles.statNumber}>🏆 #42</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </TouchableOpacity>
        </View>

        {/* Bio - Centered */}
        <View style={styles.bioContainer}>
          <Text style={styles.bioText}>{user?.bio || 'Add your bio here...'}</Text>
          
          {/* User Preferences */}
          {user?.preferences && (
            <View style={styles.preferencesContainer}>
              {user.preferences.favoriteCuisines && user.preferences.favoriteCuisines.length > 0 && (
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
              )}
            </View>
          )}
        </View>

        {/* Edit Buttons - Under Bio */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => setEditProfileVisible(true)}
          >
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.editPreferencesButton}
            onPress={handleEditPreferences}
          >
            <Text style={styles.editPreferencesButtonText}>Edit Preferences</Text>
          </TouchableOpacity>
        </View>

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
      <EditProfileModal 
        visible={editProfileVisible} 
        onClose={() => setEditProfileVisible(false)} 
      />
      <SettingsModal 
        visible={settingsVisible} 
        onClose={() => setSettingsVisible(false)} 
      />
      <LeaderboardModal 
        visible={leaderboardVisible} 
        onClose={() => setLeaderboardVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  // Banner styles
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
  bannerPlaceholderText: {
    color: '#ccc',
    marginTop: 8,
    fontSize: 14,
  },
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 8,
  },
  // Profile picture styles
  profilePictureContainer: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 20,
  },
  profilePictureWrapper: {
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
    overflow: 'hidden',
  },
  profilePicture: {
    width: '100%',
    height: '100%',
  },
  profilePicturePlaceholder: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // User info styles
  userInfoContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  instagramContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  instagramHandle: {
    fontSize: 14,
    color: '#e65332',
    marginLeft: 6,
    fontWeight: '500',
  },
  // Stats styles
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
  // Bio styles - Centered
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
    marginTop: 8,
    alignItems: 'center',
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
  // Action buttons styles - Under Bio
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  editProfileButton: {
    flex: 1,
    backgroundColor: '#e65332',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editProfileButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  editPreferencesButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  editPreferencesButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  // Tabs styles
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
  // Content styles
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
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  // Threads styles
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