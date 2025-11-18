import { ApiResponse, SignUpData, User, UserPreferences } from '@/types/auth';

class ApiService {
  private baseUrl = 'https://your-api.com/api'; // Your backend team will provide this
  
  // Mock implementations for now
  async signUp(userData: SignUpData): Promise<ApiResponse<{ user: User; token: string }>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: User = {
      id: '1',
      email: userData.email,
      username: userData.username,
      displayName: userData.displayName,
      avatar: undefined,
      bio: '',
      isPublic: true,
      hasCompletedOnboarding: false, // New users haven't completed onboarding
      preferences: undefined,
      createdAt: new Date().toISOString(),
      followersCount: 8,
      followingCount: 8,
    };
    
    return {
      data: { user: mockUser, token: 'mock-jwt-token' },
      success: true,
      message: 'Account created successfully'
    };
  }
  
  async signIn(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock different users based on email for testing
    const isReturningUser = email === 'user@example.com';
    
    const mockUser: User = isReturningUser ? {
      id: '2',
      email: email,
      username: 'foodlover123',
      displayName: 'Food Lover',
      avatar: 'https://via.placeholder.com/150',
      bio: 'Passionate about discovering new flavors!',
      isPublic: true,
      hasCompletedOnboarding: true,
      preferences: {
        favoriteCuisines: ['Japanese', 'Italian', 'Lebanese'],
        dietaryRestrictions: ['Vegetarian']
      },
      createdAt: '2024-01-01T00:00:00Z',
      followersCount: 8,
      followingCount: 8,
    } : {
      id: '1',
      email: email,
      username: 'newfoodie',
      displayName: 'New Foodie',
      avatar: undefined,
      bio: '',
      isPublic: true,
      hasCompletedOnboarding: false,
      preferences: undefined,
      createdAt: new Date().toISOString(),
      followersCount: 8,
      followingCount: 8,
    };
    
    return {
      data: { user: mockUser, token: 'mock-jwt-token' },
      success: true,
      message: 'Login successful'
    };
  }
  
  async signOut(): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      data: undefined,
      success: true,
      message: 'Logged out successfully'
    };
  }
  
  async updateUserPreferences(userId: string, preferences: UserPreferences): Promise<ApiResponse<User>> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock user update
    const updatedUser: User = {
      id: userId,
      email: 'user@example.com',
      username: 'foodlover123',
      displayName: 'Food Lover',
      avatar: 'https://via.placeholder.com/150',
      bio: 'Passionate about discovering new flavors!',
      isPublic: true,
      hasCompletedOnboarding: false, // Still false until completeOnboarding is called
      preferences: preferences,
      createdAt: '2024-01-01T00:00:00Z',
    };
    
    return {
      data: updatedUser,
      success: true,
      message: 'Preferences updated successfully'
    };
  }
  
  async completeOnboarding(userId: string): Promise<ApiResponse<User>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock user with completed onboarding
    const completedUser: User = {
      id: userId,
      email: 'user@example.com',
      username: 'foodlover123',
      displayName: 'Food Lover',
      avatar: 'https://via.placeholder.com/150',
      bio: 'Passionate about discovering new flavors!',
      isPublic: true,
      hasCompletedOnboarding: true,
      preferences: {
        favoriteCuisines: ['Japanese', 'Italian', 'Lebanese'],
        dietaryRestrictions: ['Vegetarian']
      },
      createdAt: '2024-01-01T00:00:00Z',
    };
    
    return {
      data: completedUser,
      success: true,
      message: 'Onboarding completed successfully'
    };
  }

  async getFollowers(userId: string): Promise<ApiResponse<User[]>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    // TODO: Replace with actual API call
    return this.mockResponse([]);
  }

  async getFollowing(userId: string): Promise<ApiResponse<User[]>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    // TODO: Replace with actual API call
    return this.mockResponse([]);
  }

  async followUser(targetUserId: string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // TODO: Replace with actual API call
    return this.mockResponse(undefined);
  }

  async unfollowUser(targetUserId: string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // TODO: Replace with actual API call
    return this.mockResponse(undefined);
  }

  async sendFollowRequest(targetUserId: string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // TODO: Replace with actual API call
    return this.mockResponse(undefined);
  }

  async acceptFollowRequest(requestId: string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // TODO: Replace with actual API call
    return this.mockResponse(undefined);
  }

  async cancelFollowRequest(targetUserId: string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // TODO: Replace with actual API call
    return this.mockResponse(undefined);
  }
  
  // Helper method for mock responses
  private mockResponse<T>(data: T): ApiResponse<T> {
    return {
      data,
      success: true,
      message: 'Mock response'
    };
  }
}

export const apiService = new ApiService();







