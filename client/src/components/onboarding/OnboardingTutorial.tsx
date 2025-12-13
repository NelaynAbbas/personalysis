import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface TutorialStep {
  title: string;
  content: string;
  image?: string;
}

interface OnboardingTutorialProps {
  steps: TutorialStep[];
  onComplete: () => void;
  onSkip: () => void;
}

/**
 * Onboarding Tutorial Component
 * 
 * Displays a step-by-step tutorial for new users with progress tracking
 * and navigation controls.
 */
export function OnboardingTutorial({ steps, onComplete, onSkip }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  // Calculate progress percentage
  useEffect(() => {
    setProgress(((currentStep + 1) / steps.length) * 100);
  }, [currentStep, steps.length]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="relative">
          <CardTitle className="text-xl">{steps[currentStep].title}</CardTitle>
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute top-2 right-2" 
            onClick={onSkip}
          >
            <X className="h-4 w-4" />
          </Button>
          <Progress value={progress} className="h-1 mt-2" />
        </CardHeader>
        <CardContent className="py-6">
          <div className="flex flex-col gap-4">
            {steps[currentStep].image && (
              <div className="w-full h-48 bg-muted rounded-md overflow-hidden">
                <img 
                  src={steps[currentStep].image} 
                  alt={`Tutorial step ${currentStep + 1}`} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div 
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: steps[currentStep].content }}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onSkip}>
              Skip Tutorial
            </Button>
            <Button onClick={handleNext}>
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                'Complete'
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export const defaultTutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to SurveyInsight Pro!",
    content: `
      <p>Welcome to your new survey platform! We're excited to help you gather valuable insights from your audience.</p>
      <p>This quick tutorial will guide you through the key features and help you get started.</p>
    `
  },
  {
    title: "Create Your First Survey",
    content: `
      <p>Creating a survey is easy:</p>
      <ol>
        <li>Click on <strong>"Create New Survey"</strong> from your dashboard</li>
        <li>Choose a template or start from scratch</li>
        <li>Add questions using our intuitive editor</li>
        <li>Configure settings like required fields and logic jumps</li>
        <li>Preview and publish when ready!</li>
      </ol>
    `
  },
  {
    title: "Question Types",
    content: `
      <p>We offer multiple question types to suit your needs:</p>
      <ul>
        <li><strong>Multiple Choice:</strong> Let respondents select from options</li>
        <li><strong>Rating:</strong> Collect numerical ratings</li>
        <li><strong>Text:</strong> Get detailed written responses</li>
        <li><strong>Boolean:</strong> Simple yes/no questions</li>
        <li><strong>Likert Scale:</strong> Measure agreement levels</li>
        <li><strong>NPS:</strong> Measure customer loyalty</li>
        <li><strong>Ranking:</strong> Have users rank items by preference</li>
      </ul>
    `
  },
  {
    title: "Distribute Your Survey",
    content: `
      <p>Once your survey is ready, share it with your audience:</p>
      <ul>
        <li>Generate a shareable link</li>
        <li>Email invitations directly to respondents</li>
        <li>Embed the survey on your website</li>
        <li>Create a QR code for in-person or print materials</li>
      </ul>
      <p>Track responses in real-time and send reminders if needed.</p>
    `
  },
  {
    title: "Analyze Results",
    content: `
      <p>Our powerful analytics tools help you make sense of your data:</p>
      <ul>
        <li>Visual dashboards with charts and graphs</li>
        <li>Filter and segment responses</li>
        <li>Identify trends and patterns</li>
        <li>Export data in multiple formats</li>
        <li>Share insights with your team</li>
      </ul>
    `
  },
  {
    title: "You're All Set!",
    content: `
      <p>You're now ready to create your first survey!</p>
      <p>If you need help at any time, click the <strong>Help</strong> icon in the top right corner or visit our <strong>Help Center</strong> for detailed guides and tutorials.</p>
      <p>Let's get started collecting valuable insights!</p>
    `
  }
];