import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import CollaborationWidget from '@/components/survey/CollaborationWidget';
import { SurveyResponsesViewer } from '@/components/admin/SurveyResponsesViewer';
import SurveyList from '@/components/SurveyList';
import RealtimeAnalytics from '@/components/dashboard/RealtimeAnalytics';
import { ExternalLink, Copy, BarChart2, Users, Activity, Calendar, Clock, Tag, Share2, Edit, Trash2, Eye, Plus, Filter, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRealtime } from '@/hooks/useRealtime';

interface SurveyDetailProps {
  id: string;
}

interface SurveyResponse {
  id: number;
  surveyId: number;
  respondentId?: string;
  isAnonymous?: boolean;
  isComplete?: boolean;
  completed?: boolean;
  completionTime?: number;
  completionTimeSeconds?: number;
  startedAt?: string;
  completedAt?: string;
  responses: any[];
}

interface SurveyData {
  id: number;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  questions?: any[];
  questionCount?: number;
  [key: string]: any;
}

interface SurveyResponsesQueryResult {
  data: SurveyResponse[];
  total: number;
  page: number;
  limit: number;
}

export default function SurveyDetail({ id }: SurveyDetailProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [realTimeResponses, setRealTimeResponses] = useState<SurveyResponse[]>([]);

  // Fetch survey data
  const { data: survey, isLoading, error } = useQuery<SurveyData>({
    queryKey: [`/api/dashboard/surveys/${id}`],
    enabled: !!id,
    staleTime: 0, // Force fresh data
    cacheTime: 0, // Don't cache
    onSuccess: (data) => {
      console.log('Survey data loaded:', data);
    },
    onError: (error) => {
      console.error('Survey data error:', error);
    },
  });

  // Fetch survey responses
  const { data: responses, isLoading: isLoadingResponses } = useQuery<SurveyResponsesQueryResult>({
    queryKey: [`/api/survey-responses?surveyId=${id}`],
    enabled: !!id,
  });
  
  // Hook into real-time survey response updates
  const { connected } = useRealtime('surveyResponseReceived', (data) => {
    if (data.surveyId.toString() !== id) return;
    
    console.log('Received real-time survey response update:', data);
    
    // Add new response to the real-time list
    setRealTimeResponses(prev => {
      // Check if we already have this response
      const exists = prev.some(r => r.id === data.responseId);
      if (exists) return prev;
      
      // Create a simplified response object based on the event data
      const newResponse: SurveyResponse = {
        id: data.responseId,
        surveyId: data.surveyId,
        respondentId: data.userId,
        isAnonymous: data.isAnonymous,
        isComplete: data.isComplete,
        completed: data.isComplete,
        completionTime: data.completionTimeSeconds,
        completionTimeSeconds: data.completionTimeSeconds,
        startedAt: data.timestamp,
        completedAt: data.isComplete ? data.timestamp : undefined,
        responses: [] // We don't have the actual responses in the event
      };
      
      return [newResponse, ...prev];
    });
    
    // Show a toast notification for completed responses
    if (data.isComplete) {
      toast({
        title: 'New Survey Response',
        description: `A respondent has completed the survey.`,
        duration: 5000,
      });
    }
  });
  
  // Combine fetched and real-time responses
  const allResponses = [
    ...realTimeResponses,
    ...(responses?.data || [])
  ];
  
  // Calculate survey statistics from API response
  const totalResponses = survey?.responseCount || 0;
  const completedResponses = survey?.completedCount || 0;
  const averageCompletionTime = survey?.avgCompletionTime || null;
  
  // Copy share link to clipboard
  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/take-survey/${id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast({
          title: 'Share Link Copied',
          description: 'Survey share link has been copied to clipboard.',
          duration: 3000,
        });
      })
      .catch(error => {
        console.error('Failed to copy link:', error);
        toast({
          title: 'Failed to Copy',
          description: 'Could not copy share link to clipboard.',
          variant: 'destructive',
          duration: 3000,
        });
      });
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Tabs defaultValue="overview">
          <TabsList className="w-full border-b pb-0">
            <Skeleton className="h-10 w-24 mr-2" />
            <Skeleton className="h-10 w-24 mr-2" />
            <Skeleton className="h-10 w-24 mr-2" />
          </TabsList>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          
          <div className="mt-6">
            <Skeleton className="h-64" />
          </div>
        </Tabs>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Survey</CardTitle>
            <CardDescription>
              There was a problem loading the survey details. Please try again later.
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
    <div className="container mx-auto p-6 space-y-8">
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => setLocation('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {survey?.title || 'Survey Details'}
            {survey?.status === 'active' && (
              <Badge className="ml-2 bg-green-500">Active</Badge>
            )}
            {survey?.status === 'draft' && (
              <Badge variant="outline" className="ml-2">Draft</Badge>
            )}
            {survey?.status === 'closed' && (
              <Badge variant="destructive" className="ml-2">Closed</Badge>
            )}
          </h1>
          <p className="text-gray-500 mt-1">
            Created {survey?.createdAt ? formatDistanceToNow(new Date(survey.createdAt), { addSuffix: true }) : ''}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <CollaborationWidget 
            entityId={id} 
            entityType="survey" 
            currentUserId={1} 
          />
          
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={copyShareLink}
          >
            <Copy className="h-4 w-4" />
            Copy Link
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.open(`/survey/share/${id}`, '_blank')}
          >
            <Share2 className="h-4 w-4" />
            Share Options
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full border-b pb-0">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart2 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="responses" className="gap-2">
            <Users className="h-4 w-4" />
            Responses {totalResponses > 0 && `(${totalResponses})`}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <Activity className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  Responses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalResponses}</div>
                <p className="text-sm text-gray-500">
                  {completedResponses} completed ({survey?.completionRate || 0}%)
                </p>
                {connected && (
                  <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                    <span className="h-2 w-2 rounded-full bg-green-400 mr-1 inline-block animate-pulse"></span>
                    Real-time updates enabled
                  </Badge>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  Avg. Completion Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {averageCompletionTime ? 
                    `${averageCompletionTime} min` : 
                    'N/A'}
                </div>
                <p className="text-sm text-gray-500">
                  Based on {completedResponses} completed responses
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  Survey Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {survey?.startDate ? new Date(survey.startDate).toLocaleDateString() : 'Ongoing'}
                  {survey?.endDate ? ` - ${new Date(survey.endDate).toLocaleDateString()}` : ''}
                </div>
                <p className="text-sm text-gray-500">
                  {survey?.status === 'active' ? 'Currently active' : 
                   survey?.status === 'draft' ? 'Not yet published' : 
                   'Survey closed'}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-primary" />
                  Survey Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Description</h3>
                  <p>{survey?.description || 'No description provided.'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Category</h3>
                  <p>{survey?.category || 'Uncategorized'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Questions</h3>
                  <p>{survey?.questionCount || 0} questions in total</p>
                </div>
                
                <div className="pt-2">
                  <Button variant="outline" size="sm" onClick={() => setLocation(`/dashboard/survey/${id}/edit`)}>
                    Edit Survey
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {survey?.recentActivity && survey.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {survey.recentActivity.slice(0, 5).map((activity: any) => (
                      <div key={activity.id} className="flex items-start space-x-3 text-sm">
                        <div className={`h-2 w-2 mt-1.5 rounded-full ${activity.type === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <div>
                          <p className="font-medium">
                            {activity.description}
                          </p>
                          <p className="text-gray-500">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {survey.recentActivity.length > 5 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-primary"
                        onClick={() => setActiveTab('responses')}
                      >
                        View all {survey.recentActivity.length} activities
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No activity recorded yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="responses" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Survey Responses</CardTitle>
              <CardDescription>
                View detailed information about individual survey responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SurveyResponsesViewer surveyId={parseInt(id)} isAdminView={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responsesLegacy" className="hidden">
          <Card>
            <CardHeader>
              <CardTitle>Survey Responses</CardTitle>
              <CardDescription>
                View detailed information about all survey responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingResponses ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : allResponses.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No responses have been received yet.</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <div className="grid grid-cols-5 gap-4 p-4 font-medium bg-muted/50 text-sm">
                    <div>Respondent</div>
                    <div>Status</div>
                    <div>Started</div>
                    <div>Completed</div>
                    <div>Time Taken</div>
                  </div>
                  
                  {allResponses.map((response, index) => (
                    <div 
                      key={response.id} 
                      className={`grid grid-cols-5 gap-4 p-4 text-sm ${index % 2 === 0 ? 'bg-white' : 'bg-muted/20'}`}
                    >
                      <div>
                        {(response.isAnonymous || !response.respondentId) ? 
                          'Anonymous' : 
                          `Respondent #${response.respondentId || response.id}`}
                      </div>
                      <div>
                        {(response.isComplete || response.completed) ? (
                          <Badge className="bg-green-500">Completed</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            In Progress
                          </Badge>
                        )}
                      </div>
                      <div>
                        {response.startedAt ? new Date(response.startedAt).toLocaleString() : 'N/A'}
                      </div>
                      <div>
                        {response.completedAt ? new Date(response.completedAt).toLocaleString() : 'N/A'}
                      </div>
                      <div>
                        {response.completionTimeSeconds !== null && response.completionTimeSeconds !== undefined
                          ? `${Math.floor(response.completionTimeSeconds / 60)}m ${response.completionTimeSeconds % 60}s`
                          : response.completionTime
                          ? `${Math.floor(response.completionTime / 60)}m ${response.completionTime % 60}s`
                          : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="pt-6">
          {totalResponses < 10 ? (
            <Card>
              <CardHeader>
                <CardTitle>Survey Analytics</CardTitle>
                <CardDescription>
                  Detailed analytics and insights from survey responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-10 space-y-4">
                  <p className="text-gray-500">
                    Advanced analytics are available for surveys with sufficient responses.
                  </p>
                  <p className="text-sm text-gray-400">
                    Current response count: {totalResponses} / 10 minimum for analytics
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 max-w-md mx-auto">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(totalResponses / 10 * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <RealtimeAnalytics
              surveyId={parseInt(id)}
              companyId={survey?.companyId}
              showHeader={true}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
