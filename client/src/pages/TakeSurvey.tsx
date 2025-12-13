import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// API Response interfaces
interface ApiResponse<T> {
  status: string;
  data: T;
}

interface Survey {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  responseCount: number;
  type: string;
}

interface SurveyResponse {
  status: string;
  data: Survey;
}

interface Question {
  id: number;
  text: string;
  options: string[];
}

const TakeSurvey = () => {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);

  // Get survey details
  const { data: surveyData, isLoading: isSurveyLoading, error: surveyError } = useQuery<SurveyResponse>({
    queryKey: [`/api/surveys/${params.id}`],
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Get survey questions
  const { data: questionsData, isLoading: isQuestionsLoading, error: questionsError } = useQuery<ApiResponse<any[]>>({
    queryKey: [`/api/surveys/${params.id}/questions`],
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Combined loading state
  const isLoading = isSurveyLoading || isQuestionsLoading;

  // Combined error state
  const error = surveyError || questionsError;

  // Process the questions from the API response
  const questions = questionsData?.data || [];

  // Submit survey mutation
  const { mutate: submitSurvey, isPending: isSubmitting } = useMutation({
    mutationFn: async () => {
      // First log survey answers to see what's being sent
      console.log("Submitting survey answers:", answers);
      
      // Format answers to match API expectations
      // Convert the answers object to an array of response objects
      const formattedAnswers = Object.entries(answers).map(([questionId, response]) => ({
        questionId: parseInt(questionId),
        answer: response  // Use 'answer' instead of 'response' to match backend expectations
      }));
      
      // Fetch user demographics from the API or user session
      // This would normally come from user profile or session data
      const getDemographics = async () => {
        try {
          const response = await fetch('/api/user/demographics', {
            headers: {
              'X-Mock-Admin': 'true',
              'X-User-ID': '1',
              'X-User-Role': 'platform_admin'
            }
          });
          
          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.error('Error fetching user demographics:', error);
        }
        
        // Return default demographics if API call fails
        return {
          age: null,
          gender: null,
          location: null
        };
      };
      
      const demographics = await getDemographics();
      
      // Get or create session ID
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        // Start a survey session if we don't have one
        try {
          const userResponse = await fetch('/api/me');
          const userData = await userResponse.json();
          const companyId = userData?.user?.company_id || 1;
          
          const sessionResponse = await apiRequest('POST', '/api/survey/start', {
            companyId,
            surveyType: survey?.type || 'general',
            surveyId: parseInt(params.id)
          });
          const sessionData = await sessionResponse.json();
          currentSessionId = sessionData.sessionId;
          setSessionId(currentSessionId);
          setSessionStartTime(sessionData.startTime);
        } catch (error) {
          console.error('Error creating session:', error);
        }
      }
      
      // Filter demographics based on survey settings
      const enabled = (surveyData as any)?.data?.demographics || {};
      const collectDemographics = (surveyData as any)?.data?.collectDemographics;
      const filteredDemographics: Record<string, any> = {};
      if (collectDemographics) {
        if (enabled.collectAge && demographics.age != null) filteredDemographics.age = demographics.age;
        if (enabled.collectGender && demographics.gender) filteredDemographics.gender = demographics.gender;
        if (enabled.collectLocation && demographics.location) filteredDemographics.location = demographics.location;
        if (enabled.collectEducation && demographics.education) filteredDemographics.education = demographics.education;
        if (enabled.collectIncome && demographics.income) filteredDemographics.income = demographics.income;
      }

      // Create payload with sessionId, responses, and demographics
      const payload = {
        sessionId: currentSessionId,
        surveyType: survey?.type || 'general',
        surveyId: parseInt(params.id),
        startTime: sessionStartTime, // Include the session start time
        responses: formattedAnswers,
        demographics: collectDemographics ? filteredDemographics : {}
      };
      
      console.log("Survey payload:", payload);
      
      // Post to survey completion endpoint
      const response = await apiRequest("POST", "/api/survey/complete", payload);
      console.log("Survey completion response status:", response.status);
      
      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to complete survey' }));
        console.error("Survey completion error:", errorData);
        throw new Error(errorData.message || 'Failed to complete survey');
      }
      
      const responseData = await response.json();
      console.log("Survey completed successfully, data:", responseData);
      return responseData;
    },
    onSuccess: (data) => {
      setSubmitted(true);
      toast({
        title: "Survey Submitted",
        description: "Thank you for completing the survey!",
        variant: "default"
      });
      
      // Redirect to results page after a brief delay
      setTimeout(() => {
        if (data?.data?.responseId) {
          // Fetch results after submission
          fetch(`/api/survey/results/${data.data.responseId}`, {
            headers: {
              'X-Mock-Admin': 'true',
              'X-User-ID': '1',
              'X-User-Role': 'platform_admin'
            }
          })
          .then(res => res.json())
          .then(resultsData => {
            console.log("Retrieved survey results:", resultsData);
            setLocation(`/results/${data.data.responseId}`);
          })
          .catch(err => {
            console.error("Error fetching results:", err);
            setLocation(`/results/${data.data.responseId}`);
          });
        }
      }, 1500);
    },
    onError: (error) => {
      console.error("Error submitting survey:", error);
      toast({
        title: "Submission Error",
        description: "There was a problem submitting your survey. Please try again.",
        variant: "destructive"
      });
      setShowThankYou(false);
    }
  });
  
  // Handle survey submission
  const handleSubmit = () => {
    // Immediately show Thank You while server processes results
    setShowThankYou(true);
    submitSurvey();
  };

  // Handle selecting an answer
  const handleAnswerSelect = (questionId: number, answer: string) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  // Go to next question
  const goToNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  // Go to previous question
  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Check if current question has been answered
  const isCurrentQuestionAnswered = () => {
    return !!answers[questions[currentQuestion]?.id];
  };

  // Calculate progress percentage
  const progressPercentage = ((Object.keys(answers).length / questions.length) * 100).toFixed(0);

  // Show error toast if needed
  useEffect(() => {
    if (error) {
      console.error("Survey fetch error:", error);
      toast({
        title: "Error loading survey",
        description: "Failed to load survey details. Please try again.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const survey = surveyData?.data;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/dashboard" className="flex items-center text-primary hover:underline mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Dashboard
      </Link>
      
      <Card className="shadow-lg">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-2xl font-bold">
            {isLoading ? "Loading Survey..." : survey?.title || "Personality Assessment"}
          </CardTitle>
          {!hasStarted && (
            <CardDescription>
              {survey?.description || "Complete this assessment to discover insights about your personality traits."}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              Failed to load survey. Please try again.
            </div>
          ) : !hasStarted ? (
            <div className="space-y-4">
              <div className="text-gray-700">
                <p>
                  {(survey as any)?.customWelcomeMessage || `Welcome! This survey will help us better understand your perspectives.`}
                </p>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                {((survey as any)?.estimatedTime) && (
                  <p><strong>Estimated Time:</strong> {(survey as any)?.estimatedTime} minutes</p>
                )}
                <p><strong>Questions:</strong> {questions.length}</p>
                <p><strong>Type:</strong> {(survey as any)?.surveyType || 'General'}</p>
              </div>
              <div className="pt-2">
                <Button onClick={() => setHasStarted(true)}>Start Survey</Button>
              </div>
            </div>
          ) : submitted || showThankYou ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">Thank You!</h3>
              <p className="text-gray-600 mb-2">{(survey as any)?.customCompletionMessage || 'Your responses have been recorded.'}</p>
              <p className="text-gray-500">We're preparing your personalized results...</p>
            </div>
          ) : (
            <>
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                  <span>Question {currentQuestion + 1} of {questions.length}</span>
                  <span>{progressPercentage}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Current question */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">{questions[currentQuestion]?.text}</h3>
                <div className="space-y-3">
                  {questions[currentQuestion]?.options.map((option: string, index: number) => (
                    <div 
                      key={index}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        answers[questions[currentQuestion]?.id] === option 
                          ? 'border-primary bg-primary/10' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleAnswerSelect(questions[currentQuestion].id, option)}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
        
        {!isLoading && !error && !submitted && (
          <CardFooter className="bg-gray-50 flex justify-between">
            <Button 
              variant="outline"
              onClick={goToPreviousQuestion}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            
            <Button 
              onClick={goToNextQuestion}
              disabled={!isCurrentQuestionAnswered() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Submitting</span>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                </>
              ) : (
                currentQuestion < questions.length - 1 ? 'Next' : 'Submit'
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default TakeSurvey;
