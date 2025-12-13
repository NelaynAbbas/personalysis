import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Bot, Users, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';

interface SurveyData {
  id: number;
  title: string;
  description?: string;
  responseCount: number;
  maxResponses?: number;
  aiResponses: {
    enabled: boolean;
    count: number;
  };
  businessContext?: {
    productName?: string;
    industry?: string;
    targetMarket?: string[];
  };
}

interface AIJobStatus {
  id: string;
  surveyId: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  totalCount: number;
  generatedCount: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

interface AIResponsesPageProps {
  surveyId: string;
}

export default function AIResponsesPage({ surveyId }: AIResponsesPageProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [responseCount, setResponseCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentJob, setCurrentJob] = useState<AIJobStatus | null>(null);

  // Fetch survey data
  const { data: survey, isLoading, error } = useQuery<SurveyData>({
    queryKey: [`/api/dashboard/surveys/${surveyId}`],
    enabled: !!surveyId,
  });

  // Fetch current AI job status
  const { data: jobStatus } = useQuery<AIJobStatus>({
    queryKey: [`/api/surveys/${surveyId}/ai-job-status`],
    enabled: !!surveyId,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  // Auto-restore job state when page loads
  useEffect(() => {
    if (jobStatus && jobStatus.status === 'running') {
      setIsGenerating(true);
      setCurrentJob(jobStatus);
      console.log('Restored AI job state:', jobStatus);
    } else if (jobStatus && (jobStatus.status === 'completed' || jobStatus.status === 'failed')) {
      setIsGenerating(false);
      setCurrentJob(jobStatus);
    }
  }, [jobStatus]);

  // Listen for real-time job updates
  const { connected } = useRealtime('aiJobUpdate' as any, (data: any) => {
    if (data?.surveyId?.toString() === surveyId) {
      console.log('Received AI job update:', data);
      setCurrentJob(data);
      
      // Update generating state based on job status
      if (data.status === 'running') {
        setIsGenerating(true);
      } else if (data.status === 'completed') {
        setIsGenerating(false);
        toast({
          title: 'AI Responses Generated',
          description: `Successfully generated ${data.generatedCount} AI responses.`,
        });
        
        // Invalidate all relevant queries to refresh dashboard data
        const surveyIdNum = parseInt(surveyId);
        
        // Invalidate survey-specific queries
        queryClient.invalidateQueries({ queryKey: [`/api/dashboard/surveys/${surveyId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/surveys/${surveyId}/analytics`] });
        queryClient.invalidateQueries({ queryKey: [`/api/survey-responses`], exact: false });
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const key = query.queryKey[0];
            return typeof key === 'string' && (
              key.includes(`surveyId=${surveyId}`) ||
              key.includes(`/survey-responses?surveyId=${surveyId}`)
            );
          }
        });
        
        // Invalidate survey list to update response counts
        queryClient.invalidateQueries({ queryKey: ['/api/surveys'] });
        
        // Invalidate company analytics (all company analytics queries)
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey[0];
            return typeof key === 'string' && (
              key.startsWith('/api/company/') && key.includes('/analytics')
            );
          }
        });
        
        // Invalidate DashboardView analytics queries
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey[0];
            return typeof key === 'string' && key.includes('/analytics');
          }
        });
        
        console.log('Invalidated all dashboard-related queries after AI generation completion');
      } else if (data.status === 'failed') {
        setIsGenerating(false);
        toast({
          title: 'Generation Failed',
          description: data.error || 'Failed to generate AI responses.',
          variant: 'destructive',
        });
      }
    }
  });

  // Generate AI responses mutation
  const generateMutation = useMutation({
    mutationFn: async (count: number) => {
      const response = await fetch(`/api/surveys/${surveyId}/generate-ai-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start AI generation');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Check if this is a new job or existing job
      if (data.job) {
        setIsGenerating(true);
        setCurrentJob(data.job);
        
        if (data.message && data.message.includes('already in progress')) {
          toast({
            title: 'AI Generation Resumed',
            description: `Continuing existing AI generation job. ${data.job.generatedCount || 0}/${data.job.totalCount} responses completed.`,
          });
        } else {
          toast({
            title: 'AI Generation Started',
            description: `Started generating ${responseCount} AI responses.`,
          });
        }
      }
    },
    onError: (error) => {
      toast({
        title: 'Failed to Start Generation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Calculate validation limits
  const maxAllowed = survey?.maxResponses ? survey.maxResponses - survey.responseCount : 1000;
  const isValidCount = responseCount > 0 && responseCount <= maxAllowed;

  const handleGenerate = () => {
    if (!isValidCount) return;
    generateMutation.mutate(responseCount);
  };

  const handleCancel = () => {
    // TODO: Implement cancel job functionality
    setIsGenerating(false);
    setCurrentJob(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Survey</CardTitle>
            <CardDescription>
              There was a problem loading the survey data. Please try again later.
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

  if (!survey.aiResponses.enabled) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-600">AI Responses Not Enabled</CardTitle>
            <CardDescription>
              AI responses are not enabled for this survey. Please enable AI responses in the survey settings first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation(`/dashboard/survey/${surveyId}/edit`)}>
              Edit Survey Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="h-8 w-8 text-primary" />
              AI Response Generation
            </h1>
            <p className="text-gray-500 mt-1">{survey.title}</p>
          </div>
        </div>
      </div>

      {/* Survey Info */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-gray-500">Current Responses</p>
                <p className="text-2xl font-bold">{survey.responseCount}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-gray-500">Max AI Responses</p>
                <p className="text-2xl font-bold">{survey.aiResponses.count}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-gray-500">Response Limit</p>
                <p className="text-2xl font-bold">{survey.maxResponses || 'Unlimited'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Generate AI Responses</CardTitle>
          <CardDescription>
            Generate synthetic survey responses using AI to supplement your real respondent data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="response-count">Number of Responses to Generate</Label>
            <Input
              id="response-count"
              type="number"
              min="1"
              max={maxAllowed}
              value={responseCount}
              onChange={(e) => setResponseCount(parseInt(e.target.value) || 1)}
              disabled={isGenerating}
            />
            <p className="text-sm text-gray-500">
              Maximum allowed: {maxAllowed} responses
            </p>
            {!isValidCount && responseCount > 0 && (
              <Alert className="border-red-200">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700">
                  Response count exceeds the maximum allowed limit.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {survey.businessContext && (
            <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Business Context</h4>
              <p className="text-sm text-blue-700">
                AI responses will be generated based on your survey's business context:
                {survey.businessContext.productName && ` Product: ${survey.businessContext.productName}`}
                {survey.businessContext.industry && ` Industry: ${survey.businessContext.industry}`}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={handleGenerate}
              disabled={!isValidCount || isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4" />
                  Generate AI Responses
                </>
              )}
            </Button>
            
            {isGenerating && (
              <Button variant="outline" onClick={handleCancel}>
                Cancel Generation
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Section */}
      {(isGenerating || currentJob) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentJob?.status === 'completed' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
              Generation Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{currentJob?.generatedCount || 0} / {currentJob?.totalCount || responseCount}</span>
              </div>
              <Progress 
                value={currentJob ? (currentJob.generatedCount / currentJob.totalCount) * 100 : 0} 
                className="w-full"
              />
              {currentJob?.status === 'running' && (
                <div className="text-xs text-gray-500">
                  Processing in batches of 5 responses...
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant={currentJob?.status === 'completed' ? 'default' : 
                       currentJob?.status === 'failed' ? 'destructive' : 'secondary'}
              >
                {currentJob?.status || 'pending'}
              </Badge>
              {currentJob?.status === 'running' && (
                <span className="text-sm text-gray-500">
                  Generating responses... You can leave this page and return later.
                </span>
              )}
            </div>

            {currentJob?.error && (
              <Alert className="border-red-200">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700">
                  {currentJob.error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Real-time Status */}
      {connected && (
        <div className="fixed bottom-4 right-4">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <span className="h-2 w-2 rounded-full bg-green-400 mr-1 inline-block animate-pulse"></span>
            Real-time updates enabled
          </Badge>
        </div>
      )}
    </div>
  );
}
