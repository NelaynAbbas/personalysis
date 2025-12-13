import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Users, 
  Clock, 
  TrendingUp, 
  Eye,
  Calendar,
  Building2,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { SurveyResponsesViewer } from './SurveyResponsesViewer';

interface SurveyWithAnalytics {
  id: number;
  title: string;
  description: string;
  surveyType: string;
  isActive: boolean;
  isPublic: boolean;
  status: string;
  companyId: number;
  companyName: string;
  companyEmail: string;
  companyIndustry: string;
  createdById: number;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  analytics: {
    responseCount: number;
    completionRate: number;
    averageCompletionTime: number;
    lastResponseDate: string | null;
    totalResponses: number;
    completedResponses: number;
  };
}

export function AdminResponsesViewer() {
  // Check sessionStorage for survey filter from SurveyManagement
  // Only apply filter if it came from the action (not manual tab click)
  const filterSurveyIdFromStorage = typeof window !== 'undefined' 
    ? sessionStorage.getItem('adminResponsesFilterSurveyId') 
    : null;
  const filterFromAction = typeof window !== 'undefined'
    ? sessionStorage.getItem('adminResponsesFilterFromAction') === 'true'
    : false;
  
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(
    filterSurveyIdFromStorage && filterFromAction ? parseInt(filterSurveyIdFromStorage) : null
  );
  const [activeTab, setActiveTab] = useState<'surveys' | 'responses'>(
    filterSurveyIdFromStorage && filterFromAction ? 'responses' : 'surveys'
  );

  // Clear the filter from sessionStorage after using it (only if it came from action)
  useEffect(() => {
    if (filterSurveyIdFromStorage && filterFromAction && typeof window !== 'undefined') {
      sessionStorage.removeItem('adminResponsesFilterSurveyId');
      sessionStorage.removeItem('adminResponsesFilterFromAction');
    }
  }, [filterSurveyIdFromStorage, filterFromAction]);

  // Fetch all surveys with analytics
  const {
    data: surveysData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['admin-surveys'],
    queryFn: () => fetch('/api/admin/surveys').then(res => {
      if (!res.ok) throw new Error('Failed to fetch surveys');
      return res.json();
    }),
    keepPreviousData: true
  });

  const surveys: SurveyWithAnalytics[] = surveysData?.data || [];

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Survey Responses Overview</CardTitle>
            <CardDescription>Loading survey data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card className="border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-700 dark:text-red-300">Error Loading Surveys</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error instanceof Error ? error.message : 'Failed to load survey data'}</p>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (surveys.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Surveys Found</CardTitle>
          <CardDescription>No surveys have been created yet.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="rounded-full bg-muted p-6 mb-4">
            <BarChart3 className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-center text-muted-foreground">
            Surveys will appear here once they are created by clients.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Survey Responses Management</CardTitle>
          <CardDescription>
            View and manage survey responses across all clients. Click on a survey to view its responses.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'surveys' | 'responses')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="surveys">Surveys Overview</TabsTrigger>
          <TabsTrigger value="responses">Survey Responses</TabsTrigger>
        </TabsList>

        <TabsContent value="surveys" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Survey</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responses</TableHead>
                  
                    <TableHead>Avg. Time</TableHead>
                    <TableHead>Last Response</TableHead>
                    
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveys.map((survey) => (
                    <TableRow key={survey.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div 
                            className="font-medium truncate" 
                            title={survey.title}
                            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {survey.title}
                          </div>
                          <div 
                            className="text-sm text-muted-foreground" 
                            title={survey.description}
                            style={{ display: '-webkit-box', WebkitLineClamp: 2 as any, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}
                          >
                            {survey.description || 'No description'}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {survey.surveyType}
                            </Badge>
                            {survey.isPublic && (
                              <Badge variant="secondary" className="text-xs">
                                Public
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{survey.companyName}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {survey.companyEmail}
                          </div>
                          {survey.companyIndustry && (
                            <Badge variant="outline" className="text-xs">
                              {survey.companyIndustry}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{survey.creatorName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={survey.isActive ? "default" : "secondary"}
                          className={survey.isActive ? "bg-green-100 text-green-800" : ""}
                        >
                          {survey.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{survey.analytics.responseCount}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {survey.analytics.averageCompletionTime > 0 
                              ? `${survey.analytics.averageCompletionTime} min`
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {survey.analytics.lastResponseDate 
                              ? format(new Date(survey.analytics.lastResponseDate), 'MMM dd, yyyy')
                              : 'No responses'
                            }
                          </span>
                        </div>
                      </TableCell>
                      
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses">
          <SurveyResponsesViewer 
            isAdminView={true} 
            surveyId={selectedSurveyId || undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
