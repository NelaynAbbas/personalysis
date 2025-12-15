import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import CollaborationWidget from "@/components/survey/CollaborationWidget";
import { useTranslation } from "react-i18next";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import SurveyNameGenerator from "@/components/survey/SurveyNameGenerator";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
// Removed unused Avatar imports
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, 
  ArrowLeft, 
  Briefcase,
  Clock, 
  Eye,
  FileText, 
  Info, 
  Layers, 
  LayoutGrid, 
  MessageSquare, 
  PlusCircle,
  Share, 
  Target,
  Users
} from "lucide-react";

// Survey types
enum SurveyType {
  PERSONALITY_PROFILE = "Personality Profile",
  PROFESSIONAL_PROFILE = "Professional Profile",
  CONSUMER_BEHAVIOR = "Consumer Behavior",
  INNOVATION_MINDSET = "Innovation Mindset",
  SUSTAINABILITY_ORIENTATION = "Sustainability Orientation", 
  DIGITAL_BEHAVIOR = "Digital Behavior",
  CUSTOM = "Custom Survey"
}

interface SurveyTemplate {
  id: string;
  type: SurveyType;
  title: string;
  description: string;
  estimatedTime: number;
  questionCount: number;
  traits: string[];
  recommended: boolean;
}

type QuestionOption = { id: string; text: string; value?: string; image?: string; description?: string };
type EditorQuestion = {
  id: string;
  question: string;
  questionType: string;
  required: boolean;
  helpText?: string;
  order: number;
  options: QuestionOption[];
  sliderConfig?: any;
  scenarioText?: string;
};

// Helper function to map API response to SurveyTemplate
function mapApiTemplateToSurveyTemplate(apiTemplate: any): SurveyTemplate {
  // Convert database type to display type
  // Database: "personality_profile" -> Display: "Personality Profile"
  const dbTypeToDisplayType = {
    'personality_profile': SurveyType.PERSONALITY_PROFILE,
    'professional_profile': SurveyType.PROFESSIONAL_PROFILE,
    'consumer_behavior': SurveyType.CONSUMER_BEHAVIOR,
    'innovation_mindset': SurveyType.INNOVATION_MINDSET,
    'sustainability_orientation': SurveyType.SUSTAINABILITY_ORIENTATION,
    'digital_behavior': SurveyType.DIGITAL_BEHAVIOR,
    'custom': SurveyType.CUSTOM
  };
  
  const displayType = dbTypeToDisplayType[apiTemplate.type as keyof typeof dbTypeToDisplayType] 
    || SurveyType.CUSTOM;
  
  return {
    id: String(apiTemplate.id),
    type: displayType,
    title: apiTemplate.title,
    description: apiTemplate.description,
    estimatedTime: apiTemplate.estimatedTime || 0,
    questionCount: apiTemplate.questionCount || 0,
    traits: Array.isArray(apiTemplate.traits) ? apiTemplate.traits : [],
    recommended: apiTemplate.recommended || false
  };
}

