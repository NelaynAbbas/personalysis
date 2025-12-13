import React, { useState } from "react";
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
import { 
  Loader2, 
  RefreshCw, 
  AlertCircle, 
  Search, 
  MoreHorizontal,
  UserPlus,
  UserCheck,
  MessageSquare,
  Eye,
  FileText,
  Clock,
  Users,
  Mailbox
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

// Client interface
interface Client {
  id: number;
  name: string;
  company: string;
  email: string;
  status: "active" | "pending" | "inactive";
  createdAt: string;
  licenseId: number | null;
  licenseName?: string;
  notes?: ClientNote[];
  totalSurveys?: number;
  activeSurveys?: number;
  lastLoginAt?: string | null;
  // User information
  firstName?: string;
  lastName?: string;
  userName?: string;
  userRole?: string;
  userActive?: boolean;
}

// License interface
interface License {
  id: number;
  name: string;
  type: string;
  maxSurveys: number;
  maxResponses: number;
  maxSeats?: number;
  features: Record<string, boolean> | string;
}

// Client Notes interface
interface ClientNote {
  id: number;
  clientId: number;
  content: string;
  createdAt: string;
  createdBy: string;
  isResolved: boolean;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
}

// Survey Response interface
interface SurveyResponse {
  id: number;
  surveyId: number;
  surveyTitle: string;
  respondentId: string;
  startedAt: string;
  completedAt: string | null;
  status: "complete" | "partial" | "abandoned";
  progress: number;
  duration: number;
  responseData: any;
}

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center p-12">
    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
    <p className="text-lg text-muted-foreground">Loading client data...</p>
  </div>
);

