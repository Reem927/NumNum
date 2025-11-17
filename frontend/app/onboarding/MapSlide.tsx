import OnboardingSlide from '@/components/OnboardingSlide';
import { useRouter } from 'expo-router';
import React from 'react';

export default function MapSlideScreen() {
  const router = useRouter();

  const handleNext = () => {
    router.push('/onboarding/CommunitySlide');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <OnboardingSlide
      title="Map"
      description="Pinpoint restaurants on a map with multi-cuisine filters. See where foodies you follow have reviewed and dined, all in one visual experience."
      icon="map"
      buttonText="Next"
      onButtonPress={handleNext}
      currentStep={3}
      totalSteps={5}
      showBackButton={true}
      onBackPress={handleBack}
    />
  );
}







