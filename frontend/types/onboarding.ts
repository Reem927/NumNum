export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: string;  // Icon name from Ionicons
  image?: string;
}

export interface SurveyStep {
  step: number;
  title: string;
  description: string;
  type: 'cuisines' | 'dietary';
  options: string[];
  required: boolean;
}







