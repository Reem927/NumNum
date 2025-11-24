// frontend/app/Filters.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  useDiscoverFilters,
  DiscoverFilters,
} from '@/context/DiscoverFilterContext';

const CATEGORIES = [
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

const PRICE_OPTIONS = ['$', '$$', '$$$+'];

export default function FiltersModal() {
  const router = useRouter();
  const { filters, setFilters, resetFilters } = useDiscoverFilters();

  // local UI state mirrors context
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [distance, setDistance] = useState(2);
  const [selectedRating, setSelectedRating] = useState<number[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string[]>([]);

  // hydrate from current filters when opening screen
  useEffect(() => {
    setSelectedCategory(filters.categories ?? []);
    setSelectedRating(filters.minRating ? [filters.minRating] : []);
    setSelectedPrice(filters.priceTier ? [filters.priceTier] : []);
    // distance not yet stored in DB – keep default 2km for now
  }, [filters]);

  const toggleCategory = (cat: string) => {
    setSelectedCategory((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleRating = (rating: number) => {
    setSelectedRating((prev) =>
      prev.includes(rating) ? prev.filter((r) => r !== rating) : [rating]
    );
  };

  const togglePrice = (price: string) => {
    setSelectedPrice((prev) =>
      prev.includes(price) ? [] : [price]
    );
  };

  const handleReset = () => {
    setSelectedCategory([]);
    setDistance(2);
    setSelectedRating([]);
    setSelectedPrice([]);
    resetFilters();
  };

  const handleApply = () => {
    const nextFilters: DiscoverFilters = {
      categories: selectedCategory,
      minRating: selectedRating.length ? Math.max(...selectedRating) : null,
      priceTier: selectedPrice.length ? selectedPrice[0] : null,
    };

    setFilters(nextFilters);
    router.back(); // close modal and go back to Discover
  };

  return (
    <View style={styles.container}>
      <View style={styles.handle} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconWrapper}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Filter</Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.reset}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoryContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                selectedCategory.includes(cat) && styles.categorySelected,
              ]}
              onPress={() => toggleCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory.includes(cat) && styles.categoryTextSelected,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Distance (UI only for now) */}
        <Text style={styles.sectionTitle}>Distance to me</Text>
        <View style={styles.distanceRow}>
          <TouchableOpacity
            style={styles.distanceButton}
            onPress={() => setDistance((d) => Math.max(1, d - 1))}
          >
            <Text style={styles.distanceButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.distanceValue}>{distance} km</Text>
          <TouchableOpacity
            style={styles.distanceButton}
            onPress={() => setDistance((d) => d + 1)}
          >
            <Text style={styles.distanceButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Rating */}
        <Text style={styles.sectionTitle}>Rating</Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              style={[
                styles.ratingButton,
                selectedRating.includes(star) && styles.ratingSelected,
              ]}
              onPress={() => toggleRating(star)}
            >
              <Text
                style={[
                  styles.ratingText,
                  selectedRating.includes(star) && styles.ratingTextSelected,
                ]}
              >
                {star} ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Price */}
        <Text style={styles.sectionTitle}>Price</Text>
        <View style={styles.priceRow}>
          {PRICE_OPTIONS.map((price) => (
            <TouchableOpacity
              key={price}
              style={[
                styles.priceButton,
                selectedPrice.includes(price) && styles.priceSelected,
              ]}
              onPress={() => togglePrice(price)}
            >
              <Text
                style={[
                  styles.priceText,
                  selectedPrice.includes(price) && styles.priceTextSelected,
                ]}
              >
                {price}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Apply */}
        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyText}>Show Results</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// 🎨 styles (same as before, just kept for completeness)
const styles = StyleSheet.create({
  handle: {
    width: 50,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  iconWrapper: {
    padding: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  reset: {
    color: '#e65332',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categorySelected: {
    backgroundColor: '#e65332',
    borderColor: '#e65332',
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  distanceButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceButtonText: {
    fontSize: 18,
  },
  distanceValue: {
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ratingButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ratingSelected: {
    backgroundColor: '#e65332',
    borderColor: '#e65332',
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
  },
  ratingTextSelected: {
    color: '#fff',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  priceButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  priceSelected: {
    backgroundColor: '#e65332',
    borderColor: '#e65332',
  },
  priceText: {
    fontSize: 14,
    color: '#333',
  },
  priceTextSelected: {
    color: '#fff',
  },
  applyButton: {
    marginTop: 30,
    backgroundColor: '#e65332',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});