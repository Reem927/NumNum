// frontend/app/(tabs)/index.tsx
import { useAuth } from '@/context/AuthContext';
import { useSavedList } from '@/context/SavedListContext';
import { useDiscoverFilters } from '@/context/DiscoverFilterContext';

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

// Row shape from Supabase
type RestaurantRow = {
  id: string;
  name: string;
  cuisine: string | null;
  rating: number | null;
  price_range: string | null;
  image_url: string | null;
  keywords?: any;
};

// Shape used in UI
type RestaurantCard = {
  id: string;
  name: string;
  cuisine: string;
  rating: string;
  ratingValue: number | null;
  image: any;
  keywords: string[];
  priceTier: string | null;
};

// Fallback local images by cuisine
const CUISINE_IMAGE_MAP: Record<string, any> = {
  Japanese: require('@/assets/images/tatami.png'),
  Lebanese: require('@/assets/images/arabica.png'),
  Italian: require('@/assets/images/tatami.png'),
  American: require('@/assets/images/arabica.png'),
  French: require('@/assets/images/arabica.png'),
  Mexican: require('@/assets/images/tatami.png'),
  Korean: require('@/assets/images/tatami.png'),
  Chinese: require('@/assets/images/arabica.png'),
  Indian: require('@/assets/images/tatami.png'),
  British: require('@/assets/images/arabica.png'),
};

const DEFAULT_IMAGE = require('@/assets/images/tatami.png');

function getFallbackImage(cuisine?: string | null) {
  if (!cuisine) return DEFAULT_IMAGE;
  return CUISINE_IMAGE_MAP[cuisine] ?? DEFAULT_IMAGE;
}

