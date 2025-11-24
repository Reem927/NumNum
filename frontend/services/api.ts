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
    // First, get the follower IDs
    const { data: followData, error: followError } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('followed_id', userId)
      .select(`
        follower:follower_id (
          id,
          username,
          display_name,
          avatar_url,
          bio,
          is_public,
          review_count
        )
      `)
      .eq('followee_id', userId)
      .eq('status', 'accepted');

    if (followError) {
      return {
        data: undefined,
        success: false,
        message: followError.message || 'Failed to fetch followers',
      };
    }

    if (!followData || followData.length === 0) {
      return {
        data: [],
        success: true,
        message: 'Followers fetched successfully',
      };
    }

    // Extract follower IDs
    const followerIds = followData.map(item => item.follower_id);

    // Then, get the profiles for those IDs
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio, is_public, review_count')
      .in('id', followerIds);

    if (profileError) {
      return {
        data: undefined,
        success: false,
        message: profileError.message || 'Failed to fetch follower profiles',
      };
    }

    const followers: User[] = (profiles || []).map((profile: any) => ({
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
    }));

    return {
      data: followers,
      success: true,
      message: 'Followers fetched successfully',
    };
  }

  async getFollowing(userId: string): Promise<ApiResponse<User[]>> {
    // First, get the followed IDs
    const { data: followData, error: followError } = await supabase
      .from('follows')
      .select('followed_id')
      .select(`
        following:followee_id (
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

    if (followError) {
      return {
        data: undefined,
        success: false,
        message: followError.message || 'Failed to fetch following',
      };
    }

    if (!followData || followData.length === 0) {
      return {
        data: [],
        success: true,
        message: 'Following fetched successfully',
      };
    }

    // Extract followed IDs
    const followedIds = followData.map(item => item.followed_id);

    // Then, get the profiles for those IDs
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio, is_public, review_count')
      .in('id', followedIds);

    if (profileError) {
      return {
        data: undefined,
        success: false,
        message: profileError.message || 'Failed to fetch following profiles',
      };
    }

    const following: User[] = (profiles || []).map((profile: any) => ({
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
    }));

    return {
      data: following,
      success: true,
      message: 'Following fetched successfully',
    };
  }

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: undefined,
        success: false,
        message: 'User must be authenticated',
      };
    }

    if (!query.trim()) {
      return {
        data: [],
        success: true,
        message: 'Empty query',
      };
    }

    // Search profiles by username or display_name, excluding current user
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio, is_public, review_count, has_completed_onboarding')
      .neq('id', user.id) // Exclude current user
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(20);

    if (error) {
      return {
        data: undefined,
        success: false,
        message: error.message || 'Failed to search users',
      };
    }

    if (!profiles || profiles.length === 0) {
      return {
        data: [],
        success: true,
        message: 'No users found',
      };
    }

    // Get user IDs to check follow status
    const userIds = profiles.map(p => p.id);

    // Check follow status for all users in one query
    const { data: followData } = await supabase
      .from('follows')
      .select('followed_id, status')
      .eq('follower_id', user.id)
      .in('followed_id', userIds);

    // Create a map of follow statuses
    const followStatusMap = new Map<string, 'following' | 'requested' | 'not_following'>();
    followData?.forEach((follow: any) => {
      const status = follow.status === 'accepted' ? 'following' : 'requested';
      followStatusMap.set(follow.followed_id, status);
    });

    // Map profiles to User type with follow status
    const users: User[] = profiles.map((profile: any) => {
      const followStatus = followStatusMap.get(profile.id) || 'not_following';
      
      return {
        id: profile.id,
        email: '',
        username: profile.username || '',
        displayName: profile.display_name || profile.username || '',
        avatar: profile.avatar_url || undefined,
        bio: profile.bio || '',
        isPublic: profile.is_public ?? true,
        hasCompletedOnboarding: profile.has_completed_onboarding ?? false,
        reviewCount: profile.review_count || 0,
        followersCount: 0, // Can be calculated if needed
        followingCount: 0, // Can be calculated if needed
        followStatus: followStatus as 'not_following' | 'following' | 'requested',
      };
    });

    return {
      data: users,
      success: true,
      message: 'Users found successfully',
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

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id, status')
      .eq('follower_id', user.id)
      .eq('followed_id', targetUserId)
      .single();

    if (existingFollow) {
      // Already following or requested
      return {
        data: undefined,
        success: true,
        message: 'Already following this user',
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
        followee_id: targetUserId,
        status,
      });

    if (error) {
      // Handle duplicate key error gracefully
      if (error.code === '23505') { // Unique violation
        return {
          data: undefined,
          success: true,
          message: 'Already following this user',
        };
      }
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
      .eq('followee_id', targetUserId);

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
      .eq('followee_id', user.id);

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

    console.log('Creating thread with user_id:', user.id);
    console.log('Thread data:', { 
      content: postData.content?.substring(0, 50) + '...',
      cuisine: postData.cuisine,
    });

    // Insert thread (threads table doesn't have type, restaurant_id, or rating)
    const { data: threadData_result, error } = await supabase
      .from('threads')
      .insert({
        user_id: user.id,
        content: postData.content,
        cuisine: postData.cuisine || null,
        attached_review_id: postData.attached_review_id || null,
        image_urls: postData.image_urls || [],
        likes_count: 0,
        comments_count: 0,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating thread:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return {
        data: undefined,
        success: false,
        message: error.message || 'Failed to create thread',
      };
    }

    console.log('Thread created successfully:', threadData_result.id);

    // Fetch profile separately (since there's no direct FK relationship)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', user.id)
      .single();

    // Map thread to Post interface (threads are always type 'thread')
    const post: Post = {
      ...threadData_result,
      type: 'thread',
      user: profile || undefined,
      restaurant: undefined, // Threads don't have restaurants
    };

    return {
      data: post,
      success: true,
      message: 'Thread created successfully',
    };
  }

  async getPosts(options?: {
    type?: PostType;
    userId?: string;
    restaurantId?: string;
    cuisine?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Post[]>> {
    // Fetch threads (threads table doesn't have type, restaurant_id, or rating)
    let query = supabase
      .from('threads')
      .select(`
        id,
        user_id,
        content,
        cuisine,
        attached_review_id,
        image_urls,
        likes_count,
        comments_count,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options?.cuisine) {
      query = query.eq('cuisine', options.cuisine);
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
        message: error.message || 'Failed to fetch threads',
      };
    }

    if (!data || data.length === 0) {
      return {
        data: [],
        success: true,
        message: 'Threads fetched successfully',
      };
    }

    // Get unique user IDs
    const userIds = [...new Set(data.map((thread: any) => thread.user_id))];

    // Fetch all profiles in one query
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', userIds);

    // Create a map for quick lookup
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    // Map threads to Post interface (all threads are type 'thread')
    const posts: Post[] = data.map((item: any) => ({
      ...item,
      type: 'thread' as PostType,
      user: profileMap.get(item.user_id) || undefined,
      restaurant: undefined, // Threads don't have restaurants
    }));

    return {
      data: posts,
      success: true,
      message: 'Threads fetched successfully',
    };
  }

  async getPost(postId: string): Promise<ApiResponse<Post>> {
    // Fetch thread from threads table
    const { data, error } = await supabase
      .from('threads')
      .select(`
        id,
        user_id,
        content,
        cuisine,
        attached_review_id,
        image_urls,
        likes_count,
        comments_count,
        created_at,
        updated_at
      `)
      .eq('id', postId)
      .single();

    if (error) {
      return {
        data: undefined,
        success: false,
        message: error.message || 'Failed to fetch thread',
      };
    }

    // Fetch profile separately (since there's no direct FK relationship)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', data.user_id)
      .single();

    // Fetch attached review if it exists (reviews are in reviews table)
    let attachedReview: Post | undefined = undefined;
    if (data.attached_review_id) {
      const { data: reviewData } = await supabase
        .from('reviews')
        .select(`
          id,
          user_id,
          content,
          restaurant_id,
          rating,
          image_urls,
          created_at,
          updated_at,
          likes_count,
          comments_count
        `)
        .eq('id', data.attached_review_id)
        .single();

      if (reviewData) {
        // Fetch review author profile
        const { data: reviewProfile } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .eq('id', reviewData.user_id)
          .single();

        // Fetch restaurant if exists
        let restaurant = null;
        if (reviewData.restaurant_id) {
          const { data: restaurantData } = await supabase
            .from('restaurants')
            .select('id, name, cuisine')
            .eq('id', reviewData.restaurant_id)
            .single();
          restaurant = restaurantData;
        }

        attachedReview = {
          ...reviewData,
          type: 'review' as PostType,
          user: reviewProfile || undefined,
          restaurant: restaurant || undefined,
        };
      }
    }

    // Map thread to Post interface
    const post: Post = {
      ...data,
      type: 'thread' as PostType,
      user: profile || undefined,
      restaurant: undefined, // Threads don't have restaurants
      attachedReview: attachedReview,
    };

    return {
      data: post,
      success: true,
      message: 'Thread fetched successfully',
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

    // Check if user owns the thread
    const { data: existingThread } = await supabase
      .from('threads')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (!existingThread || existingThread.user_id !== user.id) {
      return {
        data: undefined,
        success: false,
        message: 'You can only edit your own threads',
      };
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.image_urls !== undefined) {
      updateData.image_urls = updates.image_urls || [];
    }
    if (updates.attached_review_id !== undefined) {
      updateData.attached_review_id = updates.attached_review_id || null;
    }

    const { data, error } = await supabase
      .from('threads')
      .update(updateData)
      .eq('id', postId)
      .select(`
        id,
        user_id,
        content,
        cuisine,
        attached_review_id,
        image_urls,
        likes_count,
        comments_count,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      return {
        data: undefined,
        success: false,
        message: error.message || 'Failed to update thread',
      };
    }

    // Fetch profile separately
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', data.user_id)
      .single();

    // Fetch attached review if it exists
    let attachedReview: Post | undefined = undefined;
    if (data.attached_review_id) {
      const { data: reviewData } = await supabase
        .from('reviews')
        .select(`
          id,
          user_id,
          content,
          restaurant_id,
          rating,
          image_urls,
          likes_count,
          comments_count,
          created_at,
          updated_at
        `)
        .eq('id', data.attached_review_id)
        .single();

      if (reviewData) {
        // Fetch restaurant data
        let restaurant = undefined;
        if (reviewData.restaurant_id) {
          const { data: restaurantData } = await supabase
            .from('restaurants')
            .select('id, name, cuisine')
            .eq('id', reviewData.restaurant_id)
            .single();
          restaurant = restaurantData || undefined;
        }

        attachedReview = {
          ...reviewData,
          type: 'review' as PostType,
          restaurant,
        };
      }
    }

    // Map thread to Post interface
    const post: Post = {
      ...data,
      type: 'thread' as PostType,
      user: profile || undefined,
      restaurant: undefined, // Threads don't have restaurants
      attachedReview,
    };

    return {
      data: post,
      success: true,
      message: 'Thread updated successfully',
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
    const { data: existingThread } = await supabase
      .from('threads')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (!existingThread || existingThread.user_id !== user.id) {
      return {
        data: undefined,
        success: false,
        message: 'You can only delete your own threads',
      };
    }

    const { error } = await supabase
      .from('threads')
      .delete()
      .eq('id', postId);

    if (error) {
      return {
        data: undefined,
        success: false,
        message: error.message || 'Failed to delete thread',
      };
    }

    return {
      data: undefined,
      success: true,
      message: 'Thread deleted successfully',
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
        thread_id: commentData.thread_id,
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

    // Update thread comments count via RPC function
    const { error: rpcError } = await supabase.rpc('increment_thread_comments', { thread_id: commentData.thread_id });
    if (rpcError) {
      console.error('RPC Error (increment_thread_comments):', rpcError);
      // Fallback: fetch current count and increment
      const { data: thread } = await supabase
        .from('threads')
        .select('comments_count')
        .eq('id', commentData.thread_id)
        .single();
      
      if (thread) {
        const { error: updateError } = await supabase
          .from('threads')
          .update({ comments_count: (thread.comments_count || 0) + 1 })
          .eq('id', commentData.thread_id);
        
        if (updateError) {
          console.error('Update Error (increment comments):', updateError);
        }
      }
    }

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
      .eq('thread_id', postId)
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
      .eq('thread_id', postId)
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
      .select('user_id, thread_id')
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

    // Decrement thread comments count via RPC function
    const { error: rpcError } = await supabase.rpc('decrement_thread_comments', { thread_id: existing.thread_id });
    if (rpcError) {
      console.error('RPC Error (decrement_thread_comments):', rpcError);
      // Fallback: fetch current count and decrement
      const { data: thread } = await supabase
        .from('threads')
        .select('comments_count')
        .eq('id', existing.thread_id)
        .single();
      
      if (thread) {
        const { error: updateError } = await supabase
          .from('threads')
          .update({ comments_count: Math.max((thread.comments_count || 0) - 1, 0) })
          .eq('id', existing.thread_id);
        
        if (updateError) {
          console.error('Update Error (decrement comments):', updateError);
        }
      }
    }

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
      .eq('thread_id', postId)
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
          message: error.message || 'Failed to unlike thread',
        };
      }

      // Decrement likes count via RPC function
      const { error: rpcError } = await supabase.rpc('decrement_thread_likes', { thread_id: postId });
      if (rpcError) {
        console.error('RPC Error (decrement_thread_likes):', rpcError);
        // Fallback: fetch current count and decrement
        const { data: thread } = await supabase
          .from('threads')
          .select('likes_count')
          .eq('id', postId)
          .single();
        
        if (thread) {
          const { error: updateError } = await supabase
            .from('threads')
            .update({ likes_count: Math.max((thread.likes_count || 0) - 1, 0) })
            .eq('id', postId);
          
          if (updateError) {
            console.error('Update Error (decrement likes):', updateError);
          }
        }
      }

      // Fetch the updated count after RPC function completes
      const { data: thread } = await supabase
        .from('threads')
        .select('likes_count')
        .eq('id', postId)
        .single();

      return {
        data: { liked: false, likesCount: thread?.likes_count || 0 },
        success: true,
        message: 'Thread unliked',
      };
    } else {
      // Like
      const { error } = await supabase
        .from('likes')
        .insert({
          thread_id: postId,
          user_id: user.id,
        });

      if (error) {
        return {
          data: undefined,
          success: false,
          message: error.message || 'Failed to like thread',
        };
      }

      // Increment likes count via RPC function
      const { error: rpcError } = await supabase.rpc('increment_thread_likes', { thread_id: postId });
      if (rpcError) {
        console.error('RPC Error (increment_thread_likes):', rpcError);
        // Fallback: fetch current count and increment
        const { data: thread } = await supabase
          .from('threads')
          .select('likes_count')
          .eq('id', postId)
          .single();
        
        if (thread) {
          const { error: updateError } = await supabase
            .from('threads')
            .update({ likes_count: (thread.likes_count || 0) + 1 })
            .eq('id', postId);
          
          if (updateError) {
            console.error('Update Error (increment likes):', updateError);
          }
        }
      }

      // Fetch the updated count after RPC function completes
      const { data: thread } = await supabase
        .from('threads')
        .select('likes_count')
        .eq('id', postId)
        .single();

      return {
        data: { liked: true, likesCount: thread?.likes_count || 0 },
        success: true,
        message: 'Thread liked',
      };
    }
  }

  async isPostLiked(postId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;

    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('thread_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    return !!data;
  }

}

export const apiService = new ApiService();