export default function SurveyCreate() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch templates from database
  const { data: templatesData, isLoading: isLoadingTemplates, error: templatesError } = useQuery({
    queryKey: ['/api/templates'],
    queryFn: () => api.get('/api/templates'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Transform API templates to SurveyTemplate format
  // The api.get function unwraps the response, so templatesData is directly the array
  const surveyTemplates: SurveyTemplate[] = templatesData && Array.isArray(templatesData)
    ? templatesData.map(mapApiTemplateToSurveyTemplate)
    : [];
  
  // Survey creation state
  const [selectedTemplate, setSelectedTemplate] = useState<string>("scratch");
  const [surveyName, setSurveyName] = useState("");
  const [surveyDescription, setSurveyDescription] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [completionMessage, setCompletionMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("templates");
  const [questionSubTab, setQuestionSubTab] = useState("customize");
  const [enableAIInsights, setEnableAIInsights] = useState(true);
  const [enableSocialSharing, setEnableSocialSharing] = useState(true);
  const [responseLimit, setResponseLimit] = useState(1000);
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [surveyLanguage, setSurveyLanguage] = useState("en");
  const [estimatedTime, setEstimatedTime] = useState<number>(10);
  const [selectedSurveyType, setSelectedSurveyType] = useState<string>('Custom Survey');
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [requireEmail, setRequireEmail] = useState(false);
  const [collectDemographics, setCollectDemographics] = useState(true);
  
  // Demographic data collection settings
  const [collectAge, setCollectAge] = useState(true);
  const [collectGender, setCollectGender] = useState(true);
  const [collectLocation, setCollectLocation] = useState(true);
  const [collectEducation, setCollectEducation] = useState(false);
  const [collectIncome, setCollectIncome] = useState(false);
  
  // AI responses settings
  const [enableAIResponses, setEnableAIResponses] = useState(false);
  
  // Business context settings
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productFeatures, setProductFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const [valueProposition, setValueProposition] = useState("");
  const [competitors, setCompetitors] = useState<Array<{name: string, url: string}>>([]);
  const [newCompetitorName, setNewCompetitorName] = useState("");
  const [newCompetitorUrl, setNewCompetitorUrl] = useState("");
  const [targetMarket, setTargetMarket] = useState<string[]>([]);
  const [newTargetMarket, setNewTargetMarket] = useState("");
  const [industry, setIndustry] = useState("");
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [newPainPoint, setNewPainPoint] = useState("");
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdSurveyId, setCreatedSurveyId] = useState<number | null>(null);

  // Questions state
  const [questions, setQuestions] = useState<EditorQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [savedQuestions, setSavedQuestions] = useState<EditorQuestion[]>([]); // Saved checkpoint
  const [questionsSaved, setQuestionsSaved] = useState(false); // Whether questions have been saved
  const [isEditingQuestions, setIsEditingQuestions] = useState(true); // Whether in edit mode
  
  // Set default template when templates are loaded
  useEffect(() => {
    if (selectedTemplate !== "scratch") return;
    setSurveyName("");
    setSurveyDescription("");
    setWelcomeMessage("");
    setCompletionMessage("");
    setQuestions([]);
  }, [selectedTemplate]);
  
  // Pre-fill form fields based on template selection
  const lastLoadedTemplateId = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedTemplate || selectedTemplate === "scratch") return;
    if (lastLoadedTemplateId.current === selectedTemplate) return;
    const t = surveyTemplates.find(t => t.id === selectedTemplate);
    if (t) {
      setSurveyName(t.title);
      setSurveyDescription(t.description);
      setWelcomeMessage(`Welcome to our ${t.type} survey. It takes about ${t.estimatedTime} minutes to complete.`);
      setCompletionMessage("Thank you for completing the survey!");
      setEstimatedTime(t.estimatedTime || 10);
      setSelectedSurveyType(String(t.type));
    }
    (async () => {
      try {
        setQuestionsLoading(true);
        const res = await api.get(`/api/templates/${selectedTemplate}`);
        const q = (res as any)?.questions || [];
        const mapped: EditorQuestion[] = q.map((x: any, idx: number) => ({
          id: String(x.id || idx),
          question: x.question || "",
          questionType: x.questionType || x.question_type || "multiple-choice",
          required: x.required ?? true,
          helpText: x.helpText || x.help_text || "",
          order: x.order ?? idx + 1,
          options: Array.isArray(x.options) ? x.options : [],
          sliderConfig: x.sliderConfig || x.slider_config,
          scenarioText: x.scenarioText || x.scenario_text,
        }));
        setQuestions(mapped);
        // Expand all by default when loading from a template
        const expandState: Record<string, boolean> = {};
        mapped.forEach(qi => { expandState[qi.id] = true; });
        setExpandedQuestions(expandState);
        lastLoadedTemplateId.current = selectedTemplate;
      } catch {
        setQuestions([]);
      } finally {
        setQuestionsLoading(false);
      }
    })();
  }, [selectedTemplate]);
  
  // Helper functions for managing arrays
  const addFeature = () => {
    if (newFeature.trim()) {
      setProductFeatures([...productFeatures, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setProductFeatures(productFeatures.filter((_, i) => i !== index));
  };

  const addCompetitor = () => {
    if (newCompetitorName.trim()) {
      setCompetitors([...competitors, { 
        name: newCompetitorName.trim(), 
        url: newCompetitorUrl.trim() || "" 
      }]);
      setNewCompetitorName("");
      setNewCompetitorUrl("");
    }
  };

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const addTargetMarket = () => {
    if (newTargetMarket.trim()) {
      setTargetMarket([...targetMarket, newTargetMarket.trim()]);
      setNewTargetMarket("");
    }
  };

  const removeTargetMarket = (index: number) => {
    setTargetMarket(targetMarket.filter((_, i) => i !== index));
  };

  const addPainPoint = () => {
    if (newPainPoint.trim()) {
      setPainPoints([...painPoints, newPainPoint.trim()]);
      setNewPainPoint("");
    }
  };

  const removePainPoint = (index: number) => {
    setPainPoints(painPoints.filter((_, i) => i !== index));
  };

  // Questions helpers
  const addQuestion = () => {
    if (!isEditingQuestions) return; // Don't allow adding when not in edit mode
    const now = Date.now();
    const nextOrder = (questions[questions.length - 1]?.order || 0) + 1;
    const updated = [
      ...questions,
      {
        id: `q_${now}`,
        question: "",
        questionType: "multiple-choice",
        required: true,
        order: nextOrder,
        options: [
          { id: `opt_${now}_1`, text: "Option 1" },
          { id: `opt_${now}_2`, text: "Option 2" }
        ],
      },
    ];
    setQuestions(updated);
    setExpandedQuestions({ ...expandedQuestions, [`q_${now}`]: true });
  };
  const updateQuestion = (id: string, updated: Partial<EditorQuestion>) => {
    if (!isEditingQuestions) return; // Don't allow updating when not in edit mode
    setQuestions(questions.map(q => (q.id === id ? { ...q, ...updated } : q)));
  };
  const deleteQuestion = (id: string) => {
    if (!isEditingQuestions) return; // Don't allow deleting when not in edit mode
    setQuestions(questions.filter(q => q.id !== id).map((q, i) => ({ ...q, order: i + 1 })));
  };
  const moveQuestion = (id: string, dir: -1 | 1) => {
    if (!isEditingQuestions) return; // Don't allow moving when not in edit mode
    const idx = questions.findIndex(q => q.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= questions.length) return;
    const copy = [...questions];
    const [item] = copy.splice(idx, 1);
    copy.splice(target, 0, item);
    setQuestions(copy.map((q, i) => ({ ...q, order: i + 1 })));
  };

  // Questions save/edit/cancel handlers
  const handleSaveQuestions = () => {
    if (questions.length < 1) {
      toast({
        title: t('pages.surveyCreate.questions.atLeastOneRequired'),
        description: t('pages.surveyCreate.questions.addQuestionBeforeSaving'),
        variant: "destructive"
      });
      return;
    }
    // Save questions locally (create checkpoint)
    setSavedQuestions(JSON.parse(JSON.stringify(questions))); // Deep copy
    setQuestionsSaved(true);
    setIsEditingQuestions(false);
    toast({
      title: t('pages.surveyCreate.questions.questionsSaved'),
      description: t('pages.surveyCreate.questions.questionsDescription'),
    });
  };

  const handleCancelQuestions = () => {
    // Revert to saved checkpoint
    setQuestions(JSON.parse(JSON.stringify(savedQuestions))); // Deep copy
    setIsEditingQuestions(false);
    toast({
      title: t('pages.surveyCreate.questions.changesCancelled'),
      description: t('pages.surveyCreate.questions.changesReverted'),
    });
  };

  const handleEditQuestions = () => {
    setIsEditingQuestions(true);
  };

  // Handle survey creation
  const handleCreateSurvey = async () => {
    if (!surveyName.trim()) {
      toast({
        title: t('pages.surveyCreate.validation.surveyNameRequired'),
        description: t('pages.surveyCreate.validation.surveyNameRequiredDescription'),
        variant: "destructive"
      });
      return;
    }
    if (questions.length < 1 || !questionsSaved) {
      toast({ 
        title: questions.length < 1 ? t('pages.surveyCreate.validation.addAtLeastOneQuestion') : t('pages.surveyCreate.validation.saveQuestionsFirst'), 
        description: questions.length < 1 ? t('pages.surveyCreate.validation.addQuestionDescription') : t('pages.surveyCreate.validation.saveQuestionsDescription'), 
        variant: "destructive" 
      });
      setActiveTab("questions");
      return;
    }
    if (!expiryDate) {
      toast({ title: t('pages.surveyCreate.validation.expiryDateRequired'), description: t('pages.surveyCreate.validation.expiryDateRequiredDescription'), variant: "destructive" });
      setActiveTab("settings");
      return;
    }
    if (!Number.isFinite(responseLimit) || responseLimit <= 0) {
      toast({ title: t('pages.surveyCreate.validation.responseLimitRequired'), description: t('pages.surveyCreate.validation.responseLimitDescription'), variant: "destructive" });
      setActiveTab("settings");
      return;
    }
    
    setIsCreating(true);
    
    try {
      const template = selectedTemplate !== "scratch" ? surveyTemplates.find(t => t.id === selectedTemplate) : undefined;
      
      const demographics = {
        collectAge,
        collectGender,
        collectLocation,
        collectEducation,
        collectIncome
      };
      
      const aiResponses = {
        enabled: enableAIResponses
      };
      
      // Prepare business context data
      const businessContext = {
        productName,
        productDescription,
        productCategory,
        productFeatures,
        valueProposition,
        competitors,
        targetMarket,
        industry,
        painPoints
      };

      const response = await apiRequest(
        "POST",
        "/api/surveys",
        {
          title: surveyName,
          description: surveyDescription,
          welcomeMessage,
          completionMessage,
          surveyType: selectedSurveyType || template?.type || SurveyType.CUSTOM,
          templateId: undefined, // we'll control template copy on server via questions presence
          estimatedTime: estimatedTime,
          enableAIInsights,
          enableSocialSharing,
          responseLimit,
          surveyLanguage,
          allowAnonymous,
          isActive,
          isPublic,
          requireEmail,
          collectDemographics,
          expiryDate,
          demographics,
          aiResponses,
          businessContext, // Add business context to the payload
          questions: (questionsSaved ? savedQuestions : questions).map(q => ({
            question: q.question,
            questionType: q.questionType,
            required: q.required,
            helpText: q.helpText,
            order: q.order,
            options: q.options,
            sliderConfig: q.sliderConfig,
            scenarioText: q.scenarioText,
          }))
        }
      );
      
      // Parse the response JSON
      const responseData = await response.json();

      toast({
        title: t('pages.surveyCreate.toast.surveyCreated'),
        description: t('pages.surveyCreate.toast.surveyCreatedDescription'),
      });

      // Invalidate the surveys query cache so dashboard shows the new survey
      queryClient.invalidateQueries({ queryKey: ['/api/surveys'] });

      // Show success modal with options
      setCreatedSurveyId(responseData.data.id);
      setShowSuccessModal(true);
      
    } catch (error) {
      toast({
        title: t('pages.surveyCreate.toast.createFailed'),
        description: t('pages.surveyCreate.toast.createFailedDescription'),
        variant: "destructive"
      });
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button
            variant="ghost"
            className="mr-4"
            onClick={() => setLocation('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('pages.surveyCreate.backToDashboard')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('pages.surveyCreate.title')}</h1>
            <p className="text-muted-foreground">{t('pages.surveyCreate.subtitle')}</p>
          </div>
        </div>
        
        {/* Add collaboration widget to show who's currently editing */}
        <CollaborationWidget 
          entityId={selectedTemplate} 
          entityType="survey_template"
          currentUserId={1} // This would come from auth context in a real app
        />
      </div>
      
      {/* Lock tab switching via header; navigation is controlled by buttons */}
      <Tabs value={activeTab} onValueChange={() => {}} className="w-full">
        <TabsList className="grid grid-cols-6 max-w-5xl mb-8">
          <TabsTrigger value="templates">
            <Layers className="h-4 w-4 mr-2" />
            {t('pages.surveyCreate.tabs.templates')}
          </TabsTrigger>
          <TabsTrigger value="questions">
            <LayoutGrid className="h-4 w-4 mr-2" />
            {t('pages.surveyCreate.tabs.questions')}
          </TabsTrigger>
          <TabsTrigger value="metadata">
            <FileText className="h-4 w-4 mr-2" />
            {t('pages.surveyCreate.tabs.metadata')}
          </TabsTrigger>
          <TabsTrigger value="business-context">
            <Briefcase className="h-4 w-4 mr-2" />
            {t('pages.surveyCreate.tabs.businessContext')}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <FileText className="h-4 w-4 mr-2" />
            {t('pages.surveyCreate.tabs.settings')}
          </TabsTrigger>
          <TabsTrigger value="final">
            <Eye className="h-4 w-4 mr-2" />
            {t('pages.surveyCreate.tabs.finalPreview')}
          </TabsTrigger>
        </TabsList>
        
        {/* TEMPLATES TAB */}
        <TabsContent value="templates">
          {isLoadingTemplates ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">{t('pages.surveyCreate.templates.loading')}</p>
              </div>
            </div>
          ) : templatesError ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-destructive">{t('pages.surveyCreate.templates.failed')}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {(templatesError as Error).message || 'Unknown error occurred'}
                </p>
              </div>
            </div>
          ) : surveyTemplates.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-muted-foreground">{t('pages.surveyCreate.templates.noTemplates')}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Start from scratch */}
              <Card
                key="scratch"
                className={`relative overflow-hidden ${selectedTemplate === "scratch" ? 'border-primary ring-2 ring-primary/20' : ''}`}
              >
                <CardHeader className="pb-3">
                  <CardTitle>{t('pages.surveyCreate.templates.startFromScratch')}</CardTitle>
                  <CardDescription>{t('pages.surveyCreate.templates.startFromScratchDescription')}</CardDescription>
                </CardHeader>
                <CardFooter className="gap-2">
                  <Button variant={selectedTemplate === "scratch" ? "default" : "outline"} className="w-full" onClick={() => setSelectedTemplate("scratch")}>
                    {selectedTemplate === "scratch" ? t('pages.surveyCreate.templates.selected') : t('pages.surveyCreate.templates.useThis')}
                  </Button>
                </CardFooter>
              </Card>
              {surveyTemplates.map((template) => (
              <Card 
                key={template.id} 
                className={`relative overflow-hidden ${selectedTemplate === template.id ? 'border-primary ring-2 ring-primary/20' : ''}`}
              >
                {template.recommended && (
                  <div className="absolute top-0 right-0">
                    <Badge className="m-2 bg-primary">{t('pages.surveyCreate.templates.recommended')}</Badge>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <CardTitle>{template.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {template.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{template.estimatedTime} {t('pages.surveyCreate.templates.minutes')}</span>
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{template.questionCount} {t('pages.surveyCreate.templates.questionsCount')}</span>
                    </div>
                  </div>

                  {template.traits.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">{t('pages.surveyCreate.templates.measuresTraits')}</p>
                      <div className="flex flex-wrap gap-1">
                        {template.traits.map((trait, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs"
                          >
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex gap-2">
                  <Button
                    variant={selectedTemplate === template.id ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    {selectedTemplate === template.id ? t('pages.surveyCreate.templates.selected') : t('pages.surveyCreate.templates.select')}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setLocation(`/templates/${template.id}/view`)}>{t('pages.surveyCreate.templates.view')}</Button>
                </CardFooter>
              </Card>
              ))}
            </div>
          )}
          
        </TabsContent>
        
        {/* QUESTIONS TAB */}
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.surveyCreate.questions.title')}</CardTitle>
              <CardDescription>{t('pages.surveyCreate.questions.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={questionSubTab} onValueChange={setQuestionSubTab} className="w-full">
                <TabsList className="grid grid-cols-2 max-w-sm">
                  <TabsTrigger value="customize">{t('pages.surveyCreate.questions.customize')}</TabsTrigger>
                  <TabsTrigger value="preview">{t('pages.surveyCreate.questions.preview')}</TabsTrigger>
                </TabsList>
                <TabsContent value="customize" className="space-y-4 pt-4">
                  {questionsLoading ? (
                    <div className="text-sm text-muted-foreground">{t('pages.surveyCreate.questions.loading')}</div>
                  ) : (
                    <div className="space-y-4">
                      {(isEditingQuestions ? questions : savedQuestions)
                        .sort((a, b) => a.order - b.order)
                        .map((q, idx) => (
                        <Card key={q.id} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 font-medium w-full">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">{idx + 1}</span>
                              {isEditingQuestions ? (
                                <Input className="w-full" value={q.question} placeholder={t('pages.surveyCreate.questions.questionText')} onChange={(e) => updateQuestion(q.id, { question: e.target.value })} />
                              ) : (
                                <div className="w-full p-2 text-sm border rounded bg-muted/50">{q.question || t('pages.surveyCreate.questions.untitled')}</div>
                              )}
                            </div>
                            {isEditingQuestions && (
                              <div className="flex items-center gap-1 ml-2">
                                <Button variant="outline" size="sm" onClick={() => setExpandedQuestions({ ...expandedQuestions, [q.id]: !expandedQuestions[q.id] })}>{expandedQuestions[q.id] ? '▾' : '▸'}</Button>
                                <Button variant="outline" size="sm" onClick={() => moveQuestion(q.id, -1)}>↑</Button>
                                <Button variant="outline" size="sm" onClick={() => moveQuestion(q.id, 1)}>↓</Button>
                                <Button variant="ghost" size="sm" onClick={() => deleteQuestion(q.id)}>🗑️</Button>
                              </div>
                            )}
                            {!isEditingQuestions && (
                              <div className="flex items-center gap-1 ml-2">
                                <Button variant="outline" size="sm" onClick={() => setExpandedQuestions({ ...expandedQuestions, [q.id]: !expandedQuestions[q.id] })}>{expandedQuestions[q.id] ? '▾' : '▸'}</Button>
                              </div>
                            )}
                          </div>

                          {expandedQuestions[q.id] && (
                          <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                              <Label>{t('pages.surveyCreate.questions.questionType')}</Label>
                              {isEditingQuestions ? (
                                <Select value={q.questionType} onValueChange={(v) => updateQuestion(q.id, { questionType: v })}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
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
                              ) : (
                                <div className="p-2 text-sm border rounded bg-muted/50">{q.questionType || "multiple-choice"}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isEditingQuestions ? (
                                <>
                                  <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(q.id, { required: e.target.checked })} />
                                  <Label>{t('pages.surveyCreate.questions.requiredQuestion')}</Label>
                                </>
                              ) : (
                                <div className="text-sm text-muted-foreground">{q.required ? t('pages.surveyCreate.questions.required') : t('pages.surveyCreate.questions.optional')}</div>
                              )}
                            </div>
                          </div>

                          {/* Help text */}
                          <div className="mb-3">
                            <Label>{t('pages.surveyCreate.questions.helpText')}</Label>
                            {isEditingQuestions ? (
                              <Textarea value={q.helpText || ""} onChange={(e) => updateQuestion(q.id, { helpText: e.target.value })} placeholder={t('pages.surveyCreate.questions.helpTextPlaceholder')} />
                            ) : (
                              <div className="p-2 text-sm border rounded bg-muted/50 min-h-[60px]">{q.helpText || t('pages.surveyCreate.questions.noHelpText')}</div>
                            )}
                          </div>

                          {/* Options per type */}
                          {q.questionType === 'multiple-choice' && (
                            <div className="space-y-2">
                              <Label>{t('pages.surveyCreate.questions.answerOptions')}</Label>
                              {(q.options || []).map((opt, i) => (
                                <div key={opt.id || i} className="flex gap-2 items-center">
                                  {isEditingQuestions ? (
                                    <>
                                      <Input value={opt.text || ''} placeholder={`Option ${i + 1}`} onChange={(e) => {
                                        const copy = [...(q.options || [])];
                                        copy[i] = { ...(copy[i] || {}), id: opt.id || `opt_${Date.now()}`, text: e.target.value } as any;
                                        updateQuestion(q.id, { options: copy });
                                      }} />
                                      <Button variant="ghost" size="sm" onClick={() => {
                                        const copy = [...(q.options || [])];
                                        copy.splice(i, 1);
                                        updateQuestion(q.id, { options: copy });
                                      }}>{t('pages.surveyCreate.questions.remove')}</Button>
                                    </>
                                  ) : (
                                    <div className="p-2 text-sm border rounded bg-muted/50 w-full">{opt.text || `Option ${i + 1}`}</div>
                                  )}
                                </div>
                              ))}
                              {isEditingQuestions && (
                                <Button variant="outline" onClick={() => updateQuestion(q.id, { options: [...(q.options || []), { id: `opt_${Date.now()}`, text: '' }] })}>{t('pages.surveyCreate.questions.addOption')}</Button>
                              )}
                            </div>
                          )}

                          {q.questionType === 'ranking' && (
                            <div className="space-y-2">
                              <Label>{t('pages.surveyCreate.questions.rankingItems')}</Label>
                              {(q.options || []).map((opt, i) => (
                                <div key={opt.id || i} className="flex gap-2 items-center">
                                  {isEditingQuestions ? (
                                    <>
                                      <Input value={opt.text || ''} placeholder={`Item ${i + 1}`} onChange={(e) => {
                                        const copy = [...(q.options || [])];
                                        copy[i] = { ...(copy[i] || {}), id: opt.id || `opt_${Date.now()}`, text: e.target.value } as any;
                                        updateQuestion(q.id, { options: copy });
                                      }} />
                                      <Button variant="ghost" size="sm" onClick={() => {
                                        const copy = [...(q.options || [])];
                                        copy.splice(i, 1);
                                        updateQuestion(q.id, { options: copy });
                                      }}>{t('pages.surveyCreate.questions.remove')}</Button>
                                    </>
                                  ) : (
                                    <div className="p-2 text-sm border rounded bg-muted/50 w-full">{opt.text || `Item ${i + 1}`}</div>
                                  )}
                                </div>
                              ))}
                              {isEditingQuestions && (
                                <Button variant="outline" onClick={() => updateQuestion(q.id, { options: [...(q.options || []), { id: `opt_${Date.now()}`, text: '' }] })}>{t('pages.surveyCreate.questions.addItem')}</Button>
                              )}
                            </div>
                          )}

                          {q.questionType === 'slider' && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>{t('pages.surveyCreate.questions.minLabel')}</Label>
                                {isEditingQuestions ? (
                                  <Input value={q.sliderConfig?.minLabel ?? ''} onChange={(e) => updateQuestion(q.id, { sliderConfig: { ...(q.sliderConfig || {}), minLabel: e.target.value } })} />
                                ) : (
                                  <div className="p-2 text-sm border rounded bg-muted/50">{q.sliderConfig?.minLabel || 'Min'}</div>
                                )}
                              </div>
                              <div>
                                <Label>{t('pages.surveyCreate.questions.maxLabel')}</Label>
                                {isEditingQuestions ? (
                                  <Input value={q.sliderConfig?.maxLabel ?? ''} onChange={(e) => updateQuestion(q.id, { sliderConfig: { ...(q.sliderConfig || {}), maxLabel: e.target.value } })} />
                                ) : (
                                  <div className="p-2 text-sm border rounded bg-muted/50">{q.sliderConfig?.maxLabel || 'Max'}</div>
                                )}
                              </div>
                            </div>
                          )}

                          {q.questionType === 'scenario' && (
                            <div className="space-y-2">
                              <Label>{t('pages.surveyCreate.questions.scenarioText')}</Label>
                              {isEditingQuestions ? (
                                <Textarea value={q.scenarioText || ''} onChange={(e) => updateQuestion(q.id, { scenarioText: e.target.value })} />
                              ) : (
                                <div className="p-2 text-sm border rounded bg-muted/50 min-h-[60px]">{q.scenarioText || 'No scenario text'}</div>
                              )}
                              <div className="space-y-2">
                                <Label>{t('pages.surveyCreate.questions.options')}</Label>
                                {(q.options || []).map((opt, i) => (
                                  <div key={opt.id || i} className="flex gap-2 items-center">
                                    {isEditingQuestions ? (
                                      <>
                                        <Input value={opt.text || ''} placeholder={`Option ${i + 1}`} onChange={(e) => {
                                          const copy = [...(q.options || [])];
                                          copy[i] = { ...(copy[i] || {}), id: opt.id || `opt_${Date.now()}`, text: e.target.value } as any;
                                          updateQuestion(q.id, { options: copy });
                                        }} />
                                        <Button variant="ghost" size="sm" onClick={() => {
                                          const copy = [...(q.options || [])];
                                          copy.splice(i, 1);
                                          updateQuestion(q.id, { options: copy });
                                        }}>{t('pages.surveyCreate.questions.remove')}</Button>
                                      </>
                                    ) : (
                                      <div className="p-2 text-sm border rounded bg-muted/50 w-full">{opt.text || `Option ${i + 1}`}</div>
                                    )}
                                  </div>
                                ))}
                                {isEditingQuestions && (
                                  <Button variant="outline" onClick={() => updateQuestion(q.id, { options: [...(q.options || []), { id: `opt_${Date.now()}`, text: '' }] })}>Add Option</Button>
                                )}
                              </div>
                            </div>
                          )}

                          {(q.questionType === 'mood-board' || q.questionType === 'image' || q.questionType === 'personality-matrix') && (
                            <div className="space-y-2">
                              <Label>Options</Label>
                              {(q.options || []).map((opt, i) => (
                                <div key={opt.id || i} className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                                  {isEditingQuestions ? (
                                    <>
                                      <Input value={opt.text || ''} placeholder={`Option ${i + 1}`} onChange={(e) => {
                                        const copy = [...(q.options || [])];
                                        copy[i] = { ...(copy[i] || {}), id: opt.id || `opt_${Date.now()}`, text: e.target.value } as any;
                                        updateQuestion(q.id, { options: copy });
                                      }} />
                                      <Input className="overflow-hidden text-ellipsis whitespace-nowrap" value={opt.image || ''} placeholder={t('pages.surveyCreate.questions.imageUrl')} onChange={(e) => {
                                        const copy = [...(q.options || [])];
                                        copy[i] = { ...(copy[i] || {}), id: opt.id || `opt_${Date.now()}`, image: e.target.value } as any;
                                        updateQuestion(q.id, { options: copy });
                                      }} />
                                      <div className="md:col-span-2">
                                        <Input value={opt.description || ''} placeholder={t('pages.surveyCreate.questions.descriptionOptional')} onChange={(e) => {
                                          const copy = [...(q.options || [])];
                                          copy[i] = { ...(copy[i] || {}), id: opt.id || `opt_${Date.now()}`, description: e.target.value } as any;
                                          updateQuestion(q.id, { options: copy });
                                        }} />
                                      </div>
                                      <div className="md:col-span-2">
                                        <Button variant="ghost" size="sm" onClick={() => {
                                          const copy = [...(q.options || [])];
                                          copy.splice(i, 1);
                                          updateQuestion(q.id, { options: copy });
                                        }}>{t('pages.surveyCreate.questions.remove')}</Button>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="p-2 text-sm border rounded bg-muted/50">{opt.text || `Option ${i + 1}`}</div>
                                      <div className="p-2 text-sm border rounded bg-muted/50 overflow-hidden text-ellipsis whitespace-nowrap">{opt.image || 'No image URL'}</div>
                                      <div className="md:col-span-2 p-2 text-sm border rounded bg-muted/50">{opt.description || 'No description'}</div>
                                    </>
                                  )}
                                </div>
                              ))}
                              {isEditingQuestions && (
                                <Button variant="outline" onClick={() => updateQuestion(q.id, { options: [...(q.options || []), { id: `opt_${Date.now()}`, text: '' }] })}>Add Option</Button>
                              )}
                            </div>
                          )}
                          </>
                          )}
                        </Card>
                      ))}
                      {questions.length === 0 && (
                        <div className="text-sm text-muted-foreground">{t('pages.surveyCreate.questions.noQuestions')}</div>
                      )}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="preview" className="space-y-6 pt-4">
                  {(isEditingQuestions ? questions : savedQuestions).length === 0 ? (
                    <div className="text-sm text-muted-foreground">{t('pages.surveyCreate.questions.noQuestionsPreview')}</div>
                  ) : (
                    (isEditingQuestions ? questions : savedQuestions).map((q, idx) => (
                      <div key={q.id} className="space-y-3">
                        <h3 className="text-base font-medium">{idx + 1}. {q.question} {q.required ? <span className="text-destructive">*</span> : null}</h3>

                        {/* Text */}
                        {q.questionType === 'text' && (
                          <div className="p-3 border rounded bg-muted/30 text-sm text-muted-foreground">Text input field</div>
                        )}

                        {/* Multiple choice */}
                        {q.questionType === 'multiple-choice' && (
                          <div className="space-y-2">
                            {(q.options || []).map((o) => (
                              <div key={o.id} className="flex items-center gap-2">
                                <input type="radio" disabled className="h-4 w-4" />
                                <Label className="text-sm">{o.text || 'Option'}</Label>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Slider */}
                        {q.questionType === 'slider' && (
                          <div className="space-y-2">
                            <div className="p-3 border rounded bg-muted/30">
                              <div className="h-2 bg-gray-200 rounded" />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{q.sliderConfig?.minLabel ?? '0'}</span>
                              <span>{q.sliderConfig?.maxLabel ?? '100'}</span>
                            </div>
                          </div>
                        )}

                        {/* Ranking */}
                        {q.questionType === 'ranking' && (
                          <div className="space-y-2 text-sm">
                            {(q.options || []).map((o, i) => (
                              <div key={o.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{i + 1}</div>
                                  <span>{o.text}</span>
                                </div>
                                <span className="text-muted-foreground">Rank {i + 1}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Scenario */}
                        {q.questionType === 'scenario' && (
                          <div className="space-y-3">
                            {q.scenarioText && (
                              <div className="p-3 border rounded bg-muted/30 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Scenario</div>
                                <div>{q.scenarioText}</div>
                              </div>
                            )}
                            <div className="space-y-2">
                              {(q.options || []).map((o) => (
                                <div key={o.id} className="flex items-center gap-2">
                                  <input type="radio" disabled className="h-4 w-4" />
                                  <Label className="text-sm">{o.text}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Image/Mood-board grid */}
                        {(q.questionType === 'mood-board' || q.questionType === 'image') && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {(q.options || []).map((o) => (
                              <div key={o.id} className="flex flex-col border rounded-md overflow-hidden">
                                {o.image && (
                                  <div className="h-24 bg-muted">
                                    <img
                                      src={o.image}
                                      alt={o.text}
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        const t = e.target as HTMLImageElement;
                                        t.src = 'https://placehold.co/200x200?text=Image';
                                      }}
                                    />
                                  </div>
                                )}
                                <div className="p-2">
                                  <p className="text-sm">{o.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Personality matrix */}
                        {q.questionType === 'personality-matrix' && (
                          <div className="flex flex-wrap gap-2">
                            {(q.options || []).map((o) => (
                              <span key={o.id} className="px-3 py-1 rounded-full text-xs bg-pink-50 text-pink-700 border border-pink-200">{o.text}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
            
            {/* Bottom action buttons for questions */}
            <div className="border-t p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {isEditingQuestions && (
                  <Button onClick={addQuestion}>{t('pages.surveyCreate.questions.addQuestion')}</Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!questionsSaved ? (
                  <Button onClick={handleSaveQuestions} disabled={questions.length < 1}>
                    {t('pages.surveyCreate.questions.saveQuestions')}
                  </Button>
                ) : (
                  <>
                    {!isEditingQuestions ? (
                      <Button onClick={handleEditQuestions}>
                        {t('pages.surveyCreate.questions.editQuestions')}
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" onClick={handleCancelQuestions}>
                          {t('common.cancel')}
                        </Button>
                        <Button onClick={handleSaveQuestions} disabled={questions.length < 1}>
                          {t('common.save')}
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* BUSINESS CONTEXT TAB */}
        <TabsContent value="business-context">
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.surveyCreate.businessContext.title')}</CardTitle>
              <CardDescription>
                {t('pages.surveyCreate.businessContext.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Product Information */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-primary" />
                  {t('pages.surveyCreate.businessContext.productInformation')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="product-name">{t('pages.surveyCreate.businessContext.productName')}</Label>
                      <Input
                        id="product-name"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder={t('pages.surveyCreate.businessContext.productNamePlaceholder')}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="product-category">{t('pages.surveyCreate.businessContext.productCategory')}</Label>
                      <Input
                        id="product-category"
                        value={productCategory}
                        onChange={(e) => setProductCategory(e.target.value)}
                        placeholder={t('pages.surveyCreate.businessContext.productCategoryPlaceholder')}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="product-description">{t('pages.surveyCreate.businessContext.productDescription')}</Label>
                    <Textarea
                      id="product-description"
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      placeholder={t('pages.surveyCreate.businessContext.productDescriptionPlaceholder')}
                      className="mt-1"
                      rows={3}
                    />

                    <div className="mt-4">
                      <Label htmlFor="value-proposition">{t('pages.surveyCreate.businessContext.valueProposition')}</Label>
                      <Textarea
                        id="value-proposition"
                        value={valueProposition}
                        onChange={(e) => setValueProposition(e.target.value)}
                        placeholder={t('pages.surveyCreate.businessContext.valuePropositionPlaceholder')}
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Product Features */}
                <div className="mt-4">
                  <Label htmlFor="product-features">{t('pages.surveyCreate.businessContext.keyFeatures')}</Label>
                  <div className="flex mt-1">
                    <Input
                      id="new-feature"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder={t('pages.surveyCreate.businessContext.addFeaturePlaceholder')}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addFeature();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={addFeature}
                      className="ml-2"
                    >
                      {t('pages.surveyCreate.businessContext.add')}
                    </Button>
                  </div>
                  
                  {productFeatures.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {productFeatures.map((feature, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="p-2"
                        >
                          {feature}
                          <button 
                            onClick={() => removeFeature(index)} 
                            className="ml-2 text-muted-foreground hover:text-foreground"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />

              {/* Target Market */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-primary" />
                  {t('pages.surveyCreate.businessContext.targetMarket')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="industry">{t('pages.surveyCreate.businessContext.industry')}</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger id="industry" className="mt-1">
                        <SelectValue placeholder={t('pages.surveyCreate.businessContext.selectIndustry')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">{t('pages.surveyCreate.businessContext.industries.technology')}</SelectItem>
                        <SelectItem value="finance">{t('pages.surveyCreate.businessContext.industries.finance')}</SelectItem>
                        <SelectItem value="healthcare">{t('pages.surveyCreate.businessContext.industries.healthcare')}</SelectItem>
                        <SelectItem value="education">{t('pages.surveyCreate.businessContext.industries.education')}</SelectItem>
                        <SelectItem value="retail">{t('pages.surveyCreate.businessContext.industries.retail')}</SelectItem>
                        <SelectItem value="manufacturing">{t('pages.surveyCreate.businessContext.industries.manufacturing')}</SelectItem>
                        <SelectItem value="hospitality">{t('pages.surveyCreate.businessContext.industries.hospitality')}</SelectItem>
                        <SelectItem value="media">{t('pages.surveyCreate.businessContext.industries.media')}</SelectItem>
                        <SelectItem value="professional_services">{t('pages.surveyCreate.businessContext.industries.professionalServices')}</SelectItem>
                        <SelectItem value="other">{t('pages.surveyCreate.businessContext.industries.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="target-market">{t('pages.surveyCreate.businessContext.targetSegments')}</Label>
                    <div className="flex mt-1">
                      <Input
                        id="new-target-market"
                        value={newTargetMarket}
                        onChange={(e) => setNewTargetMarket(e.target.value)}
                        placeholder={t('pages.surveyCreate.businessContext.addSegmentPlaceholder')}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTargetMarket();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={addTargetMarket}
                        className="ml-2"
                      >
                        {t('pages.surveyCreate.businessContext.add')}
                      </Button>
                    </div>
                    
                    {targetMarket.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {targetMarket.map((segment, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="p-2"
                          >
                            {segment}
                            <button 
                              onClick={() => removeTargetMarket(index)} 
                              className="ml-2 text-muted-foreground hover:text-foreground"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Pain Points */}
                <div className="mt-4">
                  <Label htmlFor="pain-points">{t('pages.surveyCreate.businessContext.painPoints')}</Label>
                  <div className="flex mt-1">
                    <Input
                      id="new-pain-point"
                      value={newPainPoint}
                      onChange={(e) => setNewPainPoint(e.target.value)}
                      placeholder={t('pages.surveyCreate.businessContext.addPainPointPlaceholder')}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addPainPoint();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={addPainPoint}
                      className="ml-2"
                    >
                      {t('pages.surveyCreate.businessContext.add')}
                    </Button>
                  </div>
                  
                  {painPoints.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {painPoints.map((painPoint, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="p-2"
                        >
                          {painPoint}
                          <button 
                            onClick={() => removePainPoint(index)} 
                            className="ml-2 text-muted-foreground hover:text-foreground"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />

              {/* Competitor Analysis */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-primary" />
                  {t('pages.surveyCreate.businessContext.competitorAnalysis')}
                </h3>

                <div className="mb-4">
                  <Label>{t('pages.surveyCreate.businessContext.competitors')}</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                    <Input
                      value={newCompetitorName}
                      onChange={(e) => setNewCompetitorName(e.target.value)}
                      placeholder={t('pages.surveyCreate.businessContext.competitorName')}
                    />
                    <div className="flex">
                      <Input
                        value={newCompetitorUrl}
                        onChange={(e) => setNewCompetitorUrl(e.target.value)}
                        placeholder={t('pages.surveyCreate.businessContext.websiteUrl')}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={addCompetitor}
                        className="ml-2"
                      >
                        {t('pages.surveyCreate.businessContext.add')}
                      </Button>
                    </div>
                  </div>
                </div>

                {competitors.length > 0 && (
                  <div className="border rounded-md p-4 bg-muted/30">
                    <h4 className="text-sm font-medium mb-2">{t('pages.surveyCreate.businessContext.addedCompetitors')}</h4>
                    <div className="space-y-2">
                      {competitors.map((competitor, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-background rounded border"
                        >
                          <div>
                            <p className="font-medium">{competitor.name}</p>
                            {competitor.url && (
                              <p className="text-xs text-muted-foreground">
                                {competitor.url}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCompetitor(index)}
                          >
                            {t('common.delete')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-muted/50 rounded-md border-l-4 border-primary">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">{t('pages.surveyCreate.businessContext.whyProvideContext')}</h4>
                    <p className="text-sm mt-1">
                      {t('pages.surveyCreate.businessContext.contextExplanation')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* METADATA TAB */}
        <TabsContent value="metadata">
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.surveyCreate.metadata.title')}</CardTitle>
              <CardDescription>
                {t('pages.surveyCreate.metadata.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="survey-name">{t('pages.surveyCreate.metadata.surveyName')}</Label>
                    <div className="mt-1">
                      <SurveyNameGenerator
                        initialName={surveyName}
                        surveyType={(surveyTemplates.find(t => t.id === selectedTemplate)?.type || 'custom').toLowerCase()}
                        onSelectName={setSurveyName}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="survey-type">{t('pages.surveyCreate.metadata.surveyType')}</Label>
                    <Select value={selectedSurveyType} onValueChange={setSelectedSurveyType}>
                      <SelectTrigger id="survey-type" className="mt-1">
                        <SelectValue placeholder="Select survey type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Personality Profile">{t('pages.surveyCreate.metadata.surveyTypes.personalityProfile')}</SelectItem>
                        <SelectItem value="Professional Profile">{t('pages.surveyCreate.metadata.surveyTypes.professionalProfile')}</SelectItem>
                        <SelectItem value="Consumer Behavior">{t('pages.surveyCreate.metadata.surveyTypes.consumerBehavior')}</SelectItem>
                        <SelectItem value="Innovation Mindset">{t('pages.surveyCreate.metadata.surveyTypes.innovationMindset')}</SelectItem>
                        <SelectItem value="Sustainability Orientation">{t('pages.surveyCreate.metadata.surveyTypes.sustainabilityOrientation')}</SelectItem>
                        <SelectItem value="Digital Behavior">{t('pages.surveyCreate.metadata.surveyTypes.digitalBehavior')}</SelectItem>
                        <SelectItem value="Custom Survey">{t('pages.surveyCreate.metadata.surveyTypes.customSurvey')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="survey-description">{t('pages.surveyCreate.metadata.surveyDescription')}</Label>
                    <Textarea
                      id="survey-description"
                      value={surveyDescription}
                      onChange={(e) => setSurveyDescription(e.target.value)}
                      placeholder={t('pages.surveyCreate.metadata.descriptionPlaceholder')}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="estimated-time">{t('pages.surveyCreate.metadata.estimatedTime')}</Label>
                    <Input id="estimated-time" type="number" value={estimatedTime} onChange={(e) => setEstimatedTime(Math.max(1, parseInt(e.target.value || '0')))} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="welcome-message">{t('pages.surveyCreate.metadata.welcomeMessage')}</Label>
                    <Textarea
                      id="welcome-message"
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      placeholder={t('pages.surveyCreate.metadata.welcomeMessagePlaceholder')}
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="completion-message">{t('pages.surveyCreate.metadata.completionMessage')}</Label>
                    <Textarea
                      id="completion-message"
                      value={completionMessage}
                      onChange={(e) => setCompletionMessage(e.target.value)}
                      placeholder={t('pages.surveyCreate.metadata.completionMessagePlaceholder')}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-3">{t('pages.surveyCreate.metadata.demographicData')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('pages.surveyCreate.metadata.demographicDataDescription')}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="collect-age">{t('pages.surveyCreate.metadata.collectAge')}</Label>
                        <p className="text-xs text-muted-foreground">{t('pages.surveyCreate.metadata.collectAgeDescription')}</p>
                      </div>
                      <Switch
                        id="collect-age"
                        checked={collectAge}
                        onCheckedChange={setCollectAge}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="collect-gender">{t('pages.surveyCreate.metadata.collectGender')}</Label>
                        <p className="text-xs text-muted-foreground">{t('pages.surveyCreate.metadata.collectGenderDescription')}</p>
                      </div>
                      <Switch
                        id="collect-gender"
                        checked={collectGender}
                        onCheckedChange={setCollectGender}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="collect-location">{t('pages.surveyCreate.metadata.collectLocation')}</Label>
                        <p className="text-xs text-muted-foreground">{t('pages.surveyCreate.metadata.collectLocationDescription')}</p>
                      </div>
                      <Switch
                        id="collect-location"
                        checked={collectLocation}
                        onCheckedChange={setCollectLocation}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="collect-education">{t('pages.surveyCreate.metadata.collectEducation')}</Label>
                        <p className="text-xs text-muted-foreground">{t('pages.surveyCreate.metadata.collectEducationDescription')}</p>
                      </div>
                      <Switch
                        id="collect-education"
                        checked={collectEducation}
                        onCheckedChange={setCollectEducation}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="collect-income">{t('pages.surveyCreate.metadata.collectIncome')}</Label>
                        <p className="text-xs text-muted-foreground">{t('pages.surveyCreate.metadata.collectIncomeDescription')}</p>
                      </div>
                      <Switch
                        id="collect-income"
                        checked={collectIncome}
                        onCheckedChange={setCollectIncome}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-3">{t('pages.surveyCreate.metadata.aiResponses')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('pages.surveyCreate.metadata.aiResponsesDescription')}
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enable-ai-responses">{t('pages.surveyCreate.metadata.enableAiResponses')}</Label>
                      <p className="text-xs text-muted-foreground">{t('pages.surveyCreate.metadata.enableAiResponsesDescription')}</p>
                    </div>
                    <Switch
                      id="enable-ai-responses"
                      checked={enableAIResponses}
                      onCheckedChange={setEnableAIResponses}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* SETTINGS TAB */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.surveyCreate.settings.title')}</CardTitle>
              <CardDescription>
                {t('pages.surveyCreate.settings.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('pages.surveyCreate.settings.surveyOptions')}</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="survey-active">{t('pages.surveyCreate.settings.surveyActive')}</Label>
                        <p className="text-xs text-muted-foreground">{t('pages.surveyCreate.settings.surveyActiveDescription')}</p>
                      </div>
                      <Switch id="survey-active" checked={isActive} onCheckedChange={setIsActive} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="is-public">{t('pages.surveyCreate.settings.publicSurvey')}</Label>
                        <p className="text-xs text-muted-foreground">{t('pages.surveyCreate.settings.publicSurveyDescription')}</p>
                      </div>
                      <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="ai-insights">{t('pages.surveyCreate.settings.aiInsights')}</Label>
                        <p className="text-xs text-muted-foreground">{t('pages.surveyCreate.settings.aiInsightsDescription')}</p>
                      </div>
                      <Switch
                        id="ai-insights"
                        checked={enableAIInsights}
                        onCheckedChange={setEnableAIInsights}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="social-sharing">{t('pages.surveyCreate.settings.socialSharing')}</Label>
                        <p className="text-xs text-muted-foreground">{t('pages.surveyCreate.settings.socialSharingDescription')}</p>
                      </div>
                      <Switch
                        id="social-sharing"
                        checked={enableSocialSharing}
                        onCheckedChange={setEnableSocialSharing}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>{t('pages.surveyCreate.settings.responseIdentification')}</Label>
                        <p className="text-xs text-muted-foreground">{t('pages.surveyCreate.settings.responseIdentificationDescription')}</p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="anonymous-responses"
                            name="response-identification"
                            checked={allowAnonymous && !requireEmail}
                            onChange={() => {
                              setAllowAnonymous(true);
                              setRequireEmail(false);
                            }}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="anonymous-responses" className="font-normal cursor-pointer">
                            {t('pages.surveyCreate.settings.anonymousResponses')}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="require-email-create"
                            name="response-identification"
                            checked={requireEmail && !allowAnonymous}
                            onChange={() => {
                              setRequireEmail(true);
                              setAllowAnonymous(false);
                            }}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="require-email-create" className="font-normal cursor-pointer">
                            {t('pages.surveyCreate.settings.requireEmail')}
                          </Label>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="collect-demographics">{t('pages.surveyCreate.settings.collectDemographics')}</Label>
                        <p className="text-xs text-muted-foreground">{t('pages.surveyCreate.settings.collectDemographicsDescription')}</p>
                      </div>
                      <Switch id="collect-demographics" checked={collectDemographics} onCheckedChange={setCollectDemographics} />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('pages.surveyCreate.settings.surveyConfiguration')}</h3>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="response-limit">{t('pages.surveyCreate.settings.responseLimit')}</Label>
                      <Input
                        id="response-limit"
                        type="number"
                        value={responseLimit}
                        onChange={(e) => setResponseLimit(parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">{t('pages.surveyCreate.settings.responseLimitDescription')}</p>
                    </div>
                    <div>
                      <Label htmlFor="expiry-date">{t('pages.surveyCreate.settings.expiryDate')}</Label>
                      <Input
                        id="expiry-date"
                        type="date"
                        value={expiryDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          const selectedDate = e.target.value;
                          const today = new Date().toISOString().split('T')[0];
                          if (selectedDate >= today) {
                            setExpiryDate(selectedDate);
                          }
                        }}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">{t('pages.surveyCreate.settings.expiryDateDescription')}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t('pages.surveyCreate.settings.surveyWillClose')}</p>
                    </div>

                    <div>
                      <Label htmlFor="survey-language">{t('pages.surveyCreate.settings.surveyLanguage')}</Label>
                      <Select
                        value={surveyLanguage}
                        onValueChange={setSurveyLanguage}
                      >
                        <SelectTrigger id="survey-language" className="mt-1">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">{t('pages.surveyCreate.settings.languages.en')}</SelectItem>
                          <SelectItem value="es">{t('pages.surveyCreate.settings.languages.es')}</SelectItem>
                          <SelectItem value="fr">{t('pages.surveyCreate.settings.languages.fr')}</SelectItem>
                          <SelectItem value="de">{t('pages.surveyCreate.settings.languages.de')}</SelectItem>
                          <SelectItem value="ja">{t('pages.surveyCreate.settings.languages.ja')}</SelectItem>
                          <SelectItem value="zh">{t('pages.surveyCreate.settings.languages.zh')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">{t('pages.surveyCreate.settings.surveyLanguageDescription')}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="advanced">
                  <AccordionTrigger className="text-base font-medium">{t('pages.surveyCreate.settings.advancedOptions')}</AccordionTrigger>
                  <AccordionContent>
                    <div className="p-4 bg-muted/50 rounded-md mt-2">
                      <div className="flex items-start gap-3 text-sm">
                        <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <p>
                          {t('pages.surveyCreate.settings.advancedOptionsDescription')}
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
          <div className="mt-6 p-4 border rounded-md bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-700">{t('pages.surveyCreate.settings.importantNote')}</h4>
                <p className="text-sm text-amber-600 mt-1">
                  {t('pages.surveyCreate.settings.importantNoteDescription')}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* FINAL PREVIEW */}
        <TabsContent value="final">
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.surveyCreate.finalPreview.title')}</CardTitle>
              <CardDescription>{t('pages.surveyCreate.finalPreview.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">{t('pages.surveyCreate.finalPreview.metadata')}</h3>
                <div className="text-sm"><span className="font-bold text-base">{t('pages.surveyCreate.finalPreview.name')}:</span> {surveyName || '—'}</div>
                <div className="text-sm"><span className="font-bold text-base">{t('pages.surveyCreate.finalPreview.language')}:</span> {surveyLanguage}</div>
                <div className="text-sm"><span className="font-bold text-base">{t('pages.surveyCreate.finalPreview.estimatedTime')}:</span> {(surveyTemplates.find(t => t.id === selectedTemplate)?.estimatedTime) || 10} {t('pages.surveyCreate.finalPreview.minutes')}</div>
              </div>
              <div>
                <h3 className="font-medium mb-2">
                  {t('pages.surveyCreate.finalPreview.questionsCount', { count: questions.length })}
                </h3>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {questions.map((q) => (<li key={q.id}>{q.question || t('pages.surveyCreate.finalPreview.untitled')} - {q.questionType}</li>))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">{t('pages.surveyCreate.finalPreview.settings')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div><span className="font-bold text-base">{t('pages.surveyCreate.finalPreview.active')}:</span> {String(isActive)}</div>
                  <div><span className="font-bold text-base">{t('pages.surveyCreate.finalPreview.public')}:</span> {String(isPublic)}</div>
                  <div><span className="font-bold text-base">{t('pages.surveyCreate.finalPreview.anonymous')}:</span> {String(allowAnonymous)}</div>
                  <div><span className="font-bold text-base">{t('pages.surveyCreate.finalPreview.requireEmail')}:</span> {String(requireEmail)}</div>
                  <div><span className="font-bold text-base">{t('pages.surveyCreate.finalPreview.collectDemographics')}:</span> {String(collectDemographics)}</div>
                  <div><span className="font-bold text-base">{t('pages.surveyCreate.finalPreview.aiInsights')}:</span> {String(enableAIInsights)}</div>
                  <div><span className="font-bold text-base">{t('pages.surveyCreate.finalPreview.socialSharing')}:</span> {String(enableSocialSharing)}</div>
                  <div><span className="font-bold text-base">{t('pages.surveyCreate.finalPreview.responseLimit')}:</span> {responseLimit}</div>
                  <div><span className="font-bold text-base">{t('pages.surveyCreate.finalPreview.expiryDate')}:</span> {expiryDate}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{t('pages.surveyCreate.successModal.title')}</h2>
            <p className="mb-6">{t('pages.surveyCreate.successModal.description')}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation(`/dashboard/survey/${createdSurveyId}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {t('pages.surveyCreate.successModal.previewSurvey')}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation(`/survey/share/${createdSurveyId}`)}
              >
                <Share className="h-4 w-4 mr-2" />
                {t('pages.surveyCreate.successModal.shareSurvey')}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation('/survey/collaborate')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {t('pages.surveyCreate.successModal.collaborate')}
              </Button>

              <Button
                variant="default"
                className="w-full"
                onClick={() => setLocation('/dashboard')}
              >
                {t('pages.surveyCreate.successModal.returnToDashboard')}
              </Button>
            </div>

            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuccessModal(false)}
              >
                {t('pages.surveyCreate.successModal.close')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed bottom navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
        <div className="container mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeTab === "templates" && (
              <Button variant="outline" onClick={() => setLocation('/dashboard')}>
                {t('common.cancel')}
              </Button>
            )}
            {activeTab === "questions" && (
              <Button variant="outline" onClick={() => setActiveTab("templates")}>
                {t('common.back')}
              </Button>
            )}
            {activeTab === "metadata" && (
              <Button variant="outline" onClick={() => setActiveTab("questions")}>
                {t('common.back')}
              </Button>
            )}
            {activeTab === "business-context" && (
              <Button variant="outline" onClick={() => setActiveTab("metadata")}>
                {t('common.back')}
              </Button>
            )}
            {activeTab === "settings" && (
              <Button variant="outline" onClick={() => setActiveTab("business-context")}>
                {t('common.back')}
              </Button>
            )}
            {activeTab === "final" && (
              <Button variant="outline" onClick={() => setActiveTab("settings")}>
                {t('common.back')}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "templates" && (
              <Button onClick={() => setActiveTab("questions")} disabled={!selectedTemplate}>
                {t('pages.surveyCreate.navigation.continueToQuestions')}
              </Button>
            )}
            {activeTab === "questions" && (
              <Button
                onClick={() => setActiveTab("metadata")}
                disabled={!questionsSaved || isEditingQuestions || questions.length < 1}
              >
                {t('pages.surveyCreate.navigation.continueToMetadata')}
              </Button>
            )}
            {activeTab === "metadata" && (
              <Button
                onClick={() => setActiveTab("business-context")}
                disabled={!surveyName.trim()}
              >
                {t('pages.surveyCreate.navigation.continueToBusinessContext')}
              </Button>
            )}
            {activeTab === "business-context" && (
              <Button onClick={() => setActiveTab("settings")}>
                {t('pages.surveyCreate.navigation.continueToSettings')}
              </Button>
            )}
            {activeTab === "settings" && (
              <Button
                onClick={() => setActiveTab("final")}
                disabled={!(responseLimit > 0 && expiryDate && surveyLanguage)}
                className="gap-2"
              >
                {t('pages.surveyCreate.navigation.continueToFinalPreview')}
              </Button>
            )}
            {activeTab === "final" && (
              <Button
                onClick={handleCreateSurvey}
                disabled={isCreating}
                className="gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    {t('pages.surveyCreate.navigation.creating')}
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4" />
                    {t('pages.surveyCreate.navigation.createSurvey')}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Add padding to account for fixed bar */}
      <div className="h-20"></div>
    </div>
  );
}
