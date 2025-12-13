import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowRight } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'right' | 'bottom' | 'left';
}

interface ProductTourProps {
  tourId: string;  // Unique identifier for this specific tour
  steps: TourStep[];
}

/**
 * Product Tour Component
 * 
 * Interactive tour that highlights UI elements and explains their functionality
 */
export function ProductTour({ tourId, steps }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [completedTours, setCompletedTours] = useLocalStorage<string[]>('completed-tours', []);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Check if this tour has been completed before
  useEffect(() => {
    if (!completedTours.includes(tourId)) {
      // Start tour after a small delay to ensure UI is fully rendered
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [tourId, completedTours]);

  // Update target element when current step changes
  useEffect(() => {
    if (isOpen && steps[currentStep]) {
      const target = document.querySelector(steps[currentStep].targetSelector) as HTMLElement;
      setTargetElement(target);
      
      if (target) {
        // Add highlight class to the target element
        target.classList.add('product-tour-highlight');
        
        // Calculate position for the dialog
        const rect = target.getBoundingClientRect();
        const { position: stepPosition } = steps[currentStep];
        
        let top = 0;
        let left = 0;
        
        switch (stepPosition) {
          case 'top':
            top = rect.top - 150;
            left = rect.left + rect.width / 2 - 150;
            break;
          case 'right':
            top = rect.top + rect.height / 2 - 75;
            left = rect.right + 20;
            break;
          case 'bottom':
            top = rect.bottom + 20;
            left = rect.left + rect.width / 2 - 150;
            break;
          case 'left':
            top = rect.top + rect.height / 2 - 75;
            left = rect.left - 320;
            break;
        }
        
        // Ensure dialog stays within viewport
        top = Math.max(20, top);
        left = Math.max(20, left);
        
        setPosition({ top, left });
      }
      
      return () => {
        // Remove highlight class when component unmounts or step changes
        if (target) {
          target.classList.remove('product-tour-highlight');
        }
      };
    }
  }, [isOpen, currentStep, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    if (!completedTours.includes(tourId)) {
      setCompletedTours([...completedTours, tourId]);
    }
    
    // Remove highlight from any elements
    if (targetElement) {
      targetElement.classList.remove('product-tour-highlight');
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    if (!completedTours.includes(tourId)) {
      setCompletedTours([...completedTours, tourId]);
    }
    
    // Remove highlight from any elements
    if (targetElement) {
      targetElement.classList.remove('product-tour-highlight');
    }
  };

  if (!isOpen || !steps[currentStep]) {
    return null;
  }

  return (
    <div 
      className="fixed z-50"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        pointerEvents: 'none'
      }}
    >
      <div className="w-80 bg-card border shadow-lg rounded-lg overflow-hidden" style={{ pointerEvents: 'auto' }}>
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg">{steps[currentStep].title}</DialogTitle>
        </DialogHeader>
        
        <DialogContent className="p-4 pt-0">
          <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
        </DialogContent>
        
        <DialogFooter className="flex justify-between p-4 pt-2">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-xs">
            Skip Tour
          </Button>
          <Button size="sm" onClick={handleNext} className="text-xs">
            {currentStep < steps.length - 1 ? 'Next' : 'Finish'}
            <ArrowRight className="ml-2 h-3 w-3" />
          </Button>
        </DialogFooter>
      </div>
    </div>
  );
}

export const dashboardTourSteps: TourStep[] = [
  {
    title: "Dashboard Overview",
    description: "Welcome to your dashboard! This is where you can see all your surveys at a glance.",
    targetSelector: ".dashboard-header",
    position: "bottom"
  },
  {
    title: "Create New Survey",
    description: "Click here to create a new survey. You can start from scratch or use one of our templates.",
    targetSelector: ".create-survey-button",
    position: "right"
  },
  {
    title: "Survey Templates",
    description: "Browse our professionally designed templates to get started quickly.",
    targetSelector: ".templates-section",
    position: "top"
  },
  {
    title: "Analytics Overview",
    description: "See key metrics for all your surveys in one place.",
    targetSelector: ".analytics-overview",
    position: "left"
  },
  {
    title: "Recent Activities",
    description: "Keep track of recent responses and activities across all your surveys.",
    targetSelector: ".recent-activities",
    position: "top"
  }
];

export const surveyEditorTourSteps: TourStep[] = [
  {
    title: "Survey Editor",
    description: "This is where you build your survey. Add questions, customize settings, and preview your survey.",
    targetSelector: ".survey-editor",
    position: "bottom"
  },
  {
    title: "Question Types",
    description: "Choose from multiple question types to suit your needs.",
    targetSelector: ".question-types",
    position: "right"
  },
  {
    title: "Survey Settings",
    description: "Configure settings like required questions, randomization, and more.",
    targetSelector: ".survey-settings",
    position: "left"
  },
  {
    title: "Preview Survey",
    description: "See how your survey will appear to respondents before publishing.",
    targetSelector: ".preview-button",
    position: "top"
  },
  {
    title: "Publish Survey",
    description: "When you're ready, publish your survey and share it with your audience.",
    targetSelector: ".publish-button",
    position: "left"
  }
];