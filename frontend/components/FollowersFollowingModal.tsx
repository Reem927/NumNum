import { useAuth } from '@/context/AuthContext';
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
}

export default function FollowersFollowingModal({ 
  visible, 
  onClose, 
  initialTab = 'followers',
  userId,
  username = 'username'
}: FollowersFollowingModalProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
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
    // TODO: Replace with actual API calls
    // const response = await apiService.getFollowers(userId);
    // const followingResponse = await apiService.getFollowing(userId);
    
    // Mock data
    const mockFollowers: User[] = [
      { id: '1', username: 'annaclaramm', displayName: 'Arlene McCoy', isVerified: true, isFollowing: false, followsBack: false },
      { id: '2', username: 'marciacristina', displayName: 'Leslie Alexander', isFollowing: true, followsBack: true },
      { id: '3', username: 'afonsoinocente', displayName: 'Courtney Henry', isFollowing: false, followsBack: false },
      { id: '4', username: 'fmacfadin', displayName: 'Floyd Miles', isFollowing: true, followsBack: true },
      { id: '5', username: 'brunopadilha', displayName: 'Dianne Russell', isFollowing: true, followsBack: true },
      { id: '6', username: 'kcrews', displayName: 'Marvin McKinney', isFollowing: true, followsBack: true },
      { id: '7', username: 'sbeden', displayName: 'Savannah Nguyen', isFollowing: false, followsBack: false },
      { id: '8', username: 'cpechae', displayName: 'Cameron Williamson', isFollowing: false, followsBack: false },
    ];

    const mockFollowing: User[] = [
      { id: '1', username: 'annaclaramm', displayName: 'Arlene McCoy', isVerified: true, isFollowing: true },
      { id: '2', username: 'marciacristina', displayName: 'Leslie Alexander', isFollowing: true },
      { id: '3', username: 'afonsoinocente', displayName: 'Courtney Henry', isFollowing: true },
      { id: '4', username: 'fmacfadin', displayName: 'Floyd Miles', isVerified: true, isFollowing: true },
      { id: '5', username: 'brunopadilha', displayName: 'Dianne Russell', isFollowing: true },
      { id: '6', username: 'kcrews', displayName: 'Marvin McKinney', isFollowing: true },
      { id: '7', username: 'sbeden', displayName: 'Savannah Nguyen', isFollowing: true },
      { id: '8', username: 'cpechae', displayName: 'Cameron Williamson', isFollowing: true },
    ];

    setFollowers(mockFollowers);
    setFollowing(mockFollowing);
    setLoading(false);
  };

  const handleFollow = async (targetUserId: string) => {
    // TODO: Replace with actual API call
    // await apiService.followUser(targetUserId);
    
    // Update local state
    if (activeTab === 'followers') {
      setFollowers(prev => prev.map(u => 
        u.id === targetUserId ? { ...u, isFollowing: true } : u
      ));
    } else {
      setFollowing(prev => prev.map(u => 
        u.id === targetUserId ? { ...u, isFollowing: true } : u
      ));
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    // TODO: Replace with actual API call
    // await apiService.unfollowUser(targetUserId);
    
    // Update local state
    if (activeTab === 'followers') {
      setFollowers(prev => prev.map(u => 
        u.id === targetUserId ? { ...u, isFollowing: false } : u
      ));
    } else {
      setFollowing(prev => prev.map(u => 
        u.id === targetUserId ? { ...u, isFollowing: false } : u
      ));
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
      if (user.isFollowing) {
        return 'Following';
      } else {
        return 'Follow Back';
      }
    }
  };

  const getButtonStyle = (user: User) => {
    const isFollowingUser = user.isFollowing;
    return isFollowingUser ? styles.followingButton : styles.followButton;
  };

  const getButtonTextStyle = (user: User) => {
    const isFollowingUser = user.isFollowing;
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
                    if (user.isFollowing) {
                      handleUnfollow(user.id);
                    } else {
                      handleFollow(user.id);
                    }
                  }}
                >
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
});

