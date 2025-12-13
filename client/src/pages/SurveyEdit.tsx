import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
  Save,
  Target,
  Users,
  Trash2,
  Edit3,
  Move,
  Copy,
  CheckCircle,
  XCircle
} from "lucide-react";
import CollaborationWidget from "@/components/survey/CollaborationWidget";
import SurveyNameGenerator from "@/components/survey/SurveyNameGenerator";

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

interface SurveyData {
  id: number;
  title: string;
  description: string;
  surveyType: string;
  isActive: boolean;
  isPublic: boolean;
  customWelcomeMessage?: string;
  customCompletionMessage?: string;
  allowAnonymous: boolean;
  requireEmail: boolean;
  collectDemographics: boolean;
  estimatedTime: number;
  maxResponses?: number;
  expiryDate?: string;
  surveyLanguage?: string;
  enableAIInsights?: boolean;
  enableSocialSharing?: boolean;
  enableAIResponses?: boolean;
  // Individual demographic toggles on survey
  collectAge?: boolean;
  collectGender?: boolean;
  collectLocation?: boolean;
  collectEducation?: boolean;
  collectIncome?: boolean;
  status: string;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
  businessContext?: {
    productName?: string;
    productDescription?: string;
    productCategory?: string;
    productFeatures?: string[];
    valueProposition?: string;
    competitors?: Array<{name: string, url: string}>;
    targetMarket?: string[];
    industry?: string;
    painPoints?: string[];
  };
  questions?: SurveyQuestion[];
}

