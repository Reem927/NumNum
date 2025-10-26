import OnboardingSlide from '@/components/OnboardingSlide';
import { useRouter } from 'expo-router';
import React from 'react';

export default function CommunitySlideScreen() {
  const router = useRouter();

  const handleNext = () => {
    router.push('/onboarding/ProfileSlide');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <OnboardingSlide
      title="Community"
      description="Connect with fellow food lovers! Share thread-like posts about food, discover different cuisines, and join conversations with the foodie community."
      icon="people"
      buttonText="Next"
      onButtonPress={handleNext}
      currentStep={4}
      totalSteps={5}
      showBackButton={true}
      onBackPress={handleBack}
    />
  );
}





