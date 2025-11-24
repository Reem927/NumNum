import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { usePosts } from '@/context/PostContext';
import { useAuth } from '@/context/AuthContext';
import { Post, Comment } from '@/types/posts';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

const MAX_COMMENT_LENGTH = 200;

export default function PostDetailScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { getPost, toggleLike, getComments, createComment, isLiked } = usePosts();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [liked, setLiked] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (postId) {
      loadPost();
      loadComments();
    }
  }, [postId]);

  useEffect(() => {
    if (post && user) {
      checkLikedStatus();
    }
  }, [post, user]);

  const loadPost = async () => {
    if (!postId) return;

    try {
      const postData = await getPost(postId);
      if (postData) {
        setPost(postData);
      }
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!postId) return;

    try {
      const commentsData = await getComments(postId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const checkLikedStatus = async () => {
    if (!post || !user) return;
    const isLikedPost = await isLiked(post.id);
    setLiked(isLikedPost);
  };

  const handleLike = async () => {
    if (!post || !user) {
      Alert.alert('Error', 'You must be logged in to like posts');
      router.push('/auth/Login');
      return;
    }

    const success = await toggleLike(post.id);
    if (success !== null) {
      setLiked(success);
      // Update post likes count
      if (post) {
        setPost({
          ...post,
          likes_count: success ? post.likes_count + 1 : Math.max(post.likes_count - 1, 0),
        });
      }
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !postId) return;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to comment');
      router.push('/auth/Login');
      return;
    }

    setSubmittingComment(true);

    try {
      const newComment = await createComment({
        thread_id: postId,
        content: commentText.trim(),
        parent_id: replyingTo || undefined,
      });

      if (newComment) {
        setCommentText('');
        setReplyingTo(null);
        await loadComments();
        // Update post comments count
        if (post) {
          setPost({ ...post, comments_count: post.comments_count + 1 });
        }
        // Scroll to bottom
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    const text = replyText[parentId];
    if (!text?.trim() || !postId) return;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to reply');
      router.push('/auth/Login');
      return;
    }

    try {
      const newReply = await createComment({
        thread_id: postId,
        content: text.trim(),
        parent_id: parentId,
      });

      if (newReply) {
        setReplyText({ ...replyText, [parentId]: '' });
        await loadComments();
        // Update post comments count
        if (post) {
          setPost({ ...post, comments_count: post.comments_count + 1 });
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to post reply');
    }
  };

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

  const renderComment = (comment: Comment, level: number = 0) => {
    const isReply = level > 0;
    const showReplyInput = replyingTo === comment.id;

    return (
      <View
        key={comment.id}
        style={[
          styles.comment,
          isReply && styles.replyComment,
          level > 0 && { marginLeft: level * 20 },
        ]}
      >
        <View style={styles.commentHeader}>
          <View style={styles.commentUser}>
            {comment.user?.avatar_url ? (
              <Image
                source={{ uri: comment.user.avatar_url }}
                style={styles.commentAvatar}
              />
            ) : (
              <View style={styles.commentAvatar}>
                <IconSymbol name="person.fill" size={12} color="#666" />
              </View>
            )}
            <TouchableOpacity
              onPress={() => {
                if (comment.user?.id) {
                  router.push(`/user/${comment.user.id}`);
                }
              }}
            >
              <ThemedText style={styles.commentUsername}>
                {comment.user?.username || 'Anonymous'}
              </ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.commentTime}>
              {formatTimeAgo(comment.created_at)}
            </ThemedText>
          </View>
        </View>

        <ThemedText style={styles.commentContent}>{comment.content}</ThemedText>

        {!isReply && (
          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => {
              setReplyingTo(replyingTo === comment.id ? null : comment.id);
            }}
          >
            <IconSymbol name="arrowshape.turn.up.left" size={14} color="#666" />
            <Text style={styles.replyButtonText}>
              {showReplyInput ? 'Cancel' : 'Reply'}
            </Text>
          </TouchableOpacity>
        )}

        {showReplyInput && (
          <View style={styles.replyInputContainer}>
            <View style={styles.replyInputWrapper}>
              <View style={styles.charCountContainer}>
                <Text style={[
                  styles.charCount,
                  (replyText[comment.id]?.length || 0) === MAX_COMMENT_LENGTH && styles.charCountError
                ]}>
                  {replyText[comment.id]?.length || 0}/{MAX_COMMENT_LENGTH} characters
                  {(replyText[comment.id]?.length || 0) === MAX_COMMENT_LENGTH && ' - You\'re at the character limit'}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.replyInput,
                  (replyText[comment.id]?.length || 0) === MAX_COMMENT_LENGTH && styles.commentInputError
                ]}
                placeholder="Write a reply..."
                placeholderTextColor="#999"
                multiline
                maxLength={MAX_COMMENT_LENGTH}
                value={replyText[comment.id] || ''}
                onChangeText={(text) => {
                  if (text.length <= MAX_COMMENT_LENGTH) {
                    setReplyText({ ...replyText, [comment.id]: text });
                  }
                }}
              />
            </View>
            <TouchableOpacity
              style={styles.sendReplyButton}
              onPress={() => handleSubmitReply(comment.id)}
            >
              <Ionicons name="send" size={18} color="#e65332" />
            </TouchableOpacity>
          </View>
        )}

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {comment.replies.map((reply) => renderComment(reply, level + 1))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e65332" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Post not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isReview = post.type === 'review';
  const username = post.user?.username || 'Anonymous';
  const timeAgo = formatTimeAgo(post.created_at);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Post Content */}
        <View style={styles.postContainer}>
          <View style={styles.postHeader}>
            <View style={styles.userInfo}>
              {post.user?.avatar_url ? (
                <Image source={{ uri: post.user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <IconSymbol name="person.fill" size={16} color="#666" />
                </View>
              )}
              <TouchableOpacity
                onPress={() => {
                  if (post.user?.id) {
                    router.push(`/user/${post.user.id}`);
                  }
                }}
              >
                <ThemedText style={styles.username}>{username}</ThemedText>
              </TouchableOpacity>
              {isReview && post.rating && (
                <View style={styles.ratingBadge}>
                  <IconSymbol name="star.fill" size={12} color="#ffd700" />
                  <ThemedText style={styles.ratingText}>
                    {post.rating.toFixed(1)}
                  </ThemedText>
                </View>
              )}
            </View>
            <ThemedText style={styles.timestamp}>{timeAgo}</ThemedText>
          </View>

          <ThemedText style={styles.postContent}>{post.content}</ThemedText>

          {isReview && post.restaurant && (
            <View style={styles.restaurantInfo}>
              <IconSymbol name="location.fill" size={14} color="#e65332" />
              <ThemedText style={styles.restaurantName}>
                {post.restaurant.name}
              </ThemedText>
              {post.restaurant.cuisine && (
                <ThemedText style={styles.cuisine}>{post.restaurant.cuisine}</ThemedText>
              )}
            </View>
          )}

          {post.image_urls && post.image_urls.length > 0 && (
            <View style={styles.imageContainer}>
              {post.image_urls.map((url, idx) => (
                <Image key={idx} source={{ uri: url }} style={styles.postImage} />
              ))}
            </View>
          )}

          <View style={styles.postActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLike}
            >
              <IconSymbol
                name={liked ? 'heart.fill' : 'heart'}
                size={20}
                color={liked ? '#ff6b6b' : '#666'}
              />
              <ThemedText style={styles.actionCount}>{post.likes_count}</ThemedText>
            </TouchableOpacity>
            <View style={styles.actionButton}>
              <IconSymbol name="bubble.left" size={20} color="#666" />
              <ThemedText style={styles.actionCount}>{post.comments_count}</ThemedText>
            </View>
            <TouchableOpacity style={styles.actionButton}>
              <IconSymbol name="paperplane" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <ThemedText style={styles.commentsTitle}>
            Comments ({comments.length})
          </ThemedText>

          {comments.length === 0 ? (
            <View style={styles.noCommentsContainer}>
              <IconSymbol name="bubble.left.and.bubble.right" size={48} color="#ccc" />
              <ThemedText style={styles.noCommentsText}>No comments yet</ThemedText>
              <ThemedText style={styles.noCommentsSubtext}>
                Be the first to comment!
              </ThemedText>
            </View>
          ) : (
            comments.map((comment) => renderComment(comment))
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <View style={styles.commentInputWrapper}>
          <View style={styles.charCountContainer}>
            <Text style={[
              styles.charCount,
              commentText.length === MAX_COMMENT_LENGTH && styles.charCountError
            ]}>
              {commentText.length}/{MAX_COMMENT_LENGTH} characters
              {commentText.length === MAX_COMMENT_LENGTH && ' - You\'re at the character limit'}
            </Text>
          </View>
          <TextInput
            style={[
              styles.commentInput,
              commentText.length === MAX_COMMENT_LENGTH && styles.commentInputError
            ]}
            placeholder="Write a comment..."
            placeholderTextColor="#999"
            multiline
            maxLength={MAX_COMMENT_LENGTH}
            value={commentText}
            onChangeText={(text) => {
              if (text.length <= MAX_COMMENT_LENGTH) {
                setCommentText(text);
              }
            }}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
          onPress={handleSubmitComment}
          disabled={!commentText.trim() || submittingComment}
        >
          {submittingComment ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color={commentText.trim() ? '#fff' : '#999'} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#e65332',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  postContainer: {
    backgroundColor: '#fff',
    marginBottom: 24,
    padding: 16,
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
    gap: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  postContent: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
    marginBottom: 12,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    padding: 10,
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
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
  },
  postActions: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontSize: 14,
    color: '#666',
  },
  commentsSection: {
    marginTop: 8,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  noCommentsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  comment: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  replyComment: {
    marginLeft: 40,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
    paddingLeft: 12,
  },
  commentHeader: {
    marginBottom: 8,
  },
  commentUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentContent: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
    marginBottom: 8,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  replyButtonText: {
    fontSize: 13,
    color: '#666',
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  replyInputWrapper: {
    flex: 1,
  },
  replyInput: {
    minHeight: 40,
    maxHeight: 100,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    fontSize: 14,
    color: '#000',
  },
  sendReplyButton: {
    padding: 8,
  },
  repliesContainer: {
    marginTop: 12,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    gap: 8,
  },
  commentInputWrapper: {
    flex: 1,
  },
  commentInput: {
    minHeight: 40,
    maxHeight: 100,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    fontSize: 15,
    color: '#000',
  },
  commentInputError: {
    borderColor: '#FF0000',
    borderWidth: 1,
    backgroundColor: '#fff5f5',
  },
  charCountContainer: {
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
  },
  charCountError: {
    color: '#FF0000',
    fontWeight: '600',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e65332',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
});


