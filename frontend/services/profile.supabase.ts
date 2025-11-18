import { supabase } from '@/lib/supabase';

export type ProfileUpsert = {
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  banner_image?: string | null;
  instagram_handle?: string | null;
  is_public?: boolean;
  review_count?: number;
  has_completed_onboarding?: boolean;
  preferences?: any;
};

/** Create a profile row if it doesn't exist; otherwise update provided fields. */
export async function ensureProfile(userId: string, patch?: ProfileUpsert) {
  const { data: existing, error: selErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (selErr) throw selErr;

  if (!existing) {
    const { error: insErr, data } = await supabase
      .from('profiles')
      .insert([{ id: userId, ...patch }])
      .select('*')
      .maybeSingle();
    if (insErr) throw insErr;
    return data;
  } else if (patch && Object.keys(patch).length > 0) {
    const { error: updErr, data } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select('*')
      .maybeSingle();
    if (updErr) throw updErr;
    return data;
  } else {
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    return prof;
  }
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

