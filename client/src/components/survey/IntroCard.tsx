import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { surveyCategories, surveyTypes } from "@/lib/surveyQuestions";

interface IntroCardProps {
  onStart: (surveyType: string) => void;
}

const IntroCard = ({ onStart }: IntroCardProps) => {
  const [selectedSurvey, setSelectedSurvey] = useState("general");
  const [showPulse, setShowPulse] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Start a gentle pulse animation to draw attention
  setTimeout(() => {
    setShowPulse(false);
  }, 5000);

  return (
    <Card className="bg-white rounded-xl shadow-xl p-8 mb-6 overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-2">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Personality Quest
            </span>
          </h1>
          <div className="absolute top-0 right-0">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
              <i className="material-icons text-primary text-2xl">psychology</i>
            </div>
          </div>
        </div>
        
        <p className="text-lg text-gray-600 mb-6">
          Embark on a journey of self-discovery through our interactive personality assessments. 
          Choose your quest path below!
        </p>
        
        {/* Survey selector dropdown */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Choose your personality quest:</h3>
            
            <select 
              className="block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              value={selectedSurvey}
              onChange={(e) => setSelectedSurvey(e.target.value)}
            >
              {surveyCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Dynamic survey content based on selection */}
        <div className="p-4 bg-gray-50 rounded-lg mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 rounded-lg overflow-hidden">
              <img 
                src={surveyCategories.find(c => c.id === selectedSurvey)?.image} 
                alt={surveyCategories.find(c => c.id === selectedSurvey)?.name} 
                className="w-full h-40 object-cover"
              />
            </div>
            <div className="md:w-2/3">
              <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
                {surveyCategories.find(c => c.id === selectedSurvey)?.name}
              </h3>
              <p className="text-gray-600 mb-3">
                {surveyCategories.find(c => c.id === selectedSurvey)?.description}
              </p>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Discover insights about:</h4>
                <div className="flex flex-wrap gap-2">
                  {surveyCategories.find(c => c.id === selectedSurvey)?.traits.map((trait, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {surveyTypes[selectedSurvey as keyof typeof surveyTypes]?.questions.length || 10} engaging questions • 
                Approx. {Math.ceil((surveyTypes[selectedSurvey as keyof typeof surveyTypes]?.questions.length || 10) * 0.5)} mins
              </div>
            </div>
          </div>
        </div>
        
        {/* Dynamic info box based on selected survey */}
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {selectedSurvey === 'general' && <i className="material-icons text-primary">psychology</i>}
              {selectedSurvey === 'career' && <i className="material-icons text-primary">work</i>}
              {selectedSurvey === 'consumer' && <i className="material-icons text-primary">shopping_cart</i>}
              {selectedSurvey === 'innovation' && <i className="material-icons text-primary">lightbulb</i>}
              {selectedSurvey === 'sustainability' && <i className="material-icons text-primary">eco</i>}
              {selectedSurvey === 'digital' && <i className="material-icons text-primary">devices</i>}
              {selectedSurvey === 'emotional' && <i className="material-icons text-primary">favorite</i>}
              {selectedSurvey === 'learning' && <i className="material-icons text-primary">school</i>}
              {selectedSurvey === 'bigfive' && <i className="material-icons text-primary">stars</i>}
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">
                {selectedSurvey === 'general' && "What makes this fun?"}
                {selectedSurvey === 'career' && "Boost your professional growth"}
                {selectedSurvey === 'consumer' && "Understand your buying decisions"}
                {selectedSurvey === 'innovation' && "Unlock your creative potential"}
                {selectedSurvey === 'sustainability' && "Discover your environmental impact"}
                {selectedSurvey === 'digital' && "Navigate your digital self"}
                {selectedSurvey === 'emotional' && "Enhance your emotional intelligence"}
                {selectedSurvey === 'learning' && "Optimize your learning journey"}
                {selectedSurvey === 'bigfive' && "The science behind personality"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedSurvey === 'general' && 
                  "This isn't just a standard personality test - it's designed as a gamified experience that provides meaningful insights through enjoyable scenario-based questions!"}
                {selectedSurvey === 'career' && 
                  "Our Professional Profile assessment helps you identify your leadership style, ideal work environment, and growth opportunities to advance your career trajectory."}
                {selectedSurvey === 'consumer' && 
                  "Explore how your values shape your purchasing decisions, brand relationships, and product preferences to make more satisfying consumer choices."}
                {selectedSurvey === 'innovation' && 
                  "Measure your creative thinking patterns, problem-solving approaches, and readiness to embrace new ideas in this innovation mindset assessment."}
                {selectedSurvey === 'sustainability' && 
                  "Evaluate your environmental awareness, sustainable lifestyle choices, and long-term thinking to discover your impact on the world around you."}
                {selectedSurvey === 'digital' && 
                  "Analyze your technology adoption patterns, online behavior, and digital preferences to better understand your relationship with the connected world."}
                {selectedSurvey === 'emotional' && 
                  "Assess your ability to recognize emotions, practice empathy, and navigate social situations with our emotional intelligence framework."}
                {selectedSurvey === 'learning' && 
                  "Identify your optimal learning style, knowledge retention strategies, and growth mindset characteristics to maximize your development potential."}
                {selectedSurvey === 'bigfive' && 
                  "Based on the scientifically-validated Five Factor Model, this assessment measures the big five dimensions of personality: Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism."}
              </p>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={() => onStart(selectedSurvey)}
          className={`w-full inline-flex justify-center items-center px-6 py-4 rounded-md text-white 
            ${isHovered ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-primary'}
            transition-all duration-300 text-lg shadow-lg hover:shadow-primary/30`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <i className="material-icons mr-2">play_circle</i>
          Begin Your {surveyCategories.find(c => c.id === selectedSurvey)?.name} Quest
        </Button>
      </CardContent>
    </Card>
  );
};

export default IntroCard;