// Error alert component
const ErrorAlert = ({ message, onRetry }: { message: string, onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-destructive/10">
    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
    <h3 className="text-lg font-medium mb-2">Failed to load client data</h3>
    <p className="text-muted-foreground mb-4">{message}</p>
    <Button onClick={onRetry} variant="outline" size="sm">
      <RefreshCw className="mr-2 h-4 w-4" />
      Retry
    </Button>
  </div>
);

const ClientSupport = () => {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [licenseFilter, setLicenseFilter] = useState<number | null>(null);
  
  // State for action dialogs
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showResponseDetails, setShowResponseDetails] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);
  const [adminNote, setAdminNote] = useState("");
  
  // State for impersonation
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Fetch clients data
  const {
    data: clientsData,
    isLoading: isLoadingClients,
    isError: isClientsError,
    error: clientsError,
    refetch: refetchClients
  } = useQuery({
    queryKey: ['/r'],
    retry: 2,
    refetchOnWindowFocus: false
  });

  // Fetch licenses data
  const {
    data: licensesData,
    isLoading: isLoadingLicenses
  } = useQuery({
    queryKey: ['/api/licenses'],
    retry: 2,
    refetchOnWindowFocus: false
  });

  // Fetch client survey responses when a client is selected
  const {
    data: responsesData,
    isLoading: isLoadingResponses,
    refetch: refetchResponses
  } = useQuery({
    queryKey: ['/api/admin/clients/responses', selectedClient?.id],
    enabled: !!selectedClient && showClientDetails,
    retry: 2,
    refetchOnWindowFocus: false
  });

  // Fetch client survey data when a client is selected
  const {
    data: clientSurveysData,
    isLoading: isLoadingClientSurveys
  } = useQuery({
    queryKey: ['/api/admin/clients/surveys', selectedClient?.id],
    enabled: !!selectedClient && showClientDetails,
    retry: 2,
    refetchOnWindowFocus: false
  });

  // Extract data from responses
  const clients = clientsData?.data || [];
  const licenses = licensesData?.data || [];
  const responses = responsesData?.data || [];
  const clientSurveys = clientSurveysData?.data || [];

  // Mutation for adding client notes
  const addNoteMutation = useMutation({
    mutationFn: (data: { clientId: number, note: string }) => {
      return apiRequest("POST", `/api/admin/clients/${data.clientId}/notes`, { 
        content: data.note 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Note Added",
        description: "Client note has been added successfully."
      });
      setShowAddNote(false);
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

  // Mutation for resolving client notes
  const resolveNoteMutation = useMutation({
    mutationFn: (noteId: number) => {
      return apiRequest("PATCH", `/api/admin/client-notes/${noteId}/resolve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Note Resolved",
        description: "Client note has been marked as resolved."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to resolve note: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  // Mutation for impersonating client
  const impersonateClientMutation = useMutation({
    mutationFn: (clientId: number) => {
      return apiRequest("POST", `/api/admin/impersonate/${clientId}`, {});
    },
    onSuccess: (data) => {
      // Store the token in localStorage
      localStorage.setItem('impersonationToken', data.token);
      localStorage.setItem('impersonatedClientId', String(selectedClient?.id));
      
      // Set impersonation flag
      setIsImpersonating(true);
      
      toast({
        title: "Impersonation Started",
        description: `You are now viewing the dashboard as ${selectedClient?.name}.`
      });
      
      // Open client dashboard in a new tab
      window.open('/dashboard?impersonated=true', '_blank');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to impersonate client: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  // Handle adding a note
  const handleAddNote = () => {
    if (!selectedClient) return;
    
    if (!adminNote.trim()) {
      toast({
        title: "Missing Note",
        description: "Please provide a note.",
        variant: "destructive"
      });
      return;
    }
    
    addNoteMutation.mutate({
      clientId: selectedClient.id,
      note: adminNote
    });
  };

  // Handle resolving a note
  const handleResolveNote = (noteId: number) => {
    resolveNoteMutation.mutate(noteId);
  };

  // Handle client impersonation
  const handleImpersonateClient = () => {
    if (!selectedClient) return;
    impersonateClientMutation.mutate(selectedClient.id);
  };

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (e) {
      return dateString;
    }
  };

  // Format duration helper (in seconds to minutes and seconds)
  const formatDuration = (seconds: number) => {
    if (!seconds) return "0s";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter clients based on search and filters
  const filteredClients = clients.filter(client => {
    const matchesSearch = !searchQuery || 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || client.status === statusFilter;
    
    const matchesLicense = !licenseFilter || client.licenseId === licenseFilter;
    
    return matchesSearch && matchesStatus && matchesLicense;
  });

  // If loading, show spinner
  if (isLoadingClients) {
    return <LoadingSpinner />;
  }

  // If error, show error alert
  if (isClientsError) {
    return <ErrorAlert 
      message={(clientsError as Error)?.message || "Failed to load client data"} 
      onRetry={refetchClients} 
    />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Client Support</h2>
      </div>

      {/* Filters section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        
        <Select 
          value={licenseFilter ? String(licenseFilter) : "all"} 
          onValueChange={val => setLicenseFilter(val === "all" ? null : Number(val))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by license" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Licenses</SelectItem>
            {licenses.map((license) => (
              <SelectItem key={license.id} value={String(license.id)}>
                {license.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clients table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Clients</CardTitle>
          <CardDescription>
            Showing {filteredClients.length} {filteredClients.length !== clients.length ? `of ${clients.length}` : ''} clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No clients found matching your criteria</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Surveys</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {client.userName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'N/A'}
                          {client.notes && Array.isArray(client.notes) && client.notes.filter(note => !note.isResolved).length > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {client.notes.filter(note => !note.isResolved).length} notes
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{client.company}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(client.status)}>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {client.licenseId ? 
                          licenses.find(license => license.id === client.licenseId)?.name || `License #${client.licenseId}` 
                          : 'None'}
                      </TableCell>
                      <TableCell>
                        {client.activeSurveys !== undefined && client.totalSurveys !== undefined ? (
                          <div>
                            {client.activeSurveys} active / {client.totalSurveys} total
                          </div>
                        ) : 'Unknown'}
                      </TableCell>
                      <TableCell>{formatDate(client.lastLoginAt)}</TableCell>
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
                            
                            <DropdownMenuItem onClick={() => {
                              setSelectedClient(client);
                              setShowClientDetails(true);
                              // Ensure we have the latest responses
                              if (selectedClient?.id !== client.id) {
                                // Force a refetch when changing clients
                                setTimeout(() => refetchResponses(), 100);
                              }
                            }}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Client Details
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => {
                              setSelectedClient(client);
                              setShowAddNote(true);
                            }}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Add Support Note
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => {
                              setSelectedClient(client);
                              handleImpersonateClient();
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Impersonate Client
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

      {/* Client Details Dialog */}
      <Dialog open={showClientDetails} onOpenChange={setShowClientDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>
              Detailed information for {selectedClient?.name} at {selectedClient?.company}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {isLoadingClientSurveys || isLoadingResponses ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* License Details */}
                <div>
                  <h3 className="text-lg font-medium mb-4">License Information</h3>
                  {selectedClient?.licenseId ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {licenses.filter(license => license.id === selectedClient.licenseId).map(license => (
                        <React.Fragment key={license.id}>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">License Type</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p>{license.name} ({license.type})</p>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Surveys</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span>Active:</span>
                                  <span className="font-medium">{selectedClient.activeSurveys || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Total:</span>
                                  <span className="font-medium">{selectedClient.totalSurveys || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Limit:</span>
                                  <span className="font-medium">{license.maxSurveys}</span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full">
                                  <div 
                                    className="h-2 bg-primary rounded-full" 
                                    style={{ width: `${(selectedClient.totalSurveys || 0) / license.maxSurveys * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Features</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-1 text-sm">
                                {typeof license.features === 'string' ? (
                                  <div className="space-y-1">
                                    {Object.entries(JSON.parse(license.features)).map(([key, value]) => (
                                      <div key={key} className="flex items-start">
                                        <div className={`h-2 w-2 mt-1.5 rounded-full mr-2 ${value ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span>{key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {Object.entries(license.features).map(([key, value]) => (
                                      <div key={key} className="flex items-start">
                                        <div className={`h-2 w-2 mt-1.5 rounded-full mr-2 ${value ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span>{key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 border rounded-md bg-gray-50">
                      <p className="text-muted-foreground">No license assigned to this client</p>
                    </div>
                  )}
                </div>
                
                {/* Client Notes */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Support Notes</h3>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setShowAddNote(true);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                  
                  {selectedClient?.notes && selectedClient.notes.length > 0 ? (
                    <div className="space-y-4">
                      <Accordion type="multiple" className="w-full">
                        {selectedClient.notes.map((note, index) => (
                          <AccordionItem key={note.id} value={String(note.id)}>
                            <AccordionTrigger className={!note.isResolved ? "font-medium text-primary" : ""}>
                              <div className="flex items-center gap-2">
                                <span>Note {index + 1} - {format(new Date(note.createdAt), "MMM d, yyyy")}</span>
                                {!note.isResolved && (
                                  <Badge variant="default" className="ml-2">Open</Badge>
                                )}
                                {note.isResolved && (
                                  <Badge variant="outline" className="ml-2">Resolved</Badge>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="p-4 bg-gray-50 rounded-md space-y-4">
                                <p className="text-sm">{note.content}</p>
                                <div className="flex justify-between items-center text-xs text-muted-foreground">
                                  <span>Created by {note.createdBy} on {formatDate(note.createdAt)}</span>
                                  {note.isResolved ? (
                                    <span>Resolved by {note.resolvedBy} on {formatDate(note.resolvedAt)}</span>
                                  ) : (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => handleResolveNote(note.id)}
                                    >
                                      Mark as Resolved
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ) : (
                    <div className="text-center py-4 border rounded-md bg-gray-50">
                      <p className="text-muted-foreground">No support notes for this client</p>
                    </div>
                  )}
                </div>

                {/* Recent Survey Responses */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Recent Survey Responses</h3>
                  
                  {responses.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Survey</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Started</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {responses.slice(0, 5).map((response) => (
                          <TableRow key={response.id}>
                            <TableCell className="font-medium">{response.surveyTitle}</TableCell>
                            <TableCell>
                              <Badge variant={
                                response.status === "complete" ? "default" : 
                                response.status === "partial" ? "outline" : "secondary"
                              }>
                                {response.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(response.startedAt)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-full h-2 bg-gray-200 rounded-full">
                                  <div 
                                    className="h-2 bg-primary rounded-full" 
                                    style={{ width: `${response.progress * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs">{Math.round(response.progress * 100)}%</span>
                              </div>
                            </TableCell>
                            <TableCell>{formatDuration(response.duration)}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setSelectedSurveyId(response.surveyId);
                                  setShowResponseDetails(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View Details</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-4 border rounded-md bg-gray-50">
                      <p className="text-muted-foreground">No responses recorded for this client</p>
                    </div>
                  )}
                  
                  {responses.length > 5 && (
                    <div className="mt-4 text-center">
                      <Button variant="outline" size="sm" onClick={() => {
                        window.open(`/admin/client-responses/${selectedClient?.id}`, '_blank');
                      }}>
                        View All Responses
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          <DialogFooter className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setShowClientDetails(false)}>
              Close
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  window.open(`/admin/edit-client/${selectedClient?.id}`, '_blank');
                }}
              >
                Edit Client
              </Button>
              <Button onClick={handleImpersonateClient}>
                <Eye className="h-4 w-4 mr-2" />
                Impersonate Client
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Support Note</DialogTitle>
            <DialogDescription>
              Add a support note for {selectedClient?.name}. This will be visible to all admins.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="supportNote">Note Content</Label>
              <Textarea
                id="supportNote"
                placeholder="Enter note content..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddNote(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote}>
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Response Details Dialog */}
      <Dialog open={showResponseDetails} onOpenChange={setShowResponseDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Response Details</DialogTitle>
            <DialogDescription>
              Detailed survey response data
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <ScrollArea className="h-96">
              <div className="space-y-6">
                {responses
                  .filter(response => selectedSurveyId === response.surveyId)
                  .map((response) => (
                    <div key={response.id} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Survey</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p>{response.surveyTitle}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Status</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Badge variant={
                              response.status === "complete" ? "default" : 
                              response.status === "partial" ? "outline" : "secondary"
                            }>
                              {response.status}
                            </Badge>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Started</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p>{formatDate(response.startedAt)}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Completed</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p>{formatDate(response.completedAt)}</p>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Duration</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p>{formatDuration(response.duration)}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Progress</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="w-full h-2 bg-gray-200 rounded-full">
                                <div 
                                  className="h-2 bg-primary rounded-full" 
                                  style={{ width: `${response.progress * 100}%` }}
                                ></div>
                              </div>
                              <span>{Math.round(response.progress * 100)}%</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Response Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="text-xs overflow-x-auto p-4 bg-gray-50 rounded-md">
                            {JSON.stringify(response.responseData, null, 2)}
                          </pre>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowResponseDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientSupport;