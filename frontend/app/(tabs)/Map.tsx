import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

type ReviewPreview = {
  postId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string | null;
  rating: number | null;
  createdAt: string;
  snippet: string;
};

type FollowedReviewPin = {
  restaurantId: string;
  name: string;
  cuisine: string | null;
  latitude: number;
  longitude: number;
  restaurantRating: number | null;
  priceTier: string | null;
  reviews: ReviewPreview[];
};

const DEFAULT_REGION: Region = {
  latitude: 29.3759,
  longitude: 47.9774,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
};

const USE_MOCK_PINS = true;

const MOCK_PINS: FollowedReviewPin[] = [
  {
    restaurantId: 'mock-001',
    name: 'Arabica',
    cuisine: 'Lebanese',
    latitude: 29.379,
    longitude: 47.991,
    restaurantRating: 4.6,
    priceTier: '$$',
    reviews: [
      {
        postId: 'mock-review-1',
        reviewerId: 'mock-user-1',
        reviewerName: 'Layla',
        reviewerAvatar: null,
        rating: 4.5,
        createdAt: new Date().toISOString(),
        snippet: 'Amazing mezze and coffee—must try!',
      },
      {
        postId: 'mock-review-2',
        reviewerId: 'mock-user-2',
        reviewerName: 'Omar',
        reviewerAvatar: null,
        rating: 4.8,
        createdAt: new Date().toISOString(),
        snippet: 'Great family vibe on the weekend.',
      },
    ],
  },
  {
    restaurantId: 'mock-002',
    name: 'Sakura',
    cuisine: 'Japanese',
    latitude: 29.347,
    longitude: 48.036,
    restaurantRating: 4.9,
    priceTier: '$$$+',
    reviews: [
      {
        postId: 'mock-review-3',
        reviewerId: 'mock-user-3',
        reviewerName: 'Ruthvik',
        reviewerAvatar: null,
        rating: 5,
        createdAt: new Date().toISOString(),
        snippet: 'Best omakase in Kuwait City.',
      },
    ],
  },
  {
    restaurantId: 'mock-003',
    name: 'Burger Bros',
    cuisine: 'American',
    latitude: 29.33,
    longitude: 47.95,
    restaurantRating: 4.2,
    priceTier: '$',
    reviews: [
      {
        postId: 'mock-review-4',
        reviewerId: 'mock-user-4',
        reviewerName: 'Sara',
        reviewerAvatar: null,
        rating: 4.1,
        createdAt: new Date().toISOString(),
        snippet: 'Juicy patties and crispy fries!',
      },
    ],
  },
];

const CUISINE_OPTIONS = [
  'Kuwaiti',
  'Indian',
  'British',
  'Lebanese',
  'Japanese',
  'Chinese',
  'Italian',
  'Korean',
  'French',
  'Mexican',
];

const MAP_HEIGHT = Dimensions.get('window').height;

