import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { usePosts } from '@/context/PostContext';
import { useAuth } from '@/context/AuthContext';
import { PostType } from '@/types/posts';
import { supabase } from '@/lib/supabase';

export default function CreatePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: PostType; restaurantId?: string; fromCommunity?: string }>();
  const { createPost, error } = usePosts(); // Destructure error from usePosts
  const { user } = useAuth();
  
  const [postType, setPostType] = useState<PostType>(params.type || 'thread');
  const isFromCommunity = params.fromCommunity === 'true';
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [restaurantId, setRestaurantId] = useState<string | undefined>(params.restaurantId);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingRestaurant, setLoadingRestaurant] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Ensure postType stays as 'thread' when coming from Community
  useEffect(() => {
    if (isFromCommunity && postType !== 'thread') {
      setPostType('thread');
    }
  }, [isFromCommunity, postType]);

  // Fetch restaurant details if restaurantId is provided
  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantDetails();
    }
  }, [restaurantId]);

  const fetchRestaurantDetails = async () => {
    if (!restaurantId) return;
    
    setLoadingRestaurant(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, cuisine')
        .eq('id', restaurantId)
        .single();

      if (data && !error) {
        setRestaurantName(data.name);
      }
    } catch (err) {
      console.error('Error fetching restaurant:', err);
    } finally {
      setLoadingRestaurant(false);
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your post');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a post');
      router.push('/auth/Login');
      return;
    }

    if (postType === 'review' && !restaurantId) {
      Alert.alert('Error', 'Please select a restaurant for your review');
      return;
    }

    setLoading(true);

    try {
      const postData = {
        type: postType,
        content: content.trim(),
        restaurant_id: postType === 'review' ? restaurantId : undefined,
        rating: postType === 'review' ? rating : undefined,
        image_urls: selectedImages,
      };

      const newPost = await createPost(postData);

      if (newPost) {
        Alert.alert('Success', 'Post created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              router.back();
              // Refresh posts list
              setTimeout(() => {
                router.push('/(tabs)/Community');
              }, 100);
            },
          },
        ]);
      } else {
        // Use the error from PostContext for more specific error messages
        Alert.alert('Error', error || 'Failed to create post. Please try again.');
      }
    } catch (err: any) {
      console.error('Create post error:', err);
      Alert.alert('Error', error || err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRestaurant = () => {
    // Navigate to restaurant selection (you can create this screen later)
    Alert.alert('Coming Soon', 'Restaurant selection will be available soon');
    // router.push('/select-restaurant');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity
          onPress={handleCreatePost}
          style={[styles.postButton, loading && styles.postButtonDisabled]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={[
        styles.scrollContent,
        isFromCommunity && styles.scrollContentFromCommunity
      ]}>
        {/* Post Type Selector - Hide when coming from Community */}
        {!isFromCommunity && (
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, postType === 'thread' && styles.typeButtonActive]}
              onPress={() => setPostType('thread')}
            >
              <Ionicons
                name="chatbubbles"
                size={24}
                color={postType === 'thread' ? '#fff' : '#666'}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  postType === 'thread' && styles.typeButtonTextActive,
                ]}
              >
                Thread
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, postType === 'review' && styles.typeButtonActive]}
              onPress={() => setPostType('review')}
            >
              <Ionicons
                name="star"
                size={24}
                color={postType === 'review' ? '#fff' : '#666'}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  postType === 'review' && styles.typeButtonTextActive,
                ]}
              >
                Review
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Restaurant Selection (for reviews) */}
        {postType === 'review' && (
          <View style={styles.restaurantSection}>
            <Text style={styles.sectionLabel}>Restaurant</Text>
            {restaurantId && restaurantName ? (
              <View style={styles.restaurantCard}>
                <View style={styles.restaurantInfo}>
                  <Ionicons name="restaurant" size={20} color="#e65332" />
                  <View style={styles.restaurantDetails}>
                    <Text style={styles.restaurantName}>{restaurantName}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleSelectRestaurant}>
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectRestaurantButton}
                onPress={handleSelectRestaurant}
              >
                <Ionicons name="add-circle-outline" size={24} color="#e65332" />
                <Text style={styles.selectRestaurantText}>Select Restaurant</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Rating (for reviews) */}
        {postType === 'review' && (
          <View style={styles.ratingSection}>
            <Text style={styles.sectionLabel}>Rating</Text>
            <View style={styles.ratingSelector}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color={star <= rating ? '#ffd700' : '#ccc'}
                  />
                </TouchableOpacity>
              ))}
              <Text style={styles.ratingText}>{rating}.0</Text>
            </View>
          </View>
        )}

        {/* Content Input */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionLabel}>Your Post</Text>
          <TextInput
            style={styles.contentInput}
            placeholder={
              isFromCommunity
                ? 'Share your thoughts…'
                : postType === 'review'
                ? 'Share your dining experience...'
                : 'What do you want to share with the community?'
            }
            placeholderTextColor="#999"
            multiline
            numberOfLines={10}
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{content.length} characters</Text>
        </View>

        {/* Images Preview */}
        {selectedImages.length > 0 && (
          <View style={styles.imagesSection}>
            <Text style={styles.sectionLabel}>Images</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedImages.map((uri, index) => (
                <View key={index} style={styles.imagePreview}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      setSelectedImages(selectedImages.filter((_, i) => i !== index));
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Add Images Button (placeholder - you can implement image picker later) */}
        <TouchableOpacity
          style={styles.addImageButton}
          onPress={() => {
            Alert.alert('Coming Soon', 'Image upload will be available soon');
          }}
        >
          <Ionicons name="image-outline" size={24} color="#666" />
          <Text style={styles.addImageText}>Add Images</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e65332',
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  scrollContentFromCommunity: {
    paddingTop: 8, // Reduced top padding to close gap to header
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#e65332',
  },
  typeButtonDisabled: {
    opacity: 0.5,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  typeButtonTextDisabled: {
    color: '#ccc',
  },
  restaurantSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  restaurantDetails: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  changeText: {
    fontSize: 14,
    color: '#e65332',
    fontWeight: '600',
  },
  selectRestaurantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e65332',
    borderStyle: 'dashed',
    borderRadius: 8,
    gap: 8,
  },
  selectRestaurantText: {
    fontSize: 16,
    color: '#e65332',
    fontWeight: '600',
  },
  ratingSection: {
    marginBottom: 24,
  },
  ratingSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  contentSection: {
    marginBottom: 24,
  },
  contentInput: {
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fafafa',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  imagesSection: {
    marginBottom: 16,
  },
  imagePreview: {
    marginRight: 12,
    position: 'relative',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    gap: 8,
  },
  addImageText: {
    fontSize: 16,
    color: '#666',
  },
});

