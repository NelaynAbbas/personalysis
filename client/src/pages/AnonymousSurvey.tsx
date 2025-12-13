import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Skeleton } from "../components/ui/skeleton";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type AnonymousSurveyProps = {
  shareId: string;
};

interface SurveyQuestionOption {
  id: string;
  text: string;
  value: string;
  image?: string;
  description?: string;
  traits?: Record<string, number>;
}

interface SurveyQuestion {
  id: number;
  type: "text" | "image" | "multiple-choice" | "slider" | "ranking" | "scenario" | "mood-board" | "personality-matrix";
  question: string;
  description?: string;
  category?: string;
  traitMapping?: Array<{
    trait: string;
    valueMapping?: Record<string, number>;
    scoreMultiplier?: number;
  }>;
  options: SurveyQuestionOption[];
  required?: boolean;
}

interface SurveyDetails {
  id: number;
  companyId: number;
  createdById: number;
  title: string;
  description: string;
  surveyType: string;
  isActive: boolean;
  isPublic: boolean;
  accessCode: string | null;
  customLogo: string | null;
  customTheme: string | null;
  customCss: string | null;
  customWelcomeMessage: string;
  customCompletionMessage: string;
  redirectUrl: string | null;
  allowAnonymous: boolean;
  requireEmail: boolean;
  collectDemographics: boolean;
  estimatedTime: number | null;
  maxResponses: number | null;
  expiryDate: string | null;
  createdAt: string;
  updatedAt: string;
  businessContext: {
    productName: string | null;
    productDescription: string | null;
    productCategory: string | null;
    productFeatures: string[];
    valueProposition: string | null;
    competitors: string[];
    targetMarket: string[];
    industry: string | null;
    painPoints: string[];
  };
  surveyLanguage: string;
  enableAIInsights: boolean;
  enableSocialSharing: boolean;
  demographics: {
    collectAge: boolean;
    collectGender: boolean;
    collectLocation: boolean;
    collectEducation: boolean;
    collectIncome: boolean;
  };
}

// Ranking Question Component with Drag and Drop
function RankingQuestion({ 
  options, 
  questionId, 
  onAnswer,
  currentAnswer 
}: { 
  options: any[], 
  questionId: number, 
  onAnswer: (questionId: number, answer: string) => void,
  currentAnswer?: string
}) {
  const [rankedOptions, setRankedOptions] = useState<any[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Initialize and restore ranked options based on saved answer
  useEffect(() => {
    if (options.length > 0) {
      // If there's a saved answer, restore the ranking
      if (currentAnswer) {
        try {
          const savedRanking = JSON.parse(currentAnswer);
          // Restore the options in the saved order by matching values
          const restoredOptions = savedRanking.map((item: any) => {
            return options.find((opt: any) => opt.value === item.value || opt.text === item.option) || options[0];
          }).filter(Boolean);
          
          // If we successfully restored, use it, otherwise fall back to original order
          if (restoredOptions.length === options.length) {
            setRankedOptions(restoredOptions);
          } else {
            setRankedOptions([...options]);
          }
        } catch (error) {
          console.error("Error parsing saved ranking:", error);
          setRankedOptions([...options]);
        }
      } else {
        // No saved answer, use original order
        setRankedOptions([...options]);
      }
    }
  }, [options, currentAnswer]);
  
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null) return;
    
    const newOrder = [...rankedOptions];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    
    setRankedOptions(newOrder);
    setDraggedIndex(null);
    
    // Store the ranking as a string
    const rankingString = JSON.stringify(newOrder.map((opt, idx) => ({
      rank: idx + 1,
      option: opt.text || opt.value || opt,
      value: opt.value || opt
    })));
    
    onAnswer(questionId, rankingString);
  };
  
  return (
    <div className="space-y-3">
      {rankedOptions.map((option: any, index: number) => (
        <div
          key={option.id || option.value || index}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(index)}
          className={`flex items-center gap-3 p-3 border rounded-lg transition-all cursor-move ${
            draggedIndex === index ? 'opacity-50 border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
          }`}
        >
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white text-sm font-semibold">
            {index + 1}
          </div>
          <div className="flex-1">
            {option.text || option}
          </div>
          <div className="flex-shrink-0 text-gray-400">
            <GripVertical className="h-4 w-4" />
          </div>
        </div>
      ))}
      <p className="text-sm text-gray-500 text-center">Drag items to reorder</p>
    </div>
  );
}

