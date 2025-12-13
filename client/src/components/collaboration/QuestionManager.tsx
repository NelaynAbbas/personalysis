import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  PlusCircle, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Lock, 
  Unlock, 
  Copy, 
  Edit
} from 'lucide-react';

// Define question type
export type QuestionType = 'text' | 'multiple_choice' | 'rating' | 'yes_no' | 'image' | 'matrix';

// Define question option type
export interface QuestionOption {
  id: string;
  text: string;
  value: string | number;
}

// Define the question interface
export interface SurveyQuestion {
  id: string;
  title: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  options?: QuestionOption[];
  isLocked?: boolean;
  lockedBy?: number;
  lockedByUsername?: string;
  order: number;
}

interface QuestionManagerProps {
  sessionId: number;
  questions: SurveyQuestion[];
  userId: number;
  username: string;
  readOnly?: boolean;
  onAddQuestion: (question: Omit<SurveyQuestion, 'id' | 'order'>) => void;
  onUpdateQuestion: (questionId: string, updates: Partial<SurveyQuestion>) => void;
  onDeleteQuestion: (questionId: string) => void;
  onMoveQuestion: (questionId: string, direction: 'up' | 'down') => void;
  onLockQuestion: (questionId: string, lock: boolean) => void;
  onAddOption: (questionId: string, option: Omit<QuestionOption, 'id'>) => void;
  onUpdateOption: (questionId: string, optionId: string, updates: Partial<QuestionOption>) => void;
  onDeleteOption: (questionId: string, optionId: string) => void;
}

