import React, { useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { api } from "@/lib/api";
import { 
  PlusCircle, 
  Pencil, 
  Trash2, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Image, 
  Save, 
  Loader2, 
  Check, 
  X, 
  Copy, 
  Eye, 
  Search, 
  Settings,
  MoveUp,
  MoveDown,
  List,
  Grid2X2,
  Share2,
  Send
} from "lucide-react";
import SurveyDeployment from "./SurveyDeployment";

// Import survey categories and questions
import { surveyCategories } from "@/lib/surveyQuestions";
import { SurveyQuestion as SurveyQuestionType } from "@shared/schema";

// Define types
interface SurveyTemplate {
  id: number;
  title: string;
  description: string;
  surveyType: string;
  isActive: boolean;
  questions: SurveyQuestion[];
  customTheme?: string;
  createdAt: string;
  updatedAt: string;
  estimatedTime?: number;
  questionCount?: number;
  traits?: string[];
  image?: string;
}

interface SurveyQuestion {
  id: number;
  question: string;
  questionType: string;
  required: boolean;
  helpText?: string;
  order: number;
  options: QuestionOption[];
  sliderConfig?: {
    minLabel: string;
    maxLabel: string;
  };
  scenarioText?: string;
}

interface QuestionOption {
  id: string;
  text: string;
  value: string;
  image?: string;
  description?: string;
  traits?: Record<string, number>;
}

// Templates List Component
const TemplatesList = ({ 
  templates, 
  isLoading, 
  error, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onViewTemplate,
  onDeploy 
}: { 
  templates: SurveyTemplate[]; 
  isLoading: boolean; 
  error: any; 
  onEdit: (template: SurveyTemplate) => void;
  onDelete: (id: number) => void;
  onDuplicate: (template: SurveyTemplate) => void;
  onViewTemplate: (template: SurveyTemplate) => void;
  onDeploy?: (template: SurveyTemplate) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  
  // Filter templates based on search term and filter type
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || template.surveyType === filterType;
    return matchesSearch && matchesType;
  });
  
  // Get unique survey types for filter dropdown
  const surveyTypes = Array.from(new Set(templates.map(t => t.surveyType)));
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-12 text-center text-destructive">
        <h3 className="text-lg font-medium mb-2">Error loading templates</h3>
        <p>{error.message || "An error occurred while loading templates"}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search templates..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {surveyTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Template Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden md:table-cell">Questions</TableHead>
              <TableHead className="hidden md:table-cell">Last Updated</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No templates found. Try adjusting your search or create a new template.
                </TableCell>
              </TableRow>
            ) : (
              filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{template.title}</span>
                      <span className="text-xs text-muted-foreground md:hidden">
                        {template.surveyType} • {template.questionCount || template.questions.length} questions
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {template.surveyType.charAt(0).toUpperCase() + template.surveyType.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {template.questionCount || template.questions.length}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {template.isActive ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onViewTemplate(template)} 
                        title="View Template"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onEdit(template)} 
                        title="Edit Template"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onDuplicate(template)} 
                        title="Duplicate Template"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {onDeploy && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onDeploy(template)} 
                          title="Deploy to Client"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive" 
                            title="Delete Template"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Template</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{template.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(template.id)} className="bg-destructive text-destructive-foreground">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Question Editor Component
const QuestionEditor = ({ 
  question, 
  onChange, 
  onMoveUp, 
  onMoveDown, 
  onDelete,
  isFirst,
  isLast
}: { 
  question: SurveyQuestion; 
  onChange: (updatedQuestion: SurveyQuestion) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({
      ...question,
      [e.target.name]: e.target.value
    });
  };
  
  const handleTypeChange = (value: string) => {
    onChange({
      ...question,
      questionType: value
    });
  };
  
  const handleRequiredChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...question,
      required: e.target.checked
    });
  };
  
  const handleOptionChange = (index: number, field: string, value: string) => {
    const updatedOptions = [...question.options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value
    };
    
    onChange({
      ...question,
      options: updatedOptions
    });
  };
  
  const addOption = () => {
    const newOptionId = `option_${Date.now()}`;
    onChange({
      ...question,
      options: [
        ...question.options,
        {
          id: newOptionId,
          text: "",
          value: newOptionId,
          image: "",
          description: ""
        }
      ]
    });
  };
  
  const removeOption = (index: number) => {
    const updatedOptions = [...question.options];
    updatedOptions.splice(index, 1);
    onChange({
      ...question,
      options: updatedOptions
    });
  };
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <div className="flex-1">
                <Input
                  name="question"
                  value={question.question}
                  onChange={handleQuestionChange}
                  placeholder="Enter question text"
                  className="text-lg font-medium"
                />
              </div>
            </div>
            {!isExpanded && (
              <div className="mt-2 ml-10 flex items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="outline">
                  {question.questionType}
                </Badge>
                <span>•</span>
                <span>{question.options.length} options</span>
                <span>•</span>
                <span>{question.required ? "Required" : "Optional"}</span>
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveUp}
              disabled={isFirst}
              title="Move Up"
            >
              <MoveUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveDown}
              disabled={isLast}
              title="Move Down"
            >
              <MoveDown className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  title="Delete Question"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Question</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this question? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`question-type-${question.id}`}>Question Type</Label>
                <Select
                  value={question.questionType}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger id={`question-type-${question.id}`}>
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="slider">Slider</SelectItem>
                    <SelectItem value="ranking">Ranking</SelectItem>
                    <SelectItem value="scenario">Scenario</SelectItem>
                    <SelectItem value="mood-board">Mood Board</SelectItem>
                    <SelectItem value="personality-matrix">Personality Matrix</SelectItem>
                    <SelectItem value="image">Image Selection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`required-${question.id}`}
                    checked={question.required}
                    onChange={handleRequiredChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor={`required-${question.id}`}>Required Question</label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={`help-text-${question.id}`}>Help Text (Optional)</Label>
              <Textarea
                id={`help-text-${question.id}`}
                name="helpText"
                value={question.helpText || ""}
                onChange={handleQuestionChange}
                placeholder="Enter additional instructions for this question"
                className="resize-none"
              />
            </div>
            
            {(question.questionType === "multiple-choice" || 
              question.questionType === "image" || 
              question.questionType === "mood-board" || 
              question.questionType === "personality-matrix" ||
              question.questionType === "ranking") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Answer Options</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addOption}
                    className="h-8"
                  >
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    Add Option
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <div key={option.id} className="flex items-start gap-3 p-3 rounded-md border bg-background">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={option.text}
                          onChange={(e) => handleOptionChange(index, "text", e.target.value)}
                          placeholder="Option text"
                          className="mb-2"
                        />
                        
                        {(question.questionType === "image" || question.questionType === "mood-board") && (
                          <div className="flex items-center gap-2">
                            <Input
                              value={option.image || ""}
                              onChange={(e) => handleOptionChange(index, "image", e.target.value)}
                              placeholder="Image URL"
                              className="flex-1"
                            />
                            {option.image && (
                              <div className="h-8 w-8 rounded border overflow-hidden">
                                <img 
                                  src={option.image} 
                                  alt={option.text} 
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "https://placehold.co/200x200?text=Image+Error";
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                        
                        <Input
                          value={option.description || ""}
                          onChange={(e) => handleOptionChange(index, "description", e.target.value)}
                          placeholder="Description (optional)"
                        />
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        disabled={question.options.length <= 1}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {(question.questionType === "scenario") && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`scenario-text-${question.id}`}>Scenario Description</Label>
                  <Textarea
                    id={`scenario-text-${question.id}`}
                    value={question.scenarioText || ""}
                    onChange={(e) => onChange({
                      ...question,
                      scenarioText: e.target.value
                    })}
                    placeholder="Enter the scenario description that users will read before answering..."
                    className="h-24 resize-none"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Answer Options</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addOption}
                    className="h-8"
                  >
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    Add Option
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <div key={option.id} className="flex items-start gap-3 p-3 rounded-md border bg-background">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={option.text}
                          onChange={(e) => handleOptionChange(index, "text", e.target.value)}
                          placeholder="Option text"
                          className="mb-2"
                        />
                        <Input
                          value={option.description || ""}
                          onChange={(e) => handleOptionChange(index, "description", e.target.value)}
                          placeholder="Description (optional)"
                        />
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        disabled={question.options.length <= 1}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {(question.questionType === "slider") && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`slider-min-${question.id}`}>Minimum Label</Label>
                    <Input
                      id={`slider-min-${question.id}`}
                      value={question.sliderConfig?.minLabel || "Low"}
                      onChange={(e) => onChange({
                        ...question,
                        sliderConfig: {
                          minLabel: e.target.value,
                          maxLabel: question.sliderConfig?.maxLabel || "High"
                        }
                      })}
                      placeholder="Low or 1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter text (e.g., "Low") or number (e.g., "1")
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`slider-max-${question.id}`}>Maximum Label</Label>
                    <Input
                      id={`slider-max-${question.id}`}
                      value={question.sliderConfig?.maxLabel || "High"}
                      onChange={(e) => onChange({
                        ...question,
                        sliderConfig: {
                          minLabel: question.sliderConfig?.minLabel || "Low",
                          maxLabel: e.target.value
                        }
                      })}
                      placeholder="High or 10"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter text (e.g., "High") or number (e.g., "10")
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Template Editor Component
const TemplateEditor = ({
  template,
  onSave,
  onCancel,
  isSaving
}: {
  template: SurveyTemplate;
  onSave: (updatedTemplate: SurveyTemplate) => void;
  onCancel: () => void;
  isSaving: boolean;
}) => {
  const [editedTemplate, setEditedTemplate] = useState<SurveyTemplate>(template);
  const [activeView, setActiveView] = useState<string>("details");
  
  // Handle basic template detail changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditedTemplate({
      ...editedTemplate,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle select changes
  const handleSelectChange = (field: string, value: string) => {
    setEditedTemplate({
      ...editedTemplate,
      [field]: value
    });
  };
  
  // Toggle active status
  const toggleActive = () => {
    setEditedTemplate({
      ...editedTemplate,
      isActive: !editedTemplate.isActive
    });
  };

  // Limit traits to the 5 Gemini traits
  const allowedGeminiTraits = [
    { name: "Innovation", category: "behavioral" },
    { name: "Analytical Thinking", category: "cognitive" },
    { name: "Leadership", category: "social" },
    { name: "Adaptability", category: "behavioral" },
    { name: "Creativity", category: "cognitive" }
  ];

  const toggleTrait = (traitName: string) => {
    const current = editedTemplate.traits || [];
    const exists = current.includes(traitName);
    const updated = exists
      ? current.filter(t => t !== traitName)
      : [...current, traitName];
    setEditedTemplate({
      ...editedTemplate,
      traits: updated
    });
  };
  
  // Update a specific question
  const updateQuestion = (index: number, updatedQuestion: SurveyQuestion) => {
    const updatedQuestions = [...editedTemplate.questions];
    updatedQuestions[index] = updatedQuestion;
    setEditedTemplate({
      ...editedTemplate,
      questions: updatedQuestions
    });
  };
  
  // Add a new question
  const addQuestion = () => {
    const newId = Math.max(0, ...editedTemplate.questions.map(q => q.id)) + 1;
    const newOrder = Math.max(0, ...editedTemplate.questions.map(q => q.order)) + 1;
    
    const newQuestion = createEmptyQuestion();
    newQuestion.id = newId;
    newQuestion.question = "New Question";
    newQuestion.order = newOrder;
    newQuestion.options = [
      {
        id: `option_${Date.now()}`,
        text: "Option 1",
        value: "option_1",
        image: "",
        description: ""
      }
    ];
    
    setEditedTemplate({
      ...editedTemplate,
      questions: [...editedTemplate.questions, newQuestion]
    });
  };
  
  // Delete a question
  const deleteQuestion = (index: number) => {
    const updatedQuestions = [...editedTemplate.questions];
    updatedQuestions.splice(index, 1);
    
    // Reorder questions
    const reorderedQuestions = updatedQuestions.map((q, idx) => ({
      ...q,
      order: idx + 1
    }));
    
    setEditedTemplate({
      ...editedTemplate,
      questions: reorderedQuestions
    });
  };
  
  // Move question up
  const moveQuestionUp = (index: number) => {
    if (index <= 0) return;
    
    const updatedQuestions = [...editedTemplate.questions];
    const temp = updatedQuestions[index];
    updatedQuestions[index] = updatedQuestions[index - 1];
    updatedQuestions[index - 1] = temp;
    
    // Update order values
    const reorderedQuestions = updatedQuestions.map((q, idx) => ({
      ...q,
      order: idx + 1
    }));
    
    setEditedTemplate({
      ...editedTemplate,
      questions: reorderedQuestions
    });
  };
  
  // Move question down
  const moveQuestionDown = (index: number) => {
    if (index >= editedTemplate.questions.length - 1) return;
    
    const updatedQuestions = [...editedTemplate.questions];
    const temp = updatedQuestions[index];
    updatedQuestions[index] = updatedQuestions[index + 1];
    updatedQuestions[index + 1] = temp;
    
    // Update order values
    const reorderedQuestions = updatedQuestions.map((q, idx) => ({
      ...q,
      order: idx + 1
    }));
    
    setEditedTemplate({
      ...editedTemplate,
      questions: reorderedQuestions
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-bold">
          {template.id ? "Edit Survey Template" : "Create Survey Template"}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onSave(editedTemplate)} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Template
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue={activeView} value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6 pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Template Name</Label>
              <Input
                id="title"
                name="title"
                value={editedTemplate.title}
                onChange={handleInputChange}
                placeholder="Enter template name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="surveyType">Template Type</Label>
              <Select
                value={editedTemplate.surveyType}
                onValueChange={(value) => handleSelectChange("surveyType", value)}
              >
                <SelectTrigger id="surveyType">
                  <SelectValue placeholder="Select template type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personality">Personality</SelectItem>
                  <SelectItem value="consumer-preferences">Consumer Preferences</SelectItem>
                  <SelectItem value="employee-satisfaction">Employee Satisfaction</SelectItem>
                  <SelectItem value="market-research">Market Research</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={editedTemplate.description}
                onChange={handleInputChange}
                placeholder="Describe the purpose of this template"
                className="h-32 resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
              <Input
                id="estimatedTime"
                name="estimatedTime"
                type="number"
                value={editedTemplate.estimatedTime || 10}
                onChange={handleInputChange}
                placeholder="10"
                min="1"
                max="120"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image">Template Preview Image URL</Label>
              <Input
                id="image"
                name="image"
                value={editedTemplate.image || ""}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />
              {editedTemplate.image && (
                <div className="mt-2">
                  <img 
                    src={editedTemplate.image} 
                    alt="Template preview" 
                    className="h-20 w-32 object-cover rounded border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/200x200?text=Image+Error";
                    }}
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Personality Traits (select up to 5)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allowedGeminiTraits.map(t => {
                  const checked = (editedTemplate.traits || []).includes(t.name);
                  return (
                    <label key={t.name} className="flex items-center gap-2 p-2 border rounded-md cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTrait(t.name)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{t.name}</span>
                      <Badge variant="outline" className="ml-auto">{t.category}</Badge>
                    </label>
                  );
                })}
              </div>
              {(editedTemplate.traits && editedTemplate.traits.length > 0) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {editedTemplate.traits!.filter(t => allowedGeminiTraits.some(a => a.name === t)).map((trait, index) => (
                    <Badge key={index} variant="secondary">{trait}</Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Only the following traits are allowed: Innovation, Analytical Thinking, Leadership, Adaptability, Creativity
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={editedTemplate.isActive}
                onChange={toggleActive}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="isActive">Template is active and available for use</label>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Appearance</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customTheme">Custom Theme</Label>
                <Select
                  value={editedTemplate.customTheme || "default"}
                  onValueChange={(value) => handleSelectChange("customTheme", value)}
                >
                  <SelectTrigger id="customTheme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="colorful">Colorful</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="questions" className="space-y-6 pt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Questions</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8" onClick={addQuestion}>
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                Add Question
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            {editedTemplate.questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 border rounded-md bg-muted/20">
                <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Questions Yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  This template doesn't have any questions yet. Add your first question to get started.
                </p>
                <Button onClick={addQuestion}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add First Question
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {editedTemplate.questions
                  .sort((a, b) => a.order - b.order)
                  .map((question, index) => (
                    <QuestionEditor
                      key={question.id}
                      question={question}
                      onChange={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
                      onMoveUp={() => moveQuestionUp(index)}
                      onMoveDown={() => moveQuestionDown(index)}
                      onDelete={() => deleteQuestion(index)}
                      isFirst={index === 0}
                      isLast={index === editedTemplate.questions.length - 1}
                    />
                  ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="pt-6">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-primary h-16 flex items-center px-6">
              <h3 className="text-lg font-medium text-primary-foreground">Template Preview</h3>
            </div>
            
            <div className="p-6 bg-card">
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">{editedTemplate.title}</h1>
                  <p className="text-muted-foreground">{editedTemplate.description}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-8">
                  {editedTemplate.questions
                    .sort((a, b) => a.order - b.order)
                    .map((question, index) => (
                      <div key={question.id} className="space-y-4">
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium flex items-center">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm mr-2">
                              {index + 1}
                            </span>
                            {question.question}
                            {question.required && <span className="text-destructive ml-1">*</span>}
                          </h3>
                          {question.helpText && <p className="text-sm text-muted-foreground">{question.helpText}</p>}
                        </div>
                        
                        {(question.questionType === "multiple-choice") && (
                          <div className="space-y-2">
                            {question.options.map((option) => (
                              <div key={option.id} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id={`preview-${question.id}-${option.id}`}
                                  name={`preview-${question.id}`}
                                  className="h-4 w-4"
                                  disabled
                                />
                                <label htmlFor={`preview-${question.id}-${option.id}`} className="text-sm">
                                  {option.text}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {(question.questionType === "image" || question.questionType === "mood-board") && (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {question.options.map((option) => (
                              <div key={option.id} className="border rounded-md overflow-hidden bg-background">
                                <div className="h-32 bg-muted flex items-center justify-center">
                                  {option.image ? (
                                    <img
                                      src={option.image}
                                      alt={option.text}
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = "https://placehold.co/200x200?text=Preview";
                                      }}
                                    />
                                  ) : (
                                    <Image className="h-8 w-8 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="p-3">
                                  <p className="font-medium text-sm">{option.text}</p>
                                  {option.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {(question.questionType === "text") && (
                          <div>
                            <Input disabled placeholder="Text input field" />
                          </div>
                        )}
                        
                        {(question.questionType === "slider") && (
                          <div className="py-6 px-2">
                            <div className="h-2 bg-muted rounded-full relative">
                              <div className="absolute h-4 w-4 rounded-full bg-primary top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2"></div>
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                              <span>{question.sliderConfig?.minLabel || "Low"}</span>
                              <span>{question.sliderConfig?.maxLabel || "High"}</span>
                            </div>
                          </div>
                        )}
                        
                        {(question.questionType === "ranking") && (
                          <div className="space-y-3">
                            <div className="text-sm text-muted-foreground mb-3">
                              Drag to reorder (preview shows numbered list)
                            </div>
                            {question.options?.map((option, idx) => (
                              <div key={option.id} className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/30">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                  {idx + 1}
                                </div>
                                <div className="flex-1">
                                  <span className="text-sm font-medium">{option.text}</span>
                                  {option.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Rank {idx + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {(question.questionType === "scenario") && (
                          <div className="space-y-4">
                            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                              <div className="flex items-start space-x-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs">
                                  <span>📖</span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-blue-900">Scenario</p>
                                  <p className="text-xs text-blue-700 mt-1">
                                    {question.scenarioText || "A detailed scenario description would appear here"}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {question.options?.map((option) => (
                                <div key={option.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                                  <input 
                                    type="radio" 
                                    disabled 
                                    className="h-4 w-4 text-primary" 
                                  />
                                  <div className="flex-1">
                                    <span className="text-sm font-medium">{option.text}</span>
                                    {option.description && (
                                      <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {(question.questionType === "personality-matrix") && (
                          <div className="space-y-4">
                            <div className="text-sm text-muted-foreground mb-2">
                              Personality matrix grid (preview shows options in grid)
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {question.options?.map((option) => (
                                <div key={option.id} className="p-3 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-sm transition-shadow">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-xs">
                                      <span>🧠</span>
                                    </div>
                                    <span className="text-sm font-medium text-purple-900">{option.text}</span>
                                  </div>
                                  {option.description && (
                                    <p className="text-xs text-purple-700">{option.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="text-xs text-muted-foreground text-center">
                              Users would select multiple traits that apply to them
                            </div>
                          </div>
                        )}
                        
                        {index < editedTemplate.questions.length - 1 && <Separator className="my-6" />}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Template View Component
const TemplateViewer = ({ template, onBack }: { template: SurveyTemplate; onBack: () => void }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onBack}>
            <ChevronDown className="h-4 w-4 rotate-90" />
            Back
          </Button>
          <h2 className="text-xl font-bold ml-2">Template Details</h2>
        </div>
        
        <Badge className={template.isActive ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}>
          {template.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{template.title}</CardTitle>
          <CardDescription>{template.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Template Details</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Type:</dt>
                    <dd>{template.surveyType}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Questions:</dt>
                    <dd>{template.questionCount || template.questions.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Estimated Time:</dt>
                    <dd>{template.estimatedTime || 10} minutes</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Created:</dt>
                    <dd>{new Date(template.createdAt).toLocaleDateString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Last Updated:</dt>
                    <dd>{new Date(template.updatedAt).toLocaleDateString()}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Theme & Appearance</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Theme:</dt>
                    <dd>{template.customTheme || "Default"}</dd>
                  </div>
                  {template.image && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Preview Image:</dt>
                      <dd>
                        <img 
                          src={template.image} 
                          alt="Template preview" 
                          className="h-12 w-20 object-cover rounded border"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/200x200?text=Image+Error";
                          }}
                        />
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
            
            <Separator />
            
            {template.traits && template.traits.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Personality Traits</h3>
                <div className="flex flex-wrap gap-2">
                  {template.traits.map((trait, index) => (
                    <Badge key={index} variant="secondary">
                      {trait}
                    </Badge>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            )}
            
            <div>
              <h3 className="font-medium mb-4">Questions</h3>
              <ScrollArea className="h-[500px] rounded-md border p-4">
                <div className="space-y-8">
                  {template.questions
                    .sort((a, b) => a.order - b.order)
                    .map((question, index) => (
                      <div key={question.id} className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium flex items-center">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-sm mr-2">
                                {index + 1}
                              </span>
                              {question.question}
                              {question.required && <span className="text-destructive ml-1">*</span>}
                            </h4>
                            {question.helpText && <p className="text-sm text-muted-foreground">{question.helpText}</p>}
                          </div>
                          <Badge variant="outline">{question.questionType}</Badge>
                        </div>
                        
                        {question.options && question.options.length > 0 && (
                          <div className="ml-7 space-y-2">
                            {(question.questionType === "multiple-choice") && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                                {question.options.map((option) => (
                                  <div key={option.id} className="flex items-center py-1">
                                    <div className="h-3 w-3 rounded-full border mr-2"></div>
                                    <span>{option.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {(question.questionType === "image" || question.questionType === "mood-board") && (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {question.options.map((option) => (
                                  <div key={option.id} className="flex flex-col border rounded-md overflow-hidden">
                                    {option.image && (
                                      <div className="h-24 bg-muted">
                                        <img
                                          src={option.image}
                                          alt={option.text}
                                          className="h-full w-full object-cover"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "https://placehold.co/200x200?text=Image";
                                          }}
                                        />
                                      </div>
                                    )}
                                    <div className="p-2">
                                      <p className="text-sm">{option.text}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {(question.questionType === "text") && (
                              <div className="ml-7">
                                <div className="p-3 border rounded bg-muted/30">
                                  <span className="text-sm text-muted-foreground">Text input field</span>
                                </div>
                              </div>
                            )}
                            
                            {(question.questionType === "slider") && (
                              <div className="ml-7">
                                <div className="py-4 px-2">
                                  <div className="h-2 bg-muted rounded-full relative">
                                    <div className="absolute h-4 w-4 rounded-full bg-primary top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2"></div>
                                  </div>
                                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                    <span>{question.sliderConfig?.minLabel || "Low"}</span>
                                    <span>{question.sliderConfig?.maxLabel || "High"}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {(question.questionType === "ranking") && (
                              <div className="ml-7 space-y-2">
                                {question.options?.map((option, idx) => (
                                  <div key={option.id} className="flex items-center space-x-3 p-2 border rounded bg-muted/30">
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                      {idx + 1}
                                    </div>
                                    <span className="text-sm">{option.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {(question.questionType === "scenario") && (
                              <div className="ml-7 space-y-3">
                                <div className="p-3 border rounded bg-blue-50 border-blue-200">
                                  <div className="flex items-start space-x-2">
                                    <span className="text-blue-600">📖</span>
                                    <div>
                                      <p className="text-sm font-medium text-blue-900">Scenario</p>
                                      <p className="text-xs text-blue-700">{question.scenarioText || "Scenario description would appear here"}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  {question.options?.map((option) => (
                                    <div key={option.id} className="flex items-center space-x-2 p-2 border rounded">
                                      <div className="h-3 w-3 rounded-full border"></div>
                                      <span className="text-sm">{option.text}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {(question.questionType === "personality-matrix") && (
                              <div className="ml-7">
                                <div className="grid grid-cols-2 gap-2">
                                  {question.options?.map((option) => (
                                    <div key={option.id} className="p-2 border rounded bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-purple-600 text-xs">🧠</span>
                                        <span className="text-sm font-medium text-purple-900">{option.text}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {index < template.questions.length - 1 && <Separator className="mt-6" />}
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Define empty template
const emptyTemplate: SurveyTemplate = {
  id: 0,
  title: "",
  description: "",
  surveyType: "general",
  isActive: true,
  questions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  estimatedTime: 10,
  questionCount: 0,
  traits: [],
  image: ""
};

const createEmptyQuestion = (): SurveyQuestion => ({
  id: Date.now(),
  question: "",
  questionType: "multiple-choice",
  required: true,
  helpText: "",
  order: 1,
  options: [
    {
      id: `option_${Date.now()}`,
      text: "",
      value: `option_${Date.now()}`,
      image: "",
      description: ""
    }
  ],
  sliderConfig: {
    minLabel: "Low",
    maxLabel: "High"
  },
  scenarioText: ""
});

// Main Component
const SurveyTemplates = () => {
  const [view, setView] = useState<"list" | "edit" | "create" | "view">("list");
  const [currentTemplate, setCurrentTemplate] = useState<SurveyTemplate | null>(null);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [templateToDeploy, setTemplateToDeploy] = useState<SurveyTemplate | null>(null);
  
  // API Calls - Use api.get to properly unwrap the response
  const { 
    data: templatesResponse, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['/api/templates'],
    queryFn: async () => {
      const response = await api.get('/api/templates');
      return response;
    },
    staleTime: 1000 * 60, // 1 minute
  });

  // Debug logging
  useEffect(() => {
    if (templatesResponse) {
      console.log('🔍 Templates data received:', templatesResponse);
      console.log('🔍 Templates type:', typeof templatesResponse);
      if (Array.isArray(templatesResponse)) {
        console.log('🔍 Templates array length:', templatesResponse.length);
      } else if (templatesResponse && typeof templatesResponse === 'object') {
        console.log('🔍 Templates keys:', Object.keys(templatesResponse));
      }
    }
    if (error) {
      console.error('❌ Templates error:', error);
    }
  }, [templatesResponse, error]);
  
  // Save/update template mutation
  const saveMutation = useMutation({
    mutationFn: (template: SurveyTemplate) => {
      // Prepare template data with required fields
      const templateData = {
        ...template,
        type: template.surveyType, // Map surveyType to type as required by backend
        questionCount: template.questions.length,
        estimatedTime: template.estimatedTime || 10
      };
      
      return template.id
        ? api.put(`/api/templates/${template.id}`, templateData)
        : api.post('/api/templates', templateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Success",
        description: "Survey template saved successfully",
      });
      setView("list");
      setCurrentTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to save template: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Success",
        description: "Survey template deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete template: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  });
  
  // Transform API response to SurveyTemplate format
  // The api.get function unwraps the response, so we may get either:
  // 1. Direct array: [{ id, title, ... }, ...]
  // 2. Wrapped response: { status: 'success', data: [...] }
  const surveyTemplates: SurveyTemplate[] = (() => {
    if (!templatesResponse) return [];
    
    // If it's already an array, use it directly
    if (Array.isArray(templatesResponse)) {
      return templatesResponse.map((template: any) => ({
        id: template.id,
        title: template.title || '',
        description: template.description || '',
        surveyType: template.surveyType || template.type || 'general',
        isActive: template.isActive !== undefined ? template.isActive : (template.is_active !== undefined ? template.is_active : true),
        questions: (template.questions || []).map((q: any) => ({
          id: q.id || 0,
          question: q.question || '',
          questionType: q.questionType || q.question_type || 'multiple-choice',
          required: q.required !== undefined ? q.required : true,
          order: q.order || 0,
          helpText: q.helpText || q.help_text,
          options: q.options || [],
          sliderConfig: q.sliderConfig || q.slider_config,
          scenarioText: q.scenarioText || q.scenario_text,
        })),
        customTheme: template.customTheme || template.custom_theme,
        createdAt: template.createdAt || template.created_at || new Date().toISOString(),
        updatedAt: template.updatedAt || template.updated_at || new Date().toISOString(),
        estimatedTime: template.estimatedTime || template.estimated_time,
        questionCount: template.questionCount || template.question_count || (template.questions?.length || 0),
        traits: template.traits || [],
        image: template.image,
      }));
    }
    
    // If it's an object with a data property, extract the data
    if (templatesResponse && typeof templatesResponse === 'object' && 'data' in templatesResponse) {
      const data = (templatesResponse as any).data;
      if (Array.isArray(data)) {
        return data.map((template: any) => ({
          id: template.id,
          title: template.title || '',
          description: template.description || '',
          surveyType: template.surveyType || template.type || 'general',
          isActive: template.isActive !== undefined ? template.isActive : (template.is_active !== undefined ? template.is_active : true),
          questions: (template.questions || []).map((q: any) => ({
            id: q.id || 0,
            question: q.question || '',
            questionType: q.questionType || q.question_type || 'multiple-choice',
            required: q.required !== undefined ? q.required : true,
            order: q.order || 0,
            helpText: q.helpText || q.help_text,
            options: q.options || [],
            sliderConfig: q.sliderConfig || q.slider_config,
            scenarioText: q.scenarioText || q.scenario_text,
          })),
          customTheme: template.customTheme || template.custom_theme,
          createdAt: template.createdAt || template.created_at || new Date().toISOString(),
          updatedAt: template.updatedAt || template.updated_at || new Date().toISOString(),
          estimatedTime: template.estimatedTime || template.estimated_time,
          questionCount: template.questionCount || template.question_count || (template.questions?.length || 0),
          traits: template.traits || [],
          image: template.image,
        }));
      }
    }
    
    return [];
  })();
  
  // Create a new template
  const handleCreateTemplate = () => {
    setCurrentTemplate({...emptyTemplate});
    setView("create");
  };
  
  // Edit existing template
  const handleEditTemplate = (template: SurveyTemplate) => {
    setCurrentTemplate(template);
    setView("edit");
  };
  
  // View template details
  const handleViewTemplate = (template: SurveyTemplate) => {
    setCurrentTemplate(template);
    setView("view");
  };
  
  // Delete template
  const handleDeleteTemplate = (id: number) => {
    deleteMutation.mutate(id);
  };
  
  // Duplicate template
  const handleDuplicateTemplate = (template: SurveyTemplate) => {
    const duplicate = {
      ...template,
      id: 0,
      title: `${template.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setCurrentTemplate(duplicate);
    setView("create");
  };

  // Check if template name already exists
  const isTemplateNameExists = (name: string, excludeId?: number) => {
    return surveyTemplates.some(template => 
      template.title.toLowerCase() === name.toLowerCase() && 
      template.id !== excludeId
    );
  };
  
  // Deploy template to client
  const handleDeployTemplate = (template: SurveyTemplate) => {
    setTemplateToDeploy(template);
    setDeployDialogOpen(true);
  };
  
  // Save template changes
  const handleSaveTemplate = (template: SurveyTemplate) => {
    // Validate template name
    if (!template.title.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate template names
    if (isTemplateNameExists(template.title, template.id)) {
      toast({
        title: "Error",
        description: "A template with this name already exists. Please choose a different name.",
        variant: "destructive",
      });
      return;
    }

    // Validate questions
    if (template.questions.length === 0) {
      toast({
        title: "Warning",
        description: "This template has no questions. Are you sure you want to save it?",
        variant: "destructive",
      });
    }

    saveMutation.mutate(template);
  };
  
  // Return to template list
  const handleCancel = () => {
    setView("list");
    setCurrentTemplate(null);
  };
  


  // Conditional rendering based on current view
  if (view === "edit" && currentTemplate) {
    return (
      <TemplateEditor
        template={currentTemplate}
        onSave={handleSaveTemplate}
        onCancel={handleCancel}
        isSaving={saveMutation.isPending}
      />
    );
  }
  
  if (view === "create") {
    return (
      <TemplateEditor
        template={currentTemplate || emptyTemplate}
        onSave={handleSaveTemplate}
        onCancel={handleCancel}
        isSaving={saveMutation.isPending}
      />
    );
  }
  
  if (view === "view" && currentTemplate) {
    return (
      <TemplateViewer
        template={currentTemplate}
        onBack={handleCancel}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle className="text-xl font-bold">Survey Templates</CardTitle>
              <CardDescription>
                Manage and customize survey templates
              </CardDescription>
            </div>
            <div>
              <Button onClick={handleCreateTemplate}>
                <PlusCircle className="mr-1 h-4 w-4" />
                Create Template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TemplatesList
            templates={surveyTemplates}
            isLoading={isLoading}
            error={error}
            onEdit={handleEditTemplate}
            onDelete={handleDeleteTemplate}
            onDuplicate={handleDuplicateTemplate}
            onViewTemplate={handleViewTemplate}
            onDeploy={handleDeployTemplate}
          />
        </CardContent>
      </Card>
      
      {/* Survey Deployment Dialog */}
      {deployDialogOpen && templateToDeploy && (
        <SurveyDeployment 
          open={deployDialogOpen}
          onOpenChange={setDeployDialogOpen}
          survey={templateToDeploy}
        />
      )}
    </div>
  );
};

export default SurveyTemplates;