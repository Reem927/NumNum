import { useAuth } from '@/context/AuthContext';
import { followService, FollowListEntry } from '@/services/follow';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  onRelationshipChange?: () => void;
}

export default function FollowersFollowingModal({
  visible,
  onClose,
  initialTab = 'followers',
  userId,
  username = 'username',
  onRelationshipChange,
}: FollowersFollowingModalProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [followers, setFollowers] = useState<FollowListEntry[]>([]);
  const [following, setFollowing] = useState<FollowListEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLists = useCallback(async () => {
    if (!userId || !visible) return;
    setLoading(true);

    try {
      const [followersData, followingData] = await Promise.all([
        followService.listFollowers(userId, currentUser?.id),
        followService.listFollowing(userId, currentUser?.id),
      ]);

      setFollowers(followersData);
      setFollowing(followingData);
      setSearchQuery('');
    } catch (error) {
      console.error('Error loading follower data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, visible, currentUser?.id]);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      fetchLists();
    }
  }, [visible, initialTab, fetchLists]);

  const refreshAfterAction = useCallback(async () => {
    await fetchLists();
    onRelationshipChange?.();
  }, [fetchLists, onRelationshipChange]);

  const handleFollow = async (targetUserId: string) => {
    if (!currentUser?.id) return;
    try {
      await followService.followUser(currentUser.id, targetUserId);
      refreshAfterAction();
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    if (!currentUser?.id) return;
    try {
      await followService.unfollowUser(currentUser.id, targetUserId);
      refreshAfterAction();
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const handleUserPress = (targetUserId: string) => {
    onClose();
    router.push(`/user/${targetUserId}`);
  };

  const filteredUsers = useMemo(() => {
    const users = activeTab === 'followers' ? followers : following;
    if (!searchQuery.trim()) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(query) ||
        user.displayName.toLowerCase().includes(query)
    );
  }, [followers, following, activeTab, searchQuery]);

  const getButtonText = (user: FollowListEntry) => {
    if (activeTab === 'following') {
      return user.relationshipStatus === 'requested' ? 'Requested' : 'Following';
    }

    if (user.followStatus === 'requested') return 'Requested';
    if (user.followStatus === 'following') return 'Following';
    return 'Follow Back';
  };

  const getButtonStyle = (user: FollowListEntry) => {
    const requested =
      activeTab === 'following'
        ? user.relationshipStatus === 'requested'
        : user.followStatus === 'requested';

    if (requested) return styles.requestedButton;

    const isFollowing =
      activeTab === 'following'
        ? user.relationshipStatus === 'approved'
        : user.followStatus === 'following';

    return isFollowing ? styles.followingButton : styles.followButton;
  };

  const getButtonTextStyle = (user: FollowListEntry) => {
    const requested =
      activeTab === 'following'
        ? user.relationshipStatus === 'requested'
        : user.followStatus === 'requested';

    if (requested) return styles.requestedButtonText;

    const isFollowing =
      activeTab === 'following'
        ? user.relationshipStatus === 'approved'
        : user.followStatus === 'following';

    return isFollowing ? styles.followingButtonText : styles.followButtonText;
  };

  const handleButtonPress = (user: FollowListEntry) => {
    if (activeTab === 'following' || user.followStatus === 'following') {
      handleUnfollow(user.id);
      return;
    }

    if (user.followStatus === 'requested' || user.relationshipStatus === 'requested') {
      return;
    }

    handleFollow(user.id);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{username}</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="person-add-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

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
                  {user.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.profilePlaceholder}>
                      <Ionicons name="person" size={20} color="#ccc" />
                    </View>
                  )}

                  <View style={styles.userInfo}>
                    <Text style={styles.username}>{user.username}</Text>
                    <Text style={styles.displayName}>{user.displayName}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={getButtonStyle(user)}
                  onPress={(event) => {
                    event.stopPropagation();
                    handleButtonPress(user);
                  }}
                >
                  {(user.followStatus === 'requested' ||
                    user.relationshipStatus === 'requested') && (
                    <Ionicons name="checkmark" size={14} color="#666" style={{ marginRight: 4 }} />
                  )}
                  <Text style={getButtonTextStyle(user)}>{getButtonText(user)}</Text>
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




