import { useSavedList } from '@/context/SavedListContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FilterSavedList from './FilterSavedList';

export default function SavedList() {
  const router = useRouter();
  const { saved, toggleSave, toggleFavorite } = useSavedList();
  const [menuVisible, setMenuVisible] = useState(false);
  const [sortedList, setSortedList] = useState(saved);
  const [alphabeticalSort, setAlphabeticalSort] = useState<'asc' | 'desc' | null>(null);
  const [dateSort, setDateSort] = useState<'newest' | 'oldest' | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    applySorts();
  }, [saved, alphabeticalSort, dateSort, favoritesOnly, searchQuery]);

  const applySorts = () => {
    let result = [...saved];

    // Search
    if (searchQuery.trim()) {
      result = result.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Favorites filter
    if (favoritesOnly) {
      result = result.filter((item) => item.isFavorite);
    }

    // Sorting - handle multiple sorting criteria
    result.sort((a, b) => {
      let comparison = 0;

      // First priority: Alphabetical sorting (if enabled)
      if (alphabeticalSort) {
        comparison =
          alphabeticalSort === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
      }

      // If alphabetical comparison is equal (or not used), use date sorting
      if (comparison === 0 && dateSort) {
        const dateA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
        const dateB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
        comparison = dateSort === 'newest' ? dateB - dateA : dateA - dateB;
      }

      return comparison;
    });

    setSortedList(result);
  };

  const handleAlphabeticalSort = (sort: 'asc' | 'desc' | null) => {
    setAlphabeticalSort(sort);
    setMenuVisible(false);
  };

  const handleDateSort = (sort: 'newest' | 'oldest' | null) => {
    setDateSort(sort);
    setMenuVisible(false);
  };

  const toggleFavorites = () => {
    setFavoritesOnly((prev) => !prev);
    setMenuVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="black" />
        </TouchableOpacity>

        <Text style={styles.title}>Saved List</Text>

        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="ellipsis-vertical" size={22} color="black" />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <FilterSavedList
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        alphabeticalSort={alphabeticalSort}
        dateSort={dateSort}
        favoritesOnly={favoritesOnly}
        onAlphabeticalSort={handleAlphabeticalSort}
        onDateSort={handleDateSort}
        onToggleFavorites={toggleFavorites}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#888"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Empty State */}
      {saved.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No saved restaurants yet 😢</Text>
        </View>
      ) : (
        <FlatList
          style={styles.list} // 👈 make list fill remaining space
          contentContainerStyle={styles.listContent} // padding at bottom
          data={sortedList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={item.image} style={styles.image} />
              <View style={styles.infoContainer}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.details}>
                  {item.cuisine} | Rating {item.rating}
                </Text>
                {item.addedAt && (
                  <Text style={styles.addedDate}>
                    Added on {new Date(item.addedAt).toLocaleDateString()}
                  </Text>
                )}
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={() => toggleFavorite(item.id)}
                >
                  <Ionicons
                    name={item.isFavorite ? 'star' : 'star-outline'}
                    size={24}
                    color="#FFA500"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => toggleSave(item)}
                >
                  <Ionicons name="trash-outline" size={24} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // important for FlatList height
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    marginVertical: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#333' },
  list: {
    flex: 1, // 👈 makes the list scrollable
  },
  listContent: {
    paddingBottom: 40, // so last item isn't hidden behind tab bar
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 15,
    padding: 10,
  },
  image: { width: 80, height: 80, borderRadius: 10, marginRight: 15 },
  infoContainer: { flex: 1 },
  name: { fontWeight: 'bold', fontSize: 16 },
  details: { color: '#666', fontSize: 14 },
  addedDate: { color: '#999', fontSize: 12, marginTop: 4 },
  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  favoriteButton: { padding: 8, marginRight: 8 },
  removeButton: { padding: 8 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 260,
  },
  emptyText: { fontSize: 16, color: '#888' },
});
