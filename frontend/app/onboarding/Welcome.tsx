import OnboardingSlide from '@/components/OnboardingSlide';
import { useRouter } from 'expo-router';
import React from 'react';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/onboarding/DiscoverSlide');
  };

  return (
    <OnboardingSlide
      title="Welcome to NumNum!"
      description="A place where foodies discover new restaurants through personalized recommendations, network with fellow food lovers, and share their culinary experiences through reviews."
      icon="restaurant"
      buttonText="Get Started"
      onButtonPress={handleGetStarted}
      currentStep={1}
      totalSteps={5}
    />
  );
}







