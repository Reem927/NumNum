import OnboardingSlide from '@/components/OnboardingSlide';
import { useRouter } from 'expo-router';
import React from 'react';

export default function DiscoverSlideScreen() {
  const router = useRouter();

  const handleNext = () => {
    router.push('/onboarding/MapSlide');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <OnboardingSlide
      title="Discover"
      description="Find your next favorite restaurant through our personalized recommendation system. Save places you want to try, whether you're ordering in or dining out."
      icon="search"
      buttonText="Next"
      onButtonPress={handleNext}
      currentStep={2}
      totalSteps={5}
      showBackButton={true}
      onBackPress={handleBack}
    />
  );
}