export default function AnonymousSurvey({ shareId }: AnonymousSurveyProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [animationDirection, setAnimationDirection] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);

  // Check if this is a preview (from URL query params)
  const isPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'true';

  // Demographic questions will be shown at the end
  const [demographicInfo, setDemographicInfo] = useState({
    age: 0,
    gender: "",
    location: "",
    education: "",
    income: "",
    occupation: "",
    interests: [] as string[]
  });

  // Fetch survey details - include preview parameter if present
  const surveyUrl = isPreview ? `/api/surveys/${shareId}?preview=true` : `/api/surveys/${shareId}`;
  const { data: surveyDetailsResponse, isLoading: surveyLoading, error: surveyError } = useQuery({
    queryKey: [surveyUrl],
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const surveyDetails = (surveyDetailsResponse as any)?.data;

  // Fetch questions from database for this specific survey - include preview parameter if present
  const questionsUrl = isPreview ? `/api/surveys/${shareId}/questions?preview=true` : `/api/surveys/${shareId}/questions`;
  const { data: questionsData, isLoading: questionsLoading, error: questionsError } = useQuery({
    queryKey: [questionsUrl],
    enabled: !!surveyDetails,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const questions = (questionsData as any)?.data || [];

  // Fetch company usage to enforce response quota before showing survey (skip in preview mode)
  const { data: usageInfo, isLoading: usageLoading } = useQuery({
    queryKey: [surveyDetails?.companyId ? `/api/company/${surveyDetails.companyId}/usage` : 'usage-disabled'],
    enabled: !!surveyDetails?.companyId && !isPreview, // Skip usage check in preview mode
    queryFn: async () => {
      const res = await fetch(`/api/company/${surveyDetails!.companyId}/usage`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load usage');
      return res.json();
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false
  });

  const actualResponses = usageInfo?.data?.actualResponses ?? 0;
  const maxResponses = usageInfo?.data?.maxResponses ?? surveyDetails?.maxResponses ?? 0;
  const isCompanyQuotaReached = isPreview ? false : (maxResponses > 0 && actualResponses >= maxResponses); // Skip quota check in preview

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: () => {
      console.log('DEBUG: Calling /api/survey/start with:', {
        surveyId: surveyDetails?.id,
        companyId: surveyDetails?.companyId || 1,
        surveyType: surveyDetails?.surveyType
      });
      return apiRequest("POST", "/api/survey/start", {
        surveyId: surveyDetails?.id,
        companyId: surveyDetails?.companyId || 1,
        surveyType: surveyDetails?.surveyType
      }).then(async res => {
        const data = await res.json();
        console.log('DEBUG: Session start response:', data);
        return data;
      });
    },
    onSuccess: (data) => {
      console.log('DEBUG: Session started successfully with sessionId:', data.data?.sessionId || data.sessionId);
      const sessionId = data.data?.sessionId || data.sessionId;
      const startTime = data.data?.startTime || data.startTime;
      setSessionId(sessionId);
      setSessionStartTime(startTime);
      setSessionStarted(true);
    },
    onError: (error) => {
      console.error("DEBUG: Error starting session:", error);
      toast({
        title: "Error starting survey session",
        description: "Could not start survey session. Please try again.",
        variant: "destructive"
      });
      setSessionStarted(false);
    }
  });

  // Start session only when user clicks Start
  useEffect(() => {
    if (hasStarted && surveyDetails && !sessionId && !sessionStarted && !startSessionMutation.isPending) {
      console.log('DEBUG: Starting survey session for survey:', surveyDetails.id);
      setSessionStarted(true);
      startSessionMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted, surveyDetails]);

  // Debug state changes
  useEffect(() => {
    console.log('DEBUG: Survey state updated:', {
      currentQuestionIndex,
      questionsLength: questions.length,
      completed,
      submitting,
      sessionId,
      answersCount: Object.keys(answers).length,
      surveyDetailsLoaded: !!surveyDetails
    });
  }, [currentQuestionIndex, questions, completed, submitting, sessionId, answers, surveyDetails]);

  // Calculate progress percentage based on completed questions
  // Progress should reflect how many questions have been answered, not the current question
  const progressPercentage = questions.length > 0
    ? (currentQuestionIndex / questions.length) * 100
    : 0;

  const enforceUsage = !!surveyDetails?.companyId;
  const loading = surveyLoading || questionsLoading || (enforceUsage && usageLoading);
  const error = surveyError || questionsError;
  
  const handleAnswer = async (questionId: number, answer: string) => {
    console.log('DEBUG: handleAnswer called', { questionId, answer, currentQuestionIndex, questionsLength: questions.length, completed });

    // Save the answer
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    // Record the answer via API
    if (sessionId) {
      try {
        console.log('DEBUG: Saving answer to API', { sessionId, questionId, answer });
        const response = await apiRequest("POST", "/api/survey/answer", {
          sessionId,
          questionId,
          answer
        });

        if (!response.ok) {
          toast({
            title: "Error saving answer",
            description: "Your answer couldn't be saved. Please try again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error saving answer:", error);
      }
    }

    // Note: Navigation is now manual via the Next button
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setAnimationDirection(-1); // Set direction to backward
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleNext = () => {
    console.log('DEBUG: handleNext called', { currentQuestionIndex, questionsLength: questions.length, completed });
    setAnimationDirection(1); // Set direction to forward
    if (currentQuestionIndex < questions.length - 1) {
      console.log('DEBUG: handleNext - moving to next question', currentQuestionIndex + 1);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      console.log('DEBUG: handleNext - last question, setting completed to true');
      setCompleted(true);
      console.log('DEBUG: handleNext - setCompleted(true) called');
    }
  };
  
  const handleDemographicChange = (field: string, value: string | number | string[]) => {
    setDemographicInfo({
      ...demographicInfo,
      [field]: value
    });
  };
  
  const handleSubmit = async () => {
    console.log('DEBUG: handleSubmit called', {
      sessionId,
      answersCount: Object.keys(answers).length,
      questionsLength: questions.length,
      completed,
      submitting,
      demographicInfo
    });

    if (!sessionId) {
      console.log('DEBUG: No sessionId, attempting to create session');
      // Try to create a session on the fly
      try {
        const sessionResponse = await apiRequest("POST", "/api/survey/start", {
          surveyId: surveyDetails?.id,
          companyId: surveyDetails?.companyId || 1,
          surveyType: surveyDetails?.surveyType
        });
        const sessionData = await sessionResponse.json();
        console.log('DEBUG: Session created on submit:', sessionData);
        const newSessionId = sessionData.data?.sessionId || sessionData.sessionId;
        console.log('DEBUG: Extracted sessionId:', newSessionId);
        setSessionId(newSessionId);
        
        // Re-call submit with the new sessionId
        setTimeout(() => handleSubmit(), 100);
        return;
      } catch (error) {
        console.error('DEBUG: Failed to create session on submit:', error);
        toast({
          title: "Error starting survey session",
          description: "Could not start survey session. Please refresh and try again.",
          variant: "destructive"
        });
        return;
      }
    }

    setSubmitting(true);
    // Immediately show Thank You while results are being prepared
    setShowThankYou(true);
    console.log('DEBUG: Set submitting to true, showing Thank You, making API call');

    try {
      // Build demographics payload based on enabled fields
      const enabled = surveyDetails?.demographics || {};
      const filteredDemographics: Record<string, any> = {};
      if (enabled.collectAge && demographicInfo.age) filteredDemographics.age = demographicInfo.age;
      if (enabled.collectGender && demographicInfo.gender) filteredDemographics.gender = demographicInfo.gender;
      if (enabled.collectLocation && demographicInfo.location) filteredDemographics.location = demographicInfo.location;
      if (enabled.collectEducation && demographicInfo.education) filteredDemographics.education = demographicInfo.education;
      if (enabled.collectIncome && demographicInfo.income) filteredDemographics.income = demographicInfo.income;

      const payload = {
        sessionId,
        surveyType: surveyDetails?.surveyType || 'general',
        surveyId: surveyDetails?.id,
        companyId: surveyDetails?.companyId || 1,
        startTime: sessionStartTime, // Include the session start time
        responses: Object.entries(answers).map(([questionId, answer]) => ({
          questionId: parseInt(questionId),
          answer
        })),
        demographics: surveyDetails?.collectDemographics ? filteredDemographics : {}
      };
      
      console.log('DEBUG: surveyDetails?.id:', surveyDetails?.id);
      console.log('DEBUG: Making API request to /api/survey/complete with payload:', payload);
      
      const response = await apiRequest("POST", "/api/survey/complete", payload);

      console.log('DEBUG: API response received, status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DEBUG: API error response:', errorText);
        let errorMessage = 'Failed to complete survey';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('DEBUG: Survey completed successfully', data);
      setSubmitting(false);

      // After 3 seconds, redirect to results page using the responseId from the API
      setTimeout(() => {
        const responseId = data.data?.responseId || data.responseId;
        console.log('DEBUG: Redirecting to results with responseId:', responseId);
        setLocation(`/results/${responseId}`);
      }, 3000);

    } catch (error) {
      console.error("Error completing survey:", error);
      toast({
        title: "Error completing survey",
        description: "There was a problem completing your survey. Please try again.",
        variant: "destructive"
      });
      setSubmitting(false);
    }
  };
  
  // Card variants for animations
  const cardVariants = {
    hidden: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    visible: {
      x: 0,
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        duration: 0.3
      }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
      transition: { duration: 0.2 }
    })
  };
  
  // If loading, show a skeleton loading state with subtle animation
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-140px)] flex flex-col items-center justify-center">
        <Card className="w-full shadow-lg">
          <CardHeader className="bg-primary/5">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="animate-pulse mb-6">
              <div className="flex justify-between text-sm mb-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
            
            <Skeleton className="h-6 w-full mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 flex justify-between">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // If there was an error loading the survey
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-140px)] flex flex-col items-center justify-center">
        <Card className="w-full shadow-lg border-red-100">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Survey Not Available
            </CardTitle>
            <CardDescription className="text-red-600/80">
              We couldn't load the requested survey
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-center mb-4 text-gray-700">{error?.message || "This survey is not available or has expired. Please contact the survey administrator."}</p>
          </CardContent>
          <CardFooter className="flex justify-center pt-2 pb-6">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="px-6"
            >
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // If the survey is completed and showing thank you message
  if (showThankYou) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-140px)] flex flex-col items-center justify-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-full"
        >
          <Card className="w-full shadow-lg border-green-100">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-xl font-bold text-center text-green-600 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-6 w-6" />
                Thank You!
              </CardTitle>
              <CardDescription className="text-center text-green-600/80">
                {surveyDetails?.customCompletionMessage || 'Your survey has been completed successfully.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 pb-8 text-center">
              <p className="mb-6 text-gray-700">
                Your responses have been recorded. We are now preparing your personalized results...
              </p>
              <div className="flex justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // If company response quota is exhausted, block survey with a friendly message
  if (surveyDetails && isCompanyQuotaReached) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="shadow-lg border-red-100">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              This survey is temporarily unavailable
            </CardTitle>
            <CardDescription className="text-red-600/80">
              Something went wrong while loading the survey.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-700">
              We’re unable to accept more responses at the moment. Please check back later or contact the survey organizer if you have questions.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pt-2 pb-6">
            <Button onClick={() => window.history.back()} variant="outline" className="px-6">
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Pre-start welcome screen
  if (!hasStarted && surveyDetails) {
    const questionCount = questions.length;
    const hasDemographics = surveyDetails.collectDemographics && (
      surveyDetails.demographics?.collectAge ||
      surveyDetails.demographics?.collectGender ||
      surveyDetails.demographics?.collectLocation ||
      surveyDetails.demographics?.collectEducation ||
      surveyDetails.demographics?.collectIncome
    );

    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="shadow-lg">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl font-bold">{surveyDetails.title}</CardTitle>
            {surveyDetails.description && (
              <CardDescription>{surveyDetails.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="text-gray-700">
              <p className="whitespace-pre-line">
                {surveyDetails.customWelcomeMessage || `Welcome! This survey will help us better understand your perspectives.

What to expect:
- Estimated time: ${surveyDetails.estimatedTime || 10} minutes
- Number of questions: ${questionCount}
- Survey type: ${surveyDetails.surveyType || 'General'}`}
              </p>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              {surveyDetails.estimatedTime && (
                <p><strong>Estimated Time:</strong> {surveyDetails.estimatedTime} minutes</p>
              )}
              <p><strong>Questions:</strong> {questionCount}</p>
              <p><strong>Type:</strong> {surveyDetails.surveyType || 'General'}</p>
              {surveyDetails.expiryDate && (
                <p><strong>Expires:</strong> {new Date(surveyDetails.expiryDate).toLocaleString()}</p>
              )}
              {hasDemographics && (
                <p><strong>Note:</strong> We’ll ask optional demographics at the end.</p>
              )}
              {surveyDetails.requireEmail && (
                <p><strong>Email Required:</strong> Yes</p>
              )}
              {surveyDetails.allowAnonymous && (
                <p><strong>Anonymous Responses:</strong> Allowed</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 flex justify-end">
            <Button
              onClick={() => setHasStarted(true)}
              disabled={startSessionMutation.isPending}
            >
              {startSessionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparing...
                </>
              ) : (
                'Start Survey'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // If the main questions are completed, show demographic questions
  console.log('DEBUG: Checking if completed - current state:', {
    completed,
    currentQuestionIndex,
    questionsLength: questions.length,
    answersCount: Object.keys(answers).length,
    sessionId,
    surveyDetailsLoaded: !!surveyDetails
  });

  if (completed && surveyDetails?.collectDemographics) {
    console.log('DEBUG: Rendering demographic section', {
      completed,
      sessionId,
      answersCount: Object.keys(answers).length,
      questionsLength: questions.length
    });

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-140px)] flex flex-col items-center justify-center">
        {/* Survey Details Display for Demographics */}
        {surveyDetails && (
          <div className="w-full mb-6 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{surveyDetails.title}</h1>
            {surveyDetails.description && (
              <p className="text-gray-600 text-lg">{surveyDetails.description}</p>
            )}
          </div>
        )}

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <Card className="w-full shadow-lg">
            <CardHeader className="bg-primary/5">
              <CardTitle>Just a Few More Questions</CardTitle>
              <CardDescription>
                These optional questions help us better understand your responses and provide more personalized insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {surveyDetails?.demographics?.collectAge && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Age Range</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    value={demographicInfo.age}
                    onChange={(e) => handleDemographicChange('age', parseInt(e.target.value))}
                  >
                    <option value={0}>Prefer not to say</option>
                    <option value={18}>18-24</option>
                    <option value={25}>25-34</option>
                    <option value={35}>35-44</option>
                    <option value={45}>45-54</option>
                    <option value={55}>55-64</option>
                    <option value={65}>65+</option>
                  </select>
                </div>
              )}

              {surveyDetails?.demographics?.collectGender && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Gender</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    value={demographicInfo.gender}
                    onChange={(e) => handleDemographicChange('gender', e.target.value)}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}

              {surveyDetails?.demographics?.collectLocation && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Location</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    placeholder="Your city or region (optional)"
                    value={demographicInfo.location}
                    onChange={(e) => handleDemographicChange('location', e.target.value)}
                  />
                </div>
              )}

              {surveyDetails?.demographics?.collectEducation && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Education Level</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    value={demographicInfo.education}
                    onChange={(e) => handleDemographicChange('education', e.target.value)}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="high-school">High School</option>
                    <option value="associate">Associate's Degree</option>
                    <option value="bachelor">Bachelor's Degree</option>
                    <option value="master">Master's Degree</option>
                    <option value="doctorate">Doctorate</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}

              {surveyDetails?.demographics?.collectIncome && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Income Range</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    value={demographicInfo.income}
                    onChange={(e) => handleDemographicChange('income', e.target.value)}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="under-25k">Under $25,000</option>
                    <option value="25k-50k">$25,000 - $50,000</option>
                    <option value="50k-75k">$50,000 - $75,000</option>
                    <option value="75k-100k">$75,000 - $100,000</option>
                    <option value="100k-150k">$100,000 - $150,000</option>
                    <option value="150k-plus">$150,000+</option>
                  </select>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-gray-50 pt-4 pb-4">
              <Button
                onClick={() => {
                  console.log('DEBUG: Complete Survey button clicked');
                  handleSubmit();
                }}
                disabled={submitting}
                className="w-full transition-all"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Complete Survey"
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }
  
  // Render the current question
  const currentQuestion = questions[currentQuestionIndex];
  
  // Normalize question type - use type or questionType
  const questionType = currentQuestion?.type || currentQuestion?.questionType || 'text';
  
  if (!currentQuestion || !surveyDetails) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-140px)]">
        <Card className="w-full max-w-4xl shadow-lg">
          <CardContent className="py-12">
            <p className="text-center text-gray-500">No questions available</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Main survey question display with animations
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-140px)] flex flex-col items-center justify-center">
      {/* Survey Title Only */}
      <div className="w-full mb-6 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{surveyDetails.title}</h1>
      </div>

      <Card className="w-full shadow-lg">
        <CardHeader className="bg-primary/5">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
            <span className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 hidden sm:inline">{progressPercentage.toFixed(0)}% Complete</span>
              <Progress value={progressPercentage} className="h-2 w-24" />
            </div>
          </div>
          <AnimatePresence mode="wait" custom={animationDirection}>
            <motion.div
              key={currentQuestionIndex}
              custom={animationDirection}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <CardTitle className="text-lg md:text-xl font-bold">{currentQuestion.question || currentQuestion.text}</CardTitle>
            </motion.div>
          </AnimatePresence>
        </CardHeader>
        
        <CardContent className="pt-6">
          <AnimatePresence mode="wait" custom={animationDirection}>
            <motion.div
              key={currentQuestionIndex}
              custom={animationDirection}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <div className="space-y-3">
                {/* Multiple Choice */}
                {questionType === 'multiple-choice' && currentQuestion.options && (
                  <>
                    {currentQuestion.options.map((option: any, index: number) => (
                      <motion.div
                        key={option.id || option.value || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div 
                          className={`border rounded-lg cursor-pointer transition-all overflow-hidden ${
                            answers[currentQuestion.id] === (option.value || option) 
                              ? 'border-primary bg-primary/10' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => handleAnswer(currentQuestion.id, option.value || option)}
                        >
                          {option.image && option.image.trim() !== "" && (
                            <div className="w-full h-48 bg-gray-200 relative">
                              <img 
                                src={option.image} 
                                alt={option.text || option} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div className={option.image ? "p-4" : "p-4"}>
                            <div className="font-medium">{option.text || option}</div>
                            {option.description && (
                              <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}
                
                {/* Image Selection */}
                {questionType === 'image' && currentQuestion.options && (
                  <>
                    {currentQuestion.options.map((option: any, index: number) => (
                      <motion.div
                        key={option.id || option.value || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex flex-col items-center"
                      >
                        <div 
                          className={`p-4 border rounded-lg cursor-pointer transition-all w-full ${
                            answers[currentQuestion.id] === (option.value || option) 
                              ? 'border-primary bg-primary/10' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => handleAnswer(currentQuestion.id, option.value || option)}
                        >
                          {option.image && option.image.trim() !== "" && (
                            <img 
                              src={option.image} 
                              alt={option.text || option} 
                              className="w-full h-48 object-cover rounded-md mb-2"
                            />
                          )}
                          <div className="text-center font-medium">{option.text || option}</div>
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}
                
                {/* Text Input */}
                {questionType === 'text' && (
                  <div className="space-y-3">
                    <textarea 
                      className="w-full p-3 border rounded-md min-h-[140px] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="Type your answer here..."
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => setAnswers({...answers, [currentQuestion.id]: e.target.value})}
                    />
                  </div>
                )}
                
                {/* Slider */}
                {questionType === 'slider' && (
                  <div className="space-y-5">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{currentQuestion.sliderConfig?.minLabel || "Low"}</span>
                      <span>{currentQuestion.sliderConfig?.maxLabel || "High"}</span>
                    </div>
                    <div className="px-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={parseInt(answers[currentQuestion.id] || '50')}
                        onChange={(e) => setAnswers({...answers, [currentQuestion.id]: e.target.value})}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                    <div className="text-center">
                      <span className="text-lg font-semibold text-primary">
                        {answers[currentQuestion.id] || '50'}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Ranking */}
                {questionType === 'ranking' && currentQuestion.options && (
                  <RankingQuestion
                    options={currentQuestion.options}
                    questionId={currentQuestion.id}
                    onAnswer={handleAnswer}
                    currentAnswer={answers[currentQuestion.id]}
                  />
                )}

                {/* Scenario */}
                {questionType === 'scenario' && (
                  <div className="space-y-4">
                    {currentQuestion.scenarioText && (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">Scenario</p>
                        <p className="text-gray-600">{currentQuestion.scenarioText}</p>
                      </div>
                    )}
                    {currentQuestion.options && currentQuestion.options.length > 0 && (
                      <div className="space-y-2">
                        {currentQuestion.options.map((option: any, index: number) => (
                          <motion.div
                            key={option.id || option.value || index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <div 
                              className={`border rounded-lg cursor-pointer transition-all overflow-hidden ${
                                answers[currentQuestion.id] === (option.value || option) 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                              onClick={() => handleAnswer(currentQuestion.id, option.value || option)}
                            >
                              {option.image && option.image.trim() !== "" && (
                                <div className="w-full h-48 bg-gray-200 relative">
                                  <img 
                                    src={option.image} 
                                    alt={option.text || option} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                              <div className={option.image ? "p-4" : "p-4"}>
                                <div className="font-medium">{option.text || option}</div>
                                {option.description && (
                                  <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Mood Board */}
                {questionType === 'mood-board' && currentQuestion.options && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {currentQuestion.options.map((option: any, index: number) => (
                      <motion.div
                        key={option.id || option.value || index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div 
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            answers[currentQuestion.id] === (option.value || option) 
                              ? 'border-primary bg-primary/10' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => handleAnswer(currentQuestion.id, option.value || option)}
                        >
                          {option.image && option.image.trim() !== "" && (
                            <img 
                              src={option.image} 
                              alt={option.text || option} 
                              className="w-full h-32 object-cover rounded-md mb-2"
                            />
                          )}
                          <p className="text-center text-sm">{option.text || option}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Personality Matrix */}
                {questionType === 'personality-matrix' && currentQuestion.options && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {currentQuestion.options.map((option: any, index: number) => (
                      <motion.div
                        key={option.id || option.value || index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div 
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all overflow-hidden ${
                            answers[currentQuestion.id] === (option.value || option) 
                              ? 'border-primary bg-primary/10' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => handleAnswer(currentQuestion.id, option.value || option)}
                        >
                          {option.image && option.image.trim() !== "" && (
                            <div className="w-full h-40 bg-gray-200 relative mb-3">
                              <img 
                                src={option.image} 
                                alt={option.text || option} 
                                className="w-full h-full object-cover rounded-md"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <p className="font-medium text-center">{option.text || option}</p>
                          {option.description && (
                            <p className="text-xs text-gray-600 mt-1">{option.description}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Debug: Show if question type doesn't match any handler */}
                {questionType && 
                 !['multiple-choice', 'image', 'text', 'slider', 'ranking', 'scenario', 'mood-board', 'personality-matrix'].includes(questionType) && (
                  <div className="p-4 border border-yellow-400 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Unsupported question type:</strong> {questionType}
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Available types: text, multiple-choice, image, slider, ranking, scenario, mood-board, personality-matrix
                    </p>
                    <p className="text-xs text-yellow-700 mt-2">
                      Question ID: {currentQuestion.id} | Question: {currentQuestion.question || currentQuestion.text}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </CardContent>
        
        <CardFooter className="bg-gray-50 flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="transition-all"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={currentQuestion.required && !answers[currentQuestion.id]}
            className="transition-all"
          >
            {currentQuestionIndex === questions.length - 1 ? 'Complete' : 'Next'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
