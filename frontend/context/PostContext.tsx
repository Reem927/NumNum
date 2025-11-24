import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';
import { Post, Comment, CreatePostData, CreateCommentData, PostType } from '@/types/posts';

type PostContextType = {
  posts: Post[];
  loading: boolean;
  error: string | null;
  
  // Post operations
  createPost: (postData: CreatePostData) => Promise<Post | null>;
  updatePost: (postId: string, updates: Partial<CreatePostData>) => Promise<Post | null>;
  deletePost: (postId: string) => Promise<boolean>;
  refreshPosts: (options?: { type?: PostType; userId?: string; limit?: number }) => Promise<void>;
  
  // Like operations
  toggleLike: (postId: string) => Promise<boolean>;
  isLiked: (postId: string) => Promise<boolean>;
  
  // Comment operations
  getComments: (postId: string) => Promise<Comment[]>;
  createComment: (commentData: CreateCommentData) => Promise<Comment | null>;
  updateComment: (commentId: string, content: string) => Promise<Comment | null>;
  deleteComment: (commentId: string, postId: string) => Promise<boolean>;
  
  // Post by ID
  getPost: (postId: string) => Promise<Post | null>;
};

const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // Fetch posts
  const refreshPosts = useCallback(async (options?: { 
    type?: PostType; 
    userId?: string; 
    cuisine?: string;
    limit?: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getPosts({
        type: options?.type,
        userId: options?.userId,
        cuisine: options?.cuisine,
        limit: options?.limit || 50,
      });

      if (response.success && response.data) {
        setPosts(response.data);
        
        // Check which posts are liked by current user
        if (user) {
          const likedSet = new Set<string>();
          await Promise.all(
            response.data.map(async (post) => {
              const isLiked = await apiService.isPostLiked(post.id);
              if (isLiked) likedSet.add(post.id);
            })
          );
          setLikedPosts(likedSet);
        }
      } else {
        setError(response.message || 'Failed to fetch posts');
        setPosts([]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    refreshPosts();
  }, [refreshPosts]);

  // Create post
  const createPost = async (postData: CreatePostData): Promise<Post | null> => {
    if (!user) {
      setError('User must be logged in');
      return null;
    }

    setError(null); // Clear any previous errors
    try {
      const response = await apiService.createPost(postData);
      
      if (response.success && response.data) {
        setPosts((prev) => [response.data!, ...prev]);
        return response.data;
      } else {
        console.error('Create post failed:', response.message);
        setError(response.message || 'Failed to create post');
        return null;
      }
    } catch (err: any) {
      console.error('Create post error:', err);
      setError(err.message || 'Failed to create post');
      return null;
    }
  };

  // Update post
  const updatePost = async (
    postId: string,
    updates: Partial<CreatePostData>
  ): Promise<Post | null> => {
    try {
      const response = await apiService.updatePost(postId, updates);
      
      if (response.success && response.data) {
        setPosts((prev) =>
          prev.map((post) => (post.id === postId ? response.data! : post))
        );
        return response.data;
      } else {
        setError(response.message || 'Failed to update post');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update post');
      return null;
    }
  };

  // Delete post
  const deletePost = async (postId: string): Promise<boolean> => {
    try {
      const response = await apiService.deletePost(postId);
      
      if (response.success) {
        setPosts((prev) => prev.filter((post) => post.id !== postId));
        return true;
      } else {
        setError(response.message || 'Failed to delete post');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete post');
      return false;
    }
  };

  // Toggle like
  const toggleLike = async (postId: string): Promise<boolean> => {
    if (!user) {
      setError('User must be logged in');
      return false;
    }

    try {
      const response = await apiService.toggleLikePost(postId);
      
      if (response.success && response.data) {
        const { liked, likesCount } = response.data;
        
        // Update liked state
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          if (liked) {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });
        
        // Update post likes count
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, likes_count: likesCount }
              : post
          )
        );
        
        return liked;
      } else {
        setError(response.message || 'Failed to toggle like');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to toggle like');
      return false;
    }
  };

  // Check if post is liked
  const isLiked = async (postId: string): Promise<boolean> => {
    if (!user) return false;
    
    // Check local state first
    if (likedPosts.has(postId)) return true;
    
    // Check with API
    try {
      return await apiService.isPostLiked(postId);
    } catch {
      return false;
    }
  };

  // Get comments
  const getComments = async (postId: string): Promise<Comment[]> => {
    try {
      const response = await apiService.getComments(postId);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.message || 'Failed to fetch comments');
        return [];
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch comments');
      return [];
    }
  };

  // Create comment
  const createComment = async (commentData: CreateCommentData): Promise<Comment | null> => {
    if (!user) {
      setError('User must be logged in');
      return null;
    }

    try {
      const response = await apiService.createComment(commentData);
      
      if (response.success && response.data) {
        // Update thread comments count
        setPosts((prev) =>
          prev.map((post) =>
            post.id === commentData.thread_id
              ? { ...post, comments_count: post.comments_count + 1 }
              : post
          )
        );
        
        return response.data;
      } else {
        setError(response.message || 'Failed to create comment');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create comment');
      return null;
    }
  };

  // Update comment
  const updateComment = async (commentId: string, content: string): Promise<Comment | null> => {
    try {
      const response = await apiService.updateComment(commentId, content);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.message || 'Failed to update comment');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update comment');
      return null;
    }
  };

  // Delete comment
  const deleteComment = async (commentId: string, threadId: string): Promise<boolean> => {
    try {
      const response = await apiService.deleteComment(commentId);
      
      if (response.success) {
        // Update thread comments count
        setPosts((prev) =>
          prev.map((post) =>
            post.id === threadId
              ? { ...post, comments_count: Math.max(post.comments_count - 1, 0) }
              : post
          )
        );
        return true;
      } else {
        setError(response.message || 'Failed to delete comment');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete comment');
      return false;
    }
  };

  // Get single post
  const getPost = async (postId: string): Promise<Post | null> => {
    try {
      const response = await apiService.getPost(postId);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.message || 'Failed to fetch post');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch post');
      return null;
    }
  };

  const value: PostContextType = {
    posts,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    refreshPosts,
    toggleLike,
    isLiked,
    getComments,
    createComment,
    updateComment,
    deleteComment,
    getPost,
  };

  return <PostContext.Provider value={value}>{children}</PostContext.Provider>;
};

export const usePosts = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePosts must be used within a PostProvider');
  }
  return context;
};

