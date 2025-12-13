import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useRealtime } from '@/hooks/useRealtime';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Trash2, Eye, Plus, Filter, Search, Copy, Share2, Users, Calendar, BarChart3, Bot, AlertTriangle, Power, PowerOff, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SurveyFlag {
  id: number;
  type: string;
  description: string;
  status: string;
  createdByName?: string;
  createdAt: string;
}

interface Survey {
  id: number;
  title: string;
  description?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  responseCount: number;
  completionRate: number;
  surveyType: string;
  category?: string;
  enableAIResponses?: boolean;
  flags?: SurveyFlag[];
  openFlagsCount?: number;
  adminNote?: string | null;
  adminDeactivated?: boolean; // Admin-side deactivation (blocks all client actions)
}

interface SurveyListProps {
  showCreateButton?: boolean;
  title?: string;
  description?: string;
}

export default function SurveyList({
  showCreateButton = true,
  title = "Active Surveys",
  description = "Manage and monitor all your active surveys"
}: SurveyListProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteSurveyId, setDeleteSurveyId] = useState<number | null>(null);

  // Fetch surveys
  const { data: surveysData, isLoading, error } = useQuery<{ data: Survey[] }>({
    queryKey: ['/api/dashboard/surveys'],
  });

  // Subscribe to real-time survey updates via WebSocket
  useRealtime('surveyStatusUpdate', (data: any) => {
    console.log('Received survey status update:', data);
    // Invalidate queries to refetch survey list when status changes
    if (data?.surveyId) {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/surveys'] });
    }
  });

  // Also listen for general survey updates
  useRealtime('surveyUpdate', (data: any) => {
    console.log('Received survey update:', data);
    // Invalidate queries to refetch survey list when survey is updated
    if (data?.surveyId) {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/surveys'] });
    }
  });

  // Delete survey mutation
  const deleteMutation = useMutation({
    mutationFn: async (surveyId: number) => {
      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete survey');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/surveys'] });
      toast({
        title: 'Survey Deleted',
        description: 'The survey has been successfully deleted.',
        duration: 3000,
      });
      setDeleteSurveyId(null);
    },
    onError: (error) => {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete the survey. Please try again.',
        variant: 'destructive',
        duration: 3000,
      });
      console.error('Delete error:', error);
    },
  });

  // Filter surveys based on search term and status
  const filteredSurveys = surveysData?.data?.filter(survey => {
    const matchesSearch = survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         survey.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         survey.status === statusFilter ||
                         (statusFilter === 'active' && survey.isActive && survey.status !== 'flagged') ||
                         (statusFilter === 'inactive' && !survey.isActive) ||
                         (statusFilter === 'flagged' && survey.status === 'flagged');
    return matchesSearch && matchesStatus;
  }) || [];

  // Copy share link to clipboard
  const copyShareLink = (surveyId: number) => {
    const shareUrl = `${window.location.origin}/take-survey/${surveyId}`;
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

  // Handle survey preview
  const handlePreview = (surveyId: number) => {
    window.open(`/take-survey/${surveyId}`, '_blank');
  };

  // Handle survey edit
  const handleEdit = (surveyId: number) => {
    setLocation(`/dashboard/survey/${surveyId}/edit`);
  };

  // Handle survey details
  const handleViewDetails = (surveyId: number) => {
    setLocation(`/dashboard/survey/${surveyId}`);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (surveyId: number) => {
    deleteMutation.mutate(surveyId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Surveys</CardTitle>
          <CardDescription>
            There was a problem loading the surveys. Please try again later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-gray-600">{description}</p>
        </div>

        {showCreateButton && (
          <Button
            onClick={() => setLocation('/survey/create')}
            className="bg-primary hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Survey
          </Button>
        )}
      </div>

      {/* Surveys Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Surveys ({filteredSurveys.length})
          </CardTitle>
        </CardHeader>
        
        {/* Filters and Search */}
        <div className="px-6 pb-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search surveys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <CardContent>
          {filteredSurveys.length === 0 ? (
            <div className="text-center py-10">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No surveys match your filters' : 'No surveys found'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search terms or filters.'
                  : 'Get started by creating your first survey.'}
              </p>
              {showCreateButton && !searchTerm && statusFilter === 'all' && (
                <Button onClick={() => setLocation('/survey/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Survey
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Survey</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responses</TableHead>
                    <TableHead>Completion Rate</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSurveys.map((survey) => (
                    <TableRow 
                      key={survey.id}
                      className={survey.status === 'flagged' ? 'bg-red-50/50 hover:bg-red-50' : !survey.isActive ? 'opacity-75' : ''}
                    >
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`font-medium ${!survey.isActive ? 'text-gray-500' : ''} ${survey.status === 'flagged' ? 'text-red-700' : ''}`}>
                              {survey.title}
                            </h3>
                            {survey.status === 'flagged' && (
                              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" title="Survey has open flags" />
                            )}
                          </div>
                          {survey.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {survey.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {survey.surveyType}
                            </Badge>
                            {survey.category && (
                              <Badge variant="outline" className="text-xs">
                                {survey.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Flagged Status - Highest Priority */}
                          {survey.status === 'flagged' && (
                            <>
                              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" title="Flagged Issue" />
                              <Badge variant="destructive" className="text-xs">
                                Flagged
                              </Badge>
                            </>
                          )}
                          
                          {/* Admin Deactivated Status - Second Priority */}
                          {survey.adminDeactivated && survey.status !== 'flagged' && (
                            <Badge className="bg-red-100 text-red-800 border-red-300 text-xs" title="Deactivated by Administrator">
                              Admin Deactivated
                            </Badge>
                          )}
                          
                          {/* Regular Status Badge */}
                          {!survey.adminDeactivated && survey.status !== 'flagged' && (
                            <Badge
                              className={
                                survey.status === 'active' && survey.isActive
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : survey.status === 'inactive' || !survey.isActive
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  : 'bg-gray-100 text-gray-800 border-gray-200'
                              }
                            >
                              {survey.status}
                            </Badge>
                          )}
                          
                          {/* Power Icon - Show only if not flagged */}
                          {survey.status !== 'flagged' && (
                            <>
                              {survey.isActive ? (
                                <Power className="h-4 w-4 text-green-600 flex-shrink-0" title="Active" />
                              ) : (
                                <PowerOff className="h-4 w-4 text-gray-400 flex-shrink-0" title="Inactive" />
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{survey.responseCount}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${survey.completionRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{survey.completionRate}%</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(survey.createdAt), { addSuffix: true })}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          {/* Check if admin-deactivated or flagged - these disable all actions except delete */}
                          {(() => {
                            const isAdminDeactivated = survey.adminDeactivated || survey.status === 'flagged';
                            
                            return (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handlePreview(survey.id)}
                                    disabled={!survey.isActive || isAdminDeactivated}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview Survey
                                    {(!survey.isActive || isAdminDeactivated) && (
                                      <span className="ml-auto text-xs text-muted-foreground">
                                        {isAdminDeactivated ? "Admin disabled" : "Inactive"}
                                      </span>
                                    )}
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => survey.enableAIResponses && survey.isActive && !isAdminDeactivated && setLocation(`/dashboard/survey/${survey.id}/ai-responses`)}
                                    disabled={!survey.enableAIResponses || !survey.isActive || isAdminDeactivated}
                                  >
                                    <Bot className="h-4 w-4 mr-2" />
                                    Generate AI Responses
                                    {(!survey.enableAIResponses || !survey.isActive || isAdminDeactivated) && (
                                      <span className="ml-auto text-xs text-muted-foreground">
                                        {!survey.enableAIResponses ? "Disabled" : isAdminDeactivated ? "Admin disabled" : "Inactive"}
                                      </span>
                                    )}
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => copyShareLink(survey.id)}
                                    disabled={!survey.isActive || isAdminDeactivated}
                                  >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Share Link
                                    {(!survey.isActive || isAdminDeactivated) && (
                                      <span className="ml-auto text-xs text-muted-foreground">
                                        {isAdminDeactivated ? "Admin disabled" : "Inactive"}
                                      </span>
                                    )}
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => handleViewDetails(survey.id)}
                                    disabled={isAdminDeactivated}
                                  >
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    View Analytics
                                    {isAdminDeactivated && (
                                      <span className="ml-auto text-xs text-muted-foreground">
                                        Admin disabled
                                      </span>
                                    )}
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => handleEdit(survey.id)}
                                    disabled={isAdminDeactivated}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Survey
                                    {isAdminDeactivated && (
                                      <span className="ml-auto text-xs text-muted-foreground">
                                        Admin disabled
                                      </span>
                                    )}
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Survey
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Survey</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{survey.title}"? This action cannot be undone and will permanently delete all associated responses and data.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteConfirm(survey.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete Survey
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            );
                          })()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
