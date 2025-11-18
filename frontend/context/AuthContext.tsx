import { supabase } from '@/lib/supabase';
import { ensureProfile, getProfile, ProfileUpsert } from '@/services/profile.supabase';
import { User, UserPreferences } from '@/types/auth';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  bootstrapped: boolean; // NEW: prevents redirects before auth state is known
  signUp: (userData: SignUpPayload) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePreferences: (preferences: UserPreferences) => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

type SignUpPayload = {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
};

const mapProfileToUser = (authUser: SupabaseUser, profile?: any): User => {
  const fallbackName = authUser.email?.split('@')[0] ?? 'user';
  const username = profile?.username ?? authUser.user_metadata?.username ?? fallbackName;
  const displayName =
    profile?.display_name ??
    authUser.user_metadata?.full_name ??
    username ??
    fallbackName;

  return {
    id: authUser.id,
    email: authUser.email ?? '',
    username,
    displayName,
    avatar: profile?.avatar_url ?? undefined,
    bio: profile?.bio ?? '',
    isPublic: profile?.is_public ?? true,
    hasCompletedOnboarding: Boolean(profile?.has_completed_onboarding),
    preferences: profile?.preferences ?? undefined,
    createdAt: authUser.created_at,
    isNewUser: !profile?.has_completed_onboarding,
    profileImage: profile?.avatar_url ?? undefined,
    bannerImage: profile?.banner_image ?? undefined,
    instagramHandle: profile?.instagram_handle ?? undefined,
    reviewCount: profile?.review_count ?? undefined,
  };
};

const buildProfilePatch = (profileData: Partial<User>): ProfileUpsert => {
  const patch: ProfileUpsert = {};

  if (profileData.username !== undefined) patch.username = profileData.username;
  if (profileData.displayName !== undefined) patch.display_name = profileData.displayName;
  if (profileData.bio !== undefined) patch.bio = profileData.bio;
  if (profileData.avatar !== undefined) patch.avatar_url = profileData.avatar;
  if (profileData.profileImage !== undefined) patch.avatar_url = profileData.profileImage;
  if (profileData.bannerImage !== undefined) patch.banner_image = profileData.bannerImage ?? null;
  if (profileData.instagramHandle !== undefined) patch.instagram_handle = profileData.instagramHandle ?? null;
  if (profileData.isPublic !== undefined) patch.is_public = profileData.isPublic;
  if (profileData.reviewCount !== undefined) patch.review_count = profileData.reviewCount;
  if (profileData.hasCompletedOnboarding !== undefined) {
    patch.has_completed_onboarding = profileData.hasCompletedOnboarding;
  }
  if (profileData.preferences !== undefined) patch.preferences = profileData.preferences;

  return patch;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapped, setBootstrapped] = useState(false);

  const hydrateFromAuthUser = useCallback(
    async (authUser: SupabaseUser | null) => {
      if (!authUser) {
        setUser(null);
        return null;
      }

      await ensureProfile(authUser.id);
      const profile = await getProfile(authUser.id);
      const mapped = mapProfileToUser(authUser, profile);
      setUser(mapped);
      return mapped;
    },
    []
  );

  const loadCurrentUser = useCallback(async () => {
    const authUser = await fetchCurrentAuthUser();
    return hydrateFromAuthUser(authUser);
  }, [fetchCurrentAuthUser, hydrateFromAuthUser]);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      setLoading(true);
      try {
        if (!isMounted) return;
        await loadCurrentUser();
      } catch (error) {
        console.error('Error bootstrapping auth state:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          setBootstrapped(true);
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true);
      hydrateFromAuthUser(session?.user ?? null)
        .catch((error) => console.error('Auth state change error:', error))
        .finally(() => setLoading(false));
    });

    bootstrap();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateFromAuthUser, loadCurrentUser]);

  const fetchCurrentAuthUser = useCallback(async () => {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error) throw error;
    return authUser ?? null;
  }, []);

  const signUp = async (userData: SignUpPayload) => {
    setLoading(true);
    try {
      const { email, password, username, displayName } = userData;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, display_name: displayName },
        },
      });

      if (error) throw error;

      const authUser = data.user ?? (await fetchCurrentAuthUser());
      if (!authUser) throw new Error('Sign up succeeded but no user returned.');

      await ensureProfile(authUser.id, {
        username,
        display_name: displayName,
      });

      await hydrateFromAuthUser(authUser);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const authUser = data.user ?? (await fetchCurrentAuthUser());
      await hydrateFromAuthUser(authUser);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (preferences: UserPreferences) => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({ preferences }).eq('id', user.id);
      if (error) throw error;
      const authUser = await fetchCurrentAuthUser();
      await hydrateFromAuthUser(authUser);
    } catch (error) {
      console.error('Update preferences error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: Partial<User>) => {
    if (!user) return;
    const patch = buildProfilePatch(profileData);
    if (Object.keys(patch).length === 0) return;

    setLoading(true);
    try {
      await ensureProfile(user.id, patch);
      const authUser = await fetchCurrentAuthUser();
      await hydrateFromAuthUser(authUser);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true })
        .eq('id', user.id);
      if (error) throw error;
      const authUser = await fetchCurrentAuthUser();
      await hydrateFromAuthUser(authUser);
    } catch (error) {
      console.error('Complete onboarding error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        bootstrapped, // NEW
        signUp,
        signIn,
        signOut,
        updatePreferences,
        updateProfile,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};