import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface LeaderboardModalProps {
  visible: boolean;
  onClose: () => void;
}

interface LeaderboardUser {
  id: string;
  name: string;
  username: string;
  profileImage?: string;
  reviewCount: number;
  rank: number;
}

export default function LeaderboardModal({ visible, onClose }: LeaderboardModalProps) {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState('');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch leaderboard data from Supabase
  useEffect(() => {
    if (!visible) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, review_count')
          .order('review_count', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching leaderboard:', error);
          setLeaderboardData([]);
          return;
        }

        const leaderboard: LeaderboardUser[] = (data || []).map((profile, index) => ({
          id: profile.id,
          name: profile.display_name || profile.username || 'Unknown',
          username: profile.username || 'unknown',
          profileImage: profile.avatar_url || undefined,
          reviewCount: profile.review_count || 0,
          rank: index + 1,
        }));

        setLeaderboardData(leaderboard);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setLeaderboardData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [visible]);

  // Get current user data
  const currentUserData: LeaderboardUser | null = user ? {
    id: user.id,
    name: user.displayName || 'You',
    username: user.username || 'your_username',
    profileImage: user.profileImage || user.avatar,
    reviewCount: user.reviewCount || 0,
    rank: leaderboardData.findIndex(u => u.id === user.id) + 1 || leaderboardData.length + 1,
  } : null;

  const allUsers = [...leaderboardData];
  if (currentUserData && !leaderboardData.find(u => u.id === currentUserData.id)) {
    allUsers.push(currentUserData);
  }

  // Calculate time until next month reset
  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const timeDiff = nextMonth.getTime() - now.getTime();
      
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    if (rank <= 3) return '#e65332';
    if (rank <= 10) return '#ff9500';
    return '#666';
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kuwait Leaderboard</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.resetInfo}>
          <Ionicons name="refresh" size={16} color="#e65332" />
          <Text style={styles.resetText}>Resets in {timeLeft}</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.leaderboard}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading leaderboard...</Text>
              </View>
            ) : allUsers.length === 0 ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>No users found</Text>
              </View>
            ) : (
              allUsers.map((user, index) => (
                <View
                  key={user.id}
                  style={[
                    styles.leaderboardItem,
                    currentUserData && user.id === currentUserData.id && styles.currentUserItem,
                  ]}
                >
                <View style={styles.rankContainer}>
                  <Text style={[styles.rankText, { color: getRankColor(user.rank) }]}>
                    {getRankIcon(user.rank)}
                  </Text>
                </View>

                <View style={styles.profileContainer}>
                  {user.profileImage ? (
                    <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.profilePlaceholder}>
                      <Ionicons name="person" size={20} color="#ccc" />
                    </View>
                  )}
                </View>

                <View style={styles.userInfo}>
                  <Text style={[
                    styles.userUsername,
                    currentUserData && user.id === currentUserData.id && styles.currentUserUsername
                  ]}>
                    {user.username}
                  </Text>
                  <Text style={[
                    styles.userName,
                    currentUserData && user.id === currentUserData.id && styles.currentUserName
                  ]}>
                    {user.name}
                  </Text>
                </View>

                <View style={styles.reviewCountContainer}>
                  <Text style={[
                    styles.reviewCount,
                    currentUserData && user.id === currentUserData.id && styles.currentUserReviewCount
                  ]}>
                    {user.reviewCount}
                  </Text>
                  <Text style={styles.reviewLabel}>reviews</Text>
                </View>
              </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 34,
  },
  resetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
  },
  resetText: {
    fontSize: 14,
    color: '#e65332',
    fontWeight: '500',
    marginLeft: 6,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  leaderboard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  currentUserItem: {
    backgroundColor: '#fff5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#e65332',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileContainer: {
    marginLeft: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  currentUserUsername: {
    color: '#e65332',
  },
  userName: {
    fontSize: 14,
    color: '#666',
  },
  currentUserName: {
    color: '#e65332',
  },
  reviewCountContainer: {
    alignItems: 'center',
  },
  reviewCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  currentUserReviewCount: {
    color: '#e65332',
  },
  reviewLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});





