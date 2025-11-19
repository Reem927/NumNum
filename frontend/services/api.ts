import { supabase } from '../lib/supabase';

import { ApiResponse, SignUpData, User, UserPreferences } from '@/types/auth';

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

    const metadata = data.user.user_metadata || {};

    // 2) Map Supabase user -> app User type
    const appUser: User = {
      id: data.user.id,
      email: data.user.email || email,
      username: metadata.username || username,
      displayName: metadata.displayName || displayName,
      avatar: metadata.avatar || undefined,
      bio: metadata.bio || '',
      isPublic: metadata.isPublic ?? true,
      hasCompletedOnboarding: metadata.hasCompletedOnboarding ?? false,
      preferences: metadata.preferences,
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

    const metadata = data.user.user_metadata || {};

    // 2) Map Supabase user -> app User
    const appUser: User = {
      id: data.user.id,
      email: data.user.email || email,
      username: metadata.username || 'newfoodie',
      displayName: metadata.displayName || 'New Foodie',
      avatar: metadata.avatar || undefined,
      bio: metadata.bio || '',
      isPublic: metadata.isPublic ?? true,
      hasCompletedOnboarding: metadata.hasCompletedOnboarding ?? false,
      preferences: metadata.preferences,
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

  // ========== SOCIAL GRAPH (STILL MOCKED FOR NOW) ==========

  async getFollowers(userId: string): Promise<ApiResponse<User[]>> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // TODO: Replace with actual API call
    return this.mockResponse([]);
  }

  async getFollowing(userId: string): Promise<ApiResponse<User[]>> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // TODO: Replace with actual API call
    return this.mockResponse([]);
  }

  async followUser(targetUserId: string): Promise<ApiResponse<void>> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // TODO: Replace with actual API call
    return this.mockResponse(undefined);
  }

  async unfollowUser(targetUserId: string): Promise<ApiResponse<void>> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // TODO: Replace with actual API call
    return this.mockResponse(undefined);
  }

  async sendFollowRequest(targetUserId: string): Promise<ApiResponse<void>> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // TODO: Replace with actual API call
    return this.mockResponse(undefined);
  }

  async acceptFollowRequest(requestId: string): Promise<ApiResponse<void>> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // TODO: Replace with actual API call
    return this.mockResponse(undefined);
  }

  async cancelFollowRequest(targetUserId: string): Promise<ApiResponse<void>> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // TODO: Replace with actual API call
    return this.mockResponse(undefined);
  }

  // Helper method for mock responses
  private mockResponse<T>(data: T): ApiResponse<T> {
    return {
      data,
      success: true,
      message: 'Mock response',
    };
  }
}

export const apiService = new ApiService();
