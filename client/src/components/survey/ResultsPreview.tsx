import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PersonalityTrait } from "@shared/schema";
import { surveyCategories } from "@/lib/surveyQuestions";
import { useState, useEffect } from "react";

interface ResultsPreviewProps {
  sessionId: string;
  traits: PersonalityTrait[];
  surveyType?: string;
}

const ResultsPreview = ({ sessionId, traits, surveyType = "general" }: ResultsPreviewProps) => {
  const [, setLocation] = useLocation();
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Get survey category info
  const surveyCategory = surveyCategories.find(c => c.id === surveyType) || surveyCategories[0];
  
  // Get the top 3 traits to display with defensive programming
  const topTraits = (traits && Array.isArray(traits) && traits.length > 0)
    ? [...traits]
        .sort((a, b) => (b?.score || 0) - (a?.score || 0))
        .slice(0, 3)
        .map(trait => ({
          name: trait?.name || "Unknown Trait",
          score: trait?.score || 50,
          category: trait?.category || "general"
        }))
    : [];
  
  const handleViewFullResults = () => {
    // Navigate to results page with just the session ID to avoid query params issues
    setLocation(`/results/${sessionId}`);
  };
  
  // Get appropriate icon based on survey type
  const getSurveyIcon = () => {
    const iconMap: Record<string, string> = {
      general: "psychology",
      career: "work",
      consumer: "shopping_cart",
      innovation: "lightbulb",
      sustainability: "eco"
    };
    
    return iconMap[surveyType] || "insights";
  };
  
  // Get appropriate title based on survey type
  const getResultTitle = () => {
    if (surveyCategory?.name) {
      return `Your ${surveyCategory.name} Analysis`;
    }
    return "Your Digital Personality Profile";
  };
  
  return (
    <Card className="bg-white rounded-xl shadow-xl p-8 mb-6">
      <CardContent className="p-0">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-primary to-secondary mb-4">
            <i className="material-icons text-white text-3xl">{getSurveyIcon()}</i>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {getResultTitle()}
          </h2>
          <p className="text-gray-600 mt-2">
            Quest complete! Based on your choices, we've unlocked insights about your {surveyCategory?.traits?.join(", ")?.toLowerCase() || "personality"}.
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Top Traits</h3>
          <div className="space-y-5">
            {topTraits.map((trait, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between mb-2">
                  <div className="flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-primary' : 
                      index === 1 ? 'bg-secondary' : 
                      'bg-accent'
                    } mr-2`}></span>
                    <span className="font-medium text-gray-800">{trait.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">{trait.score}%</span>
                </div>
                <Progress 
                  value={trait.score} 
                  className="w-full bg-gray-200 rounded-full h-2.5"
                  indicatorClassName={`h-2.5 rounded-full ${
                    index === 0 ? 'bg-primary' : 
                    index === 1 ? 'bg-secondary' : 
                    'bg-accent'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center">
          <Button
            onClick={handleViewFullResults}
            className="inline-flex items-center px-8 py-4 rounded-md text-white bg-gradient-to-r from-primary to-secondary hover:shadow-lg transition-all duration-200 text-lg"
          >
            See Full Analysis
            <i className="material-icons ml-2">dashboard</i>
          </Button>
          <p className="text-sm text-gray-500 mt-3">
            Unlock detailed insights and actionable recommendations
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsPreview;
