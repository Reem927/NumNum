import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
  Keyboard,
  Alert,
} from 'react-native';
import { apiService } from '@/services/api';
import { User } from '@/types/auth';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';

export default function SearchUsersScreen() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      setHasSearched(true);
      try {
        const response = await apiService.searchUsers(searchQuery);
        if (response.success && response.data) {
          setSearchResults(response.data);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleUserPress = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  const handleFollow = async (userId: string, e: any) => {
    e.stopPropagation();
    try {
      const response = await apiService.followUser(userId);
      if (response.success) {
        // Update the search results to reflect follow status
        setSearchResults(prev =>
          prev.map(user =>
            user.id === userId
              ? { ...user, followStatus: 'following' as const }
              : user
          )
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to follow user');
      }
    } catch (error) {
      console.error('Error following user:', error);
      Alert.alert('Error', 'Failed to follow user');
    }
  };

  const handleUnfollow = async (userId: string, e: any) => {
    e.stopPropagation();
    try {
      const response = await apiService.unfollowUser(userId);
      if (response.success) {
        // Update the search results to reflect unfollow status
        setSearchResults(prev =>
          prev.map(user =>
            user.id === userId
              ? { ...user, followStatus: 'not_following' as const }
              : user
          )
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to unfollow user');
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      Alert.alert('Error', 'Failed to unfollow user');
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <TouchableOpacity
        style={styles.userContent}
        onPress={() => handleUserPress(item.id)}
        activeOpacity={0.7}
      >
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
        ) : (
          <View style={styles.userAvatar}>
            <IconSymbol name="person.fill" size={20} color="#666" />
          </View>
        )}
        <View style={styles.userInfo}>
          <ThemedText style={styles.username}>{item.username}</ThemedText>
          {item.displayName && item.displayName !== item.username && (
            <ThemedText style={styles.displayName}>{item.displayName}</ThemedText>
          )}
        </View>
      </TouchableOpacity>
      {item.id !== currentUser?.id && (
        <TouchableOpacity
          style={[
            styles.followButton,
            item.followStatus === 'following' && styles.followButtonActive
          ]}
          onPress={(e) => {
            if (item.followStatus === 'following') {
              handleUnfollow(item.id, e);
            } else {
              handleFollow(item.id, e);
            }
          }}
        >
          <ThemedText
            style={[
              styles.followButtonText,
              item.followStatus === 'following' && styles.followButtonTextActive
            ]}
          >
            {item.followStatus === 'following' ? 'Following' : 'Follow'}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Search</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoFocus
          placeholderTextColor="#888"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {searchQuery.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol name="person.2.fill" size={64} color="#ccc" />
          <ThemedText style={styles.emptyStateText}>Search for users</ThemedText>
          <ThemedText style={styles.emptyStateSubtext}>
            Find and follow other users by their username or display name
          </ThemedText>
        </View>
      ) : (
        <View style={styles.resultsContainer}>
          {searching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#e65332" />
            </View>
          ) : searchResults.length > 0 ? (
            <>
              <ThemedText style={styles.resultsTitle}>
                {searchResults.length} result
                {searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
              </ThemedText>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={renderUserItem}
                showsVerticalScrollIndicator={false}
              />
            </>
          ) : hasSearched ? (
            <View style={styles.noResultsContainer}>
              <IconSymbol name="person.slash" size={64} color="#ccc" />
              <ThemedText style={styles.noResultsText}>
                No users found for "{searchQuery}"
              </ThemedText>
              <ThemedText style={styles.noResultsSubtext}>
                Try searching with a different username or display name
              </ThemedText>
            </View>
          ) : null}
        </View>
      )}
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
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 20,
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
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  resultsTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  displayName: {
    fontSize: 14,
    color: '#666',
  },
  followButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#e65332',
  },
  followButtonActive: {
    backgroundColor: '#f0f0f0',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  followButtonTextActive: {
    color: '#666',
  },
});

