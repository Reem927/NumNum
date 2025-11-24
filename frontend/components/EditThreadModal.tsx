import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '@/types/posts';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';

interface EditThreadModalProps {
  visible: boolean;
  post: Post | null;
  onClose: () => void;
  onSave: (updates: {
    content: string;
    image_urls?: string[] | null;
    attached_review_id?: string | null;
  }) => Promise<void>;
}

export default function EditThreadModal({
  visible,
  post,
  onClose,
  onSave,
}: EditThreadModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [attachedReview, setAttachedReview] = useState<Post | null>(null);
  const [saving, setSaving] = useState(false);
  const [showReviewPicker, setShowReviewPicker] = useState(false);
  const [userReviews, setUserReviews] = useState<Post[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Initialize state when post changes
  useEffect(() => {
    if (post && visible) {
      setContent(post.content || '');
      setImageUrls(post.image_urls || []);
      setAttachedReview(post.attachedReview || null);
    }
  }, [post, visible]);

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleRemoveReview = () => {
    setAttachedReview(null);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll access to add images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setImageUrls([...imageUrls, ...newImages]);
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

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        content: content.trim(),
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        attached_review_id: attachedReview?.id || null,
      });
      onClose();
    } catch (error) {
      console.error('Error saving thread:', error);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (post) {
      setContent(post.content || '');
      setImageUrls(post.image_urls || []);
      setAttachedReview(post.attachedReview || null);
    }
    setShowReviewPicker(false);
    onClose();
  };

  if (!post) return null;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={handleCancel}
          >
            <View style={styles.modal} onStartShouldSetResponder={() => true}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                  <ThemedText style={styles.cancelText}>Cancel</ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.title}>Edit Thread</ThemedText>
                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.saveButton, (!content.trim() || saving) && styles.saveButtonDisabled]}
                  disabled={!content.trim() || saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={styles.saveText}>Save</ThemedText>
                  )}
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
              >
                {/* Text Input */}
                <TextInput
                  style={styles.textInput}
                  placeholder="What's on your mind?"
                  placeholderTextColor="#999"
                  multiline
                  value={content}
                  onChangeText={setContent}
                  autoFocus
                  textAlignVertical="top"
                />

                {/* Current Images */}
                {imageUrls.length > 0 && (
                  <View style={styles.imagesSection}>
                    <ThemedText style={styles.sectionLabel}>Images</ThemedText>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.imagesScrollContent}
                    >
                      {imageUrls.map((uri, index) => (
                        <View key={index} style={styles.imagePreview}>
                          <Image source={{ uri }} style={styles.previewImage} />
                          <TouchableOpacity
                            style={styles.removeImageButton}
                            onPress={() => handleRemoveImage(index)}
                          >
                            <Ionicons name="close-circle" size={24} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Current Attached Review */}
                {attachedReview && (
                  <View style={styles.attachedReviewSection}>
                    <ThemedText style={styles.sectionLabel}>Attached Review</ThemedText>
                    <View style={styles.reviewChip}>
                      <View style={styles.reviewContent}>
                        <View style={styles.reviewHeader}>
                          <Ionicons name="star" size={16} color="#ffd700" />
                          <ThemedText style={styles.reviewTitle}>
                            {attachedReview.restaurant?.name || 'Review'}
                          </ThemedText>
                        </View>
                        {attachedReview.rating && (
                          <ThemedText style={styles.reviewRating}>
                            {attachedReview.rating.toFixed(1)} ⭐
                          </ThemedText>
                        )}
                        {attachedReview.content && (
                          <ThemedText
                            style={styles.reviewText}
                            numberOfLines={2}
                          >
                            {attachedReview.content}
                          </ThemedText>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.removeReviewButton}
                        onPress={handleRemoveReview}
                      >
                        <Ionicons name="close-circle" size={20} color="#e65332" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={pickImage}
                  >
                    <Ionicons name="image-outline" size={20} color="#666" />
                    <ThemedText style={styles.actionButtonText}>
                      {imageUrls.length > 0 ? 'Add More Images' : 'Add Images'}
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleOpenReviewPicker}
                  >
                    <Ionicons name="document-text-outline" size={20} color="#666" />
                    <ThemedText style={styles.actionButtonText}>
                      {attachedReview ? 'Change Review' : 'Attach Review'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Review Picker Modal */}
      <Modal
        visible={showReviewPicker}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowReviewPicker(false)}
      >
        <View style={styles.reviewPickerContainer}>
          <View style={styles.reviewPickerHeader}>
            <TouchableOpacity 
              onPress={() => setShowReviewPicker(false)} 
              style={styles.reviewPickerCloseButton}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <ThemedText style={styles.reviewPickerTitle}>Select a Review</ThemedText>
            <View style={styles.reviewPickerPlaceholder} />
          </View>
          <ScrollView style={styles.reviewPickerContent}>
            {loadingReviews ? (
              <View style={styles.reviewPickerLoading}>
                <ActivityIndicator size="large" color="#e65332" />
              </View>
            ) : userReviews.length === 0 ? (
              <View style={styles.reviewPickerEmpty}>
                <Ionicons name="document-text-outline" size={48} color="#ccc" />
                <ThemedText style={styles.reviewPickerEmptyText}>No reviews found</ThemedText>
                <ThemedText style={styles.reviewPickerEmptySubtext}>
                  Create a review first to attach it to a thread
                </ThemedText>
              </View>
            ) : (
              userReviews.map((review) => (
                <TouchableOpacity
                  key={review.id}
                  style={styles.reviewItem}
                  onPress={() => handleSelectReview(review)}
                >
                  <View style={styles.reviewItemContent}>
                    <ThemedText style={styles.reviewItemText} numberOfLines={2}>
                      {review.content}
                    </ThemedText>
                    {review.restaurant && (
                      <ThemedText style={styles.reviewItemRestaurant}>
                        {review.restaurant.name}
                      </ThemedText>
                    )}
                    {review.rating && (
                      <View style={styles.reviewItemRating}>
                        <Ionicons name="star" size={14} color="#ffd700" />
                        <ThemedText style={styles.reviewItemRatingText}>
                          {review.rating.toFixed(1)}
                        </ThemedText>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#e65332',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  textInput: {
    fontSize: 16,
    color: '#000',
    minHeight: 120,
    padding: 0,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  imagesSection: {
    marginBottom: 20,
  },
  imagesScrollContent: {
    paddingRight: 16,
  },
  imagePreview: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachedReviewSection: {
    marginBottom: 20,
  },
  reviewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reviewContent: {
    flex: 1,
    marginRight: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  reviewRating: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  reviewText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  removeReviewButton: {
    padding: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  // Review Picker Modal Styles
  reviewPickerContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  reviewPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  reviewPickerCloseButton: {
    padding: 4,
  },
  reviewPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  reviewPickerPlaceholder: {
    width: 32,
  },
  reviewPickerContent: {
    flex: 1,
  },
  reviewPickerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  reviewPickerEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  reviewPickerEmptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  reviewPickerEmptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  reviewItemContent: {
    flex: 1,
    marginRight: 12,
  },
  reviewItemText: {
    fontSize: 15,
    color: '#000',
    marginBottom: 4,
  },
  reviewItemRestaurant: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  reviewItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewItemRatingText: {
    fontSize: 13,
    color: '#666',
  },
});
