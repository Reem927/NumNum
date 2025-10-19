import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FiltersModal() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [distance, setDistance] = useState(2);
  const [selectedRating, setSelectedRating] = useState<number[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string[]>([]);


  return (
    <View style={styles.container}>
      {/* Modal handle */}
      <View style={styles.handle} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconWrapper} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Filter</Text>
        <TouchableOpacity onPress={() => { 
            setSelectedCategory([]); 
            setDistance(2); 
            setSelectedRating([]);
            setSelectedPrice([]);
            }}>
          <Text style={styles.reset}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoryContainer}>
          {['Kuwaiti', 'Indian', 'British', 'Lebanese', 'Japanese', 'Chinese', 'Italian', 'Korean', 'French', 'Mexican'].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                selectedCategory.includes(cat) && styles.categorySelected,
              ]}
              onPress={() => {
                if (selectedCategory.includes(cat)) {
                    setSelectedCategory(selectedCategory.filter(c => c !== cat));
                  } else {
                    setSelectedCategory([...selectedCategory, cat]);
                  }
              }}
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

        {/* Distance */}
        <Text style={styles.sectionTitle}>Distance to me</Text>
        <View style={styles.distanceRow}>
          <TouchableOpacity
            style={styles.distanceBtn}
            onPress={() => setDistance(Math.max(1, distance - 1))}
          >
            <Text>-</Text>
          </TouchableOpacity>
          <Text style={styles.distanceValue}>{distance} km</Text>
          <TouchableOpacity
            style={styles.distanceBtn}
            onPress={() => setDistance(distance + 1)}
          >
            <Text>+</Text>
          </TouchableOpacity>
        </View>

        {/* Rating */}
        <Text style={styles.sectionTitle}>Rating</Text>
        <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((num) => (
            <TouchableOpacity
            key={num}
            style={[
                styles.ratingButton,
                selectedRating.includes(num) && styles.ratingButtonSelected,
            ]}
            onPress={() => {
                if (selectedRating.includes(num)) {
                    setSelectedRating(selectedRating.filter(r => r !== num));
                } else {
                    setSelectedRating([...selectedRating, num]);
                }
            }}
            >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text
                style={[
                    styles.ratingText,
                    selectedRating.includes(num) && styles.ratingTextSelected,
                ]}
                >
                {num}
                </Text>
                <Ionicons
                name="star"
                size={16}
                color={selectedRating.includes(num) ? '#fff' : '#e65332'}
                />
            </View>
            </TouchableOpacity>
        ))}
        </View>

        {/* Price */}
        <Text style={styles.sectionTitle}>Price</Text>
        <View style={styles.priceRow}>
        {['$', '$$', '$$$+'].map((price) => (
            <TouchableOpacity
            key={price}
            style={[
                styles.priceButton,
                selectedPrice.includes(price) && styles.priceButtonSelected,
            ]}
            onPress={() => {
                if (selectedPrice.includes(price)) {
                    setSelectedPrice(selectedPrice.filter(p => p !== price));
                  } else {
                    setSelectedPrice([...selectedPrice, price]);
                  }
            }}
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
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => router.back()}
        >
          <Text style={styles.applyText}>Show Results</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

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
    width: 38.5,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  reset: {
    color: '#e65332',
    fontWeight: '500',
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 8,
    marginTop: 15,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categorySelected: {
    backgroundColor: '#e65332',
    borderColor: '#e65332',
  },
  categoryText: {
    fontSize: 14,
  },
  categoryTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  distanceBtn: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 15,
  },
  distanceValue: {
    fontWeight: '600',
    fontSize: 16,
  },
  applyButton: {
    backgroundColor: '#e65332',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 30,
  },
  applyText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  
  ratingButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  
  ratingButtonSelected: {
    backgroundColor: '#e65332',
    borderColor: '#e65332',
  },
  
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  
  ratingTextSelected: {
    color: '#fff',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',       
    gap: 10,                    
    marginTop: 10,
  },
  
  priceButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  
  priceButtonSelected: {
    backgroundColor: '#e65332',
    borderColor: '#e65332',
  },
  
  priceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  
  priceTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});