export default function SurveyEdit() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debug logging to see what ID is being received
  console.log('SurveyEdit - Raw ID from useParams:', id);
  console.log('SurveyEdit - Parsed surveyId:', parseInt(id || '0'));

  const surveyId = parseInt(id || '0');

  // If surveyId is 0 or invalid, try to get it from the current survey in the list
  // This handles the case where the URL might have the wrong ID
  const { data: surveysData } = useQuery<{ data: any[] }>({
    queryKey: ['/api/surveys'],
    enabled: !surveyId || surveyId === 0,
  });

  // Use the first available survey if no valid ID is provided
  const effectiveSurveyId = surveyId && surveyId > 0 ? surveyId :
    (surveysData?.data && surveysData.data.length > 0 ? surveysData.data[0].id : null);

  console.log('SurveyEdit - Effective surveyId:', effectiveSurveyId);

  // Form state
  const [activeTab, setActiveTab] = useState("metadata");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track if we're still loading initial data
  const [initialValues, setInitialValues] = useState<any>(null); // Store initial form values for comparison

  // Survey metadata state
  const [surveyName, setSurveyName] = useState("");
  const [surveyDescription, setSurveyDescription] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [completionMessage, setCompletionMessage] = useState("");
  const [surveyType, setSurveyType] = useState<SurveyType>(SurveyType.CUSTOM);
  const [isActive, setIsActive] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [requireEmail, setRequireEmail] = useState(false);
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [collectDemographics, setCollectDemographics] = useState(true);
  const [estimatedTime, setEstimatedTime] = useState(10);
  const [maxResponses, setMaxResponses] = useState<number | undefined>();
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [surveyLanguage, setSurveyLanguage] = useState<string>("en");
  const [enableAIInsights, setEnableAIInsights] = useState<boolean>(true);
  const [enableSocialSharing, setEnableSocialSharing] = useState<boolean>(true);
  const [enableAIResponses, setEnableAIResponses] = useState<boolean>(false);
  // Individual demographic toggles
  const [collectAge, setCollectAge] = useState(true);
  const [collectGender, setCollectGender] = useState(true);
  const [collectLocation, setCollectLocation] = useState(true);
  const [collectEducation, setCollectEducation] = useState(false);
  const [collectIncome, setCollectIncome] = useState(false);

  // Business context state
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

  // Questions state (mirror creation flow)
  const [questions, setQuestions] = useState<EditorQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [savedQuestions, setSavedQuestions] = useState<EditorQuestion[]>([]); // Saved checkpoint
  const [questionsSaved, setQuestionsSaved] = useState(false); // Whether questions have been saved
  const [isEditingQuestions, setIsEditingQuestions] = useState(false); // Whether in edit mode (start as false since questions are loaded from API)
  const [questionSubTab, setQuestionSubTab] = useState("customize"); // Sub-tab for questions section (customize/preview)

  // Fetch survey data using the effective survey ID
  const { data: survey, isLoading, error } = useQuery<SurveyData>({
    queryKey: [`/api/surveys/${effectiveSurveyId}`],
    enabled: !!effectiveSurveyId,
  });
  // Unwrap possible { status, data } envelope from the default query function
  const surveyData = (survey as any)?.data ?? survey;
  const isAdminDeactivated = surveyData?.adminDeactivated || surveyData?.admin_deactivated || surveyData?.status === 'flagged';

  // Fetch questions from API to mirror creation flow
  const { data: questionsResponse } = useQuery<{ data: SurveyQuestion[] }>({
    queryKey: [`/api/surveys/${effectiveSurveyId}/questions`],
    enabled: !!effectiveSurveyId,
  });

  // Populate form fields when survey data loads
  useEffect(() => {
    const toBool = (value: any, fallback: boolean): boolean => {
      if (value === true || value === false) return value;
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        if (lower === 'true') return true;
        if (lower === 'false') return false;
      }
      return fallback;
    };

    if (surveyData) {
      // Populate form fields with existing survey data
      setSurveyName(surveyData.title || "");
      setSurveyDescription(surveyData.description || "");
      setWelcomeMessage(surveyData.customWelcomeMessage || surveyData.custom_welcome_message || "");
      setCompletionMessage(surveyData.customCompletionMessage || surveyData.custom_completion_message || "");
      // Map DB type to display type used in selects
      const dbToDisplayType: Record<string, SurveyType> = {
        'personality_profile': SurveyType.PERSONALITY_PROFILE,
        'professional_profile': SurveyType.PROFESSIONAL_PROFILE,
        'consumer_behavior': SurveyType.CONSUMER_BEHAVIOR,
        'innovation_mindset': SurveyType.INNOVATION_MINDSET,
        'sustainability_orientation': SurveyType.SUSTAINABILITY_ORIENTATION,
        'digital_behavior': SurveyType.DIGITAL_BEHAVIOR,
        'custom': SurveyType.CUSTOM,
        'general': SurveyType.CUSTOM,
      };
      const rawType: string = (surveyData.surveyType || surveyData.survey_type || '').toString();
      const normalized = rawType.trim().toLowerCase().replace(/\s+/g, '_');
      const displayType = (Object.values(SurveyType) as string[]).includes(rawType as any)
        ? (rawType as SurveyType)
        : (dbToDisplayType[normalized] || SurveyType.CUSTOM);
      setSurveyType(displayType as SurveyType);

      setIsActive(toBool(surveyData.isActive ?? surveyData.is_active, true));
      setIsPublic(toBool(surveyData.isPublic ?? surveyData.is_public, true));
      setRequireEmail(toBool(surveyData.requireEmail ?? surveyData.require_email, false));
      setAllowAnonymous(toBool(surveyData.allowAnonymous ?? surveyData.allow_anonymous, true));
      setCollectDemographics(toBool(surveyData.collectDemographics ?? surveyData.collect_demographics, true));
      setEstimatedTime(
        surveyData.estimatedTime ?? surveyData.estimated_time_minutes ?? 10
      );
      setMaxResponses(
        surveyData.maxResponses ?? surveyData.max_responses
      );
      const rawExpiry = surveyData.expiryDate || surveyData.expiry_date;
      setExpiryDate(rawExpiry ? new Date(rawExpiry).toISOString().split('T')[0] : "");
      setSurveyLanguage(
        surveyData.surveyLanguage || surveyData.survey_language || 'en'
      );
      setEnableAIInsights(
        toBool(
          surveyData.enableAIInsights ?? surveyData.enable_ai_insights,
          true
        )
      );
      setEnableSocialSharing(
        toBool(
          surveyData.enableSocialSharing ?? surveyData.enable_social_sharing,
          true
        )
      );
      setEnableAIResponses(
        toBool(
          (surveyData.aiResponses && surveyData.aiResponses.enabled) ??
            surveyData.enableAIResponses ??
            surveyData.enable_ai_responses,
          false
        )
      );
      setCollectAge(
        toBool(
          (surveyData.demographics && surveyData.demographics.collectAge) ??
            surveyData.collectAge ??
            surveyData.collect_age,
          true
        )
      );
      setCollectGender(
        toBool(
          (surveyData.demographics && surveyData.demographics.collectGender) ??
            surveyData.collectGender ??
            surveyData.collect_gender,
          true
        )
      );
      setCollectLocation(
        toBool(
          (surveyData.demographics && surveyData.demographics.collectLocation) ??
            surveyData.collectLocation ??
            surveyData.collect_location,
          true
        )
      );
      setCollectEducation(
        toBool(
          (surveyData.demographics && surveyData.demographics.collectEducation) ??
            surveyData.collectEducation ??
            surveyData.collect_education,
          false
        )
      );
      setCollectIncome(
        toBool(
          (surveyData.demographics && surveyData.demographics.collectIncome) ??
            surveyData.collectIncome ??
            surveyData.collect_income,
          false
        )
      );

      // Populate business context
      if (surveyData.businessContext) {
        setProductName(surveyData.businessContext.productName || "");
        setProductDescription(surveyData.businessContext.productDescription || "");
        setProductCategory(surveyData.businessContext.productCategory || "");
        setProductFeatures(surveyData.businessContext.productFeatures || []);
        setValueProposition(surveyData.businessContext.valueProposition || "");
        setCompetitors(surveyData.businessContext.competitors || []);
        setTargetMarket(surveyData.businessContext.targetMarket || []);
        setIndustry(surveyData.businessContext.industry || "");
        setPainPoints(surveyData.businessContext.painPoints || []);
      } else {
        // Fallback for flat snake_case fields returned by API
        setProductName(surveyData.productName || surveyData.product_name || "");
        setProductDescription(surveyData.productDescription || surveyData.product_description || "");
        setProductCategory(surveyData.productCategory || surveyData.product_category || "");
        setProductFeatures(surveyData.productFeatures || surveyData.product_features || []);
        setValueProposition(surveyData.valueProposition || surveyData.value_proposition || "");
        setCompetitors(surveyData.competitors || []);
        setTargetMarket(surveyData.targetMarket || surveyData.target_market || []);
        setIndustry(surveyData.industry || "");
        setPainPoints(surveyData.painPoints || surveyData.pain_points || []);
      }
      // Populate questions from endpoint if available; fallback to embedded
      const raw = questionsResponse?.data || surveyData.questions || [];
      const mapped: EditorQuestion[] = raw.map((x: any, idx: number) => ({
        id: String(x.id ?? idx),
        question: x.question || x.text || "",
        questionType: x.questionType || x.question_type || "multiple-choice",
        required: x.required ?? true,
        helpText: x.helpText || x.help_text || "",
        order: x.order ?? idx + 1,
        options: Array.isArray(x.options) ? x.options : [],
        sliderConfig: x.sliderConfig || x.slider_config,
        scenarioText: x.scenarioText || x.scenario_text,
      }));
      setQuestions(mapped);
      // Set saved questions as initial checkpoint
      setSavedQuestions(JSON.parse(JSON.stringify(mapped))); // Deep copy
      setQuestionsSaved(true); // Questions are already saved (loaded from API)
      setIsEditingQuestions(false); // Start in read-only mode
      const expandState: Record<string, boolean> = {};
      mapped.forEach(q => { expandState[q.id] = true; });
      setExpandedQuestions(expandState);
      
      // Store initial values for comparison
      const initial = {
        surveyName: surveyData.title || "",
        surveyDescription: surveyData.description || "",
        welcomeMessage: surveyData.customWelcomeMessage || surveyData.custom_welcome_message || "",
        completionMessage: surveyData.customCompletionMessage || surveyData.custom_completion_message || "",
        surveyType: displayType,
        isActive: toBool(surveyData.isActive ?? surveyData.is_active, true),
        isPublic: toBool(surveyData.isPublic ?? surveyData.is_public, true),
        requireEmail: toBool(surveyData.requireEmail ?? surveyData.require_email, false),
        allowAnonymous: toBool(surveyData.allowAnonymous ?? surveyData.allow_anonymous, true),
        collectDemographics: toBool(surveyData.collectDemographics ?? surveyData.collect_demographics, true),
        estimatedTime: surveyData.estimatedTime ?? surveyData.estimated_time_minutes ?? 10,
        maxResponses: surveyData.maxResponses ?? surveyData.max_responses,
        expiryDate: rawExpiry ? new Date(rawExpiry).toISOString().split('T')[0] : "",
        surveyLanguage: surveyData.surveyLanguage || surveyData.survey_language || 'en',
        enableAIInsights: toBool(surveyData.enableAIInsights ?? surveyData.enable_ai_insights, true),
        enableSocialSharing: toBool(surveyData.enableSocialSharing ?? surveyData.enable_social_sharing, true),
        enableAIResponses: toBool((surveyData.aiResponses && surveyData.aiResponses.enabled) ?? surveyData.enableAIResponses ?? surveyData.enable_ai_responses, false),
        collectAge: toBool((surveyData.demographics && surveyData.demographics.collectAge) ?? surveyData.collectAge ?? surveyData.collect_age, true),
        collectGender: toBool((surveyData.demographics && surveyData.demographics.collectGender) ?? surveyData.collectGender ?? surveyData.collect_gender, true),
        collectLocation: toBool((surveyData.demographics && surveyData.demographics.collectLocation) ?? surveyData.collectLocation ?? surveyData.collect_location, true),
        collectEducation: toBool((surveyData.demographics && surveyData.demographics.collectEducation) ?? surveyData.collectEducation ?? surveyData.collect_education, false),
        collectIncome: toBool((surveyData.demographics && surveyData.demographics.collectIncome) ?? surveyData.collectIncome ?? surveyData.collect_income, false),
        productName: surveyData.businessContext?.productName || surveyData.productName || surveyData.product_name || "",
        productDescription: surveyData.businessContext?.productDescription || surveyData.productDescription || surveyData.product_description || "",
        productCategory: surveyData.businessContext?.productCategory || surveyData.productCategory || surveyData.product_category || "",
        productFeatures: surveyData.businessContext?.productFeatures || surveyData.productFeatures || surveyData.product_features || [],
        valueProposition: surveyData.businessContext?.valueProposition || surveyData.valueProposition || surveyData.value_proposition || "",
        competitors: surveyData.businessContext?.competitors || surveyData.competitors || [],
        targetMarket: surveyData.businessContext?.targetMarket || surveyData.targetMarket || surveyData.target_market || [],
        industry: surveyData.businessContext?.industry || surveyData.industry || "",
        painPoints: surveyData.businessContext?.painPoints || surveyData.painPoints || surveyData.pain_points || [],
        questions: JSON.stringify(mapped)
      };
      setInitialValues(initial);
      
      // Mark initial load as complete after a short delay to avoid triggering unsaved changes
      setTimeout(() => {
        setIsInitialLoad(false);
        setHasUnsavedChanges(false);
      }, 100);
    }
  }, [surveyData, questionsResponse]);

  // Save mutation using effective survey ID
  const saveMutation = useMutation({
    mutationFn: async (updatedSurvey: Partial<SurveyData>) => {
      if (!effectiveSurveyId) {
        throw new Error('No valid survey ID available');
      }
      // Prevent saving if admin-deactivated
      if (isAdminDeactivated) {
        throw new Error('This survey has been deactivated by an administrator and cannot be edited.');
      }
      const response = await apiRequest(
        "PUT",
        `/api/surveys/${effectiveSurveyId}`,
        updatedSurvey
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Survey updated successfully!",
        description: "Your survey changes have been saved.",
      });
      setHasUnsavedChanges(false);
      // Update initial values to current values after successful save
      if (initialValues) {
        setInitialValues({
          ...initialValues,
          surveyName,
          surveyDescription,
          welcomeMessage,
          completionMessage,
          surveyType,
          isActive,
          isPublic,
          requireEmail,
          allowAnonymous,
          collectDemographics,
          estimatedTime,
          maxResponses,
          expiryDate,
          surveyLanguage,
          enableAIInsights,
          enableSocialSharing,
          enableAIResponses,
          collectAge,
          collectGender,
          collectLocation,
          collectEducation,
          collectIncome,
          productName,
          productDescription,
          productCategory,
          productFeatures,
          valueProposition,
          competitors,
          targetMarket,
          industry,
          painPoints,
          questions: JSON.stringify(questionsSaved ? savedQuestions : questions)
        });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/surveys/${effectiveSurveyId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/surveys'] });
      setLocation('/dashboard');
    },
    onError: (error) => {
      toast({
        title: "Failed to update survey",
        description: "There was a problem saving your changes. Please try again.",
        variant: "destructive"
      });
      console.error(error);
    }
  });

  // Delete mutation using effective survey ID
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveSurveyId) {
        throw new Error('No valid survey ID available');
      }
      const response = await apiRequest(
        "DELETE",
        `/api/surveys/${effectiveSurveyId}`
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Survey deleted successfully!",
        description: "The survey and all its data have been permanently removed.",
      });
      // Navigate back to dashboard after successful deletion
      setLocation('/dashboard');
      queryClient.invalidateQueries({ queryKey: ['/api/surveys'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete survey",
        description: "There was a problem deleting the survey. Please try again.",
        variant: "destructive"
      });
      console.error(error);
    }
  });

  // Track unsaved changes - only set to true if not initial load and values have actually changed
  useEffect(() => {
    // Don't track changes during initial load or if initial values haven't been set
    if (isInitialLoad || !initialValues) {
      return;
    }
    
    // Check if questions have changed (compare current questions with saved checkpoint)
    const questionsChanged = JSON.stringify(questions) !== JSON.stringify(savedQuestions);
    
    // Check if other fields have changed by comparing with initial values
    const fieldsChanged = 
      surveyName !== initialValues.surveyName ||
      surveyDescription !== initialValues.surveyDescription ||
      welcomeMessage !== initialValues.welcomeMessage ||
      completionMessage !== initialValues.completionMessage ||
      surveyType !== initialValues.surveyType ||
      isActive !== initialValues.isActive ||
      isPublic !== initialValues.isPublic ||
      requireEmail !== initialValues.requireEmail ||
      allowAnonymous !== initialValues.allowAnonymous ||
      collectDemographics !== initialValues.collectDemographics ||
      estimatedTime !== initialValues.estimatedTime ||
      maxResponses !== initialValues.maxResponses ||
      expiryDate !== initialValues.expiryDate ||
      surveyLanguage !== initialValues.surveyLanguage ||
      enableAIInsights !== initialValues.enableAIInsights ||
      enableSocialSharing !== initialValues.enableSocialSharing ||
      enableAIResponses !== initialValues.enableAIResponses ||
      collectAge !== initialValues.collectAge ||
      collectGender !== initialValues.collectGender ||
      collectLocation !== initialValues.collectLocation ||
      collectEducation !== initialValues.collectEducation ||
      collectIncome !== initialValues.collectIncome ||
      productName !== initialValues.productName ||
      productDescription !== initialValues.productDescription ||
      productCategory !== initialValues.productCategory ||
      JSON.stringify(productFeatures) !== JSON.stringify(initialValues.productFeatures) ||
      valueProposition !== initialValues.valueProposition ||
      JSON.stringify(competitors) !== JSON.stringify(initialValues.competitors) ||
      JSON.stringify(targetMarket) !== JSON.stringify(initialValues.targetMarket) ||
      industry !== initialValues.industry ||
      JSON.stringify(painPoints) !== JSON.stringify(initialValues.painPoints);
    
    // Set unsaved changes only if there are actual changes
    setHasUnsavedChanges(questionsChanged || fieldsChanged);
  }, [
    surveyName, surveyDescription, welcomeMessage, completionMessage,
    surveyType, isActive, isPublic, requireEmail, allowAnonymous,
    collectDemographics, estimatedTime, maxResponses, expiryDate,
    surveyLanguage, enableAIInsights, enableSocialSharing, enableAIResponses,
    collectAge, collectGender, collectLocation, collectEducation, collectIncome,
    productName, productDescription, productCategory, productFeatures,
    valueProposition, competitors, targetMarket, industry, painPoints,
    questions, savedQuestions, isInitialLoad, initialValues
  ]);

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

  // Question management functions (mirror creation)
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
      } as EditorQuestion,
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
        title: "At least one question required",
        description: "Please add at least one question before saving.",
        variant: "destructive"
      });
      return;
    }
    // Save questions locally (create checkpoint)
    setSavedQuestions(JSON.parse(JSON.stringify(questions))); // Deep copy
    setQuestionsSaved(true);
    setIsEditingQuestions(false);
    toast({
      title: "Questions saved",
      description: "Your questions have been saved locally.",
    });
  };

  const handleCancelQuestions = () => {
    // Revert to saved checkpoint
    setQuestions(JSON.parse(JSON.stringify(savedQuestions))); // Deep copy
    setIsEditingQuestions(false);
    toast({
      title: "Changes cancelled",
      description: "Your changes have been reverted to the last saved state.",
    });
  };

  const handleEditQuestions = () => {
    setIsEditingQuestions(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!surveyName.trim()) {
      toast({
        title: "Survey name required",
        description: "Please enter a name for your survey.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
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

      const updatedSurvey = {
        title: surveyName,
        description: surveyDescription,
        customWelcomeMessage: welcomeMessage,
        customCompletionMessage: completionMessage,
        surveyType,
        isActive,
        isPublic,
        requireEmail,
        allowAnonymous,
        collectDemographics,
        estimatedTime,
        maxResponses,
        expiryDate: expiryDate || undefined,
        surveyLanguage,
        enableAIInsights,
        enableSocialSharing,
        enableAIResponses,
        demographics: {
          collectAge,
          collectGender,
          collectLocation,
          collectEducation,
          collectIncome,
        },
        businessContext,
        questions: (questionsSaved ? savedQuestions : questions).map((q, idx) => ({
          id: isNaN(Number(q.id)) ? undefined : Number(q.id),
          question: q.question,
          questionType: q.questionType,
          required: q.required,
          helpText: q.helpText,
          order: q.order ?? idx + 1,
          options: q.options,
          sliderConfig: q.sliderConfig,
          scenarioText: q.scenarioText,
        })),
      };

      await saveMutation.mutateAsync(updatedSurvey);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel with unsaved changes warning
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
        setLocation('/dashboard');
      }
    } else {
      setLocation('/dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-muted animate-pulse rounded mr-4"></div>
            <div>
              <div className="h-8 w-64 bg-muted animate-pulse rounded mb-2"></div>
              <div className="h-4 w-48 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        </div>
        <div className="h-96 bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-6xl">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Survey</CardTitle>
            <CardDescription>
              There was a problem loading the survey for editing. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Survey</h1>
            <p className="text-muted-foreground">
              Modify your survey settings, questions, and business context
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CollaborationWidget
            entityId={effectiveSurveyId || surveyId}
            entityType="survey"
            currentUserId={1}
          />

          <Button
            variant="outline"
            onClick={() => window.open(`/survey/${effectiveSurveyId || surveyId}/preview`, '_blank')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>

          <Button
            variant="outline"
            onClick={() => window.open(`/take-survey/${effectiveSurveyId || surveyId}`, '_blank')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Test Survey
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Survey
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Survey</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{surveyData?.title || 'this survey'}"? This action cannot be undone and will permanently delete:
                  <br /><br />
                  • All survey questions and settings
                  <br />
                  • All collected responses and data
                  <br />
                  • All associated analytics and reports
                  <br /><br />
                  This action is irreversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Survey
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Admin Deactivation Warning */}
      {isAdminDeactivated && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Survey Deactivated by Administrator</h3>
                <p className="text-sm text-red-700">
                  This survey has been deactivated by an administrator and cannot be edited or activated. 
                  All actions except viewing have been disabled. Please contact support to reactivate this survey.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 max-w-4xl mb-8">
          <TabsTrigger value="metadata">
            <FileText className="h-4 w-4 mr-2" />
            Metadata
          </TabsTrigger>
          <TabsTrigger value="questions">
            <MessageSquare className="h-4 w-4 mr-2" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="business-context">
            <Briefcase className="h-4 w-4 mr-2" />
            Business Context
          </TabsTrigger>
          <TabsTrigger value="settings">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* METADATA TAB */}
        <TabsContent value="metadata">
          <Card>
            <CardHeader>
              <CardTitle>Survey Metadata</CardTitle>
              <CardDescription>
                Basic information about your survey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="survey-name">Survey Name*</Label>
                    <div className="mt-1">
                      <SurveyNameGenerator
                        initialName={surveyName}
                        surveyType={surveyType.toLowerCase()}
                        onSelectName={setSurveyName}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="survey-type">Survey Type</Label>
                    <Select value={surveyType} onValueChange={(value: SurveyType) => setSurveyType(value)}>
                      <SelectTrigger id="survey-type" className="mt-1">
                        <SelectValue placeholder="Select survey type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SurveyType.PERSONALITY_PROFILE}>Personality Profile</SelectItem>
                        <SelectItem value={SurveyType.PROFESSIONAL_PROFILE}>Professional Profile</SelectItem>
                        <SelectItem value={SurveyType.CONSUMER_BEHAVIOR}>Consumer Behavior</SelectItem>
                        <SelectItem value={SurveyType.INNOVATION_MINDSET}>Innovation Mindset</SelectItem>
                        <SelectItem value={SurveyType.SUSTAINABILITY_ORIENTATION}>Sustainability Orientation</SelectItem>
                        <SelectItem value={SurveyType.DIGITAL_BEHAVIOR}>Digital Behavior</SelectItem>
                        <SelectItem value={SurveyType.CUSTOM}>Custom Survey</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="survey-description">Survey Description</Label>
                    <Textarea
                      id="survey-description"
                      value={surveyDescription}
                      onChange={(e) => setSurveyDescription(e.target.value)}
                      placeholder="Describe what this survey is about"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="estimated-time">Estimated Time (minutes)</Label>
                    <Input
                      id="estimated-time"
                      type="number"
                      value={estimatedTime}
                      onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 10)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="welcome-message">Welcome Message</Label>
                    <Textarea
                      id="welcome-message"
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      placeholder="Message shown at the start of survey"
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="completion-message">Completion Message</Label>
                    <Textarea
                      id="completion-message"
                      value={completionMessage}
                      onChange={(e) => setCompletionMessage(e.target.value)}
                      placeholder="Message shown at the end of survey"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardContent className="space-y-6">
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-3">Demographic Data Collection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="collect-age">Age</Label>
                        <p className="text-xs text-muted-foreground">Collect respondent's age</p>
                      </div>
                      <Switch id="collect-age" checked={collectAge} onCheckedChange={setCollectAge} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="collect-gender">Gender</Label>
                        <p className="text-xs text-muted-foreground">Collect respondent's gender</p>
                      </div>
                      <Switch id="collect-gender" checked={collectGender} onCheckedChange={setCollectGender} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="collect-location">Location</Label>
                        <p className="text-xs text-muted-foreground">Collect respondent's location</p>
                      </div>
                      <Switch id="collect-location" checked={collectLocation} onCheckedChange={setCollectLocation} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="collect-education">Education</Label>
                        <p className="text-xs text-muted-foreground">Collect education level</p>
                      </div>
                      <Switch id="collect-education" checked={collectEducation} onCheckedChange={setCollectEducation} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="collect-income">Income</Label>
                        <p className="text-xs text-muted-foreground">Collect income range</p>
                      </div>
                      <Switch id="collect-income" checked={collectIncome} onCheckedChange={setCollectIncome} />
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-3">AI Responses</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="ai-responses">Enable AI Responses</Label>
                      <p className="text-xs text-muted-foreground">Generate synthetic responses using AI</p>
                    </div>
                    <Switch id="ai-responses" checked={enableAIResponses} onCheckedChange={setEnableAIResponses} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QUESTIONS TAB */}
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Questions</CardTitle>
              <CardDescription>Edit questions or add new ones. At least one question is required.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={questionSubTab} onValueChange={setQuestionSubTab} className="w-full">
                <TabsList className="grid grid-cols-2 max-w-sm">
                  <TabsTrigger value="customize">Customize</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="customize" className="space-y-4 pt-4">
                  {questionsLoading ? (
                    <div className="text-sm text-muted-foreground">Loading questions…</div>
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
                                <Input className="w-full" value={q.question} placeholder="Question text" onChange={(e) => updateQuestion(q.id, { question: e.target.value })} />
                              ) : (
                                <div className="w-full p-2 text-sm border rounded bg-muted/50">{q.question || "Untitled question"}</div>
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
                              <Label>Question Type</Label>
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
                                  <Label>Required Question</Label>
                                </>
                              ) : (
                                <div className="text-sm text-muted-foreground">{q.required ? "Required" : "Optional"}</div>
                              )}
                            </div>
                          </div>

                          {/* Help text */}
                          <div className="mb-3">
                            <Label>Help Text (Optional)</Label>
                            {isEditingQuestions ? (
                              <Textarea value={q.helpText || ""} onChange={(e) => updateQuestion(q.id, { helpText: e.target.value })} placeholder="Enter additional instructions for this question" />
                            ) : (
                              <div className="p-2 text-sm border rounded bg-muted/50 min-h-[60px]">{q.helpText || "No help text"}</div>
                            )}
                          </div>

                          {/* Options per type */}
                          {q.questionType === 'multiple-choice' && (
                            <div className="space-y-2">
                              <Label>Answer Options</Label>
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
                                      }}>Remove</Button>
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
                          )}

                          {q.questionType === 'ranking' && (
                            <div className="space-y-2">
                              <Label>Ranking Items</Label>
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
                                      }}>Remove</Button>
                                    </>
                                  ) : (
                                    <div className="p-2 text-sm border rounded bg-muted/50 w-full">{opt.text || `Item ${i + 1}`}</div>
                                  )}
                                </div>
                              ))}
                              {isEditingQuestions && (
                                <Button variant="outline" onClick={() => updateQuestion(q.id, { options: [...(q.options || []), { id: `opt_${Date.now()}`, text: '' }] })}>Add Item</Button>
                              )}
                            </div>
                          )}

                          {q.questionType === 'slider' && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>Min Label</Label>
                                {isEditingQuestions ? (
                                  <Input value={q.sliderConfig?.minLabel ?? ''} onChange={(e) => updateQuestion(q.id, { sliderConfig: { ...(q.sliderConfig || {}), minLabel: e.target.value } })} />
                                ) : (
                                  <div className="p-2 text-sm border rounded bg-muted/50">{q.sliderConfig?.minLabel || 'Min'}</div>
                                )}
                              </div>
                              <div>
                                <Label>Max Label</Label>
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
                              <Label>Scenario Text</Label>
                              {isEditingQuestions ? (
                                <Textarea value={q.scenarioText || ''} onChange={(e) => updateQuestion(q.id, { scenarioText: e.target.value })} />
                              ) : (
                                <div className="p-2 text-sm border rounded bg-muted/50 min-h-[60px]">{q.scenarioText || 'No scenario text'}</div>
                              )}
                              <div className="space-y-2">
                                <Label>Options</Label>
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
                                        }}>Remove</Button>
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
                                      <Input value={opt.image || ''} placeholder="Image URL (optional)" onChange={(e) => {
                                        const copy = [...(q.options || [])];
                                        copy[i] = { ...(copy[i] || {}), id: opt.id || `opt_${Date.now()}`, image: e.target.value } as any;
                                        updateQuestion(q.id, { options: copy });
                                      }} />
                                      <div className="md:col-span-2">
                                        <Input value={opt.description || ''} placeholder="Description (optional)" onChange={(e) => {
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
                                        }}>Remove</Button>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="p-2 text-sm border rounded bg-muted/50">{opt.text || `Option ${i + 1}`}</div>
                                      <div className="p-2 text-sm border rounded bg-muted/50">{opt.image || 'No image URL'}</div>
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
                      {(isEditingQuestions ? questions : savedQuestions).length === 0 && (
                        <div className="text-sm text-muted-foreground">No questions yet. {isEditingQuestions ? 'Click Add Question.' : 'Click Edit Questions to add questions.'}</div>
                      )}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="preview" className="space-y-6 pt-4">
                  {(isEditingQuestions ? questions : savedQuestions).length === 0 ? (
                    <div className="text-sm text-muted-foreground">No questions to preview.</div>
                  ) : (
                    (isEditingQuestions ? questions : savedQuestions).map((q, idx) => (
                      <div key={q.id} className="space-y-3">
                        <h3 className="text-base font-medium">{idx + 1}. {q.question} {q.required ? <span className="text-destructive">*</span> : null}</h3>
                        {q.questionType === 'text' && (
                          <div className="p-3 border rounded bg-muted/30 text-sm text-muted-foreground">Text input field</div>
                        )}
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
                  <Button onClick={addQuestion}>Add Question</Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isEditingQuestions ? (
                  <Button onClick={handleEditQuestions}>
                    Edit Questions
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={handleCancelQuestions}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveQuestions} disabled={questions.length < 1}>
                      Save
                    </Button>
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
              <CardTitle>Business Context</CardTitle>
              <CardDescription>
                Provide details about your product, target market, and business challenges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Product Information */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-primary" />
                  Product Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="product-name">Product Name</Label>
                      <Input
                        id="product-name"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="Name of the product or service"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="product-category">Product Category</Label>
                      <Input
                        id="product-category"
                        value={productCategory}
                        onChange={(e) => setProductCategory(e.target.value)}
                        placeholder="Category or industry"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="product-description">Product Description</Label>
                    <Textarea
                      id="product-description"
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      placeholder="Describe what the product does and its main benefits"
                      className="mt-1"
                      rows={3}
                    />

                    <div className="mt-4">
                      <Label htmlFor="value-proposition">Value Proposition</Label>
                      <Textarea
                        id="value-proposition"
                        value={valueProposition}
                        onChange={(e) => setValueProposition(e.target.value)}
                        placeholder="What makes this product unique or valuable to customers"
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Product Features */}
                <div className="mt-4">
                  <Label htmlFor="product-features">Key Features</Label>
                  <div className="flex mt-1">
                    <Input
                      id="new-feature"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add a product feature"
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
                      Add
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
                  Target Market
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger id="industry" className="mt-1">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="hospitality">Hospitality</SelectItem>
                        <SelectItem value="media">Media & Entertainment</SelectItem>
                        <SelectItem value="professional_services">Professional Services</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="target-market">Target Segments</Label>
                    <div className="flex mt-1">
                      <Input
                        id="new-target-market"
                        value={newTargetMarket}
                        onChange={(e) => setNewTargetMarket(e.target.value)}
                        placeholder="Add a target segment"
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
                        Add
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
                  <Label htmlFor="pain-points">Pain Points</Label>
                  <div className="flex mt-1">
                    <Input
                      id="new-pain-point"
                      value={newPainPoint}
                      onChange={(e) => setNewPainPoint(e.target.value)}
                      placeholder="Add a customer pain point"
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
                      Add
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
                  Competitor Analysis
                </h3>

                <div className="mb-4">
                  <Label>Competitors</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                    <Input
                      value={newCompetitorName}
                      onChange={(e) => setNewCompetitorName(e.target.value)}
                      placeholder="Competitor name"
                    />
                    <div className="flex">
                      <Input
                        value={newCompetitorUrl}
                        onChange={(e) => setNewCompetitorUrl(e.target.value)}
                        placeholder="Website URL (optional)"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={addCompetitor}
                        className="ml-2"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                {competitors.length > 0 && (
                  <div className="border rounded-md p-4 bg-muted/30">
                    <h4 className="text-sm font-medium mb-2">Added Competitors</h4>
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
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Survey Settings</CardTitle>
              <CardDescription>
                Configure advanced settings for your survey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Access & Privacy</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="is-active">Survey Active</Label>
                        <p className="text-xs text-muted-foreground">
                          {isAdminDeactivated 
                            ? "Survey deactivated by admin - cannot be activated" 
                            : "Allow new responses to be collected"}
                        </p>
                      </div>
                      <Switch
                        id="is-active"
                        checked={isActive}
                        onCheckedChange={setIsActive}
                        disabled={isAdminDeactivated}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="is-public">Public Survey</Label>
                        <p className="text-xs text-muted-foreground">Survey can be found in public listings</p>
                      </div>
                      <Switch
                        id="is-public"
                        checked={isPublic}
                        onCheckedChange={setIsPublic}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Response Identification</Label>
                        <p className="text-xs text-muted-foreground">Choose how respondents identify themselves</p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="allow-anonymous"
                            name="response-identification"
                            checked={allowAnonymous && !requireEmail}
                            onChange={() => {
                              setAllowAnonymous(true);
                              setRequireEmail(false);
                            }}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="allow-anonymous" className="font-normal cursor-pointer">
                            Anonymous Responses
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="require-email"
                            name="response-identification"
                            checked={requireEmail && !allowAnonymous}
                            onChange={() => {
                              setRequireEmail(true);
                              setAllowAnonymous(false);
                            }}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="require-email" className="font-normal cursor-pointer">
                            Require Email
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="collect-demographics">Collect Demographics</Label>
                        <p className="text-xs text-muted-foreground">Collect age, gender, location data</p>
                      </div>
                      <Switch
                        id="collect-demographics"
                        checked={collectDemographics}
                        onCheckedChange={setCollectDemographics}
                      />
                    </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="ai-insights">AI Insights</Label>
                      <p className="text-xs text-muted-foreground">Enable AI-powered insights</p>
                    </div>
                    <Switch id="ai-insights" checked={enableAIInsights} onCheckedChange={setEnableAIInsights} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="social-sharing">Social Sharing</Label>
                      <p className="text-xs text-muted-foreground">Allow respondents to share results</p>
                    </div>
                    <Switch id="social-sharing" checked={enableSocialSharing} onCheckedChange={setEnableSocialSharing} />
                  </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Response Limits</h3>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="max-responses">Maximum Responses</Label>
                      <Input
                        id="max-responses"
                        type="number"
                        value={maxResponses || ""}
                        onChange={(e) => setMaxResponses(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="No limit"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Leave empty for unlimited responses</p>
                    </div>

                    <div>
                      <Label htmlFor="expiry-date">Expiry Date</Label>
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
                      <p className="text-xs text-muted-foreground mt-1">Select today or a future date</p>
                    </div>

                    <div>
                      <Label htmlFor="survey-language">Survey Language</Label>
                      <Select value={surveyLanguage} onValueChange={setSurveyLanguage}>
                        <SelectTrigger id="survey-language" className="mt-1">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                          <SelectItem value="zh">Chinese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PREVIEW TAB */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Survey Preview</CardTitle>
              <CardDescription>
                Preview how your survey will look to respondents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-muted/30">
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">{surveyName || "Survey Title"}</h2>
                    <p className="text-muted-foreground">{surveyDescription || "Survey description will appear here."}</p>
                    <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {estimatedTime} minutes
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {questions.length} questions
                      </span>
                    </div>
                  </div>

                  {welcomeMessage && (
                    <div className="bg-primary/10 border-l-4 border-primary p-4 rounded mb-6">
                      <p className="text-sm">{welcomeMessage}</p>
                    </div>
                  )}

                  {questions.length > 0 ? (
                    <div className="space-y-6">
                      {questions.slice(0, 3).map((question, index) => (
                        <div key={question.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-medium">
                              {index + 1}. {question.question}
                              {question.required && <span className="text-red-500 ml-1">*</span>}
                            </h3>
                            <Badge variant="outline">{question.questionType}</Badge>
                          </div>

                          {question.helpText && (
                            <p className="text-sm text-muted-foreground mb-3">{question.helpText}</p>
                          )}

                          {/* Mock question input based on type */}
                          {question.questionType === 'multiple-choice' && question.options && (
                            <div className="space-y-2">
                              {question.options.map((option) => (
                                <div key={option.id} className="flex items-center space-x-2">
                                  <input type="radio" id={option.id} name={`question-${question.id}`} />
                                  <label htmlFor={option.id} className="text-sm">{option.text}</label>
                                </div>
                              ))}
                            </div>
                          )}

                          {question.questionType === 'text' && (
                            <textarea
                              className="w-full p-2 border rounded-md text-sm"
                              placeholder="Your answer..."
                              rows={3}
                            />
                          )}

                          {question.questionType === 'slider' && (
                            <div className="px-2">
                              <input type="range" className="w-full" min="1" max="10" />
                              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>Strongly Disagree</span>
                                <span>Strongly Agree</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {questions.length > 3 && (
                        <div className="text-center text-muted-foreground">
                          <p>... and {questions.length - 3} more questions</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No questions to preview.</p>
                      <p className="text-sm">Add questions in the Questions tab to see them here.</p>
                    </div>
                  )}

                  {completionMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <p className="text-sm text-green-700">{completionMessage}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fixed save/cancel bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
        <div className="container mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Unsaved changes
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              Last saved: {surveyData?.updatedAt ? new Date(surveyData.updatedAt).toLocaleString() : 'Never'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Add padding to account for fixed bar */}
      <div className="h-20"></div>
    </div>
  );
}
