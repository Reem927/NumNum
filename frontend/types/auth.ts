export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isPublic: boolean;
  hasCompletedOnboarding: boolean;  // Track onboarding status
  preferences?: UserPreferences;
  createdAt: string;
  isNewUser?: boolean;
  profileImage?: string;
  bannerImage?: string;
  instagramHandle?: string;
  reviewCount?: number;
}

export interface UserPreferences {
  favoriteCuisines: string[];  // From your 10 cuisines
  dietaryRestrictions: string[];  // Vegetarian, Vegan, Gluten-Free, etc.
}

export interface SignUpData {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}


