import { useSavedList } from '@/context/SavedListContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import { Animated } from 'react-native';


export default function SavedList() {
  const router = useRouter();
  const { saved, toggleSave, toggleFavorite, isFavorited } = useSavedList();
  const [menuVisible, setMenuVisible] = useState(false);
  const [sortedList, setSortedList] = useState(saved);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeSort, setActiveSort] = useState<'newest' | 'oldest'>('newest');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    applySorts();
  }, [saved, sortOrder, activeSort, favoritesOnly, searchQuery]);

  const applySorts = () => {
    let result = [...saved];

    // Search
    if (searchQuery.trim()) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Favorites
    if (favoritesOnly) {
      result = result.filter(item => item.isFavorited);
    }

    // Sorting
    result.sort((a, b) => {
      const nameComparison =
        sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);

      if (nameComparison === 0) {
        const dateA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
        const dateB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
        return activeSort === 'newest' ? dateB - dateA : dateA - dateB;
      }

      return nameComparison;
    });

    setSortedList(result);
  };

  const toggleAlphabetSort = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    setMenuVisible(false);
  };

  const toggleFavorites = () => {
    setFavoritesOnly(prev => !prev);
    setMenuVisible(false);
  };

  const toggleDateSort = () => {
    setActiveSort(prev => (prev === 'newest' ? 'oldest' : 'newest'));
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

        <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)}>
          <Ionicons name="ellipsis-vertical" size={22} color="black" />
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu */}
      {menuVisible && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity onPress={toggleAlphabetSort}>
            <View style={styles.dropdownItemContainer}>
              <Ionicons
                name={sortOrder === 'asc' ? 'arrow-down-outline' : 'arrow-up-outline'}
                size={18}
                color="#555"
              />
              <Text style={styles.dropdownItem}>
                {sortOrder === 'asc' ? 'Sort A–Z' : 'Sort Z–A'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleDateSort}>
            <View style={styles.dropdownItemContainer}>
              <Ionicons
                name={activeSort === 'newest' ? 'time-outline' : 'refresh-outline'}
                size={18}
                color="#555"
              />
              <Text style={styles.dropdownItem}>
                {activeSort === 'newest' ? 'Newest First' : 'Oldest First'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleFavorites}>
            <View style={styles.dropdownItemContainer}>
              <Ionicons
                name={favoritesOnly ? 'star' : 'star-outline'}
                size={18}
                color="#FFA500"
              />
              <Text style={styles.dropdownItem}>Favorites Only</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

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

      {/* Empty state (keeps structure) */}
      {saved.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No saved restaurants yet 😢</Text>
        </View>
      ) : (
        <FlatList
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
                    name={isFavorited(item.id) ? 'star' : 'star-outline'}
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
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  dropdownMenu: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    width: 180,
    zIndex: 20,
  },
  dropdownItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  dropdownItem: { marginLeft: 10, fontSize: 15, color: '#333' },
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
    justifyContent: 'flex-start', // move alignment to top
    marginTop: 260, // adjust this value until it looks perfect
  },
  emptyText: { fontSize: 16, color: '#888' },
});
