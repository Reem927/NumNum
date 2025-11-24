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
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { usePosts } from '@/context/PostContext';
import { useAuth } from '@/context/AuthContext';
import { PostType, Post } from '@/types/posts';
import { supabase } from '@/lib/supabase';
import { apiService } from '@/services/api';

const CUISINES = ['Kuwaiti', 'Indian', 'British', 'Lebanese', 'Japanese', 'Chinese', 'Italian', 'Korean', 'French', 'Mexican'];
const MAX_THREAD_LENGTH = 400;

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
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  const [attachedReview, setAttachedReview] = useState<Post | null>(null);
  const [showReviewPicker, setShowReviewPicker] = useState(false);
  const [userReviews, setUserReviews] = useState<Post[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

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

    if (isFromCommunity && !selectedCuisine) {
      Alert.alert('Error', 'Please select a cuisine category for your thread');
      return;
    }

    setLoading(true);

    try {
      const postData = {
        type: postType,
        content: content.trim(),
        cuisine: isFromCommunity ? selectedCuisine : undefined,
        restaurant_id: postType === 'review' ? restaurantId : undefined,
        rating: postType === 'review' ? rating : undefined,
        image_urls: selectedImages,
        attached_review_id: attachedReview?.id,
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

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll access to add images');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      // Store local URIs (you'll need to upload to Supabase Storage later)
      const newImages = result.assets.map(asset => asset.uri);
      setSelectedImages([...selectedImages, ...newImages]);
    }
  };

  const fetchUserReviews = async () => {
    if (!user) return;
    
    setLoadingReviews(true);
    try {
      const response = await apiService.getPosts({
        type: 'review',
        userId: user.id,
      });
      
      if (response.success && response.data) {
        setUserReviews(response.data);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleOpenReviewPicker = async () => {
    setShowReviewPicker(true);
    await fetchUserReviews();
  };

  const handleSelectReview = (review: Post) => {
    setAttachedReview(review);
    setShowReviewPicker(false);
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

        {/* Cuisine Selection (only for threads from Community) */}
        {isFromCommunity && (
          <View style={styles.cuisineSection}>
            <Text style={styles.sectionLabel}>Select Cuisine Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cuisineScroll}>
              {CUISINES.map((cuisine) => (
                <TouchableOpacity
                  key={cuisine}
                  style={[
                    styles.cuisineChip,
                    selectedCuisine === cuisine && styles.cuisineChipSelected
                  ]}
                  onPress={() => setSelectedCuisine(cuisine)}
                >
                  <Text style={[
                    styles.cuisineChipText,
                    selectedCuisine === cuisine && styles.cuisineChipTextSelected
                  ]}>
                    {cuisine}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Content Input */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionLabel}>Your Post</Text>
          <TextInput
            style={[
              styles.contentInput,
              isFromCommunity && content.length === MAX_THREAD_LENGTH && styles.contentInputError
            ]}
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
            maxLength={isFromCommunity ? MAX_THREAD_LENGTH : undefined}
            value={content}
            onChangeText={(text) => {
              if (isFromCommunity && text.length <= MAX_THREAD_LENGTH) {
                setContent(text);
              } else if (!isFromCommunity) {
                setContent(text);
              }
            }}
            textAlignVertical="top"
          />
          <View style={styles.charCountContainer}>
            <Text style={[
              styles.charCount,
              isFromCommunity && content.length === MAX_THREAD_LENGTH && styles.charCountError
            ]}>
              {content.length}{isFromCommunity ? `/${MAX_THREAD_LENGTH}` : ''} characters
              {isFromCommunity && content.length === MAX_THREAD_LENGTH && ' - You\'re at the character limit'}
            </Text>
          </View>
        </View>

        {/* Attached Review Preview */}
        {attachedReview && (
          <View style={styles.attachedReviewCard}>
            <View style={styles.attachedReviewHeader}>
              <Ionicons name="document-text" size={20} color="#e65332" />
              <Text style={styles.attachedReviewTitle}>Attached Review</Text>
              <TouchableOpacity onPress={() => setAttachedReview(null)}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            </View>
            <Text style={styles.attachedReviewContent} numberOfLines={2}>
              {attachedReview.content}
            </Text>
            {attachedReview.restaurant && (
              <Text style={styles.attachedReviewRestaurant}>
                {attachedReview.restaurant.name}
              </Text>
            )}
            {attachedReview.rating && (
              <View style={styles.attachedReviewRating}>
                <Ionicons name="star" size={14} color="#ffd700" />
                <Text style={styles.attachedReviewRatingText}>{attachedReview.rating}</Text>
              </View>
            )}
          </View>
        )}

        {/* Images Preview */}
        {selectedImages.length > 0 && (
          <View style={styles.imagesSection}>
            <Text style={styles.sectionLabel}>Images</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagesScrollContent}
            >
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

        {/* Attachment Buttons */}
        <View style={styles.attachmentButtons}>
          <TouchableOpacity
            style={styles.addImageButton}
            onPress={pickImage}
          >
            <Ionicons name="image-outline" size={24} color="#666" />
            <Text style={styles.addImageText}>Add Images</Text>
          </TouchableOpacity>

          {isFromCommunity && (
            <TouchableOpacity
              style={styles.attachReviewButton}
              onPress={handleOpenReviewPicker}
            >
              <Ionicons name="document-text-outline" size={24} color="#666" />
              <Text style={styles.attachReviewText}>Attach Review</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Review Picker Modal */}
        <Modal
          visible={showReviewPicker}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowReviewPicker(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowReviewPicker(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select a Review</Text>
              <View style={styles.modalPlaceholder} />
            </View>
            <ScrollView style={styles.modalContent}>
              {loadingReviews ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color="#e65332" />
                </View>
              ) : userReviews.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Ionicons name="document-text-outline" size={48} color="#ccc" />
                  <Text style={styles.modalEmptyText}>No reviews found</Text>
                  <Text style={styles.modalEmptySubtext}>Create a review first to attach it to a thread</Text>
                </View>
              ) : (
                userReviews.map((review) => (
                  <TouchableOpacity
                    key={review.id}
                    style={styles.reviewItem}
                    onPress={() => handleSelectReview(review)}
                  >
                    <View style={styles.reviewItemContent}>
                      <Text style={styles.reviewItemText} numberOfLines={2}>
                        {review.content}
                      </Text>
                      {review.restaurant && (
                        <Text style={styles.reviewItemRestaurant}>
                          {review.restaurant.name}
                        </Text>
                      )}
                      {review.rating && (
                        <View style={styles.reviewItemRating}>
                          <Ionicons name="star" size={14} color="#ffd700" />
                          <Text style={styles.reviewItemRatingText}>{review.rating}</Text>
                        </View>
                      )}
                    </View>
                    {attachedReview?.id === review.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#e65332" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </Modal>
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
  contentInputError: {
    borderColor: '#FF0000',
    backgroundColor: '#fff5f5',
  },
  charCountContainer: {
    marginTop: 4,
    alignItems: 'flex-end',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
  },
  charCountError: {
    color: '#FF0000',
    fontWeight: '600',
  },
  imagesSection: {
    marginBottom: 16,
  },
  imagesScrollContent: {
    paddingRight: 20,
  },
  imagePreview: {
    marginRight: 12,
    position: 'relative',
    overflow: 'visible',
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
    zIndex: 10,
    elevation: 10,
  },
  attachmentButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  addImageButton: {
    flex: 1,
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
  attachReviewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    gap: 8,
  },
  attachReviewText: {
    fontSize: 16,
    color: '#666',
  },
  attachedReviewCard: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  attachedReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  attachedReviewTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  attachedReviewContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  attachedReviewRestaurant: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  attachedReviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attachedReviewRatingText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalPlaceholder: {
    width: 34,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  modalEmptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reviewItemContent: {
    flex: 1,
  },
  reviewItemText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  reviewItemRestaurant: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  reviewItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewItemRatingText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  cuisineSection: {
    marginBottom: 24,
  },
  cuisineScroll: {
    marginTop: 8,
  },
  cuisineChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cuisineChipSelected: {
    backgroundColor: '#e65332',
    borderColor: '#e65332',
  },
  cuisineChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  cuisineChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});