const QuestionManager: React.FC<QuestionManagerProps> = ({
  sessionId,
  questions,
  userId,
  username,
  readOnly = false,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onMoveQuestion,
  onLockQuestion,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
}) => {
  const [newQuestion, setNewQuestion] = useState<{
    title: string;
    description: string;
    type: QuestionType;
    required: boolean;
  }>({
    title: '',
    description: '',
    type: 'text',
    required: false,
  });
  
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [newOption, setNewOption] = useState<{ text: string; value: string }>({ text: '', value: '' });
  const { toast } = useToast();
  
  // Reset new option when active question changes
  useEffect(() => {
    setNewOption({ text: '', value: '' });
  }, [activeQuestionId]);
  
  // Find the active question object
  const activeQuestion = activeQuestionId 
    ? questions.find(q => q.id === activeQuestionId) 
    : null;
  
  // Handle adding a new question
  const handleAddQuestion = () => {
    if (!newQuestion.title) {
      toast({
        title: 'Error',
        description: 'Question title is required',
        variant: 'destructive',
      });
      return;
    }
    
    onAddQuestion(newQuestion);
    
    // Reset the new question form
    setNewQuestion({
      title: '',
      description: '',
      type: 'text',
      required: false,
    });
    
    toast({
      title: 'Question Added',
      description: `"${newQuestion.title}" has been added to the survey`,
    });
  };
  
  // Handle adding a new option to a question
  const handleAddOption = () => {
    if (!activeQuestionId) return;
    if (!newOption.text || !newOption.value) {
      toast({
        title: 'Error',
        description: 'Option text and value are required',
        variant: 'destructive',
      });
      return;
    }
    
    onAddOption(activeQuestionId, newOption);
    setNewOption({ text: '', value: '' });
    
    toast({
      title: 'Option Added',
      description: `"${newOption.text}" has been added to the question`,
    });
  };
  
  // Check if the current user has locked a question
  const isLockedByCurrentUser = (question: SurveyQuestion) => {
    return question.isLocked && question.lockedBy === userId;
  };
  
  // Check if a question is locked by another user
  const isLockedByOtherUser = (question: SurveyQuestion) => {
    return question.isLocked && question.lockedBy !== userId;
  };
  
  return (
    <div className="space-y-6">
      {/* Question List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Survey Questions</h3>
        
        {questions.length === 0 ? (
          <div className="text-center p-4 border border-dashed rounded-md text-muted-foreground">
            No questions added yet. Add your first question below.
          </div>
        ) : (
          questions.map((question, index) => (
            <Card 
              key={question.id} 
              className={`
                ${activeQuestionId === question.id ? 'ring-2 ring-primary' : ''}
                ${question.isLocked ? 'bg-muted/50' : ''}
              `}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge>{index + 1}</Badge>
                    <CardTitle className="text-base">{question.title}</CardTitle>
                    {question.required && (
                      <Badge variant="outline" className="text-destructive">Required</Badge>
                    )}
                    {question.isLocked && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        {question.lockedByUsername}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {/* Question type indicator */}
                    <Badge variant="outline">{question.type.replace('_', ' ')}</Badge>
                    
                    {/* Question actions */}
                    {!readOnly && (
                      <div className="flex items-center space-x-1">
                        {/* Move question up/down buttons */}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onMoveQuestion(question.id, 'up')}
                          disabled={index === 0 || isLockedByOtherUser(question)}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onMoveQuestion(question.id, 'down')}
                          disabled={index === questions.length - 1 || isLockedByOtherUser(question)}
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                        
                        {/* Lock/unlock button */}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onLockQuestion(question.id, !question.isLocked)}
                          disabled={isLockedByOtherUser(question)}
                          title={question.isLocked ? "Unlock question" : "Lock question for editing"}
                        >
                          {question.isLocked ? (
                            <Unlock className="h-4 w-4 text-green-600" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                        </Button>
                        
                        {/* Edit button */}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setActiveQuestionId(question.id)}
                          disabled={isLockedByOtherUser(question)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        {/* Delete button */}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onDeleteQuestion(question.id)}
                          disabled={isLockedByOtherUser(question)}
                          className="hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {question.description && (
                  <CardDescription>{question.description}</CardDescription>
                )}
              </CardHeader>
              
              {/* Show options for appropriate question types */}
              {(['multiple_choice', 'rating', 'yes_no'].includes(question.type) && question.options) && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2">
                    {question.options.map(option => (
                      <div 
                        key={option.id} 
                        className="flex items-center p-2 border rounded-md"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{option.text}</div>
                          <div className="text-sm text-muted-foreground">Value: {option.value}</div>
                        </div>
                        
                        {/* Option actions - only shown for active question and not locked by others */}
                        {activeQuestionId === question.id && !isLockedByOtherUser(question) && !readOnly && (
                          <div className="flex items-center">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => onDeleteOption(question.id, option.id)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
      
      {/* Active Question Editor */}
      {activeQuestionId && activeQuestion && !readOnly && !isLockedByOtherUser(activeQuestion) && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Question Title</label>
              <Input 
                value={activeQuestion.title}
                onChange={(e) => onUpdateQuestion(activeQuestionId, { title: e.target.value })}
                placeholder="Enter question title"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea 
                value={activeQuestion.description || ''}
                onChange={(e) => onUpdateQuestion(activeQuestionId, { description: e.target.value })}
                placeholder="Enter additional instructions for the question"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Question Type</label>
                <Select 
                  value={activeQuestion.type}
                  onValueChange={(value) => onUpdateQuestion(activeQuestionId, { 
                    type: value as QuestionType 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a question type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="yes_no">Yes/No</SelectItem>
                    <SelectItem value="image">Image Upload</SelectItem>
                    <SelectItem value="matrix">Matrix</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end space-x-2">
                <div className="flex items-center space-x-2 h-10">
                  <Checkbox 
                    id="required"
                    checked={activeQuestion.required}
                    onCheckedChange={(checked) => 
                      onUpdateQuestion(activeQuestionId, { required: !!checked })
                    }
                  />
                  <label htmlFor="required" className="text-sm font-medium">
                    Required Question
                  </label>
                </div>
              </div>
            </div>
            
            {/* Option editor for multiple choice questions */}
            {['multiple_choice', 'rating', 'yes_no'].includes(activeQuestion.type) && (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">Options</h4>
                
                {/* Add new option */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Input 
                      value={newOption.text}
                      onChange={(e) => setNewOption({ ...newOption, text: e.target.value })}
                      placeholder="Option text"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      value={newOption.value}
                      onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                      placeholder="Value"
                    />
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={handleAddOption}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Current options */}
                {activeQuestion.options && activeQuestion.options.length > 0 && (
                  <div className="border rounded-md p-2 space-y-2">
                    <h5 className="text-sm font-medium">Current Options</h5>
                    {activeQuestion.options.map(option => (
                      <div key={option.id} className="flex items-center space-x-2 text-sm">
                        <div className="flex-1">{option.text}</div>
                        <div className="text-muted-foreground">({option.value})</div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onDeleteOption(activeQuestionId, option.id)}
                          className="h-6 w-6"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end pt-2">
              <Button 
                variant="outline"
                onClick={() => setActiveQuestionId(null)}
              >
                Done Editing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Add New Question Form */}
      {!readOnly && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Question Title</label>
              <Input 
                value={newQuestion.title}
                onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                placeholder="Enter question title"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea 
                value={newQuestion.description}
                onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
                placeholder="Enter additional instructions for the question"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Question Type</label>
                <Select 
                  value={newQuestion.type}
                  onValueChange={(value) => setNewQuestion({ 
                    ...newQuestion, 
                    type: value as QuestionType 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a question type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="yes_no">Yes/No</SelectItem>
                    <SelectItem value="image">Image Upload</SelectItem>
                    <SelectItem value="matrix">Matrix</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end space-x-2">
                <div className="flex items-center space-x-2 h-10">
                  <Checkbox 
                    id="new-required"
                    checked={newQuestion.required}
                    onCheckedChange={(checked) => 
                      setNewQuestion({ ...newQuestion, required: !!checked })
                    }
                  />
                  <label htmlFor="new-required" className="text-sm font-medium">
                    Required Question
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button onClick={handleAddQuestion}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuestionManager;