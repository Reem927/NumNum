import { useAuth } from '@/context/AuthContext';
import { UserPreferences } from '@/types/auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const CUISINES = [
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

const DIETARY_RESTRICTIONS = [
  'None',
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Halal',
  'Kosher',
  'Dairy-Free',
  'Nut Allergy',
];

export default function SurveyScreen() {
  const router = useRouter();
  const { updatePreferences, completeOnboarding, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);

  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine) 
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleDietaryToggle = (restriction: string) => {
    setSelectedDietary(prev => 
      prev.includes(restriction) 
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (selectedCuisines.length === 0) {
        Alert.alert('Selection Required', 'Please select at least one cuisine you love!');
        return;
      }
      setCurrentStep(2);
    }
  };

  const handleComplete = async () => {
    if (selectedCuisines.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one cuisine you love!');
      return;
    }
  
    try {
      const preferences: UserPreferences = {
        favoriteCuisines: selectedCuisines,
        dietaryRestrictions: selectedDietary.filter(r => r !== 'None'),
      };
  
      // First, update preferences and then mark onboarding as complete
      await updatePreferences(preferences);
      await completeOnboarding();
  
      Alert.alert('Setup Complete', 'Your preferences have been saved!');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Survey completion error:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    }
  };

  const renderCuisineStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 1 of 2</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>What cuisines do you love?</Text>
        <Text style={styles.description}>Select your favorite cuisines to personalize your Discover feed</Text>

        <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.optionsGrid}>
            {CUISINES.map((cuisine) => (
              <TouchableOpacity
                key={cuisine}
                style={[
                  styles.optionChip,
                  selectedCuisines.includes(cuisine) && styles.optionChipSelected,
                ]}
                onPress={() => handleCuisineToggle(cuisine)}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    selectedCuisines.includes(cuisine) && styles.optionChipTextSelected,
                  ]}
                >
                  {cuisine}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDietaryStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep(1)}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 2 of 2</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Any dietary preferences?</Text>
        <Text style={styles.description}>Help us show you the best options</Text>

        <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.optionsList}>
            {DIETARY_RESTRICTIONS.map((restriction) => (
              <TouchableOpacity
                key={restriction}
                style={[
                  styles.optionItem,
                  selectedDietary.includes(restriction) && styles.optionItemSelected,
                ]}
                onPress={() => handleDietaryToggle(restriction)}
              >
                <Text
                  style={[
                    styles.optionItemText,
                    selectedDietary.includes(restriction) && styles.optionItemTextSelected,
                  ]}
                >
                  {restriction}
                </Text>
                {selectedDietary.includes(restriction) && (
                  <Ionicons name="checkmark" size={20} color="#e65332" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity 
          style={[styles.completeButton, loading && styles.completeButtonDisabled]} 
          onPress={handleComplete}
          disabled={loading}
        >
          <Text style={styles.completeButtonText}>
            {loading ? 'Completing Setup...' : 'Complete Setup'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {currentStep === 1 ? renderCuisineStep() : renderDietaryStep()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  backButton: {
    padding: 8,
  },
  stepIndicator: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  optionsContainer: {
    flex: 1,
    marginBottom: 30,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionChip: {
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 12,
    width: '48%',
    alignItems: 'center',
  },
  optionChipSelected: {
    backgroundColor: '#e65332',
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  optionChipTextSelected: {
    color: '#fff',
  },
  optionsList: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  optionItemSelected: {
    backgroundColor: '#fff2f0',
    borderWidth: 1,
    borderColor: '#e65332',
  },
  optionItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  optionItemTextSelected: {
    color: '#e65332',
  },
  nextButton: {
    backgroundColor: '#e65332',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  completeButton: {
    backgroundColor: '#e65332',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  completeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});