// Safely normalize whatever comes from Supabase into string[]
function normalizeKeywords(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((kw) => (typeof kw === 'string' ? kw.trim() : ''))
      .filter(Boolean);
  }
  if (typeof raw === 'string') {
    // e.g. "burger,american,fast_food"
    return raw
      .split(',')
      .map((kw) => kw.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizePriceRange(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed === '$' || trimmed === '$$') return trimmed;
  if (trimmed.startsWith('$$$')) {
    return '$$$+';
  }
  return trimmed;
}

export default function DiscoverScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { saved, toggleSave, toggleFavorite, isSaved } = useSavedList();
  const { user } = useAuth();
  const { filters } = useDiscoverFilters();

  // 🔖 Bookmark animation state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // 🔄 Card animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Restaurants from Supabase
  const [restaurants, setRestaurants] = useState<RestaurantCard[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [restaurantsError, setRestaurantsError] = useState<string | null>(null);

  // Reset bookmark when returning to Home
  useFocusEffect(
    useCallback(() => {
      setIsBookmarked(false);
    }, [])
  );

  const handleBookmarkPress = () => {
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

    setIsBookmarked(true);

    setTimeout(() => {
      router.push('/SavedList');
    }, 150);
  };

  // Fetch restaurants from Supabase once at mount
  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoadingRestaurants(true);
      setRestaurantsError(null);

      const { data, error } = await supabase
        .from('restaurants')
        // map "Keywords" column from DB to 'keywords'
        .select('id, name, cuisine, rating, price_range, image_url, keywords:Keywords')
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error fetching restaurants:', error);
        setRestaurantsError(error.message);
        setRestaurants([]);
      } else if (data) {
        const mapped: RestaurantCard[] = (data as RestaurantRow[]).map(
          (row) => ({
            id: row.id,
            name: row.name,
            cuisine: row.cuisine ?? 'Unknown',
            rating:
              typeof row.rating === 'number'
                ? row.rating.toFixed(1)
                : '0.0',
            ratingValue: typeof row.rating === 'number' ? row.rating : null,
            image: row.image_url
              ? { uri: row.image_url }
              : getFallbackImage(row.cuisine),
            keywords: normalizeKeywords((row as any).keywords),
            priceTier: normalizePriceRange(row.price_range),
          })
        );
        setRestaurants(mapped);
      }

      setLoadingRestaurants(false);
    };

    fetchRestaurants();
  }, []);

  // ============================
  // ✨ Recommendation + Filters
  // ============================
  const getPersonalizedRestaurants = (allRestaurants: RestaurantCard[]) => {
    if (!allRestaurants.length) return [];

    // 0) Apply filters first (cuisine + rating)
    let filtered = allRestaurants;

    // cuisines from Filter modal
    if (filters.categories.length > 0) {
      const cats = new Set(
        filters.categories.map((c) => c.toLowerCase().trim())
      );
      filtered = filtered.filter((rest) =>
        cats.has(rest.cuisine.toLowerCase().trim())
      );
    }

    // min rating from Filter modal
    if (filters.minRating != null) {
      filtered = filtered.filter((rest) => {
        const ratingValue =
          rest.ratingValue ??
          (rest.rating ? parseFloat(rest.rating) : null);
        return ratingValue != null && ratingValue >= filters.minRating!;
      });
    }

    // price tier from Filter modal
    if (filters.priceTier) {
      filtered = filtered.filter(
        (rest) => rest.priceTier === filters.priceTier
      );
    }

    if (!filtered.length) return [];

    const favoriteCuisines = user?.preferences?.favoriteCuisines ?? [];

    // 1) Liked/saved restaurants inside the filtered set
    const likedRestaurants = filtered.filter((r) => isSaved(r.id));

    // 2) Keyword score map from liked restaurants
    const keywordScores: Record<string, number> = {};

    likedRestaurants.forEach((rest) => {
      (rest.keywords ?? []).forEach((kw) => {
        const key = kw.toLowerCase().trim();
        if (!key) return;
        keywordScores[key] = (keywordScores[key] ?? 0) + 1;
      });
    });

    // 3) Score each restaurant in the filtered set
    const scored = filtered.map((rest) => {
      let score = 0;

      // (a) If user has favorite cuisines, boost them
      if (
        favoriteCuisines.length > 0 &&
        favoriteCuisines.includes(rest.cuisine)
      ) {
        score += 3;
      }

      // (b) Keyword overlap with liked restaurants
      const restKeywords = rest.keywords ?? [];
      restKeywords.forEach((kw) => {
        const key = kw.toLowerCase().trim();
        if (!key) return;
        if (keywordScores[key]) {
          score += keywordScores[key];
        }
      });

      // (c) Small boost if already saved (feels familiar)
      if (isSaved(rest.id)) {
        score += 1;
      }

      // (d) Tiny boost for higher rating
      const ratingValue =
        rest.ratingValue ?? (rest.rating ? parseFloat(rest.rating) : null);
      if (ratingValue != null && !Number.isNaN(ratingValue)) {
        score += ratingValue * 0.1;
      }

      return { rest, score };
    });

    // 4) Sort: score desc, then rating desc, then name
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ratingDiff =
        parseFloat(b.rest.rating) - parseFloat(a.rest.rating);
      if (ratingDiff !== 0) return ratingDiff;
      return a.rest.name.localeCompare(b.rest.name);
    });

    return scored.map((s) => s.rest);
  };

  const personalizedRestaurants = getPersonalizedRestaurants(restaurants);

  // ============================
  // UI states
  // ============================

  if (loadingRestaurants) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color="#e65332" />
        <Text style={{ marginTop: 10 }}>Loading restaurants...</Text>
      </View>
    );
  }

  if (restaurantsError) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          },
        ]}
      >
        <Text style={{ textAlign: 'center', marginBottom: 8 }}>
          Failed to load restaurants.
        </Text>
        <Text style={{ textAlign: 'center', color: '#888' }}>
          {restaurantsError}
        </Text>
      </View>
    );
  }

  if (!personalizedRestaurants || personalizedRestaurants.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Text>No restaurants available for these filters yet.</Text>
      </View>
    );
  }

  // Loop through restaurants (Tinder-style)
  const currentRestaurant =
    personalizedRestaurants[
      currentIndex % personalizedRestaurants.length
    ];

  const handleNextCard = () => {
    translateX.setValue(0);
    opacity.setValue(1);
    setCurrentIndex(
      (prev) => (prev + 1) % personalizedRestaurants.length
    );
  };

  const animateSwipe = (direction: 'left' | 'right') => {
    const toValue = direction === 'left' ? -400 : 400;

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

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.searchContainer}
          onPress={() => router.push('/Search')}
        >
          <Ionicons
            name="search"
            size={20}
            color="#888"
            style={{ marginRight: 5 }}
          />
          <Text style={{ color: '#888', fontSize: 16 }}>
            Search restaurants...
          </Text>
        </TouchableOpacity>

        <View style={styles.topIcons}>
          {/* Bookmark icon */}
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
        ]}
      >
        <Image source={currentRestaurant.image} style={styles.cardImage} />
        <Text style={styles.cardTitle}>{currentRestaurant.name}</Text>
        <Text style={styles.cardSubtitle}>
          {currentRestaurant.cuisine}
          {currentRestaurant.priceTier ? ` • ${currentRestaurant.priceTier}` : ''} | Rating{' '}
          {currentRestaurant.rating}
        </Text>

        {/* Dietary restriction badges from user preferences */}
        {user?.preferences?.dietaryRestrictions &&
          user.preferences.dietaryRestrictions.length > 0 && (
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
          onPress={() => animateSwipe('left')}
        >
          <Ionicons name="close" size={34} color="#ff4d4d" />
        </TouchableOpacity>

        {/* Star (Blue) */}
        <TouchableOpacity
          style={[styles.circleButton, { borderColor: '#007AFF' }]}
          onPress={() => {
            toggleSave(currentRestaurant);
            toggleFavorite(currentRestaurant.id);
            animateSwipe('right');
          }}
        >
          <Ionicons name="star" size={30} color="#007AFF" />
        </TouchableOpacity>

        {/* Save (Green Heart) */}
        <TouchableOpacity
          style={[styles.circleButton, { borderColor: '#34C759' }]}
          onPress={() => {
            toggleSave(currentRestaurant);
            animateSwipe('right');
          }}
        >
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