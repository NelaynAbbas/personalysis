import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, Filter, Clock, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Template interface matching database structure
interface SurveyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedCompletionTime: number;
  questions: any[];
  tags?: string[];
}

interface TemplateBrowserProps {
  onSelectTemplate: (template: SurveyTemplate) => void;
  onCreateBlank: () => void;
}

/**
 * Template Browser Component
 * 
 * Allows users to browse and select from predefined survey templates
 */
export function TemplateBrowser({ onSelectTemplate, onCreateBlank }: TemplateBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [templatePreview, setTemplatePreview] = useState<SurveyTemplate | null>(null);
  
  // Fetch templates from database
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['/api/templates'],
    queryFn: () => api.get('/api/templates'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Transform API templates to match expected structure
  // The api.get function unwraps the response, so templatesData is directly the array
  const surveyTemplates: SurveyTemplate[] = templatesData && Array.isArray(templatesData)
    ? templatesData.map((t: any) => ({
        id: t.id,
        name: t.title,
        description: t.description,
        category: t.surveyType || 'General',
        estimatedCompletionTime: t.estimatedTime || 10,
        questions: t.questions || [],
        tags: []
      }))
    : [];
  
  // Group templates by category
  const categories = Array.from(new Set(surveyTemplates.map(t => t.category)));
  
  // Filter templates based on search and category
  const filteredTemplates = surveyTemplates.filter(template => {
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Survey Templates</h1>
        <Button onClick={onCreateBlank}>Create Blank Survey</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium">Categories</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${
                  selectedCategory === 'all' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent'
                }`}
              >
                All Templates
              </button>
              
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${
                    selectedCategory === category 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
              <h3 className="font-medium mb-1">Loading templates...</h3>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No templates found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <Card key={template.id} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  </CardContent>
                  
                  <CardFooter className="p-4 border-t flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <FileQuestion className="h-3.5 w-3.5" />
                        <span>{template.questions.length}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{template.estimatedCompletionTime} min</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setTemplatePreview(template)}
                      >
                        Preview
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => onSelectTemplate(template)}
                      >
                        Use
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Template preview dialog */}
      <Dialog open={!!templatePreview} onOpenChange={(open) => !open && setTemplatePreview(null)}>
        <DialogContent className="sm:max-w-3xl">
          {templatePreview && (
            <>
              <DialogHeader>
                <DialogTitle>{templatePreview.name}</DialogTitle>
                <DialogDescription>
                  {templatePreview.description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 text-sm">
                      <FileQuestion className="h-4 w-4 text-muted-foreground" />
                      <span>{templatePreview.questions.length} questions</span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>~{templatePreview.estimatedCompletionTime} min completion time</span>
                    </div>
                  </div>
                  
                  <div className="text-sm font-medium bg-accent px-3 py-1 rounded-full">
                    {templatePreview.category}
                  </div>
                </div>
                
                <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                  {templatePreview.questions.map((question, index) => (
                    <div key={question.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Question {index + 1}</span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {question.type}
                        </span>
                      </div>
                      
                      <p className="font-medium mb-1">{question.question}</p>
                      
                      {question.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {question.description}
                        </p>
                      )}
                      
                      {question.options && (
                        <div className="mt-2">
                          <span className="text-xs font-medium">Options:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                            {question.options.map((option, i) => (
                              <div key={i} className="text-xs py-1 px-2 bg-muted rounded">
                                {option}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {question.required && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Required question
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setTemplatePreview(null)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  onSelectTemplate(templatePreview);
                  setTemplatePreview(null);
                }}>
                  Use This Template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}