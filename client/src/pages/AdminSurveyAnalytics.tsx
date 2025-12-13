import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import RealtimeAnalytics from '@/components/dashboard/RealtimeAnalytics';
// Removed apiRequest import - using fetch directly for better control

interface AdminSurveyAnalyticsProps {
  surveyId?: number | null;
  onBack?: () => void;
}

export default function AdminSurveyAnalytics({ surveyId: propSurveyId, onBack }: AdminSurveyAnalyticsProps = {}) {
  const [, setLocation] = useLocation();
  const params = useParams();
  const surveyId = propSurveyId || (params?.id ? parseInt(params.id) : null);

  // Fetch survey details
  const { data: surveyData, isLoading: surveyLoading, error: surveyError } = useQuery({
    queryKey: [`/api/surveys/${surveyId}?preview=true`],
    queryFn: async () => {
      // Get admin user from localStorage to add auth headers
      const currentUserStr = localStorage.getItem('currentUser');
      const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add admin headers for preview access
      if (currentUser?.role === 'platform_admin' || currentUser?.role === 'admin') {
        headers['X-Mock-Admin'] = 'true';
        headers['X-User-ID'] = String(currentUser.id || '1');
        headers['X-User-Role'] = currentUser.role || 'platform_admin';
      }
      
      const response = await fetch(`/api/surveys/${surveyId}?preview=true`, {
        credentials: 'include',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch survey: ${response.statusText}`);
      }
      
      const json = await response.json();
      
      // Handle the API response structure: { status: 'success', data: {...} }
      if (json.status === 'success' && json.data) {
        return json.data;
      } else if (json.status === 'error' || json.status === 'fail') {
        throw new Error(json.message || 'Failed to fetch survey data');
      }
      
      // Fallback: return the whole response if structure is different
      return json;
    },
    enabled: !!surveyId,
  });

  if (!surveyId) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Invalid Survey ID</CardTitle>
          <CardDescription>Please provide a valid survey ID</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => {
            if (onBack) {
              onBack();
            } else {
              setLocation('/admin');
            }
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Console
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (surveyLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (surveyError || !surveyData) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Error Loading Survey
          </CardTitle>
          <CardDescription>
            {surveyError instanceof Error ? surveyError.message : 'Failed to load survey data'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => {
            if (onBack) {
              onBack();
            } else {
              setLocation('/admin');
            }
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Console
          </Button>
        </CardContent>
      </Card>
    );
  }

  const survey = surveyData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Survey Analytics</h1>
          <p className="text-muted-foreground mt-1">{survey.title}</p>
        </div>
      </div>

      {/* Analytics Component */}
      <RealtimeAnalytics
        surveyId={surveyId}
        companyId={survey.companyId || undefined}
        showHeader={true}
      />
    </div>
  );
}

