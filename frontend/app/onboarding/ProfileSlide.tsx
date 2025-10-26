import OnboardingSlide from '@/components/OnboardingSlide';
import { useRouter } from 'expo-router';
import React from 'react';

export default function ProfileSlideScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/onboarding/Survey');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <OnboardingSlide
      title="Profile"
      description="Your personal food journal. View all your review posts, track your culinary journey, and showcase your foodie profile."
      icon="person"
      buttonText="Continue to Survey"
      onButtonPress={handleContinue}
      currentStep={5}
      totalSteps={5}
      showBackButton={true}
      onBackPress={handleBack}
    />
  );
}





