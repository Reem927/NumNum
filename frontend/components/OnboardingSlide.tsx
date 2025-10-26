import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface OnboardingSlideProps {
  title: string;
  description: string;
  icon: string;
  image?: string;
  buttonText: string;
  onButtonPress: () => void;
  currentStep: number;
  totalSteps: number;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export default function OnboardingSlide({
  title,
  description,
  icon,
  image,
  buttonText,
  onButtonPress,
  currentStep,
  totalSteps,
  showBackButton = false,
  onBackPress,
}: OnboardingSlideProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Back Button */}
        {showBackButton && onBackPress && (
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )}

        {/* Icon/Image */}
        <View style={styles.iconContainer}>
          {image ? (
            <View style={styles.imageContainer}>
              {/* You can add an Image component here if needed */}
              <Text style={styles.imagePlaceholder}>📱</Text>
            </View>
          ) : (
            <View style={styles.iconWrapper}>
              <Ionicons name={icon as any} size={80} color="#e65332" />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          {Array.from({ length: totalSteps }, (_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStep - 1 && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity style={styles.button} onPress={onButtonPress}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 24,
    zIndex: 1,
    padding: 8,
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: 60,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#e65332',
    width: 24,
  },
  button: {
    backgroundColor: '#e65332',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});





