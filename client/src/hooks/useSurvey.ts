import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SurveyQuestion } from "@shared/schema";

interface UseSurveyParams {
  onComplete?: (sessionId: string, traits: any[]) => void;
}

export const useSurvey = ({ onComplete }: UseSurveyParams = {}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [surveyType, setSurveyType] = useState<string>('general');
  
  // Start survey session mutation
  const { mutate: startSurvey, isPending: isStarting } = useMutation({
    mutationFn: async (companyId?: number) => {
      // Get company ID from user if not provided
      let userCompanyId = companyId;
      if (!userCompanyId) {
        const userResponse = await fetch('/api/me');
        const userData = await userResponse.json();
        userCompanyId = userData?.user?.company_id || 1;
      }
      
      const response = await apiRequest('POST', '/api/survey/start', {
        companyId: userCompanyId
      });
      return response.json();
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setSessionStartTime(data.startTime);
    }
  });
  
  // Submit answer mutation
  const { mutate: submitAnswer, isPending: isSubmitting } = useMutation({
    mutationFn: async (data: { questionId: number; answer: string }) => {
      if (!sessionId) throw new Error("No active session");
      
      const response = await apiRequest('POST', '/api/survey/answer', {
        sessionId,
        questionId: data.questionId,
        answer: data.answer
      });
      return response.json();
    }
  });
  
  // Complete survey mutation
  const { mutate: completeSurvey, isPending: isCompleting } = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error("No active session");
      
      // Format answers to match backend expectations
      const formattedResponses = Object.entries(answers).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        answer: answer
      }));
      
      console.log('Completing survey with responses:', formattedResponses);
      
      const response = await apiRequest('POST', '/api/survey/complete', {
        sessionId,
        surveyType,
        startTime: sessionStartTime, // Include the session start time
        responses: formattedResponses,
        demographics: {}
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (onComplete) {
        onComplete(sessionId, data.traits);
      }
    }
  });
  
  const handleStart = () => {
    startSurvey();
  };
  
  const handleAnswer = (question: SurveyQuestion, answer: string) => {
    // Save answer locally
    setAnswers(prev => ({ 
      ...prev, 
      [question.id]: answer 
    }));
    
    // Submit answer to server
    submitAnswer({
      questionId: question.id,
      answer
    });
  };
  
  const handleNextQuestion = (questions: SurveyQuestion[], answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Save and submit the answer
    handleAnswer(currentQuestion, answer);
    
    // Move to next question or complete
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Complete the survey
      completeSurvey();
    }
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const isLoading = isStarting || isSubmitting || isCompleting;
  
  return {
    currentQuestionIndex,
    sessionId,
    answers,
    surveyType,
    setSurveyType,
    isLoading,
    handleStart,
    handleAnswer,
    handleNextQuestion,
    handlePrevQuestion
  };
};
