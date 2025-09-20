import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plane, ArrowRight, ArrowLeft } from 'lucide-react';

interface UserPreferences {
  social_preference: string;
  activity_level: string;
  group_dynamics: string;
  environment_preference: string;
  accommodation_style: string;
  food_adventure_level: string;
  pace_preference: string;
  cultural_interest: string;
  adventure_seeking: string;
  shopping_interest: string;
  nightlife_preference: string;
  budget_flexibility: string;
  planning_style: string;
}

const questions = [
  {
    id: 'social_preference',
    title: 'How social are you when traveling?',
    description: 'This helps us understand your interaction style',
    options: [
      { value: 'extrovert', label: 'Love meeting new people and being social', emoji: '🎉' },
      { value: 'ambivert', label: 'Enjoy both social time and alone time', emoji: '⚖️' },
      { value: 'introvert', label: 'Prefer quieter, more intimate experiences', emoji: '🧘' }
    ]
  },
  {
    id: 'environment_preference',
    title: 'What environment calls to you?',
    description: 'Your ideal travel destination setting',
    options: [
      { value: 'beach', label: 'Beach - Sun, sand, and ocean vibes', emoji: '🏖️' },
      { value: 'mountains', label: 'Mountains - Fresh air and scenic views', emoji: '🏔️' },
      { value: 'city', label: 'City - Urban energy and cultural sites', emoji: '🏙️' },
      { value: 'countryside', label: 'Countryside - Peaceful rural landscapes', emoji: '🌾' },
      { value: 'desert', label: 'Desert - Unique landscapes and starry nights', emoji: '🏜️' }
    ]
  },
  {
    id: 'activity_level',
    title: 'What\'s your travel energy level?',
    description: 'How active do you like to be on trips?',
    options: [
      { value: 'high_energy', label: 'High energy - Always on the go!', emoji: '⚡' },
      { value: 'moderate', label: 'Moderate - Mix of activities and relaxation', emoji: '🚶' },
      { value: 'relaxed', label: 'Relaxed - Prefer leisurely pace', emoji: '☕' }
    ]
  },
  {
    id: 'adventure_seeking',
    title: 'How adventurous are you?',
    description: 'Your comfort level with new experiences',
    options: [
      { value: 'thrill_seeker', label: 'Thrill seeker - Bring on the excitement!', emoji: '🎢' },
      { value: 'moderate_adventure', label: 'Some adventure - Safe but fun', emoji: '🎯' },
      { value: 'comfort_zone', label: 'Comfort zone - Familiar experiences', emoji: '🛡️' }
    ]
  },
  {
    id: 'food_adventure_level',
    title: 'How adventurous is your palate?',
    description: 'Your approach to trying new foods',
    options: [
      { value: 'very_adventurous', label: 'Very adventurous - Try everything!', emoji: '🍜' },
      { value: 'somewhat_adventurous', label: 'Somewhat - Open to new flavors', emoji: '🍲' },
      { value: 'familiar_foods', label: 'Familiar foods - Stick to what I know', emoji: '🍕' }
    ]
  },
  {
    id: 'accommodation_style',
    title: 'What\'s your ideal accommodation?',
    description: 'Where you prefer to stay',
    options: [
      { value: 'luxury', label: 'Luxury - Premium comfort and service', emoji: '🏨' },
      { value: 'boutique', label: 'Boutique - Unique and stylish places', emoji: '🏩' },
      { value: 'budget', label: 'Budget-friendly - Clean and comfortable', emoji: '🏠' },
      { value: 'local', label: 'Local stays - Authentic experiences', emoji: '🏡' }
    ]
  },
  {
    id: 'cultural_interest',
    title: 'How much do you enjoy cultural experiences?',
    description: 'Museums, history, local traditions',
    options: [
      { value: 'high', label: 'High - Love learning about culture', emoji: '🏛️' },
      { value: 'moderate', label: 'Moderate - Some cultural sites', emoji: '🎭' },
      { value: 'low', label: 'Low - Prefer other activities', emoji: '🎪' }
    ]
  },
  {
    id: 'nightlife_preference',
    title: 'What\'s your evening style?',
    description: 'How you like to spend your nights',
    options: [
      { value: 'party_lover', label: 'Party lover - Dance till dawn!', emoji: '🎊' },
      { value: 'casual_evenings', label: 'Casual - Nice dinner and drinks', emoji: '🍷' },
      { value: 'early_sleeper', label: 'Early sleeper - Rest for tomorrow', emoji: '🌙' }
    ]
  }
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleOptionSelect = (questionId: string, value: string) => {
    setPreferences(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save your preferences.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Add default values for questions not asked
      const completePreferences = {
        ...preferences,
        group_dynamics: 'independent',
        pace_preference: 'balanced',
        shopping_interest: 'occasional',
        budget_flexibility: 'moderate',
        planning_style: 'rough_outline',
        onboarding_completed: true
      };

      const { error } = await supabase
        .from('user_profiles')
        .update(completePreferences)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Welcome aboard! ✈️",
        description: "Your travel preferences have been saved. Let's start planning your perfect trip!"
      });

      // Force navigation immediately without waiting for auth state change
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error saving preferences",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentStep];
  const selectedValue = preferences[currentQuestion.id as keyof UserPreferences];
  const canProceed = selectedValue !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-4">
            <Plane className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Let's Get to Know You
          </h1>
          <p className="text-muted-foreground mt-2">
            Help us create the perfect travel experience for you
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Question {currentStep + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">{currentQuestion.title}</CardTitle>
            <CardDescription>{currentQuestion.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionSelect(currentQuestion.id, option.value)}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all hover:border-primary/50 ${
                    selectedValue === option.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-muted bg-background/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{option.emoji}</span>
                    <span className="font-medium">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canProceed || loading}
                className="flex items-center space-x-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <span>
                  {currentStep === questions.length - 1 ? (loading ? 'Saving...' : 'Finish') : 'Next'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;