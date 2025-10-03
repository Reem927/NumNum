import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState('For You');

  const renderPost = (username: string, time: string, likes: number, replies: number, isReview: boolean = false) => (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <IconSymbol name="person.fill" size={16} color="#666" />
          </View>
          <ThemedText style={styles.username}>{username}</ThemedText>
        </View>
        <View style={styles.postActions}>
          <ThemedText style={styles.timestamp}>{time}</ThemedText>
          <TouchableOpacity style={styles.moreButton}>
            <IconSymbol name="ellipsis" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentArea}>
        {isReview ? (
          <View style={styles.reviewContent}>
            <ThemedText style={styles.reviewText}>Review</ThemedText>
            <IconSymbol name="heart.fill" size={16} color="#ff6b6b" />
          </View>
        ) : (
          <View style={styles.mediaPlaceholder}>
            <IconSymbol name="photo" size={40} color="#ccc" />
          </View>
        )}
      </View>

      <View style={styles.interactionBar}>
        <View style={styles.interactionLeft}>
          <TouchableOpacity style={styles.interactionButton}>
            <IconSymbol name="heart" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.interactionButton}>
            <IconSymbol name="bubble.left" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.interactionButton}>
            <IconSymbol name="paperplane" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.engagementStats}>
          {replies} replis {likes} like
        </ThemedText>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.titleSection}>

            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerActionItem}>
                <IconSymbol name="person.badge.plus" size={18} color="#000" />
                <ThemedText style={styles.actionLabel}>Friend request</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerActionIcon}>
                <IconSymbol name="envelope" size={18} color="#000" />
                <ThemedText style={styles.actionLabel}>Messages</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.mainTabs}>
            <TouchableOpacity 
              style={[styles.mainTab, activeTab === 'For You' && styles.activeMainTab]}
              onPress={() => setActiveTab('For You')}
            >
              <ThemedText style={[styles.mainTabText, activeTab === 'For You' && styles.activeMainTabText]}>
                For You
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.mainTab, activeTab === 'Following' && styles.activeMainTab]}
              onPress={() => setActiveTab('Following')}
            >
              <ThemedText style={[styles.mainTabText, activeTab === 'Following' && styles.activeMainTabText]}>
                Following
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.categorySection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {['Japanese', 'Italian', 'Indian', 'Chinese'].map((category, index) => (
                <TouchableOpacity key={index} style={styles.categoryButton}>
                  <ThemedText style={styles.categoryText}>{category}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.feed}>
          {renderPost('Username', '1m', 10, 2, false)}
          {renderPost('Username', '3m', 10, 3, true)}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <IconSymbol name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 50,
  },
  headerTop: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  titleSection: {
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerActionIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionLabel: {
    fontSize: 11,
    color: '#000',
  },
  mainTabs: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  mainTab: {
    marginRight: 20,
    paddingBottom: 5,
  },
  activeMainTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  mainTabText: {
    fontSize: 14,
    color: '#666',
  },
  activeMainTabText: {
    color: '#000',
    fontWeight: '600',
  },
  tabIndicator: {
    fontSize: 11,
    color: '#666',
    marginLeft: 'auto',
  },
  categorySection: {
    paddingVertical: 10,
    paddingLeft: 15,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#000',
  },
  feed: {
    padding: 15,
  },
  post: {
    backgroundColor: '#fff',
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  moreButton: {
    padding: 2,
  },
  contentArea: {
    marginBottom: 12,
  },
  mediaPlaceholder: {
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewContent: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  interactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  interactionLeft: {
    flexDirection: 'row',
    gap: 15,
  },
  interactionButton: {
    padding: 2,
  },
  engagementStats: {
    fontSize: 12,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    backgroundColor: '#e65332',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});