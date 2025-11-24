import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface FollowersFollowingModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'followers' | 'following';
  userId?: string;
  username?: string;
}

interface User {
  id: string;
  username: string;
  displayName: string;
  profileImage?: string;
  isVerified?: boolean;
  isFollowing?: boolean; // Whether current user follows this user
  followsBack?: boolean; // Whether this user follows current user back
  isPublic?: boolean;
  followStatus?: 'not_following' | 'following' | 'requested';
}

export default function FollowersFollowingModal({ 
  visible, 
  onClose, 
  initialTab = 'followers',
  userId,
  username = 'username'
}: FollowersFollowingModalProps) {
  const router = useRouter();
  const { user: currentUser, updateFollowCounts } = useAuth();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data when modal opens or tab changes
  useEffect(() => {
    if (visible) {
      loadData();
      setSearchQuery(''); // Reset search when opening
    }
  }, [visible, activeTab]);

  // Reset to initial tab when modal opens
  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  const loadData = async () => {
    setLoading(true);
  
    try {
      const followersResponse = await apiService.getFollowers(userId!);
      const followingResponse = await apiService.getFollowing(userId!);

      // Handle undefined data by defaulting to empty arrays
      setFollowers(followersResponse.data || []);
      setFollowing(followingResponse.data || []);
    } catch (error) {
      console.error('Error loading followers/following:', error);
      // Set empty arrays on error
      setFollowers([]);
      setFollowing([]);
    }
  
    setLoading(false);
  };

  const handleFollow = async (targetUserId: string) => {
    await apiService.followUser(targetUserId);
  
    if (activeTab === 'followers') {
      updateFollowCounts(+1, 0);
      setFollowers(prev =>
        prev.map(u => u.id === targetUserId ? { ...u, isFollowing: true, followStatus: 'following' } : u)
      );
    } else {
      updateFollowCounts(0, +1);
      setFollowing(prev =>
        prev.map(u => u.id === targetUserId ? { ...u, isFollowing: true, followStatus: 'following' } : u)
      );
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
  await apiService.unfollowUser(targetUserId);

  if (activeTab === 'followers') {
    updateFollowCounts(-1, 0);
    setFollowers(prev =>
      prev.map(u => u.id === targetUserId ? { ...u, isFollowing: false, followStatus: 'not_following' } : u)
    );
  } else {
    updateFollowCounts(0, -1);
    setFollowing(prev =>
      prev.map(u => u.id === targetUserId ? { ...u, isFollowing: false, followStatus: 'not_following' } : u)
    );
  }
};


  const handleUserPress = (targetUserId: string) => {
    onClose();
    // Navigate to user profile
    router.push(`/user/${targetUserId}`);
  };

  const getFilteredUsers = () => {
    const users = activeTab === 'followers' ? followers : following;
    if (!searchQuery.trim()) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.displayName.toLowerCase().includes(query)
    );
  };

  const getButtonText = (user: User) => {
    if (activeTab === 'following') {
      return 'Following';
    } else {
      // In followers tab
      if (user.followStatus === 'requested') {
        return 'Requested';
      } else if (user.isFollowing || user.followStatus === 'following') {
        return 'Following';
      } else {
        return 'Follow Back';
      }
    }
  };

  const getButtonStyle = (user: User) => {
    const isFollowingUser = user.isFollowing || user.followStatus === 'following';
    const isRequested = user.followStatus === 'requested';
    
    if (isRequested) {
      return styles.requestedButton;
    }
    return isFollowingUser ? styles.followingButton : styles.followButton;
  };

  const getButtonTextStyle = (user: User) => {
    const isFollowingUser = user.isFollowing || user.followStatus === 'following';
    const isRequested = user.followStatus === 'requested';
    
    if (isRequested) {
      return styles.requestedButtonText;
    }
    return isFollowingUser ? styles.followingButtonText : styles.followButtonText;
  };

  const filteredUsers = getFilteredUsers();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{username}</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="person-add-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
            onPress={() => setActiveTab('followers')}
          >
            <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
              {followers.length} Followers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'following' && styles.activeTab]}
            onPress={() => setActiveTab('following')}
          >
            <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
              {following.length} Following
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* User List */}
        <ScrollView style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No users found' : `No ${activeTab} yet`}
              </Text>
            </View>
          ) : (
            filteredUsers.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.userItem}
                onPress={() => handleUserPress(user.id)}
              >
                <View style={styles.userInfoContainer}>
                  {user.profileImage ? (
                    <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.profilePlaceholder}>
                      <Ionicons name="person" size={20} color="#ccc" />
                    </View>
                  )}
                  
                  <View style={styles.userInfo}>
                    <View style={styles.usernameRow}>
                      <Text style={styles.username}>{user.username}</Text>
                      {user.isVerified && (
                        <Ionicons name="checkmark-circle" size={16} color="#007AFF" style={styles.verifiedIcon} />
                      )}
                    </View>
                    <Text style={styles.displayName}>{user.displayName}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={getButtonStyle(user)}
                  onPress={(e) => {
                    e.stopPropagation();
                    const isFollowingUser = user.isFollowing || user.followStatus === 'following';
                    const isRequested = user.followStatus === 'requested';
                    if (isFollowingUser) {
                      handleUnfollow(user.id);
                    } else if (!isRequested) {
                      handleFollow(user.id);
                    }
                    // If requested, button is disabled (no action)
                  }}
                >
                  {user.followStatus === 'requested' && (
                    <Ionicons name="checkmark" size={14} color="#666" style={{ marginRight: 4 }} />
                  )}
                  <Text style={getButtonTextStyle(user)}>
                    {getButtonText(user)}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
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
  addButton: {
    padding: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  displayName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#e65332',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  followingButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  requestedButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestedButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
});

