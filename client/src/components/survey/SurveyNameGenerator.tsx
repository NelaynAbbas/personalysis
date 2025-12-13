import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { RefreshCw, Check, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { generateSurveyNameOptions } from "../../lib/surveyNameGenerator";

interface SurveyNameGeneratorProps {
  initialName?: string;
  surveyType?: string;
  onSelectName: (name: string) => void;
}

export default function SurveyNameGenerator({ 
  initialName = "", 
  surveyType = "personality",
  onSelectName 
}: SurveyNameGeneratorProps) {
  const [customName, setCustomName] = useState(initialName);
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(initialName || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Generate name suggestions when component mounts or surveyType changes
  useEffect(() => {
    generateNames();
  }, [surveyType]);

  // Sync when initialName changes (e.g., editing an existing survey)
  useEffect(() => {
    if (initialName) {
      setCustomName(initialName);
      setSelectedName(initialName);
      // Apply immediately so the editor reflects the saved name by default
      onSelectName(initialName);
    }
  }, [initialName]);

  // Generate new name suggestions
  const generateNames = () => {
    setIsGenerating(true);
    
    try {
      // Generate engaging survey name options
      const nameOptions = generateSurveyNameOptions(surveyType, 5);
      setGeneratedNames(nameOptions);
      
      // If no name is currently selected, auto-select the first one
      if (!selectedName && nameOptions.length > 0) {
        setSelectedName(nameOptions[0]);
        onSelectName(nameOptions[0]);
      }
    } catch (error) {
      console.error("Error generating survey names:", error);
      toast({
        title: "Error generating names",
        description: "There was a problem creating survey name suggestions.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle name selection
  const handleSelectName = (name: string) => {
    setSelectedName(name);
    onSelectName(name);
    
    toast({
      title: "Survey name selected",
      description: "The name has been successfully applied to your survey.",
    });
  };

  // Handle custom name input
  const handleCustomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomName(e.target.value);
  };

  // Apply custom name
  const applyCustomName = () => {
    if (customName.trim()) {
      setSelectedName(customName);
      onSelectName(customName);
      
      toast({
        title: "Custom name applied",
        description: "Your custom survey name has been set.",
      });
    } else {
      toast({
        title: "Name required",
        description: "Please enter a custom name or select a suggested one.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Survey Name Generator</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={generateNames}
                  disabled={isGenerating}
                >
                  <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generate new name suggestions</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Choose an engaging name to boost survey completion rates.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Generated name options */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500">Suggested names:</h3>
          <div className="grid grid-cols-1 gap-2">
            {generatedNames.map((name, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border cursor-pointer flex justify-between items-center
                  ${selectedName === name 
                    ? 'border-primary bg-primary-50 text-primary-900' 
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => handleSelectName(name)}
              >
                <span className="font-medium">{name}</span>
                {selectedName === name && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            ))}
            
            {generatedNames.length === 0 && !isGenerating && (
              <div className="p-4 rounded-md border border-gray-200 bg-gray-50 text-center">
                <AlertCircle className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">No name suggestions available.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={generateNames}
                >
                  Generate suggestions
                </Button>
              </div>
            )}
            
            {isGenerating && (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Generating names...</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Custom name input */}
        <div className="pt-4 border-t space-y-2">
          <h3 className="text-sm font-medium text-gray-500">Or create your own:</h3>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter a custom survey name"
              value={customName}
              onChange={handleCustomNameChange}
              className="flex-1"
            />
            <Button onClick={applyCustomName}>
              Apply
            </Button>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between bg-gray-50 rounded-b-lg">
        <div className="text-sm text-gray-500">
          Current selection:
        </div>
        {selectedName ? (
          <Badge variant="outline" className="text-primary font-medium">
            {selectedName}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-gray-400">
            No name selected
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}