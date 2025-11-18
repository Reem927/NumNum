import { supabase } from '@/lib/supabase';

type ApiUser = {
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  hasCompletedOnboarding?: boolean;
  preferences?: any;
};

const buildUser = (authUser: any, profile?: any): ApiUser => ({
  id: authUser?.id,
  email: authUser?.email ?? undefined,
  username: profile?.username ?? undefined,
  displayName: profile?.display_name ?? undefined,
  bio: profile?.bio ?? undefined,
  avatarUrl: profile?.avatar_url ?? undefined,
  hasCompletedOnboarding: Boolean(profile?.has_completed_onboarding),
  preferences: profile?.preferences,
});

export const apiService = {
  async signUp(userData: { email: string; password: string; username?: string; displayName?: string }) {
    const { email, password, username, displayName } = userData;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, display_name: displayName } },
    });
    if (error) throw error;

    const u = data.user ?? (await supabase.auth.getUser()).data.user;
    if (u) {
      const { error: upErr } = await supabase
        .from('profiles')
        .upsert({ id: u.id, username, display_name: displayName }, { onConflict: 'id' });
      if (upErr) throw upErr;
    }

    const session = (await supabase.auth.getSession()).data.session;
    const token = session?.access_token ?? null;

    const profile = u
      ? (await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()).data
      : null;

    return {
      data: {
        user: u ? buildUser(u, profile) : null,
        token,
      },
    };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const u = data.user ?? (await supabase.auth.getUser()).data.user;
    const session = (await supabase.auth.getSession()).data.session;
    const token = session?.access_token ?? null;

    let profile = null as any;
    if (u) {
      await supabase.from('profiles').upsert({ id: u.id }, { onConflict: 'id' });
      profile = (await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()).data;
    }

    return {
      data: {
        user: u ? buildUser(u, profile) : null,
        token,
      },
    };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { data: { ok: true } };
  },

  async updateUserPreferences(userId: string, preferences: any) {
    const { error } = await supabase.from('profiles').update({ preferences }).eq('id', userId);
    if (error) throw error;

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    return { data: { preferences: profile?.preferences ?? preferences } };
  },

  async completeOnboarding(userId: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ has_completed_onboarding: true })
      .eq('id', userId);
    if (error) throw error;
    return { data: { ok: true } };
  },
};

