import { supabase } from '@/lib/supabase';

export type FollowStatus = 'not_following' | 'following' | 'requested';

export type FollowListEntry = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  isPublic?: boolean;
  relationshipStatus: 'approved' | 'requested';
  followStatus: FollowStatus;
};

const mapProfileRow = (row: any) => ({
  id: row.id,
  username: row.username ?? 'user',
  displayName: row.display_name ?? row.username ?? 'User',
  avatarUrl: row.avatar_url ?? undefined,
  bio: row.bio ?? undefined,
  isPublic: row.is_public ?? true,
});

async function fetchProfilesByIds(ids: string[]) {
  if (ids.length === 0) return {};

  const { data, error } = await supabase.from('profiles').select('*').in('id', ids);

  if (error) throw error;

  return (data ?? []).reduce<Record<string, any>>((acc, row) => {
    acc[row.id] = row;
    return acc;
  }, {});
}

async function getStatusMap(followerId: string | undefined, targetIds: string[]) {
  if (!followerId || targetIds.length === 0) return {};

  const { data, error } = await supabase
    .from('followers')
    .select('following_id,status')
    .eq('follower_id', followerId)
    .in('following_id', targetIds);

  if (error) throw error;

  return (data ?? []).reduce<Record<string, FollowStatus>>((acc, row) => {
    acc[row.following_id] = row.status === 'requested' ? 'requested' : 'following';
    return acc;
  }, {});
}

async function listRelationships({
  viewedUserId,
  currentUserId,
  mode,
}: {
  viewedUserId: string;
  currentUserId?: string;
  mode: 'followers' | 'following';
}): Promise<FollowListEntry[]> {
  const { data, error } =
    mode === 'followers'
      ? await supabase.from('followers').select('follower_id,status').eq('following_id', viewedUserId)
      : await supabase.from('followers').select('following_id,status').eq('follower_id', viewedUserId);

  if (error) throw error;

  const rows = (data as any[]) ?? [];
  const profileIds =
    mode === 'followers'
      ? rows.map((row) => row.follower_id)
      : rows.map((row) => row.following_id);

  const profiles = await fetchProfilesByIds(profileIds);
  const statusMap = await getStatusMap(currentUserId, profileIds);

  return rows
    .map((row) => {
      const profileId = mode === 'followers' ? row.follower_id : row.following_id;
      const profile = profiles[profileId];
      if (!profile) return null;

      return {
        ...mapProfileRow(profile),
        relationshipStatus: (row.status as 'approved' | 'requested') ?? 'approved',
        followStatus: statusMap[profileId] ?? 'not_following',
      };
    })
    .filter(Boolean) as FollowListEntry[];
}

async function getProfilePublicStatus(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_public')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.is_public ?? true;
}

export const followService = {
  async listFollowers(viewedUserId: string, currentUserId?: string) {
    return listRelationships({ viewedUserId, currentUserId, mode: 'followers' });
  },

  async listFollowing(viewedUserId: string, currentUserId?: string) {
    return listRelationships({ viewedUserId, currentUserId, mode: 'following' });
  },

  async followUser(currentUserId: string, targetUserId: string): Promise<FollowStatus> {
    const isPublic = await getProfilePublicStatus(targetUserId);
    const status = isPublic ? 'approved' : 'requested';

    const { error } = await supabase.from('followers').upsert(
      {
        follower_id: currentUserId,
        following_id: targetUserId,
        status,
      },
      { onConflict: 'follower_id,following_id' }
    );

    if (error) throw error;
    return status === 'approved' ? 'following' : 'requested';
  },

  async unfollowUser(currentUserId: string, targetUserId: string) {
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId);

    if (error) throw error;
    return 'not_following' as FollowStatus;
  },

  async getFollowStatus(currentUserId: string | undefined, targetUserId: string) {
    if (!currentUserId) {
      return { status: 'not_following' as FollowStatus };
    }

    const { data, error } = await supabase
      .from('followers')
      .select('status')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return { status: 'not_following' as FollowStatus };
    }

    return {
      status: data.status === 'requested' ? 'requested' : ('following' as FollowStatus),
    };
  },

  async getFollowCounts(userId: string) {
    const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
      supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)
        .eq('status', 'approved'),
      supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId),
    ]);

    return {
      followers: followersCount ?? 0,
      following: followingCount ?? 0,
    };
  },
};

