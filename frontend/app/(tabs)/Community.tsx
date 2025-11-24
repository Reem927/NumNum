import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { usePosts } from '@/context/PostContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator, Text, Image, RefreshControl, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post, CreatePostData } from '@/types/posts';
import EditThreadModal from '@/components/EditThreadModal';
import NotificationsModal from '@/components/NotificationsModal';

const CUISINES = ['Kuwaiti', 'Indian', 'British', 'Lebanese', 'Japanese', 'Chinese', 'Italian', 'Korean', 'French', 'Mexican'];

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState<'For You' | 'Following'>('For You');
  const { posts, loading, error, toggleLike, refreshPosts, isLiked, updatePost, deletePost } = usePosts();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [notificationsVisible, setNotificationsVisible] = useState(false);

  useEffect(() => {
    refreshPosts({ cuisine: activeCategory || undefined });
  }, [refreshPosts, activeCategory]);

  // Refresh posts when screen comes into focus (e.g., returning from detail screen)
  useFocusEffect(
    useCallback(() => {
      refreshPosts({ cuisine: activeCategory || undefined });
    }, [refreshPosts, activeCategory])
  );

  // Check liked status for all posts when they load
  useEffect(() => {
    if (posts.length > 0 && currentUser) {
      const checkLikedStatus = async () => {
        const liked = new Set<string>();
        await Promise.all(
          posts.map(async (post) => {
            const isLikedPost = await isLiked(post.id);
            if (isLikedPost) liked.add(post.id);
          })
        );
        setLikedPosts(liked);
      };
      checkLikedStatus();
    }
  }, [posts, currentUser, isLiked]);

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return `${Math.floor(seconds / 604800)}w`;
  };

  // Helper function to format count with proper singular/plural
  const formatCount = (count: number, singular: string, plural: string): string => {
    if (count === 1) {
      return `${count} ${singular}`;
    }
    return `${count} ${plural}`;
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshPosts({ cuisine: activeCategory || undefined });
    setRefreshing(false);
  }, [refreshPosts, activeCategory]);

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      // Navigate to login if not authenticated
      router.push('/auth/Login');
      return;
    }
    const wasLiked = likedPosts.has(postId);
    const success = await toggleLike(postId);
    if (success !== null) {
      // Update local liked state
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        if (success) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      // Refresh posts to get updated likes count from the server
      await refreshPosts({ cuisine: activeCategory || undefined });
    }
  };

  const handlePostPress = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleCommentPress = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleMoreOptions = (post: Post, e: any) => {
    e.stopPropagation();
    if (post.user_id === currentUser?.id) {
      Alert.alert(
        'Thread Options',
        'What would you like to do?',
        [
          {
            text: 'Edit Thread',
            onPress: () => handleEditThread(post),
          },
          {
            text: 'Delete Thread',
            style: 'destructive',
            onPress: () => handleDeleteThread(post.id),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    }
  };

  const handleEditThread = (post: Post) => {
    setEditingPost(post);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (updates: {
    content: string;
    image_urls?: string[] | null;
    attached_review_id?: string | null;
  }) => {
    if (!editingPost) return;

    // Convert null to undefined for API compatibility
    const apiUpdates: Partial<CreatePostData> & { image_urls?: string[]; attached_review_id?: string | null } = {
      content: updates.content,
      image_urls: updates.image_urls === null ? undefined : updates.image_urls,
      attached_review_id: updates.attached_review_id === null ? undefined : updates.attached_review_id,
    };

    const success = await updatePost(editingPost.id, apiUpdates);
    if (success) {
      await refreshPosts({ cuisine: activeCategory || undefined });
      setEditModalVisible(false);
      setEditingPost(null);
    }
  };

  const handleDeleteThread = (postId: string) => {
    Alert.alert(
      'Delete Thread',
      'Are you sure you want to delete this thread? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deletePost(postId);
            if (success) {
              await refreshPosts({ cuisine: activeCategory || undefined });
            } else {
              Alert.alert('Error', 'Failed to delete thread');
            }
          },
        },
      ]
    );
  };

  const renderPost = (post: Post) => {
    const isReview = post.type === 'review';
    const username = post.user?.username || 'Anonymous';
    const timeAgo = formatTimeAgo(post.created_at);
    const liked = likedPosts.has(post.id);

    return (
      <TouchableOpacity 
        key={post.id} 
        style={styles.post}
        onPress={() => handlePostPress(post.id)}
        activeOpacity={0.9}
      >
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            {post.user?.avatar_url ? (
              <Image 
                source={{ uri: post.user.avatar_url }} 
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatar}>
                <IconSymbol name="person.fill" size={16} color="#666" />
              </View>
            )}
            <ThemedText style={styles.username}>{username}</ThemedText>
            {isReview && post.rating && (
              <View style={styles.ratingBadge}>
                <IconSymbol name="star.fill" size={12} color="#ffd700" />
                <ThemedText style={styles.ratingText}>{post.rating.toFixed(1)}</ThemedText>
              </View>
            )}
          </View>
          <View style={styles.postActions}>
            <ThemedText style={styles.timestamp}>{timeAgo}</ThemedText>
            {post.user_id === currentUser?.id && (
              <TouchableOpacity 
                style={styles.moreButton}
                onPress={(e) => handleMoreOptions(post, e)}
              >
                <IconSymbol name="ellipsis" size={16} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => handlePostPress(post.id)}
          activeOpacity={1}
        >
          <View style={styles.contentArea}>
            <ThemedText style={styles.postContent}>{post.content}</ThemedText>
            
            {isReview && post.restaurant && (
              <View style={styles.restaurantInfo}>
                <IconSymbol name="location.fill" size={14} color="#e65332" />
                <ThemedText style={styles.restaurantName}>{post.restaurant.name}</ThemedText>
                {post.restaurant.cuisine && (
                  <ThemedText style={styles.cuisine}>{post.restaurant.cuisine}</ThemedText>
                )}
              </View>
            )}

            {post.image_urls && post.image_urls.length > 0 && (
              <View style={styles.imageContainer}>
                {post.image_urls.slice(0, 1).map((url, idx) => (
                  <Image key={idx} source={{ uri: url }} style={styles.postImage} />
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.interactionBar}>
          <View style={styles.interactionLeft}>
            <TouchableOpacity 
              style={styles.interactionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleLike(post.id);
              }}
            >
              <IconSymbol 
                name={liked ? "heart.fill" : "heart"} 
                size={20} 
                color={liked ? "#ff6b6b" : "#666"} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.interactionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleCommentPress(post.id);
              }}
            >
              <IconSymbol name="bubble.left" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.interactionButton}>
              <IconSymbol name="paperplane" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.engagementStats}>
            {formatCount(post.comments_count, 'comment', 'comments')} · {formatCount(post.likes_count, 'like', 'likes')}
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          {/* Bell button positioned absolutely at top right */}
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => setNotificationsVisible(true)}
          >
            <IconSymbol name="bell" size={18} color="#000" />
          </TouchableOpacity>

          <View style={styles.headerTop}>
            <View style={styles.titleSection}>

            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerActionItem}>
                <IconSymbol name="person.badge.plus" size={18} color="#000" />
                <ThemedText style={styles.actionLabel}>Friend request</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerActionIcon}>
                <IconSymbol name="envelope" size={18} color="#000" />
                <ThemedText style={styles.actionLabel}>Messages</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Button */}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => router.push('/SearchUsers')}
          >
            <View style={styles.searchButtonContent}>
              <Ionicons name="search" size={20} color="#999" />
              <ThemedText style={styles.searchButtonText}>Search users...</ThemedText>
            </View>
          </TouchableOpacity>

          <View style={styles.mainTabs}>
            <TouchableOpacity 
              style={[styles.mainTab, activeTab === 'For You' && styles.activeMainTab]}
              onPress={() => setActiveTab('For You')}
            >
              <ThemedText style={[styles.mainTabText, activeTab === 'For You' && styles.activeMainTabText]}>
                For You
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.mainTab, activeTab === 'Following' && styles.activeMainTab]}
              onPress={() => setActiveTab('Following')}
            >
              <ThemedText style={[styles.mainTabText, activeTab === 'Following' && styles.activeMainTabText]}>
                Following
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.categorySection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              <TouchableOpacity 
                key="all"
                style={[
                  styles.categoryButton,
                  activeCategory === null && styles.categoryButtonActive
                ]}
                onPress={() => setActiveCategory(null)}
              >
                <ThemedText style={[
                  styles.categoryText,
                  activeCategory === null && styles.categoryTextActive
                ]}>
                  All
                </ThemedText>
              </TouchableOpacity>
              {CUISINES.map((category, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.categoryButton,
                    activeCategory === category && styles.categoryButtonActive
                  ]}
                  onPress={() => setActiveCategory(category)}
                >
                  <ThemedText style={[
                    styles.categoryText,
                    activeCategory === category && styles.categoryTextActive
                  ]}>
                    {category}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.feed}>
          {posts.length === 0 && !loading && (
            <View style={styles.emptyContainer}>
              <IconSymbol name="bubble.left.bubble.right" size={48} color="#ccc" />
              <ThemedText style={styles.emptyText}>No posts yet</ThemedText>
              <ThemedText style={styles.emptySubtext}>Be the first to share!</ThemedText>
            </View>
          )}
          {posts.map((post) => renderPost(post))}
        </View>
      </ScrollView>

      {loading && posts.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e65332" />
        </View>
      )}

      {error && posts.length === 0 && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => refreshPosts()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push({
          pathname: '/create-post',
          params: { type: 'thread', fromCommunity: 'true' }
        })}
      >
        <IconSymbol name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      <EditThreadModal
        visible={editModalVisible}
        post={editingPost}
        onClose={() => {
          setEditModalVisible(false);
          setEditingPost(null);
        }}
        onSave={handleSaveEdit}
      />

      <NotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 50,
    position: 'relative',
  },
  headerTop: {
    paddingHorizontal: 15,
    paddingTop: 0,
    paddingBottom: 10,
    justifyContent: 'center',
    minHeight: 34, // Match notification button height (18px icon + 8px padding * 2)
  },
  titleSection: {
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerActionIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  notificationButton: {
    position: 'absolute',
    top: 50, // Match paddingTop of header
    right: 15,
    padding: 8,
    zIndex: 10,
  },
  actionLabel: {
    fontSize: 11,
    color: '#000',
  },
  mainTabs: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  mainTab: {
    marginRight: 20,
    paddingBottom: 5,
  },
  activeMainTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  mainTabText: {
    fontSize: 14,
    color: '#666',
  },
  activeMainTabText: {
    color: '#000',
    fontWeight: '600',
  },
  tabIndicator: {
    fontSize: 11,
    color: '#666',
    marginLeft: 'auto',
  },
  categorySection: {
    paddingVertical: 10,
    paddingLeft: 15,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#e65332',
  },
  categoryText: {
    fontSize: 12,
    color: '#000',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  feed: {
    padding: 15,
  },
  post: {
    backgroundColor: '#fff',
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  moreButton: {
    padding: 2,
  },
  contentArea: {
    marginBottom: 12,
  },
  mediaPlaceholder: {
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewContent: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  interactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  interactionLeft: {
    flexDirection: 'row',
    gap: 15,
  },
  interactionButton: {
    padding: 2,
  },
  engagementStats: {
    fontSize: 12,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    backgroundColor: '#e65332',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  postContent: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
    marginBottom: 12,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  cuisine: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  imageContainer: {
    marginTop: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#856404',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryText: {
    color: '#e65332',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  searchButton: {
    marginHorizontal: 15,
    marginVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  searchButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButtonText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#999',
  },
});