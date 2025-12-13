import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import IntroCard from "@/components/survey/IntroCard";
import ProgressIndicator from "@/components/survey/ProgressIndicator";
import QuestionCard from "@/components/survey/QuestionCard";
import ResultsPreview from "@/components/survey/ResultsPreview";
import { apiRequest } from "@/lib/queryClient";
import { surveyTypes } from "@/lib/surveyQuestions";
import { SurveyQuestion } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

const SurveyPage = () => {
  const [currentStep, setCurrentStep] = useState<'intro' | 'questions' | 'demographics' | 'results'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // Load the sessionId from localStorage if it exists
  const [sessionId, setSessionId] = useState<string | null>(() => {
    const saved = localStorage.getItem('surveySessionId');
    // Log for debugging
    console.log('Initial sessionId from localStorage:', saved);
    return saved || null;
  });
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(() => {
    const saved = localStorage.getItem('surveySessionStartTime');
    return saved || null;
  });
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [traits, setTraits] = useState<any[]>([]);
  const [surveyType, setSurveyType] = useState<string>(() => {
    return localStorage.getItem('surveyType') || "general";
  });
  const [questionsData, setQuestionsData] = useState<SurveyQuestion[]>([]);
  const [milestones, setMilestones] = useState<number[]>([]);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementTitle, setAchievementTitle] = useState("");
  const [demographicInfo, setDemographicInfo] = useState({
    age: 0,
    gender: "",
    location: "",
    education: "",
    income: ""
  });
  
  // Save sessionId to localStorage whenever it changes
  useEffect(() => {
    if (sessionId) {
      console.log('Saving sessionId to localStorage:', sessionId);
      localStorage.setItem('surveySessionId', sessionId);
    }
  }, [sessionId]);
  
  // Save surveyType to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('surveyType', surveyType);
  }, [surveyType]);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams();
  const surveyId = params?.id ? parseInt(params.id, 10) : null;
  
  // Fetch survey details if a specific survey ID is provided
  const { data: surveyData } = useQuery({
    queryKey: ['/api/surveys', surveyId],
    queryFn: async () => {
      if (!surveyId) return null;
      const res = await apiRequest('GET', `/api/surveys/${surveyId}`);
      return await res.json();
    },
    enabled: !!surveyId
  });
  
  // Initialize survey with fetched data when available
  useEffect(() => {
    if (surveyData) {
      setSurveyType(surveyData.surveyType || "general");
      
      // If we have a specific survey, we can skip the intro step
      if (currentStep === 'intro') {
        // Using setTimeout to avoid the React Hook Form dependency warning
        // as startSurvey function is created after this effect
        setTimeout(() => {
          startSurvey();
        }, 0);
      }
    }
  }, [surveyData, currentStep]);
  
  // Generate milestones for achievements (at 33% and 66% completion)
  useEffect(() => {
    if (questionsData.length > 0) {
      const third = Math.floor(questionsData.length / 3);
      setMilestones([third, third * 2]);
    }
  }, [questionsData]);
  
  // Fetch survey questions from database
  const { data: questionsResponse, isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/surveys', surveyId, 'questions'],
    queryFn: async () => {
      if (!surveyId) return null;
      const response = await apiRequest('GET', `/api/surveys/${surveyId}/questions`);
      return await response.json();
    },
    enabled: !!surveyId && currentStep === 'questions',
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  // Set questions data when fetched
  useEffect(() => {
    if (questionsResponse?.data) {
      setQuestionsData(questionsResponse.data);
    }
  }, [questionsResponse]);
  
  // Start survey session mutation
  const { mutate: startSurvey, isPending: isStarting } = useMutation({
    mutationFn: async () => {
      // Get company ID from authenticated user
      const userResponse = await fetch('/api/me');
      const userData = await userResponse.json();
      const companyId = userData?.user?.company_id || 1;
      
      const response = await apiRequest('POST', '/api/survey/start', {
        companyId,
        surveyType, // Include survey type in request
        surveyId: surveyId // Include specific survey ID if available
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setSessionStartTime(data.startTime);
      localStorage.setItem('surveySessionId', data.sessionId);
      localStorage.setItem('surveySessionStartTime', data.startTime);
      setCurrentStep('questions');
    },
    onError: (error: any) => {
      toast({
        title: "Error starting survey",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Submit answer mutation
  const { mutate: submitAnswer, isPending: isSubmitting } = useMutation({
    mutationFn: async (data: { questionId: number; answer: string }) => {
      console.log('Submitting answer, sessionId:', sessionId);
      
      // Check for sessionId - if missing, try to retrieve from localStorage
      if (!sessionId) {
        const savedSessionId = localStorage.getItem('surveySessionId');
        console.log('No sessionId in state, checking localStorage:', savedSessionId);
        
        if (savedSessionId) {
          // We found a session ID in localStorage, let's use it
          console.log('Using sessionId from localStorage:', savedSessionId);
          
          // Update the sessionId state
          setSessionId(savedSessionId);
          
          // Use the retrieved sessionId for this request
          const response = await apiRequest('POST', '/api/survey/answer', {
            sessionId: savedSessionId,
            questionId: data.questionId,
            answer: data.answer,
            surveyType
          });
          return await response.json();
        }
        
        // If we still don't have a sessionId, throw an error
        throw new Error("No active session. Please restart the survey.");
      }
      
      // Use the sessionId from state
      const response = await apiRequest('POST', '/api/survey/answer', {
        sessionId,
        questionId: data.questionId,
        answer: data.answer,
        surveyType // Include survey type in request
      });
      
      console.log('Answer submitted successfully, response status:', response.status);
      return await response.json();
    },
    onError: (error: any) => {
      console.error('Error submitting answer:', error);
      toast({
        title: "Error saving answer",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
      
      // If we have a session error, we could try to restart the survey
      if (error.message && error.message.includes("No active session")) {
        console.log('Session error detected, clearing localStorage session data');
        localStorage.removeItem('surveySessionId');
        
        // Redirect to intro page after a short delay
        setTimeout(() => {
          setCurrentStep('intro');
          setCurrentQuestionIndex(0);
          setSessionId(null);
        }, 2000);
      }
    }
  });
  
  // Complete survey mutation
  const { mutate: completeSurvey, isPending: isCompleting } = useMutation({
    mutationFn: async () => {
      console.log('Completing survey, sessionId:', sessionId);
      console.log('Answers to send:', answers);
      
      // Check for sessionId - if missing, try to retrieve from localStorage
      if (!sessionId) {
        const savedSessionId = localStorage.getItem('surveySessionId');
        console.log('No sessionId in state for completion, checking localStorage:', savedSessionId);
        
        if (savedSessionId) {
          // We found a session ID in localStorage, let's use it
          console.log('Using sessionId from localStorage for completion:', savedSessionId);
          
          // Update the sessionId state
          setSessionId(savedSessionId);
          
          // Format answers to match backend expectations
          const formattedResponses = Object.entries(answers).map(([questionId, answer]) => ({
            questionId: parseInt(questionId),
            answer: answer
          }));
          
          // Get survey data to check demographics settings
          const survey = surveyData?.data || surveyData;
          const collectDemographics = survey?.collectDemographics;
          const enabled = survey?.demographics || {};
          
          // Filter demographics based on survey settings
          const filteredDemographics: Record<string, any> = {};
          if (collectDemographics) {
            if (enabled.collectAge && demographicInfo.age > 0) filteredDemographics.age = demographicInfo.age;
            if (enabled.collectGender && demographicInfo.gender) filteredDemographics.gender = demographicInfo.gender;
            if (enabled.collectLocation && demographicInfo.location) filteredDemographics.location = demographicInfo.location;
            if (enabled.collectEducation && demographicInfo.education) filteredDemographics.education = demographicInfo.education;
            if (enabled.collectIncome && demographicInfo.income) filteredDemographics.income = demographicInfo.income;
          }
          
          // Use the retrieved sessionId for this request
          const response = await apiRequest('POST', '/api/survey/complete', {
            sessionId: savedSessionId,
            surveyType,
            startTime: sessionStartTime, // Include the session start time
            responses: formattedResponses,
            demographics: filteredDemographics
          });
          return await response.json();
        }
        
        // If we still don't have a sessionId, throw an error
        throw new Error("No active session. Please restart the survey.");
      }
      
      // Format answers to match backend expectations
      const formattedResponses = Object.entries(answers).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        answer: answer
      }));
      
      // Get survey data to check demographics settings
      const survey = surveyData?.data || surveyData;
      const collectDemographics = survey?.collectDemographics;
      const enabled = survey?.demographics || {};
      
      // Filter demographics based on survey settings
      const filteredDemographics: Record<string, any> = {};
      if (collectDemographics) {
        if (enabled.collectAge && demographicInfo.age > 0) filteredDemographics.age = demographicInfo.age;
        if (enabled.collectGender && demographicInfo.gender) filteredDemographics.gender = demographicInfo.gender;
        if (enabled.collectLocation && demographicInfo.location) filteredDemographics.location = demographicInfo.location;
        if (enabled.collectEducation && demographicInfo.education) filteredDemographics.education = demographicInfo.education;
        if (enabled.collectIncome && demographicInfo.income) filteredDemographics.income = demographicInfo.income;
      }
      
      console.log('Sending formatted responses:', formattedResponses);
      console.log('Sending demographics:', filteredDemographics);
      
      // Use the sessionId from state
      const response = await apiRequest('POST', '/api/survey/complete', {
        sessionId,
        surveyType, // Include survey type in request
        startTime: sessionStartTime, // Include the session start time
        responses: formattedResponses, // Include formatted answers
        demographics: filteredDemographics
      });
      
      console.log('Survey completed successfully, response status:', response.status);
      return await response.json();
    },
    onSuccess: async (data) => {
      console.log('Survey completed successfully, data:', data);
      
      try {
        // The complete endpoint returns traits in the response
        if (data.traits && Array.isArray(data.traits)) {
          console.log('Setting traits from complete response:', data.traits);
          setTraits(data.traits);
        } else if (data.responseId || data.data?.responseId) {
          // Fallback: fetch the survey results to get the traits if not in response
          console.log('Traits not in response, fetching separately');
          const responseId = data.data?.responseId || data.responseId;
          const resultsResponse = await fetch(`/api/survey/results/${responseId}`);
          if (resultsResponse.ok) {
            const resultsData = await resultsResponse.json();
            console.log('Retrieved survey results:', resultsData);
            
            // Check if traits exist and are in the right format
            if (resultsData.traits && Array.isArray(resultsData.traits)) {
              setTraits(resultsData.traits);
            } else {
              // If no traits or wrong format, create empty array so spread operator won't fail
              console.warn('No traits found in results, using empty array');
              setTraits([]);
            }
          } else {
            console.error('Failed to fetch survey results:', resultsResponse.status);
            // Set empty array as fallback
            setTraits([]);
          }
        } else {
          console.warn('No traits in response and no sessionId, using empty array');
          setTraits([]);
        }
      } catch (error) {
        console.error('Error fetching traits:', error);
        // Set empty array as fallback
        setTraits([]);
      }
      
      // Set current step to results regardless of traits
      setCurrentStep('results');
      
      // Celebrate completion with confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error completing survey",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleStartSurvey = (type: string) => {
    setSurveyType(type);
    startSurvey();
  };
  
  const handleAnswerSelect = (answer: string) => {
    const currentQuestion = questionsData[currentQuestionIndex];
    
    // Save answer
    setAnswers(prev => ({ 
      ...prev, 
      [currentQuestion.id]: answer 
    }));
    
    // Submit answer to server
    submitAnswer({
      questionId: currentQuestion.id,
      answer
    });
  };
  
  const handleNextQuestion = () => {
    if (!questionsData.length) return;
    
    const currentQuestion = questionsData[currentQuestionIndex];
    
    // Check for milestones/achievements
    const nextIndex = currentQuestionIndex + 1;
    if (milestones.includes(nextIndex)) {
      // Determine which milestone was reached
      const milestoneIndex = milestones.indexOf(nextIndex);
      const achievements = [
        "Insightful Explorer",
        "Deep Questioner"
      ];
      
      // Show achievement notification
      setAchievementTitle(achievements[milestoneIndex]);
      setShowAchievement(true);
      
      // Hide after 2.5 seconds
      setTimeout(() => {
        setShowAchievement(false);
      }, 2500);
      
      // Small confetti burst for milestone
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 }
      });
    }
    
    // Move to next question or show demographics
    if (currentQuestionIndex < questionsData.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Check if we need to collect demographics
      const survey = surveyData?.data || surveyData;
      const collectDemographics = survey?.collectDemographics;
      if (collectDemographics) {
        setCurrentStep('demographics');
      } else {
        // Complete the survey directly if no demographics needed
        completeSurvey();
      }
    }
  };
  
  const handleDemographicChange = (field: string, value: any) => {
    setDemographicInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleDemographicsSubmit = () => {
    completeSurvey();
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const isLoading = isStarting || isSubmitting || isCompleting;
  const loadingQuestions = currentStep === 'questions' && (questionsData.length === 0 || questionsLoading);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div id="survey-container" className="max-w-2xl mx-auto">
        {currentStep === 'intro' && (
          <IntroCard onStart={handleStartSurvey} />
        )}
        
        {currentStep === 'questions' && (
          <>
            <ProgressIndicator 
              currentQuestion={currentQuestionIndex + 1} 
              totalQuestions={questionsData?.length || 10} 
            />
            
            {/* Achievement notification */}
            {showAchievement && (
              <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-full shadow-lg animate-bounce">
                <div className="flex items-center">
                  <i className="material-icons mr-2">emoji_events</i>
                  <span>Achievement Unlocked: <strong>{achievementTitle}</strong></span>
                </div>
              </div>
            )}
            
            {isLoading || loadingQuestions ? (
              <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-5/6 mb-8" />
                
                <div className="space-y-4 mb-6">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
                
                <div className="flex justify-between">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            ) : questionsData && questionsData.length > 0 ? (
              <QuestionCard 
                question={questionsData[currentQuestionIndex]}
                onNext={handleNextQuestion}
                onPrev={handlePrevQuestion}
                onAnswerSelect={handleAnswerSelect}
                isFirstQuestion={currentQuestionIndex === 0}
                isLastQuestion={currentQuestionIndex === questionsData.length - 1}
                currentAnswer={answers[questionsData[currentQuestionIndex]?.id]}
                isLoading={isCompleting}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-xl p-8 mb-6 text-center">
                <p className="text-gray-600">No questions available for this survey type.</p>
              </div>
            )}
          </>
        )}
        
        {currentStep === 'demographics' && (
          <Card className="w-full shadow-xl">
            <CardHeader className="bg-primary/5">
              <CardTitle>Just a Few More Questions</CardTitle>
              <CardDescription>
                These optional questions help us better understand your responses and provide more personalized insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {(() => {
                const survey = surveyData?.data || surveyData;
                const enabled = survey?.demographics || {};
                return (
                  <>
                    {enabled.collectAge && (
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

                    {enabled.collectGender && (
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

                    {enabled.collectLocation && (
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

                    {enabled.collectEducation && (
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

                    {enabled.collectIncome && (
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
                  </>
                );
              })()}
            </CardContent>
            <CardContent className="pt-0">
              <div className="flex justify-end">
                <Button onClick={handleDemographicsSubmit} disabled={isCompleting}>
                  {isCompleting ? "Submitting..." : "Continue"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {currentStep === 'results' && sessionId && (
          <ResultsPreview 
            sessionId={sessionId} 
            traits={traits} 
            surveyType={surveyType}
          />
        )}
      </div>
    </main>
  );
};

export default SurveyPage;
