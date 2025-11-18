import { useAuth } from '@/context/AuthContext';
import { useSavedList } from '@/context/SavedListContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DiscoverScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toggleSave, toggleFavorite, isSaved } = useSavedList();
  const { user } = useAuth();

  // 🔖 Bookmark animation state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // 🔄 Card animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;


  // Reset when returning to Home
  useFocusEffect(
    useCallback(() => {
      // When screen is focused (back to home), reset to outlined
      setIsBookmarked(false);
    }, [])
  );

  const handleBookmarkPress = () => {
    // Animate pop
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  
    // Immediately fill the icon
    setIsBookmarked(true);
  
    // Wait for animation, then navigate
    setTimeout(() => {
      router.push('/SavedList');
    }, 150);
  };
  
  // Get personalized restaurant recommendations based on user preferences
  const getPersonalizedRestaurants = () => {
    const allRestaurants = [
      { id: '1', name: 'Tatami', cuisine: 'Japanese', rating: '4.8', image: require('@/assets/images/tatami.png') },
      { id: '2', name: 'Arabica', cuisine: 'Lebanese', rating: '4.6', image: require('@/assets/images/arabica.png') },
      { id: '3', name: 'Solo Eatery', cuisine: 'Italian', rating: '4.5', image: require('@/assets/images/tatami.png') },
      { id: '4', name: 'Burger Bros', cuisine: 'American', rating: '4.2', image: require('@/assets/images/arabica.png') },
      { id: '5', name: 'Sakura', cuisine: 'Japanese', rating: '4.9', image: require('@/assets/images/tatami.png') },
      { id: '6', name: 'La Table', cuisine: 'French', rating: '4.4', image: require('@/assets/images/arabica.png') },
      { id: '7', name: 'Casa Verde', cuisine: 'Mexican', rating: '4.3', image: require('@/assets/images/tatami.png') },
      { id: '8', name: 'Byblos', cuisine: 'Lebanese', rating: '4.7', image: require('@/assets/images/arabica.png') },
      { id: '9', name: 'K-Town Grill', cuisine: 'Korean', rating: '4.6', image: require('@/assets/images/tatami.png') },
      { id: '10', name: 'Dragon Wok', cuisine: 'Chinese', rating: '4.5', image: require('@/assets/images/arabica.png') },
      { id: '11', name: 'Spice Garden', cuisine: 'Indian', rating: '4.8', image: require('@/assets/images/tatami.png') },
      { id: '12', name: 'Fish & Chips', cuisine: 'British', rating: '4.3', image: require('@/assets/images/arabica.png') },
    ];

    // If user has preferences, prioritize their favorite cuisines
    if (user?.preferences?.favoriteCuisines && user.preferences.favoriteCuisines.length > 0) {
      const favoriteCuisines = user.preferences.favoriteCuisines;
      
      // Sort restaurants: favorite cuisines first, then others
      return allRestaurants.sort((a, b) => {
        const aIsFavorite = favoriteCuisines.includes(a.cuisine);
        const bIsFavorite = favoriteCuisines.includes(b.cuisine);
        
        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;
        
        // If both are favorites or both aren't, sort by rating
        return parseFloat(b.rating) - parseFloat(a.rating);
      });
    }
    
    // Default: sort by rating
    return allRestaurants.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  };

  const restaurants = getPersonalizedRestaurants();

  const currentRestaurant = restaurants[currentIndex];

  const handleNextCard = () => {
    // Reset card position instantly after the animation
    translateX.setValue(0);
    opacity.setValue(1);
    setCurrentIndex((prev) => prev + 1);
  };
  
  const animateSwipe = (direction: 'left' | 'right') => {
    const toValue = direction === 'left' ? -400 : 400; // swipe distance in px
  
    Animated.parallel([
      Animated.timing(translateX, {
        toValue,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => handleNextCard());
  };
  



  if (!currentRestaurant) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>No more restaurants!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.searchContainer}
          onPress={() => router.push('/Search')}>
          <Ionicons name="search" size={20} color="#888" style={{ marginRight: 5 }} />
          <Text style={{ color: '#888', fontSize: 16 }}>Search restaurants...</Text>
        </TouchableOpacity>

        <View style={styles.topIcons}>
          {/* 🔖 Animated Bookmark Icon */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity onPress={handleBookmarkPress}>
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={26}
                color="#000"
              />
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity onPress={() => router.push('/Filters')}>
            <View style={styles.filterButton}>
              <Ionicons name="options-outline" size={22} color="black" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Restaurant Card */}
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ translateX }],
            opacity,
          },
        ]}>
        <Image source={currentRestaurant.image} style={styles.cardImage} />
        <Text style={styles.cardTitle}>{currentRestaurant.name}</Text>
        <Text style={styles.cardSubtitle}>
          {currentRestaurant.cuisine} | Rating {currentRestaurant.rating}
        </Text>
        
        {/* Dietary Restriction Badges */}
        {user?.preferences?.dietaryRestrictions && user.preferences.dietaryRestrictions.length > 0 && (
          <View style={styles.badgesContainer}>
            {user.preferences.dietaryRestrictions.map((restriction) => (
              <View key={restriction} style={styles.badge}>
                <Text style={styles.badgeText}>{restriction}</Text>
              </View>
            ))}
          </View>
        )}
      </Animated.View>

      {/* Tinder-style Buttons */}
      <View style={styles.buttonsContainer}>
        {/* Skip (Red X) */}
        <TouchableOpacity
          style={[styles.circleButton, { borderColor: '#ff4d4d' }]}
          onPress={() => animateSwipe('left')}>
          <Ionicons name="close" size={34} color="#ff4d4d" />
        </TouchableOpacity>

        {/* Star (Blue) */}
        <TouchableOpacity
          style={[styles.circleButton, { borderColor: '#007AFF' }]}
          onPress={() => {
            toggleSave(currentRestaurant);
            toggleFavorite(currentRestaurant.id);
            animateSwipe('right');
          }}>
          <Ionicons name="star" size={30} color="#007AFF" />
        </TouchableOpacity>

        {/* Save (Green Heart) */}
        <TouchableOpacity
          style={[styles.circleButton, { borderColor: '#34C759' }]}
          onPress={() => {
            toggleSave(currentRestaurant);
            animateSwipe('right');
          }}>
          <Ionicons name="heart" size={30} color="#34C759" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 65,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    paddingHorizontal: 10,
    marginRight: 10,
    height: 40,
  },
  topIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    width: '85%',
    borderRadius: 20,
    backgroundColor: 'rgba(245, 245, 245, 0.9)',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 360,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    marginTop: 15,
    paddingHorizontal: 16,
    color: '#333',
  },
  cardSubtitle: {
    color: '#666',
    fontSize: 15,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  badge: {
    backgroundColor: '#e65332',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 75,
    gap: 25,
  },
  circleButton: {
    width: 75,
    height: 75,
    borderWidth: 4,
    borderRadius: 37.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  filterButton: {
    backgroundColor: 'transparent',
    borderRadius: 50,
    padding: 8,
    marginLeft: 15,
  },
});
