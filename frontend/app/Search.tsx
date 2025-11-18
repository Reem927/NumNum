import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  ScrollView,
} from 'react-native';

type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  rating: string;
  image: any;
};

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [randomSuggestions, setRandomSuggestions] = useState<string[]>([]);

  const restaurants = useMemo<Restaurant[]>(
    () => [
      { id: '1', name: 'Tatami', cuisine: 'Japanese', rating: '4.8', image: require('@/assets/images/tatami.png') },
      { id: '2', name: 'Arabica', cuisine: 'Cafe', rating: '4.6', image: require('@/assets/images/arabica.png') },
      { id: '3', name: 'Solo Eatery', cuisine: 'Italian', rating: '4.5', image: require('@/assets/images/tatami.png') },
      { id: '4', name: 'Burger Bros', cuisine: 'American', rating: '4.2', image: require('@/assets/images/arabica.png') },
      { id: '5', name: 'Sakura', cuisine: 'Japanese', rating: '4.9', image: require('@/assets/images/tatami.png') },
      { id: '6', name: 'La Table', cuisine: 'French', rating: '4.4', image: require('@/assets/images/arabica.png') },
      { id: '7', name: 'Casa Verde', cuisine: 'Mexican', rating: '4.3', image: require('@/assets/images/tatami.png') },
      { id: '8', name: 'Byblos', cuisine: 'Lebanese', rating: '4.7', image: require('@/assets/images/arabica.png') },
      { id: '9', name: 'K-Town Grill', cuisine: 'Korean', rating: '4.6', image: require('@/assets/images/tatami.png') },
      { id: '10', name: 'Dragon Wok', cuisine: 'Chinese', rating: '4.5', image: require('@/assets/images/arabica.png') },
    ],
    []
  );

  const cuisines = useMemo(
    () => [
      { name: 'Kuwaiti', emoji: '🇰🇼' },
      { name: 'Indian', emoji: '🍛' },
      { name: 'British', emoji: '🥧' },
      { name: 'Lebanese', emoji: '🥙' },
      { name: 'Japanese', emoji: '🍣' },
      { name: 'Chinese', emoji: '🥡' },
      { name: 'Italian', emoji: '🍝' },
      { name: 'Korean', emoji: '🍜' },
      { name: 'French', emoji: '🥐' },
      { name: 'Mexican', emoji: '🌮' },
    ],
    []
  );

  // 🌀 Randomize 3 cuisines on mount
  useEffect(() => {
    const shuffled = cuisines
      .map((c) => c.name)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    setRandomSuggestions(shuffled);
  }, [cuisines]);

  // 🔍 Filter restaurants
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = restaurants.filter(
        (restaurant) =>
          restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRestaurants(filtered);
    } else {
      setFilteredRestaurants([]);
    }
  }, [restaurants, searchQuery]);

  // 🧠 Add query to recents
  const addToRecents = (query: string) => {
    const clean = query.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const updated = [clean, ...prev.filter((q) => q !== clean)].slice(0, 5); // keep 5 max
      return updated;
    });
  };

  // 🔍 Handle search submission
  const handleSearchSubmit = (query?: string) => {
    const activeQuery = query?.trim() || searchQuery.trim();
    if (!activeQuery) return;
    addToRecents(activeQuery);
    setSearchQuery(activeQuery);
    Keyboard.dismiss();
  };

  // 🖱️ Handle category or suggestion click
  const handleCategorySearch = (category: string) => {
    setSearchQuery(category);
    addToRecents(category);
  };

  // 🍣 Handle restaurant click
  const handleRestaurantClick = (name: string) => {
    addToRecents(name);
    setSearchQuery(''); // ✅ Clear input after clicking
    Keyboard.dismiss();
    // router.push(`/restaurant/${id}`) — optional navigation if you add details
  };

  // 🧾 Render a restaurant
  const renderRestaurantItem = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={styles.restaurantItem}
      onPress={() => handleRestaurantClick(item.name)}
    >
      <Image source={item.image} style={styles.restaurantImage} />
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{item.name}</Text>
        <Text style={styles.restaurantCuisine}>
          {item.cuisine} • Rating {item.rating}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={(e) => handleSearchSubmit(e.nativeEvent.text)} // ✅ Pass actual text
          returnKeyType="search"
          autoFocus
          placeholderTextColor="#888"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {searchQuery.length === 0 ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Suggested + Recents */}
          {(randomSuggestions.length > 0 || recentSearches.length > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent searches</Text>
              <View style={styles.recentSearches}>
                {[...randomSuggestions, ...recentSearches].map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.recentSearchItem}
                    onPress={() => handleCategorySearch(search)}
                  >
                    <Ionicons name="time-outline" size={16} color="#888" />
                    <Text style={styles.recentSearchText}>{search}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Category List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            {cuisines.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={styles.categoryRow}
                onPress={() => handleCategorySearch(category.name)}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={styles.categoryText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.resultsContainer}>
          {filteredRestaurants.length > 0 ? (
            <>
              <Text style={styles.resultsTitle}>
                {filteredRestaurants.length} result
                {filteredRestaurants.length !== 1 ? 's' : ''} for {'"'}
                {searchQuery}
                {'"'}
              </Text>
              <FlatList
                data={filteredRestaurants}
                keyExtractor={(item) => item.id}
                renderItem={renderRestaurantItem}
                showsVerticalScrollIndicator={false}
              />
            </>
          ) : (
            <Text style={styles.noResultsText}>
              No restaurants found for {'"'}
              {searchQuery}
              {'"'}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#000' },
  content: { flex: 1, paddingHorizontal: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#000', marginBottom: 15 },
  recentSearches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recentSearchText: { marginLeft: 6, fontSize: 14, color: '#666' },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryEmoji: { fontSize: 28, marginRight: 16 },
  categoryText: { fontSize: 16, color: '#000', fontWeight: '500' },
  resultsContainer: { flex: 1, paddingHorizontal: 20 },
  resultsTitle: { fontSize: 16, color: '#666', marginBottom: 15 },
  noResultsText: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 40 },
  restaurantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  restaurantImage: { width: 60, height: 60, borderRadius: 8, marginRight: 15 },
  restaurantInfo: { flex: 1 },
  restaurantName: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 },
  restaurantCuisine: { fontSize: 14, color: '#666' },
});








