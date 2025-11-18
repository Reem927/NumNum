import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FilterSavedListProps = {
  visible: boolean;
  onClose: () => void;
  alphabeticalSort: 'asc' | 'desc' | null;
  dateSort: 'newest' | 'oldest' | null;
  favoritesOnly: boolean;
  onAlphabeticalSort: (sort: 'asc' | 'desc' | null) => void;
  onDateSort: (sort: 'newest' | 'oldest' | null) => void;
  onToggleFavorites: () => void;
};

export default function FilterSavedList({
  visible,
  onClose,
  alphabeticalSort,
  dateSort,
  favoritesOnly,
  onAlphabeticalSort,
  onDateSort,
  onToggleFavorites,
}: FilterSavedListProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Sort & Filter</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Section: Alphabetical */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Filter by alphabetic order</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  alphabeticalSort === 'asc' && styles.optionButtonActive,
                ]}
                onPress={() => onAlphabeticalSort(alphabeticalSort === 'asc' ? null : 'asc')}
              >
                <Text
                  style={[
                    styles.optionText,
                    alphabeticalSort === 'asc' && styles.optionTextActive,
                  ]}
                >
                  A–Z
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  alphabeticalSort === 'desc' && styles.optionButtonActive,
                ]}
                onPress={() => onAlphabeticalSort(alphabeticalSort === 'desc' ? null : 'desc')}
              >
                <Text
                  style={[
                    styles.optionText,
                    alphabeticalSort === 'desc' && styles.optionTextActive,
                  ]}
                >
                  Z–A
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Date */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Filter by date</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  dateSort === 'newest' && styles.optionButtonActive,
                ]}
                onPress={() => onDateSort(dateSort === 'newest' ? null : 'newest')}
              >
                <Text
                  style={[
                    styles.optionText,
                    dateSort === 'newest' && styles.optionTextActive,
                  ]}
                >
                  Newest First
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  dateSort === 'oldest' && styles.optionButtonActive,
                ]}
                onPress={() => onDateSort(dateSort === 'oldest' ? null : 'oldest')}
              >
                <Text
                  style={[
                    styles.optionText,
                    dateSort === 'oldest' && styles.optionTextActive,
                  ]}
                >
                  Oldest First
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Favorites */}
          <View style={[styles.section, { borderBottomWidth: 0 }]}>
            <Text style={styles.sectionTitle}>Filter by favorite</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  favoritesOnly && styles.optionButtonActive,
                ]}
                onPress={onToggleFavorites}
              >
                <Text
                  style={[
                    styles.optionText,
                    favoritesOnly && styles.optionTextActive,
                  ]}
                >
                  Favorite
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 18,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
  },
  optionButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