export default function FollowedReviewsMapScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [pins, setPins] = useState<FollowedReviewPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [selectedPin, setSelectedPin] = useState<FollowedReviewPin | null>(null);
  const [emptyState, setEmptyState] = useState<'noFollows' | 'noReviews' | null>(
    null
  );

  const loadPins = useCallback(async () => {
    if (USE_MOCK_PINS) {
      setPins(MOCK_PINS);
      setSelectedPin(MOCK_PINS[0]);
      setLoading(false);
      setEmptyState(null);
      setError(null);
      return;
    }

    if (!user?.id) {
      setPins([]);
      setLoading(false);
      setEmptyState(null);
      return;
    }

    setLoading(true);
    setError(null);
    setEmptyState(null);

    try {
      const { data: followRows, error: followError } = await supabase
        .from('follows')
        .select('followee_id')
        .eq('follower_id', user.id)
        .eq('status', 'accepted');

      if (followError) throw followError;

      const followedIds =
        followRows?.map((row) => row.followee_id).filter(Boolean) ?? [];

      if (!followedIds.length) {
        setPins([]);
        setSelectedPin(null);
        setEmptyState('noFollows');
        return;
      }

      const { data: reviewRows, error: reviewError } = await supabase
        .from('posts')
        .select(
          `
          id,
          user_id,
          content,
          rating,
          created_at,
          restaurant_id,
          restaurants:restaurant_id (
            id,
            name,
            cuisine,
            latitude,
            longitude,
            rating,
            price_range
          )
        `
        )
        .eq('type', 'review')
        .in('user_id', followedIds)
        .not('restaurant_id', 'is', null)
        .order('created_at', { ascending: false });

      if (reviewError) throw reviewError;

      if (!reviewRows?.length) {
        setPins([]);
        setSelectedPin(null);
        setEmptyState('noReviews');
        return;
      }

      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', followedIds);

      const profileMap = new Map(
        (profileRows ?? []).map((profile) => [profile.id, profile])
      );

      const grouped = new Map<string, FollowedReviewPin>();

      reviewRows.forEach((row: any) => {
        const restaurant = row.restaurants;
        if (!restaurant) return;

        const latitude = parseCoordinate(restaurant.latitude);
        const longitude = parseCoordinate(restaurant.longitude);
        if (latitude == null || longitude == null) return;

        const restaurantId: string | undefined = restaurant.id;
        if (!restaurantId) return;

        if (!grouped.has(restaurantId)) {
          grouped.set(restaurantId, {
            restaurantId,
            name: restaurant.name ?? 'Unknown spot',
            cuisine: restaurant.cuisine ?? null,
            latitude,
            longitude,
            restaurantRating:
              typeof restaurant.rating === 'number' ? restaurant.rating : null,
            priceTier: normalizePriceTier(restaurant.price_range),
            reviews: [],
          });
        }

        const pin = grouped.get(restaurantId)!;

        const profile = profileMap.get(row.user_id);
        const reviewerName =
          profile?.display_name || profile?.username || 'Foodie';

        pin.reviews.push({
          postId: row.id,
          reviewerId: row.user_id,
          reviewerName,
          reviewerAvatar: profile?.avatar_url ?? null,
          rating: typeof row.rating === 'number' ? row.rating : null,
          createdAt: row.created_at,
          snippet: createSnippet(row.content),
        });
      });

      const hydratedPins = Array.from(grouped.values())
        .map((pin) => ({
          ...pin,
          reviews: [...pin.reviews].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
        }))
        .sort(
          (a, b) =>
            new Date(b.reviews[0]?.createdAt ?? 0).getTime() -
            new Date(a.reviews[0]?.createdAt ?? 0).getTime()
        );

      setPins(hydratedPins);
      setSelectedPin((prev) => {
        if (!prev) return null;
        return hydratedPins.find((pin) => pin.restaurantId === prev.restaurantId) ?? null;
      });
    } catch (err: any) {
      console.error('Failed to load map pins', err);
      setError(err.message || 'Unable to load map');
      setPins([]);
      setSelectedPin(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadPins();
    }, [loadPins])
  );

  const cuisineFilteredPins = useMemo(() => {
    if (!selectedCuisines.length) return pins;
    const selected = new Set(selectedCuisines.map((c) => c.toLowerCase()));
    return pins.filter((pin) => {
      if (!pin.cuisine) return false;
      return selected.has(pin.cuisine.toLowerCase());
    });
  }, [pins, selectedCuisines]);

  const pinsInRegion = useMemo(() => {
    if (!region) return cuisineFilteredPins;
    const latDelta = region.latitudeDelta / 2;
    const lonDelta = region.longitudeDelta / 2;
    const minLat = region.latitude - latDelta;
    const maxLat = region.latitude + latDelta;
    const minLon = region.longitude - lonDelta;
    const maxLon = region.longitude + lonDelta;

    return cuisineFilteredPins.filter(
      (pin) =>
        pin.latitude >= minLat &&
        pin.latitude <= maxLat &&
        pin.longitude >= minLon &&
        pin.longitude <= maxLon
    );
  }, [cuisineFilteredPins, region]);

  const showFilterEmpty =
    !loading &&
    pins.length > 0 &&
    selectedCuisines.length > 0 &&
    cuisineFilteredPins.length === 0;

  const clearSelection = useCallback(() => setSelectedPin(null), []);

  usePinSelectionGuard(selectedPin, cuisineFilteredPins, clearSelection);

  const resetFilters = () => setSelectedCuisines([]);

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((item) => item !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleRegionChange = (nextRegion: Region) => {
    setRegion(nextRegion);
  };

  const handlePinPress = (pin: FollowedReviewPin) => {
    setSelectedPin(pin);
  };

  const handleOpenReview = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  if (!user) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageTitle}>Sign in to view the map</Text>
        <Text style={styles.messageBody}>
          Log in to discover restaurants reviewed by people you follow.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/auth/Login')}
        >
          <Text style={styles.primaryButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={DEFAULT_REGION}
        onRegionChangeComplete={handleRegionChange}
      >
        {pinsInRegion.map((pin) => (
          <Marker
            key={pin.restaurantId}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            pinColor="#e65332"
            onPress={() => handlePinPress(pin)}
          >
            <View style={styles.markerDot}>
              <Text style={styles.markerDotText}>
                {pin.reviews.length > 1 ? pin.reviews.length : ''}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          <TouchableOpacity
            style={[
              styles.chip,
              selectedCuisines.length === 0 && styles.chipSelected,
            ]}
            onPress={resetFilters}
          >
            <Ionicons name="refresh" size={14} color="#fff" />
            <Text style={[styles.chipText, { color: '#fff' }]}>All cuisines</Text>
          </TouchableOpacity>
          {CUISINE_OPTIONS.map((cuisine) => {
            const isActive = selectedCuisines.includes(cuisine);
            return (
              <TouchableOpacity
                key={cuisine}
                style={[styles.chip, isActive && styles.chipSelected]}
                onPress={() => toggleCuisine(cuisine)}
              >
                <Text
                  style={[
                    styles.chipText,
                    isActive && styles.chipTextSelected,
                  ]}
                >
                  {cuisine}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#e65332" />
          <Text style={styles.loadingText}>Finding spots from your network…</Text>
        </View>
      )}

      {error && (
        <View style={styles.messageCard}>
          <Text style={styles.messageTitle}>Couldn’t load pins</Text>
          <Text style={styles.messageBody}>{error}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={loadPins}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && emptyState === 'noFollows' && (
        <View style={styles.messageCard}>
          <Text style={styles.messageTitle}>Follow foodies to get started</Text>
          <Text style={styles.messageBody}>
            Your map highlights restaurants reviewed by people you follow. Head to
            your profile to start following tastemakers.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/Profile')}
          >
            <Text style={styles.primaryButtonText}>Find people to follow</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && emptyState === 'noReviews' && (
        <View style={styles.messageCard}>
          <Text style={styles.messageTitle}>No reviews yet</Text>
          <Text style={styles.messageBody}>
            People you follow haven’t shared reviews with locations yet. Check
            back soon!
          </Text>
        </View>
      )}

      {showFilterEmpty && (
        <View style={styles.messageCard}>
          <Text style={styles.messageTitle}>No matches for these cuisines</Text>
          <Text style={styles.messageBody}>
            None of your followed reviews match those cuisines. Reset filters to
            see everything again.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={resetFilters}>
            <Text style={styles.primaryButtonText}>Reset filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedPin && (
        <View style={[styles.detailCard, { bottom: Math.max(24, MAP_HEIGHT * 0.08) }]}>
          <View style={styles.detailHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailTitle}>{selectedPin.name}</Text>
              <Text style={styles.detailSubtitle}>
                {selectedPin.cuisine ?? 'Various'}{' '}
                {selectedPin.priceTier ? `• ${selectedPin.priceTier}` : ''}{' '}
                {selectedPin.restaurantRating
                  ? `• ★ ${selectedPin.restaurantRating.toFixed(1)}`
                  : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={clearSelection}>
              <Ionicons name='close-circle' size={22} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.reviewChips}>
            {selectedPin.reviews.slice(0, 3).map((review) => (
              <View key={review.postId} style={styles.reviewChip}>
                <Ionicons name="person-circle" size={18} color="#e65332" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                  <Text style={styles.reviewerMeta}>
                    {review.rating ? `${review.rating.toFixed(1)} ★ · ` : ''}
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
            {selectedPin.reviews.length > 3 && (
              <Text style={styles.moreReviewsText}>
                +{selectedPin.reviews.length - 3} more reviews
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleOpenReview(selectedPin.reviews[0].postId)}
          >
            <Text style={styles.primaryButtonText}>Open latest review</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function usePinSelectionGuard(
  selectedPin: FollowedReviewPin | null,
  cuisineFilteredPins: FollowedReviewPin[],
  onClear: () => void
) {
  useEffect(() => {
    if (!selectedPin) return;
    const stillVisible = cuisineFilteredPins.some(
      (pin) => pin.restaurantId === selectedPin.restaurantId
    );
    if (!stillVisible) {
      onClear();
    }
  }, [cuisineFilteredPins, onClear, selectedPin]);
}

function parseCoordinate(value: any): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function normalizePriceTier(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed === '$' || trimmed === '$$') return trimmed;
  if (trimmed.startsWith('$$$')) return '$$$+';
  return trimmed;
}

function createSnippet(content?: string | null): string {
  if (!content) return 'Tap to read the full review.';
  const trimmed = content.trim();
  if (trimmed.length <= 90) return trimmed;
  return `${trimmed.slice(0, 90)}…`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  filterBar: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
  },
  chip: {
    marginRight: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipSelected: {
    backgroundColor: '#e65332',
    borderColor: '#e65332',
  },
  chipText: {
    fontSize: 14,
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  loadingText: {
    marginTop: 12,
    color: '#555',
  },
  messageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  messageCard: {
    position: 'absolute',
    top: '30%',
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#111',
  },
  messageBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: '#e65332',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  markerDot: {
    minWidth: 32,
    minHeight: 32,
    borderRadius: 16,
    backgroundColor: '#e65332',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  markerDotText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  detailCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  detailSubtitle: {
    marginTop: 4,
    color: '#666',
    fontSize: 13,
  },
  reviewChips: {
    gap: 8,
    marginBottom: 12,
  },
  reviewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  reviewerMeta: {
    fontSize: 12,
    color: '#777',
  },
  moreReviewsText: {
    fontSize: 12,
    color: '#777',
  },
});