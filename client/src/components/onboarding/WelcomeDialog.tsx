import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { OnboardingTutorial, defaultTutorialSteps } from './OnboardingTutorial';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Template interface matching database structure
interface SurveyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedCompletionTime: number;
  questions: any[];
}

interface WelcomeDialogProps {
  userId: number;
  isNewUser?: boolean;
  onStartTutorial: () => void;
  onSelectTemplate: (template: SurveyTemplate) => void;
  onCreateBlankSurvey: () => void;
}

/**
 * Welcome Dialog
 * 
 * Shown to new users on first login, or when accessing dashboard
 * without any created surveys.
 */
export function WelcomeDialog({ 
  userId, 
  isNewUser = false, 
  onStartTutorial, 
  onSelectTemplate, 
  onCreateBlankSurvey 
}: WelcomeDialogProps) {
  const [hasSeenWelcome, setHasSeenWelcome] = useLocalStorage<boolean>(`welcome-seen-${userId}`, false);
  const [isOpen, setIsOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedTabCategory, setSelectedTabCategory] = useState('all');
  
  // Fetch templates from database
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['/api/templates'],
    queryFn: () => api.get('/api/templates'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Transform API templates to match expected structure
  // The api.get function unwraps the response, so templatesData is directly the array
  const surveyTemplates: SurveyTemplate[] = templatesData && Array.isArray(templatesData)
    ? templatesData.map((t: any) => ({
        id: t.id,
        name: t.title,
        description: t.description,
        category: t.surveyType || 'General',
        estimatedCompletionTime: t.estimatedTime || 10,
        questions: t.questions || []
      }))
    : [];
  
  useEffect(() => {
    // Show welcome dialog for new users or when forced
    if ((isNewUser && !hasSeenWelcome) || isNewUser === true) {
      setIsOpen(true);
    }
  }, [isNewUser, hasSeenWelcome]);
  
  const handleClose = () => {
    setIsOpen(false);
    setHasSeenWelcome(true);
  };
  
  const handleStartTutorial = () => {
    setShowTutorial(true);
    onStartTutorial();
  };
  
  const handleTutorialComplete = () => {
    setShowTutorial(false);
    handleClose();
  };
  
  const handleTutorialSkip = () => {
    setShowTutorial(false);
  };
  
  // Group templates by category
  const templatesByCategory: Record<string, SurveyTemplate[]> = {
    all: surveyTemplates
  };
  
  surveyTemplates.forEach(template => {
    if (!templatesByCategory[template.category]) {
      templatesByCategory[template.category] = [];
    }
    templatesByCategory[template.category].push(template);
  });
  
  const categoryNames = Object.keys(templatesByCategory).filter(cat => cat !== 'all');
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Welcome to SurveyInsight Pro!</DialogTitle>
            <DialogDescription>
              Get started creating surveys and gathering valuable insights from your audience.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="start" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="start">Quick Start</TabsTrigger>
              <TabsTrigger value="templates">Survey Templates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="start" className="space-y-4 py-4">
              <div className="grid gap-4 py-4">
                <div className="flex flex-col gap-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-2">Start with a fresh survey</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a survey from scratch with our intuitive editor
                    </p>
                    <Button 
                      onClick={() => {
                        onCreateBlankSurvey();
                        handleClose();
                      }}
                    >
                      Create Blank Survey
                    </Button>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-2">Take the product tour</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Learn how to use the platform with our guided tutorial
                    </p>
                    <Button variant="outline" onClick={handleStartTutorial}>
                      Start Tutorial
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="templates" className="py-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Loading templates...</p>
                </div>
              ) : surveyTemplates.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">No templates available</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={selectedTabCategory === 'all' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setSelectedTabCategory('all')}
                      className="text-xs rounded-full"
                    >
                      All
                    </Button>
                    {categoryNames.map(category => (
                      <Button
                        key={category}
                        variant={selectedTabCategory === category ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTabCategory(category)}
                        className="text-xs rounded-full"
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 max-h-[400px] overflow-y-auto p-1">
                    {templatesByCategory[selectedTabCategory]?.map(template => (
                      <div 
                        key={template.id}
                        className="border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => {
                          onSelectTemplate(template);
                          handleClose();
                        }}
                      >
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {template.questions.length} questions
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ~{template.estimatedCompletionTime} min
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="ghost" onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {showTutorial && (
        <OnboardingTutorial 
          steps={defaultTutorialSteps} 
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      )}
    </>
  );
}