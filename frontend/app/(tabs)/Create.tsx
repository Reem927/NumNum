import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CreateScreen() {
  const [selectedType, setSelectedType] = useState<'review' | 'thread' | null>(null);
  const router = useRouter();

  const handleSelect = (type: 'review' | 'thread') => {
    setSelectedType(type);
    router.push({
      pathname: '/create-post',
      params: { type },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Title */}
        <Text style={styles.title}>Create a...</Text>

        {/* Review Card */}
        <TouchableOpacity
          style={[
            styles.card,
            selectedType === 'review' && styles.cardSelected
          ]}
          onPress={() => handleSelect('review')}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="star" size={48} color={selectedType === 'review' ? '#fff' : '#e65332'} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[
              styles.cardTitle,
              selectedType === 'review' && styles.cardTitleSelected
            ]}>
              Review
            </Text>
            <Text style={[
              styles.cardDescription,
              selectedType === 'review' && styles.cardDescriptionSelected
            ]}>
              Share your dining experience and rate restaurants with photos and detailed feedback
            </Text>
          </View>
        </TouchableOpacity>

        {/* Thread Card */}
        <TouchableOpacity
          style={[
            styles.card,
            selectedType === 'thread' && styles.cardSelected
          ]}
          onPress={() => handleSelect('thread')}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="chatbubbles" size={48} color={selectedType === 'thread' ? '#fff' : '#e65332'} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[
              styles.cardTitle,
              selectedType === 'thread' && styles.cardTitleSelected
            ]}>
              Thread
            </Text>
            <Text style={[
              styles.cardDescription,
              selectedType === 'thread' && styles.cardDescriptionSelected
            ]}>
              Start a conversation, ask questions, or share food-related discussions with the community
            </Text>
          </View>
        </TouchableOpacity>

        {/* Selection Indicator (shown when one is selected) */}
        {selectedType && (
          <View style={styles.selectionIndicator}>
            <View style={styles.checkmarkCircle}>
              <Ionicons name="checkmark" size={24} color="#20c997" />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 32,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    backgroundColor: '#20c997', // Teal/green like in the image
    borderColor: '#20c997',
  },
  iconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  cardTitleSelected: {
    color: '#fff',
  },
  cardDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  cardDescriptionSelected: {
    color: '#fff',
    opacity: 0.9,
  },
  selectionIndicator: {
    alignItems: 'center',
    marginTop: 8,
  },
  checkmarkCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});