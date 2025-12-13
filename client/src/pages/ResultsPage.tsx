import React, { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, Share2 } from "lucide-react";
import { SurveyShareModal } from "@/components/survey/SurveyShareModal";

// Interface for personality trait from API
interface PersonalityTrait {
  trait: string;
  score: number;
  description: string;
}

// Interface for insights from API
interface InsightsData {
  strengths: string[];
  challenges: string[];
  suggestions: string[];
}

// Interface for the full response format from the API
interface SurveyResultsData {
  responseId: number;
  surveyId: number;
  submittedAt?: string;
  personalityTraits: PersonalityTrait[];
  insights: InsightsData;
  careerMatches: string[];
}

const ResultsPage: React.FC = () => {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [, setLocation] = useLocation();

  const [match, params] = useRoute("/results/:responseId");
  const responseId = match ? params.responseId : null;

  // Store the responseId in localStorage for later retrieval
  useEffect(() => {
    if (responseId) {
      localStorage.setItem('lastResponseId', responseId);
    }
  }, [responseId]);

  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/survey/results/${responseId}`],
    queryFn: async () => {
      // Use custom fetch for results to avoid auto-logout on 401
      // Results should be accessible for public surveys
      const response = await fetch(`/api/survey/results/${responseId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorJson = await response.json();
          throw new Error(`${response.status}: ${JSON.stringify(errorJson)}`);
        } else {
          const text = await response.text();
          throw new Error(`${response.status}: ${text || response.statusText}`);
        }
      }
      
      return await response.json();
    },
    enabled: !!responseId,
    retry: 3
  });

  // Debugging logs for data and errors
  useEffect(() => {
    if (data) {
      console.log("Results data:", data);
    }
    if (error) {
      console.error("Error loading results:", error);
    }
  }, [data, error]);
  
  // First check for response ID
  if (!responseId) {
    return (
      <main className="container mx-auto px-4 py-10">
        <Card className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl p-8">
          <CardContent className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Session</h2>
            <p className="text-gray-600 mb-6">No session ID provided.</p>
            <Button onClick={() => setLocation('/dashboard')}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10">
        <Card className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-8">
          <CardContent>
            <div className="text-center mb-8">
              <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error) {
    // Check if it's a 401 error (shouldn't happen for public surveys, but handle gracefully)
    const errorMessage = error instanceof Error ? error.message : String(error);
    const is401Error = errorMessage.includes('401') || errorMessage.includes('Unauthorized');
    
    return (
      <main className="container mx-auto px-4 py-10">
        <Card className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl p-8">
          <CardContent className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="text-red-500 h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {is401Error ? 'Results Not Available' : 'Error Loading Results'}
            </h2>
            <p className="text-gray-600 mb-6">
              {is401Error 
                ? 'The survey results are not publicly available. Please contact the survey administrator for access.'
                : 'We couldn\'t load your personality results. Please try again or contact support if the problem persists.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
              <Button onClick={() => setLocation('/')}>Return Home</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }
  
  if (!data) {
    return (
      <main className="container mx-auto px-4 py-10">
        <Card className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl p-8">
          <CardContent className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="text-red-500 h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Results Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find your personality results. Please try taking the survey again.
            </p>
            <Button onClick={() => setLocation('/')}>Return Home</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // The data is nested inside a data field from the API response
  const responseData = data?.data;
  
  console.log('DEBUG: Full API response:', data);
  console.log('DEBUG: Response data:', responseData);
  
  // Extract data with safety measures (only after we've confirmed responseData exists)
  const personalityTraits = responseData?.traits && Array.isArray(responseData.traits) 
    ? responseData.traits : [];
    
  console.log('DEBUG: Extracted personality traits:', personalityTraits);
    
  // Convert other properties for backward compatibility with component
  const insights = responseData?.insights || {};
  const careerMatches = responseData?.careerMatches || [];
  
  // For logging purposes
  console.log("Personality traits:", personalityTraits);
  if (personalityTraits.length === 0) {
    console.warn("No traits found in results, using empty array");
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <CardContent className="p-0">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mr-4"
                  onClick={() => setLocation('/dashboard')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">Your Personality Results</h1>
              </div>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShareModalOpen(true)}
                className="text-primary border-primary hover:bg-primary/10"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Results
              </Button>
            </div>

            <SurveyShareModal
              open={shareModalOpen}
              onOpenChange={setShareModalOpen}
              sessionId={responseId}
              defaultTitle="My Personality Assessment Results"
              defaultType="personality"
            />

            {personalityTraits.length > 0 ? (
              <div className="mb-8">
                <h2 className="text-xl font-medium text-gray-900 mb-4">Personality Traits</h2>
                <div className="space-y-4">
                  {personalityTraits
                    .sort((a, b) => b.score - a.score)
                    .map((trait, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-base font-medium text-gray-700">{trait.name}</span>
                          <span className="text-sm font-medium text-gray-700">{trait.score}%</span>
                        </div>
                        <Progress 
                          value={trait.score} 
                          className="w-full h-3 mt-1"
                        />
                        <p className="mt-3 text-sm text-gray-500">
                          Category: {trait.category}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="mb-8">
                <h2 className="text-xl font-medium text-gray-900 mb-4">Personality Traits</h2>
                <div className="border rounded-lg p-4 bg-yellow-50">
                  <p className="text-gray-600">
                    No personality traits found in the survey results. This might be a data processing issue.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Debug info: Found {personalityTraits.length} traits in response data.
                  </p>
                </div>
              </div>
            )}

            {/* Insights section */}
            {insights && insights.strengths && insights.strengths.length > 0 && (
              <div className="border rounded-lg p-4 mb-8">
                <h2 className="text-xl font-medium text-gray-900 mb-4">Your Insights</h2>
                
                {/* Strengths */}
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Strengths</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {insights.strengths.map((strength, index) => (
                      <li key={index} className="text-gray-700">{strength}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Challenges */}
                {insights.challenges && insights.challenges.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Areas for Growth</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {insights.challenges.map((challenge, index) => (
                        <li key={index} className="text-gray-700">{challenge}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Suggestions */}
                {insights.suggestions && insights.suggestions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Recommendations</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {insights.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-gray-700">{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {/* Career matches section */}
            {careerMatches && careerMatches.length > 0 && (
              <div className="border rounded-lg p-4 mb-8 bg-primary/5">
                <h2 className="text-xl font-medium text-gray-900 mb-2">Career Matches</h2>
                <div className="flex flex-wrap gap-2 mt-3">
                  {careerMatches.map((career, index) => (
                    <span key={index} className="px-3 py-1 bg-primary/20 text-primary rounded-full">
                      {career}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default ResultsPage;