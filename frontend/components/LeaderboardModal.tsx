import { useAuth } from '@/context/AuthContext';
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

  // Mock leaderboard data
  const leaderboardData: LeaderboardUser[] = [
    { id: '1', name: 'Ahmed Al-Rashid', username: 'ahmed_foodie', reviewCount: 156, rank: 1 },
    { id: '2', name: 'Fatima Al-Zahra', username: 'fatima_eats', reviewCount: 142, rank: 2 },
    { id: '3', name: 'Mohammed Al-Sabah', username: 'mohammed_reviews', reviewCount: 138, rank: 3 },
    { id: '4', name: 'Noura Al-Mutairi', username: 'noura_food', reviewCount: 125, rank: 4 },
    { id: '5', name: 'Khalid Al-Ajmi', username: 'khalid_tastes', reviewCount: 119, rank: 5 },
    { id: '6', name: 'Aisha Al-Hajri', username: 'aisha_dines', reviewCount: 112, rank: 6 },
    { id: '7', name: 'Omar Al-Mansouri', username: 'omar_eats', reviewCount: 108, rank: 7 },
    { id: '8', name: 'Layla Al-Rashid', username: 'layla_foodie', reviewCount: 105, rank: 8 },
    { id: '9', name: 'Yousef Al-Mutawa', username: 'yousef_reviews', reviewCount: 98, rank: 9 },
    { id: '10', name: 'Mariam Al-Sabah', username: 'mariam_tastes', reviewCount: 94, rank: 10 },
    { id: '11', name: 'Fahad Al-Ajmi', username: 'fahad_eats', reviewCount: 89, rank: 11 },
    { id: '12', name: 'Hala Al-Zahra', username: 'hala_food', reviewCount: 85, rank: 12 },
    { id: '13', name: 'Saad Al-Mansouri', username: 'saad_dines', reviewCount: 82, rank: 13 },
    { id: '14', name: 'Reem Al-Hajri', username: 'reem_reviews', reviewCount: 78, rank: 14 },
    { id: '15', name: 'Tariq Al-Mutairi', username: 'tariq_eats', reviewCount: 75, rank: 15 },
    { id: '16', name: 'Nada Al-Rashid', username: 'nada_foodie', reviewCount: 72, rank: 16 },
    { id: '17', name: 'Waleed Al-Sabah', username: 'waleed_tastes', reviewCount: 68, rank: 17 },
    { id: '18', name: 'Dina Al-Ajmi', username: 'dina_dines', reviewCount: 65, rank: 18 },
    { id: '19', name: 'Hassan Al-Mutawa', username: 'hassan_food', reviewCount: 62, rank: 19 },
    { id: '20', name: 'Rana Al-Hajri', username: 'rana_reviews', reviewCount: 58, rank: 20 },
  ];

  // Add current user to leaderboard if not already present
  const currentUserData: LeaderboardUser = {
    id: user?.id || 'current',
    name: user?.displayName || 'You',
    username: user?.username || 'your_username',
    profileImage: user?.profileImage,
    reviewCount: user?.reviewCount || 25,
    rank: 42, // Mock rank
  };

  const allUsers = [...leaderboardData];
  if (!leaderboardData.find(u => u.id === currentUserData.id)) {
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
      
      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // Update every minute

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
            {allUsers.map((user, index) => (
              <View
                key={user.id}
                style={[
                  styles.leaderboardItem,
                  user.id === currentUserData.id && styles.currentUserItem,
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
                    user.id === currentUserData.id && styles.currentUserUsername
                  ]}>
                    {user.username}
                  </Text>
                  <Text style={[
                    styles.userName,
                    user.id === currentUserData.id && styles.currentUserName
                  ]}>
                    {user.name}
                  </Text>
                </View>

                <View style={styles.reviewCountContainer}>
                  <Text style={[
                    styles.reviewCount,
                    user.id === currentUserData.id && styles.currentUserReviewCount
                  ]}>
                    {user.reviewCount}
                  </Text>
                  <Text style={styles.reviewLabel}>reviews</Text>
                </View>
              </View>
            ))}
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
});





