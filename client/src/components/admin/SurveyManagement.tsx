import React, { useState } from "react";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@/lib/api";
import { 
  Loader2, 
  RefreshCw, 
  AlertCircle, 
  Search, 
  MoreHorizontal,
  Flag,
  Eye,
  Play,
  PowerOff,
  RotateCcw,
  Trash2,
  FileText,
  BarChart3,
  MessageSquare
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

// Survey interface
interface Survey {
  id: number;
  title: string;
  status: "active" | "inactive" | "draft" | "archived" | "flagged";
  type: string;
  launchedAt: string | null;
  responseCount: number;
  maxResponses: number | null;
  createdAt: string;
  clientId: number | null;
  clientName?: string;
  flags?: SurveyFlag[];
}

// Survey Flag interface
interface SurveyFlag {
  id: number;
  surveyId: number;
  type: "missing_data" | "broken_logic" | "client_complaint" | "other";
  description: string;
  status: "open" | "resolved";
  createdAt: string;
  createdBy: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center p-12">
    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
    <p className="text-lg text-muted-foreground">Loading survey data...</p>
  </div>
);

// Error alert component
const ErrorAlert = ({ message, onRetry }: { message: string, onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-destructive/10">
    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
    <h3 className="text-lg font-medium mb-2">Failed to load surveys</h3>
    <p className="text-muted-foreground mb-4">{message}</p>
    <Button onClick={onRetry} variant="outline" size="sm">
      <RefreshCw className="mr-2 h-4 w-4" />
      Retry
    </Button>
  </div>
);

interface SurveyManagementProps {
  onViewAnalytics?: (surveyId: number) => void;
}

const SurveyManagement = ({ onViewAnalytics }: SurveyManagementProps = {}) => {
  const [, setLocation] = useLocation();
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState<number | null>(null);
  
  // State for action dialogs
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [flagDetails, setFlagDetails] = useState({
    type: "missing_data" as "missing_data" | "broken_logic" | "client_complaint" | "other",
    description: ""
  });
  const [showFlagsDialog, setShowFlagsDialog] = useState(false);
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  // Fetch surveys data - use admin endpoint to get all surveys from all companies
  const {
    data: surveysData,
    isLoading: isLoadingSurveys,
    isError: isSurveysError,
    error: surveysError,
    refetch: refetchSurveys
  } = useQuery({
    queryKey: ['/api/admin/surveys'],
    queryFn: async () => {
      const response = await api.get('/api/admin/surveys');
      return response;
    },
    retry: 2,
    refetchOnWindowFocus: false
  });

  // Fetch clients data for dropdown
  const {
    data: clientsData,
    isLoading: isLoadingClients
  } = useQuery({
    queryKey: ['/api/clients'],
    retry: 2,
    refetchOnWindowFocus: false
  });

  // Transform API response to match Survey interface
  const surveys: Survey[] = (() => {
    if (!surveysData) return [];
    
    // Handle both array and wrapped response formats
    const surveysArray = Array.isArray(surveysData) 
      ? surveysData 
      : (surveysData?.data && Array.isArray(surveysData.data) 
          ? surveysData.data 
          : []);
    
    console.log('📊 Transforming surveys data:', { count: surveysArray.length, first: surveysArray[0] });
    
    return surveysArray.map((survey: any) => {
      // Determine status - prioritize explicit status, then isActive, default to active
      let status: "active" | "inactive" | "draft" | "archived" | "flagged" = "active";
      if (survey.status) {
        status = survey.status.toLowerCase() as any;
      } else if (survey.isActive !== undefined) {
        status = survey.isActive ? "active" : "inactive";
      }
      
      // Get survey type
      const surveyType = survey.surveyType || survey.type || survey.survey_type || 'Custom Survey';
      
      // Get response count and max responses
      const responseCount = survey.responseCount !== undefined 
                          ? survey.responseCount 
                          : (survey.response_count !== undefined 
                             ? survey.response_count 
                             : (survey.analytics?.responseCount || 0));
      
      const maxResponses = survey.maxResponses !== undefined && survey.maxResponses !== null
                          ? survey.maxResponses
                          : (survey.max_responses !== undefined && survey.max_responses !== null
                             ? survey.max_responses
                             : null);
      
      // Get client/company info
      const clientId = survey.companyId || survey.clientId || null;
      const clientName = survey.companyName || survey.clientName || null;
      
      return {
        id: survey.id,
        title: survey.title || 'Untitled Survey',
        status,
        type: surveyType,
        launchedAt: survey.createdAt || survey.launchedAt || null,
        responseCount: Number(responseCount),
        maxResponses: maxResponses !== null ? Number(maxResponses) : null,
        createdAt: survey.createdAt || new Date().toISOString(),
        clientId,
        clientName: clientName || 'No client',
        flags: survey.flags || []
      };
    });
  })();

  const clients = clientsData?.data || [];

  // Mutations
  // Update survey status (enable/disable/archive)
  const updateSurveyStatusMutation = useMutation({
    mutationFn: (data: { surveyId: number, status: string }) => {
      return apiRequest("PATCH", `/api/surveys/${data.surveyId}/status`, { status: data.status, isAdmin: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/surveys'] });
      toast({
        title: "Survey Updated",
        description: "Survey status has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update survey: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  // Reset survey (delete all responses)
  const resetSurveyMutation = useMutation({
    mutationFn: (surveyId: number) => {
      return apiRequest("POST", `/api/surveys/${surveyId}/reset`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/surveys'] });
      toast({
        title: "Survey Reset",
        description: "Survey has been reset successfully. All responses have been deleted."
      });
      setShowResetConfirm(false);
      setSelectedSurvey(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to reset survey: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  // Delete survey
  const deleteSurveyMutation = useMutation({
    mutationFn: (surveyId: number) => {
      return apiRequest("DELETE", `/api/surveys/${surveyId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/surveys'] });
      toast({
        title: "Survey Deleted",
        description: "Survey has been deleted successfully."
      });
      setShowDeleteConfirm(false);
      setSelectedSurvey(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete survey: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  // Flag survey
  const flagSurveyMutation = useMutation({
    mutationFn: (data: { surveyId: number, type: string, description: string }) => {
      return apiRequest("POST", `/api/surveys/${data.surveyId}/flag`, {
        type: data.type,
        description: data.description
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/surveys'] });
      toast({
        title: "Survey Flagged",
        description: "Survey has been flagged successfully."
      });
      setShowFlagDialog(false);
      setFlagDetails({
        type: "missing_data",
        description: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to flag survey: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  // Add admin note
  const addAdminNoteMutation = useMutation({
    mutationFn: (data: { surveyId: number, note: string }) => {
      return apiRequest("POST", `/api/surveys/${data.surveyId}/notes`, {
        note: data.note
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/surveys'] });
      toast({
        title: "Note Added",
        description: "Admin note has been added successfully."
      });
      setShowAddNoteDialog(false);
      setAdminNote("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to add note: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  // Handle status update
  const handleStatusUpdate = (survey: Survey, newStatus: string) => {
    updateSurveyStatusMutation.mutate({
      surveyId: survey.id,
      status: newStatus
    });
  };

  // Handle survey reset - show confirmation first
  const handleResetSurvey = (survey: Survey) => {
    setSelectedSurvey(survey);
    setShowResetConfirm(true);
  };

  // Confirm reset after warning dialog
  const handleConfirmReset = () => {
    if (!selectedSurvey) return;
    resetSurveyMutation.mutate(selectedSurvey.id);
  };

  // Handle flag survey
  const handleFlagSurvey = () => {
    if (!selectedSurvey) return;
    
    if (!flagDetails.description.trim()) {
      toast({
        title: "Missing Details",
        description: "Please provide a description of the issue.",
        variant: "destructive"
      });
      return;
    }
    
    flagSurveyMutation.mutate({
      surveyId: selectedSurvey.id,
      type: flagDetails.type,
      description: flagDetails.description
    });
  };

  // Handle add admin note
  const handleAddAdminNote = () => {
    if (!selectedSurvey) return;
    
    if (!adminNote.trim()) {
      toast({
        title: "Missing Note",
        description: "Please provide a note.",
        variant: "destructive"
      });
      return;
    }
    
    addAdminNoteMutation.mutate({
      surveyId: selectedSurvey.id,
      note: adminNote
    });
  };

  // Handle delete survey
  const handleDeleteSurvey = () => {
    if (!selectedSurvey) return;
    deleteSurveyMutation.mutate(selectedSurvey.id);
  };

  // Filter surveys based on search query, status and client
  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = !searchQuery || 
      survey.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || survey.status === statusFilter;
    
    const matchesClient = !clientFilter || survey.clientId === clientFilter;
    
    return matchesSearch && matchesStatus && matchesClient;
  });

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "draft":
        return "bg-blue-100 text-blue-800";
      case "archived":
        return "bg-purple-100 text-purple-800";
      case "flagged":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // If loading, show spinner
  if (isLoadingSurveys) {
    return <LoadingSpinner />;
  }

  // If error, show error alert
  if (isSurveysError) {
    return <ErrorAlert 
      message={(surveysError as Error)?.message || "Failed to load surveys"} 
      onRetry={refetchSurveys} 
    />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Survey Management</h2>
      </div>

      {/* Filters section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search surveys..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={statusFilter || "all"} onValueChange={val => setStatusFilter(val === "all" ? null : val)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
        
        <Select 
          value={clientFilter ? String(clientFilter) : "all"} 
          onValueChange={val => setClientFilter(val === "all" ? null : Number(val))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={String(client.id)}>
                {client.name} - {client.company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Surveys table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Surveys</CardTitle>
          <CardDescription>
            Showing {filteredSurveys.length} {filteredSurveys.length !== surveys.length ? `of ${surveys.length}` : ''} surveys
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSurveys.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No surveys found matching your criteria</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Launched</TableHead>
                    <TableHead>Responses</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSurveys.map((survey) => (
                    <TableRow key={survey.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {survey.title}
                          {survey.flags && survey.flags.length > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {survey.flags.length} {survey.flags.length === 1 ? 'issue' : 'issues'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(survey.status)}>
                          {survey.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{survey.clientName || "No client"}</TableCell>
                      <TableCell>{survey.type}</TableCell>
                      <TableCell>{formatDate(survey.launchedAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>
                            {survey.responseCount} / {survey.maxResponses !== null ? survey.maxResponses : '∞'}
                          </span>
                          <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                            {survey.maxResponses !== null && survey.maxResponses > 0 ? (
                              <div 
                                className="h-2 bg-primary rounded-full" 
                                style={{ width: `${Math.min((survey.responseCount / survey.maxResponses) * 100, 100)}%` }}
                              ></div>
                            ) : (
                              <div 
                                className="h-2 bg-primary rounded-full" 
                                style={{ width: survey.responseCount > 0 ? '100%' : '0%' }}
                              ></div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => {
                              setSelectedSurvey(survey);
                              // Open preview in a new tab
                              window.open(`/take-survey/${survey.id}?preview=true`, '_blank');
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview Survey
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => {
                              if (onViewAnalytics) {
                                onViewAnalytics(survey.id);
                              } else {
                                // Fallback: open in new tab if callback not provided
                                window.open(`/admin/analyze-survey/${survey.id}`, '_blank');
                              }
                            }}>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Analytics
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => {
                              // Navigate to admin console responses tab with survey filter
                              // Store surveyId in sessionStorage to filter responses
                              // Use a special flag to indicate this is from the action
                              sessionStorage.setItem('adminResponsesFilterSurveyId', survey.id.toString());
                              sessionStorage.setItem('adminResponsesFilterFromAction', 'true');
                              setLocation('/admin/responses');
                            }}>
                              <FileText className="h-4 w-4 mr-2" />
                              View Responses
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {survey.status !== "active" && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(survey, "active")}>
                                <Play className="h-4 w-4 mr-2" />
                                Activate Survey
                              </DropdownMenuItem>
                            )}
                            
                            {survey.status === "active" && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(survey, "inactive")}>
                                <PowerOff className="h-4 w-4 mr-2" />
                                Disable Survey
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem onClick={() => handleResetSurvey(survey)}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reset Survey
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => {
                              setSelectedSurvey(survey);
                              setShowFlagDialog(true);
                            }}>
                              <Flag className="h-4 w-4 mr-2" />
                              Flag Issue
                            </DropdownMenuItem>
                            
                            {survey.flags && survey.flags.length > 0 && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedSurvey(survey);
                                setShowFlagsDialog(true);
                              }}>
                                <AlertCircle className="h-4 w-4 mr-2" />
                                View Issues ({survey.flags.length})
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem onClick={() => {
                              setSelectedSurvey(survey);
                              setShowAddNoteDialog(true);
                            }}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Add Admin Note
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setSelectedSurvey(survey);
                                setShowDeleteConfirm(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Survey
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flag Issue Dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Survey Issue</DialogTitle>
            <DialogDescription>
              Report an issue with "{selectedSurvey?.title}". This will mark the survey as flagged.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="issueType">Issue Type <span className="text-destructive">*</span></Label>
              <Select
                value={flagDetails.type}
                onValueChange={(value: any) => setFlagDetails({ ...flagDetails, type: value })}
              >
                <SelectTrigger id="issueType">
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="missing_data">Missing Data</SelectItem>
                  <SelectItem value="broken_logic">Broken Logic</SelectItem>
                  <SelectItem value="client_complaint">Client Complaint</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="issueDescription">Description <span className="text-destructive">*</span></Label>
              <Textarea
                id="issueDescription"
                placeholder="Describe the issue in detail..."
                value={flagDetails.description}
                onChange={(e) => setFlagDetails({ ...flagDetails, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlagDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFlagSurvey}>
              Flag Survey
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Flags Dialog */}
      <Dialog open={showFlagsDialog} onOpenChange={setShowFlagsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Survey Issues</DialogTitle>
            <DialogDescription>
              Issues reported for "{selectedSurvey?.title}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {selectedSurvey?.flags && selectedSurvey.flags.length > 0 ? (
              <div className="space-y-4">
                {selectedSurvey.flags.map((flag) => (
                  <Card key={flag.id} className={flag.status === "resolved" ? "border-green-200" : "border-red-200"}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-base">
                            {flag.type.replace("_", " ").charAt(0).toUpperCase() + flag.type.replace("_", " ").slice(1)}
                          </CardTitle>
                          <CardDescription>
                            Reported on {formatDate(flag.createdAt)} by {flag.createdBy}
                          </CardDescription>
                        </div>
                        <Badge variant={flag.status === "resolved" ? "default" : "destructive"}>
                          {flag.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{flag.description}</p>
                      
                      {flag.status === "resolved" && flag.resolvedAt && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Resolved on {formatDate(flag.resolvedAt)} by {flag.resolvedBy}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No issues found for this survey</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowFlagsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Admin Note Dialog */}
      <Dialog open={showAddNoteDialog} onOpenChange={setShowAddNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin Note</DialogTitle>
            <DialogDescription>
              Add an internal note for "{selectedSurvey?.title}". This is only visible to admin users.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adminNote">Note</Label>
              <Textarea
                id="adminNote"
                placeholder="Add your note here..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddNoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAdminNote}>
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Survey?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all responses for "{selectedSurvey?.title}". 
              The survey itself will remain, but all response data will be lost. This action cannot be undone.
              <br /><br />
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset Survey
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the survey "{selectedSurvey?.title}" and all its data. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSurvey}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SurveyManagement;