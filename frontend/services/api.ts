import { supabase } from '../lib/supabase';

import { ApiResponse, SignUpData, User, UserPreferences } from '@/types/auth';
import { Post, Comment, CreatePostData, CreateCommentData, PostType } from '@/types/posts';

class ApiService {
  private baseUrl = 'https://your-api.com/api'; // Reserved for future custom backend

  // ========== AUTH ==========

  async signUp(
    userData: SignUpData
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    const { email, password, username, displayName } = userData;

    // 1) Call Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          displayName,
          // We can initialize preferences later during onboarding
          hasCompletedOnboarding: false,
        },
      },
    });

    if (error || !data.user) {
      return {
        data: undefined,
        success: false,
        message: error?.message || 'Failed to sign up',
      };
    }

    // 2) Create profile in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        username: username,
        display_name: displayName,
        has_completed_onboarding: false,
        is_public: true,
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Continue anyway - profile might already exist or be created by trigger
    }

    // 3) Fetch profile to get the actual data (in case it was created by trigger)
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url, bio, is_public, has_completed_onboarding, preferences, review_count')
      .eq('id', data.user.id)
      .single();

    const metadata = data.user.user_metadata || {};

    // 4) Map Supabase user -> app User type (use profile data if available)
    const appUser: User = {
      id: data.user.id,
      email: data.user.email || email,
      username: profile?.username || metadata.username || username,
      displayName: profile?.display_name || metadata.displayName || displayName,
      avatar: profile?.avatar_url || metadata.avatar || undefined,
      bio: profile?.bio || metadata.bio || '',
      isPublic: profile?.is_public ?? metadata.isPublic ?? true,
      hasCompletedOnboarding: profile?.has_completed_onboarding ?? metadata.hasCompletedOnboarding ?? false,
      preferences: profile?.preferences || metadata.preferences,
      reviewCount: profile?.review_count || 0,
      createdAt: data.user.created_at || new Date().toISOString(),
      followersCount: metadata.followersCount ?? 0,
      followingCount: metadata.followingCount ?? 0,
    };

    // 3) Return ApiResponse matching existing AuthContext expectations
    return {
      data: {
        user: appUser,
        token: data.session?.access_token || '',
      },
      success: true,
      message: 'Account created successfully',
    };
  }

  async signIn(
    email: string,
    password: string
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    // 1) Supabase email/password login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return {
        data: undefined,
        success: false,
        message: error?.message || 'Failed to sign in',
      };
    }

    // 2) Fetch profile from profiles table (source of truth)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url, bio, is_public, has_completed_onboarding, preferences, review_count')
      .eq('id', data.user.id)
      .single();

    const metadata = data.user.user_metadata || {};

    // 3) Map Supabase user -> app User (use profile data first, fallback to metadata)
    const appUser: User = {
      id: data.user.id,
      email: data.user.email || email,
      username: profile?.username || metadata.username || 'newfoodie',
      displayName: profile?.display_name || metadata.displayName || 'New Foodie', // ✅ Get from profiles table first
      avatar: profile?.avatar_url || metadata.avatar || undefined,
      bio: profile?.bio || metadata.bio || '',
      isPublic: profile?.is_public ?? metadata.isPublic ?? true,
      hasCompletedOnboarding: profile?.has_completed_onboarding ?? metadata.hasCompletedOnboarding ?? false,
      preferences: profile?.preferences || metadata.preferences,
      reviewCount: profile?.review_count || 0,
      createdAt: data.user.created_at || new Date().toISOString(),
      followersCount: metadata.followersCount ?? 0,
      followingCount: metadata.followingCount ?? 0,
    };

    return {
      data: {
        user: appUser,
        token: data.session?.access_token || '',
      },
      success: true,
      message: 'Login successful',
    };
  }

  async signOut(): Promise<ApiResponse<void>> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        data: undefined,
        success: false,
        message: error.message || 'Failed to log out',
      };
    }

    return {
      data: undefined,
      success: true,
      message: 'Logged out successfully',
    };
  }

  // ========== USER PREFERENCES & ONBOARDING (NOW REAL) ==========

  async updateUserPreferences(
    userId: string, // not strictly needed for Supabase but kept for API shape
    preferences: UserPreferences
  ): Promise<ApiResponse<User>> {
    // Update the current authenticated user's metadata with preferences
    const { data, error } = await supabase.auth.updateUser({
      data: {
        preferences,
      },
    });

    if (error || !data.user) {
      return {
        data: undefined,
        success: false,
        message: error?.message || 'Failed to update preferences',
      };
    }

    const metadata = data.user.user_metadata || {};

    const updatedUser: User = {
      id: data.user.id,
      email: data.user.email || '',
      username: metadata.username || 'foodlover123',
      displayName: metadata.displayName || 'Food Lover',
      avatar: metadata.avatar || 'https://via.placeholder.com/150',
      bio: metadata.bio || 'Passionate about discovering new flavors!',
      isPublic: metadata.isPublic ?? true,
      hasCompletedOnboarding: metadata.hasCompletedOnboarding ?? false,
      preferences: metadata.preferences,
      createdAt: data.user.created_at || '2024-01-01T00:00:00Z',
      followersCount: metadata.followersCount ?? 0,
      followingCount: metadata.followingCount ?? 0,
    };

    return {
      data: updatedUser,
      success: true,
      message: 'Preferences updated successfully',
    };
  }

  async completeOnboarding(userId: string): Promise<ApiResponse<User>> {
    // Mark onboarding as completed in user metadata
    const { data, error } = await supabase.auth.updateUser({
      data: {
        hasCompletedOnboarding: true,
      },
    });

    if (error || !data.user) {
      return {
        data: undefined,
        success: false,
        message: error?.message || 'Failed to complete onboarding',
      };
    }

    const metadata = data.user.user_metadata || {};

    const completedUser: User = {
      id: data.user.id,
      email: data.user.email || '',
      username: metadata.username || 'foodlover123',
      displayName: metadata.displayName || 'Food Lover',
      avatar: metadata.avatar || 'https://via.placeholder.com/150',
      bio: metadata.bio || 'Passionate about discovering new flavors!',
      isPublic: metadata.isPublic ?? true,
      hasCompletedOnboarding: metadata.hasCompletedOnboarding ?? true,
      preferences: metadata.preferences,
      createdAt: data.user.created_at || '2024-01-01T00:00:00Z',
      followersCount: metadata.followersCount ?? 0,
      followingCount: metadata.followingCount ?? 0,
    };

    return {
      data: completedUser,
      success: true,
      message: 'Onboarding completed successfully',
    };
  }

  // ========== SOCIAL GRAPH ==========

  async getFollowers(userId: string): Promise<ApiResponse<User[]>> {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower:followed_id (
          id,
          username,
          display_name,
          avatar_url,
          bio,
          is_public,
          review_count
        )
      `)
      .eq('follower_id', userId)
      .eq('status', 'accepted');

    if (error) {
      return {
        data: undefined,
        success: false,
        message: error.message || 'Failed to fetch followers',
      };
    }

    const followers: User[] = (data || []).map((item: any) => {
      const profile = item.follower;
      return {
        id: profile.id,
        email: '',
        username: profile.username || '',
        displayName: profile.display_name || '',
        avatar: profile.avatar_url || undefined,
        bio: profile.bio || '',
        isPublic: profile.is_public ?? true,
        hasCompletedOnboarding: true,
        reviewCount: profile.review_count || 0,
        followersCount: 0,
        followingCount: 0,
      };
    });

    return {
      data: followers,
      success: true,
      message: 'Followers fetched successfully',
    };
  }

  async getFollowing(userId: string): Promise<ApiResponse<User[]>> {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following:follower_id (
          id,
          username,
          display_name,
          avatar_url,
          bio,
          is_public,
          review_count
        )
      `)
      .eq('followed_id', userId)
      .eq('status', 'accepted');

    if (error) {
      return {
        data: undefined,
        success: false,
        message: error.message || 'Failed to fetch following',
      };
    }

    const following: User[] = (data || []).map((item: any) => {
      const profile = item.following;
      return {
        id: profile.id,
        email: '',
        username: profile.username || '',
        displayName: profile.display_name || '',
        avatar: profile.avatar_url || undefined,
        bio: profile.bio || '',
        isPublic: profile.is_public ?? true,
        hasCompletedOnboarding: true,
        reviewCount: profile.review_count || 0,
        followersCount: 0,
        followingCount: 0,
      };
    });

    return {
      data: following,
      success: true,
      message: 'Following fetched successfully',
    };
  }

  async followUser(targetUserId: string): Promise<ApiResponse<void>> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: undefined,
        success: false,
        message: 'User must be authenticated',
      };
    }

    // Check if target user is public
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('is_public')
      .eq('id', targetUserId)
      .single();

    if (!targetProfile) {
      return {
        data: undefined,
        success: false,
        message: 'User not found',
      };
    }

    const status = targetProfile.is_public ? 'accepted' : 'pending';

    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        followed_id: targetUserId,
        status,
      });

    if (error) {
      return {
        data: undefined,
        success: false,
        message: error.message || 'Failed to follow user',
      };
    }

    return {
      data: undefined,
      success: true,
      message: 'User followed successfully',
    };
  }

  async unfollowUser(targetUserId: string): Promise<ApiResponse<void>> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: undefined,
        success: false,
        message: 'User must be authenticated',
      };
    }

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('followed_id', targetUserId);

    if (error) {
      return {
        data: undefined,
        success: false,
        message: error.message || 'Failed to unfollow user',
      };
    }

    return {
      data: undefined,
      success: true,
      message: 'User unfollowed successfully',
    };
  }

  async sendFollowRequest(targetUserId: string): Promise<ApiResponse<void>> {
    // This is the same as followUser for private accounts
    return this.followUser(targetUserId);
  }

  async acceptFollowRequest(requestId: string): Promise<ApiResponse<void>> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: undefined,
        success: false,
        message: 'User must be authenticated',
      };
    }

    const { error } = await supabase
      .from('follows')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .eq('followed_id', user.id);

    if (error) {
      return {
        data: undefined,
        success: false,
        message: error.message || 'Failed to accept follow request',
      };
    }

    return {
      data: undefined,
      success: true,
      message: 'Follow request accepted',
    };
  }

  async cancelFollowRequest(targetUserId: string): Promise<ApiResponse<void>> {
    // This is the same as unfollowUser
    return this.unfollowUser(targetUserId);
  }

  // ========== POSTS ==========

  async createPost(postData: CreatePostData): Promise<ApiResponse<Post>> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: undefined,
        success: false,
        message: 'User must be authenticated',
      };
    }

    console.log('Creating post with user_id:', user.id);
    console.log('Post data:', { 
      type: postData.type, 
      content: postData.content?.substring(0, 50) + '...',
      restaurant_id: postData.restaurant_id,
      rating: postData.rating 
    });

    // Insert post without joins (to avoid foreign key relationship issues)
    const { data: postData_result, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        type: postData.type,
        content: postData.content,
        restaurant_id: postData.restaurant_id || null,
        rating: postData.rating || null,
        image_urls: postData.image_urls || [],
        likes_count: 0,
        comments_count: 0,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating post:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return {
        data: undefined,
        success: false,
        message: error.message || 'Failed to create post',
      };
    }

    console.log('Post created successfully:', postData_result.id);

    // Fetch profile separately (since there's no direct FK relationship)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', user.id)
      .single();

    // Fetch restaurant separately if restaurant_id exists
    let restaurant = null;
    if (postData_result.restaurant_id) {
      const { data: restaurantData } = await supabase
        .from('restaurants')
        .select('id, name, cuisine')
        .eq('id', postData_result.restaurant_id)
        .single();
      restaurant = restaurantData;
    }

    const post: Post = {
      ...postData_result,
      user: profile || undefined,
      restaurant: restaurant || undefined,
    };

    return {
      data: post,
      success: true,
      message: 'Post created successfully',
    };
  }

  async getPosts(options?: {
    type?: PostType;
    userId?: string;
    restaurantId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Post[]>> {
    // Explicitly select columns to avoid schema cache issues with *
    let query = supabase
      .from('posts')
      .select(`
        id,
        user_id,
        type,
        content,
        restaurant_id,
        rating,
        image_urls,
        likes_count,
        comments_count,
        created_at,
        updated_at,
        restaurants:restaurant_id (
          id,
          name,
          cuisine
        )
      `)
      .order('created_at', { ascending: false });

    if (options?.type) {
      query = query.eq('type', options.type);
    }

    if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options?.restaurantId) {
      query = query.eq('restaurant_id', options.restaurantId);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset !== undefined) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return {
        data: undefined,
        success: false,
        message: error.message || 'Failed to fetch posts',
      };
    }

    if (!data || data.length === 0) {
      return {
        data: [],
        success: true,
        message: 'Posts fetched successfully',
      };
    }

    // Get unique user IDs
    const userIds = [...new Set(data.map((post: any) => post.user_id))];

    // Fetch all profiles in one query
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', userIds);

    // Create a map for quick lookup
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    // Map posts with profiles and restaurants
    const posts: Post[] = data.map((item: any) => ({
      ...item,
      user: profileMap.get(item.user_id) || undefined,
      restaurant: Array.isArray(item.restaurants) ? item.restaurants[0] : item.restaurants,
    }));

    return {
      data: posts,
      success: true,
      message: 'Posts fetched successfully',
    };
  }

  async getPost(postId: string): Promise<ApiResponse<Post>> {
    // Explicitly select columns to avoid schema cache issues with *
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        user_id,
        type,
        content,
        restaurant_id,
        rating,
        image_urls,
        likes_count,
        comments_count,
        created_at,
        updated_at,
        restaurants:restaurant_id (
          id,
          name,
          cuisine
        )
      `)
      .eq('id', postId)
      .single();

    if (error) {
      return {
        data: undefined,
        success: false,
        message: error.message || 'Failed to fetch post',
      };
    }

    // Fetch profile separately (since there's no direct FK relationship)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', data.user_id)
      .single();

    const post: Post = {
      ...data,
      user: profile || undefined,
      restaurant: Array.isArray(data.restaurants) ? data.restaurants[0] : data.restaurants,
    };

    return {
      data: post,
      success: true,
      message: 'Post fetched successfully',
    };
  }

  async updatePost(postId: string, updates: Partial<CreatePostData>): Promise<ApiResponse<Post>> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: undefined,
        success: false,
        message: 'User must be authenticated',
      };
    }

    // Check if user owns the post
    const { data: existingPost } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (!existingPost || existingPost.user_id !== user.id) {
      return {
        data: undefined,
        success: false,
        message: 'You can only edit your own posts',
      };
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.rating !== undefined) updateData.rating = updates.rating;
    if (updates.image_urls !== undefined) updateData.image_urls = updates.image_urls;

    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .select(`
        id,
        user_id,
        type,
        content,
        restaurant_id,
        rating,
        image_urls,
        likes_count,
        comments_count,
        created_at,
        updated_at,
        restaurants:restaurant_id (
          id,
          name,
          cuisine
        )
      `)
      .single();

    if (error) {
      return {
        data: undefined,
        success: false,
        message: error.message || 'Failed to update post',
      };
    }

    // Fetch profile separately
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', data.user_id)
      .single();

    const post: Post = {
      ...data,
      user: profile || undefined,
      restaurant: Array.isArray(data.restaurants) ? data.restaurants[0] : data.restaurants,
    };

    return {
      data: post,
      success: true,
      message: 'Post updated successfully',
    };
  }

  async deletePost(postId: string): Promise<ApiResponse<void>> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: undefined,
        success: false,
        message: 'User must be authenticated',
      };
    }

    // Check ownership
    const { data: existingPost } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (!existingPost || existingPost.user_id !== user.id) {
      return {
        data: undefined,
        success: false,
        message: 'You can only delete your own posts',
      };
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      return {
        data: undefined,
        success: false,
        message: error.message || 'Failed to delete post',
      };
    }

    return {
      data: undefined,
      success: true,
      message: 'Post deleted successfully',
    };
  }

  // ========== COMMENTS ==========

  async createComment(commentData: CreateCommentData): Promise<ApiResponse<Comment>> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: undefined,
        success: false,
        message: 'User must be authenticated',
      };
    }

    // Create comment
    const { data: newComment, error: commentError } = await supabase
      .from('comments')
      .insert({
        post_id: commentData.post_id,
        user_id: user.id,
        parent_id: commentData.parent_id || null,
        content: commentData.content,
        likes_count: 0,
      })
      .select('*')
      .single();

    if (commentError) {
      return {
        data: undefined,
        success: false,
        message: commentError.message || 'Failed to create comment',
      };
    }

    // Fetch profile separately
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', user.id)
      .single();

    // Update post comments count via RPC function
    await supabase.rpc('increment_post_comments', { post_id: commentData.post_id }).catch(async () => {
      // Fallback: fetch current count and increment
      const { data: post } = await supabase
        .from('posts')
        .select('comments_count')
        .eq('id', commentData.post_id)
        .single();
      
      if (post) {
        await supabase
          .from('posts')
          .update({ comments_count: (post.comments_count || 0) + 1 })
          .eq('id', commentData.post_id);
      }
    });

    const commentResult: Comment = {
      ...newComment,
      user: profile || undefined,
      replies: [],
    };

    return {
      data: commentResult,
      success: true,
      message: 'Comment created successfully',
    };
  }

  async getComments(postId: string): Promise<ApiResponse<Comment[]>> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .is('parent_id', null) // Only top-level comments
      .order('created_at', { ascending: false });

    if (error) {
      return {
        data: undefined,
        success: false,
        message: error.message || 'Failed to fetch comments',
      };
    }

    if (!data || data.length === 0) {
      return {
        data: [],
        success: true,
        message: 'Comments fetched successfully',
      };
    }

    // Fetch all replies first to get all user IDs
    const { data: allReplies } = await supabase
      .from('comments')
      .select('id, user_id, parent_id, created_at')
      .eq('post_id', postId)
      .not('parent_id', 'is', null)
      .order('created_at', { ascending: true });

    // Get all unique user IDs from comments and replies
    const allUserIds = new Set<string>();
    data.forEach((comment: any) => allUserIds.add(comment.user_id));
    allReplies?.forEach((reply: any) => allUserIds.add(reply.user_id));

    // Fetch all profiles in one query
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', Array.from(allUserIds));

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    // Group replies by parent_id
    const repliesByParent = new Map<string, any[]>();
    allReplies?.forEach((reply: any) => {
      if (!repliesByParent.has(reply.parent_id)) {
        repliesByParent.set(reply.parent_id, []);
      }
      repliesByParent.get(reply.parent_id)!.push(reply);
    });

    // Fetch full reply data for each parent
    const commentsWithReplies = await Promise.all(
      (data || []).map(async (comment: any) => {
        const replyIds = repliesByParent.get(comment.id)?.map((r: any) => r.id) || [];
        
        let replies: any[] = [];
        if (replyIds.length > 0) {
          const { data: fullReplies } = await supabase
            .from('comments')
            .select('*')
            .in('id', replyIds)
            .order('created_at', { ascending: true });
          replies = fullReplies || [];
        }

        return {
          ...comment,
          user: profileMap.get(comment.user_id) || undefined,
          replies: replies.map((reply: any) => ({
            ...reply,
            user: profileMap.get(reply.user_id) || undefined,
          })),
        };
      })
    );

    return {
      data: commentsWithReplies,
      success: true,
      message: 'Comments fetched successfully',
    };
  }

  async updateComment(commentId: string, content: string): Promise<ApiResponse<Comment>> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: undefined,
        success: false,
        message: 'User must be authenticated',
      };
    }

    // Check ownership
    const { data: existing } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return {
        data: undefined,
        success: false,
        message: 'You can only edit your own comments',
      };
    }

    const { data, error } = await supabase
      .from('comments')
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .select('*')
      .single();

    if (error) {
      return {
        data: undefined,
        success: false,
        message: error.message || 'Failed to update comment',
      };
    }

    // Fetch profile separately
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', data.user_id)
      .single();

    const comment: Comment = {
      ...data,
      user: profile || undefined,
      replies: [],
    };

    return {
      data: comment,
      success: true,
      message: 'Comment updated successfully',
    };
  }

  async deleteComment(commentId: string): Promise<ApiResponse<void>> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: undefined,
        success: false,
        message: 'User must be authenticated',
      };
    }

    // Check ownership
    const { data: existing } = await supabase
      .from('comments')
      .select('user_id, post_id')
      .eq('id', commentId)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return {
        data: undefined,
        success: false,
        message: 'You can only delete your own comments',
      };
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      return {
        data: undefined,
        success: false,
        message: error.message || 'Failed to delete comment',
      };
    }

    // Decrement post comments count via RPC function
    await supabase.rpc('decrement_post_comments', { post_id: existing.post_id }).catch(async () => {
      // Fallback: fetch current count and decrement
      const { data: post } = await supabase
        .from('posts')
        .select('comments_count')
        .eq('id', existing.post_id)
        .single();
      
      if (post) {
        await supabase
          .from('posts')
          .update({ comments_count: Math.max((post.comments_count || 0) - 1, 0) })
          .eq('id', existing.post_id);
      }
    });

    return {
      data: undefined,
      success: true,
      message: 'Comment deleted successfully',
    };
  }

  // ========== LIKES ==========

  async toggleLikePost(postId: string): Promise<ApiResponse<{ liked: boolean; likesCount: number }>> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: undefined,
        success: false,
        message: 'User must be authenticated',
      };
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) {
        return {
          data: undefined,
          success: false,
          message: error.message || 'Failed to unlike post',
        };
      }

      // Decrement likes count via RPC function
      await supabase.rpc('decrement_post_likes', { post_id: postId }).catch(async () => {
        // Fallback: fetch current count and decrement
        const { data: post } = await supabase
          .from('posts')
          .select('likes_count')
          .eq('id', postId)
          .single();
        
        if (post) {
          await supabase
            .from('posts')
            .update({ likes_count: Math.max((post.likes_count || 0) - 1, 0) })
            .eq('id', postId);
        }
      });

      const { data: post } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      return {
        data: { liked: false, likesCount: Math.max((post?.likes_count || 1) - 1, 0) },
        success: true,
        message: 'Post unliked',
      };
    } else {
      // Like
      const { error } = await supabase
        .from('likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      if (error) {
        return {
          data: undefined,
          success: false,
          message: error.message || 'Failed to like post',
        };
      }

      // Increment likes count via RPC function
      await supabase.rpc('increment_post_likes', { post_id: postId }).catch(async () => {
        // Fallback: fetch current count and increment
        const { data: post } = await supabase
          .from('posts')
          .select('likes_count')
          .eq('id', postId)
          .single();
        
        if (post) {
          await supabase
            .from('posts')
            .update({ likes_count: (post.likes_count || 0) + 1 })
            .eq('id', postId);
        }
      });

      const { data: post } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      return {
        data: { liked: true, likesCount: (post?.likes_count || 0) + 1 },
        success: true,
        message: 'Post liked',
      };
    }
  }

  async isPostLiked(postId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;

    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    return !!data;
  }

}

export const apiService = new ApiService();
