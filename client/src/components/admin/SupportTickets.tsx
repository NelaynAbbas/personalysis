import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, getQueryFn } from "@/lib/queryClient";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Ticket type definitions matching backend schema
interface Ticket {
  id: number;
  ticketNumber: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  type: string;
  assignedToId: number | null;
  companyId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  resolvedAt?: string;
  closedAt?: string;
  attachments?: string[];
  tags?: string[];
  // Frontend-only fields to handle joins
  client?: string;
  assignedTo?: string;
  userName?: string;
  category?: string;
  lastUpdated?: string;
  messages?: TicketComment[];
  // API response fields
  clientName?: string;
  lastUpdate?: string;
}

interface TicketComment {
  id: number;
  ticketId: number;
  userId: number;
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  attachments?: string[];
  // Frontend-only fields
  userName?: string;
  userRole?: string;
  role?: string;
  sender?: string;
  timestamp?: string;
}

interface Agent {
  id: number;
  name?: string;
  email?: string;
}

type SupportTicketsProps = { initialOpenTicketId?: number; onInitialOpenHandled?: () => void };

const SupportTickets = ({ initialOpenTicketId, onInitialOpenHandled }: SupportTicketsProps) => {
  const queryClient = useQueryClient();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Get authenticated user's company ID
  const getCurrentUser = () => {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  };

  const currentUser = getCurrentUser();
  const userCompanyId = currentUser?.companyId || 1;

  // State for new ticket
  const [newTicket, setNewTicket] = useState({
    subject: "",
    companyId: "", // Default to empty string to show "Select a client"
    priority: "", 
    type: "", // Default to empty string to require selection
    description: ""
  });
  
  // State for form validation errors
  const [formErrors, setFormErrors] = useState<{
    subject?: string;
    companyId?: string;
    type?: string;
    priority?: string;
    description?: string;
  }>({});
  
  // State for ticket details
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // State for reply message
  const [replyMessage, setReplyMessage] = useState("");

  // State for search query
  const [searchQuery, setSearchQuery] = useState("");

  // State for filter
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // State for loading indicators
  const [isLoadingTicketDetails, setIsLoadingTicketDetails] = useState(false);
  
  // State for create ticket dialog
  const [isCreateTicketDialogOpen, setIsCreateTicketDialogOpen] = useState(false);
  // Controlled dialogs for update flows
  const [openAssignTicketId, setOpenAssignTicketId] = useState<number | null>(null);
  const [openStatusTicketId, setOpenStatusTicketId] = useState<number | null>(null);
  const [openEditTicketId, setOpenEditTicketId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ subject: string; priority: string; type: string; description: string }>({ subject: '', priority: 'medium', type: 'general', description: '' });
  
  // Reset form when dialog closes
  const handleDialogOpenChange = (open: boolean) => {
    setIsCreateTicketDialogOpen(open);
    if (!open) {
      // Reset form when dialog closes
      setNewTicket({
        subject: "",
        companyId: "",
        priority: "",
        type: "",
        description: ""
      });
      setFormErrors({});
    }
  };
  
  // Fetch tickets
  // Fetch companies for client dropdown
  const companies = useQuery({
    queryKey: ['/api/clients'],
    queryFn: () => api.get('/api/clients'),
  });
  
  // Fetch agents for assignment dropdown
  const agents = useQuery({
    queryKey: ['/api/users/agents'],
    queryFn: () => api.get('/api/users/agents'),
  });

  const { data: ticketsData, isLoading: isLoadingTickets, error: ticketsError } = useQuery({
    queryKey: ['/api/support/tickets'],
    // Use the same query function as AdminConsole to ensure consistent cached shape
    queryFn: getQueryFn({ on401: 'throw' }),
    refetchOnWindowFocus: true,
  });


  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: (ticketData: any) => api.post('/api/support/ticket', ticketData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support/tickets'] });
      toast({
        title: "Ticket Created",
        description: "The support ticket has been created successfully."
      });
      // Reset form and close dialog
      setNewTicket({
        subject: "",
        companyId: "",
        priority: "",
        type: "",
        description: ""
      });
      setFormErrors({});
      setIsCreateTicketDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive"
      });
      console.error("Error creating ticket:", error);
    }
  });

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => api.patch(`/api/support/tickets/${id}`, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/support/tickets'] });
      // Also invalidate ticket details if needed
      if (selectedTicket?.id === variables.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/support/tickets', variables.id] });
      }
      toast({
        title: "Ticket Updated",
        description: "The ticket has been updated successfully."
      });
      // Close any open status/assign dialogs for this ticket
      if (openAssignTicketId === variables.id) setOpenAssignTicketId(null);
      if (openStatusTicketId === variables.id) setOpenStatusTicketId(null);
      if (openEditTicketId === variables.id) setOpenEditTicketId(null);

      // Update local tickets list immediately
      setTickets(prev => prev.map(t => {
        if (t.id !== variables.id) return t;
        const updated = data as Partial<Ticket>;
        return {
          ...t,
          subject: updated.subject ?? t.subject,
          description: updated.description ?? t.description,
          status: updated.status ?? t.status,
          assignedToId: (updated as any).assignedToId ?? t.assignedToId,
          priority: updated.priority ?? t.priority,
          type: updated.type ?? t.type,
          // Map updatedAt to lastUpdated used by table/modal
          updatedAt: (updated as any).updatedAt ?? t.updatedAt,
          lastUpdated: ((updated as any).updatedAt as any) ?? t.lastUpdated,
        };
      }));

      // Update selected ticket in modal so UI reflects new state without reopening
      if (selectedTicket?.id === variables.id) {
        const updated = data as Partial<Ticket>;
        setSelectedTicket({
          ...selectedTicket,
          subject: updated.subject ?? selectedTicket.subject,
          description: updated.description ?? selectedTicket.description,
          status: updated.status ?? selectedTicket.status,
          assignedToId: (updated as any).assignedToId ?? selectedTicket.assignedToId,
          priority: updated.priority ?? selectedTicket.priority,
          type: updated.type ?? selectedTicket.type,
          updatedAt: (updated as any).updatedAt ?? selectedTicket.updatedAt,
          lastUpdated: ((updated as any).updatedAt as any) ?? selectedTicket.lastUpdated,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update ticket. Please try again.",
        variant: "destructive"
      });
      console.error("Error updating ticket:", error);
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: ({ ticketId, content, isInternal = false }: { ticketId: number, content: string, isInternal?: boolean }) => 
      api.post(`/api/support/tickets/${ticketId}/comments`, { content, isInternal }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/support/tickets', variables.ticketId, 'comments'] });
      toast({
        title: "Comment Added",
        description: "Your response has been added to the ticket."
      });
      setReplyMessage("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      });
      console.error("Error adding comment:", error);
    }
  });

  // Fetch ticket comments when a ticket is selected
  const { data: commentsData, isLoading: isLoadingComments } = useQuery({
    queryKey: ['/api/support/tickets', selectedTicket?.id, 'comments'],
    queryFn: () => selectedTicket ? api.get(`/api/support/tickets/${selectedTicket.id}/comments`) : null,
    enabled: !!selectedTicket
  });

  // Update local tickets state when API data changes
  // ✅ Update local tickets state when API data changes
useEffect(() => {
  if (ticketsData) {
    const sourceArray = Array.isArray(ticketsData)
      ? ticketsData
      : (ticketsData as any).data && Array.isArray((ticketsData as any).data)
        ? (ticketsData as any).data
        : [];
    const formattedTickets = sourceArray.map((ticket: Ticket) => ({
      ...ticket,
      client: ticket.clientName,
      lastUpdated: ticket.lastUpdate,
    }));
    setTickets(formattedTickets);
  }
}, [ticketsData]);

  // Open ticket modal automatically when initialOpenTicketId is provided from parent (dashboard)
  useEffect(() => {
    if (initialOpenTicketId && tickets.length) {
      const found = tickets.find(t => t.id === initialOpenTicketId);
      if (found) {
        setSelectedTicket(found);
        if (onInitialOpenHandled) onInitialOpenHandled();
      }
    }
  }, [initialOpenTicketId, tickets]);

  
  // Update selectedTicket with comments when commentsData changes
  useEffect(() => {
    if (selectedTicket && commentsData?.success && commentsData.comments) {
      setSelectedTicket({
        ...selectedTicket,
        messages: commentsData.comments
      });
    }
  }, [commentsData, selectedTicket]);

  // Handle input change for new ticket form
  const handleNewTicketChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTicket({
      ...newTicket,
      [name]: value
    });
    // Clear error for this field when user starts typing/selecting
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: undefined
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};
    
    if (!newTicket.subject.trim()) {
      errors.subject = "Subject is required";
    }
    
    if (!newTicket.companyId) {
      errors.companyId = "Please select a client";
    }
    
    if (!newTicket.type) {
      errors.type = "Please select a type";
    }
    
    if (!newTicket.priority) {
      errors.priority = "Please select a priority";
    }

    if (!newTicket.description.trim()) {
      errors.description = "Description is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add new ticket
  const createTicket = () => {
    // Validate all required fields
    if (!validateForm()) {
      toast({
        title: "Missing Fields",
        description: "Please fill out all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Ensure userId is available
    if (!currentUser?.id) {
      toast({
        title: "Not Authenticated",
        description: "Your session appears to be missing. Please sign in again.",
        variant: "destructive"
      });
      return;
    }

    // Use mutation to create ticket
    createTicketMutation.mutate({
      subject: newTicket.subject.trim(),
      description: newTicket.description.trim(),
      companyId: parseInt(newTicket.companyId),
      userId: currentUser?.id,
      priority: newTicket.priority,
      type: newTicket.type
    });
  };

  // Add reply to ticket
  const addReply = () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    // Use mutation to add comment
    addCommentMutation.mutate({
      ticketId: selectedTicket.id,
      content: replyMessage,
      isInternal: false // Set to true for internal notes
    });
  };

  // Change ticket status
  const changeTicketStatus = (ticket: Ticket, newStatus: string) => {
    if (!ticket) return;

    // Use mutation to update ticket status
    updateTicketMutation.mutate({
      id: ticket.id,
      data: { 
        status: newStatus 
      }
    });
  };

  // Assign ticket
  const assignTicket = (ticket: Ticket, assignedToId: number) => {
    if (!ticket) return;

    // Use mutation to update ticket assignment
    updateTicketMutation.mutate({
      id: ticket.id,
      data: { 
        assignedToId 
      }
    });
  };

  // Filter tickets based on search query and status filter
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = searchQuery ? (
      (ticket.ticketNumber && ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.client && ticket.client.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) : true;
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Helper function to get priority badge styling
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return "bg-red-100 text-red-800";
      case 'high':
        return "bg-orange-100 text-orange-800";
      case 'medium':
        return "bg-yellow-100 text-yellow-800";
      case 'low':
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return "bg-blue-100 text-blue-800";
      case 'in_progress':
        return "bg-purple-100 text-purple-800";
      case 'on_hold':
        return "bg-yellow-100 text-yellow-800";
      case 'resolved':
        return "bg-green-100 text-green-800";
      case 'closed':
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to format status text
  const formatStatusText = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle className="text-xl font-bold">Support Tickets</CardTitle>
              <CardDescription>
                Manage client support requests and issues
              </CardDescription>
            </div>
            <div>
              <Dialog open={isCreateTicketDialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"></path>
                    </svg>
                    Create Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Create New Support Ticket</DialogTitle>
                    <DialogDescription>
                      Enter the details for the new support ticket.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="subject" className="text-right pt-2">
                        Subject <span className="text-red-500">*</span>
                      </Label>
                      <div className="col-span-3 space-y-1">
                        <Input
                          id="subject"
                          name="subject"
                          value={newTicket.subject}
                          onChange={handleNewTicketChange}
                          required
                          className={formErrors.subject ? "border-red-500" : ""}
                        />
                        {formErrors.subject && (
                          <p className="text-sm text-red-500">{formErrors.subject}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="companyId" className="text-right pt-2">
                        Client <span className="text-red-500">*</span>
                      </Label>
                      <div className="col-span-3 space-y-1">
                        <select
                          id="companyId"
                          name="companyId"
                          value={newTicket.companyId}
                          onChange={handleNewTicketChange as any}
                          required
                          className={`col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${formErrors.companyId ? "border-red-500" : ""}`}
                        >
                          <option value="">Select a client</option>
                          {companies.isLoading ? (
                            <option value="" disabled>Loading clients...</option>
                          ) : companies.error ? (
                            <option value="" disabled>Error loading clients</option>
                          ) : (
                            // api.get unwraps { status: 'success', data } → data is an array of companies
                            (Array.isArray(companies.data)
                              ? companies.data
                              : Array.isArray((companies as any).data?.clients)
                                ? (companies as any).data.clients
                                : []
                            ).map((company: any) => (
                              <option key={company.id} value={company.id}>
                                {company.name}
                              </option>
                            ))
                          )}
                        </select>
                        {formErrors.companyId && (
                          <p className="text-sm text-red-500">{formErrors.companyId}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="type" className="text-right pt-2">
                        Type <span className="text-red-500">*</span>
                      </Label>
                      <div className="col-span-3 space-y-1">
                        <select
                          id="type"
                          name="type"
                          value={newTicket.type}
                          onChange={handleNewTicketChange as any}
                          required
                          className={`col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${formErrors.type ? "border-red-500" : ""}`}
                        >
                          <option value="">Select a type</option>
                          <option value="technical_issue">Technical Issue</option>
                          <option value="billing">Billing</option>
                          <option value="feature_request">Feature Request</option>
                          <option value="account">Account</option>
                          <option value="other">Other</option>
                        </select>
                        {formErrors.type && (
                          <p className="text-sm text-red-500">{formErrors.type}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="priority" className="text-right pt-2">
                        Priority <span className="text-red-500">*</span>
                      </Label>
                      <div className="col-span-3 space-y-1">
                        <select
                          id="priority"
                          name="priority"
                          value={newTicket.priority}
                          onChange={handleNewTicketChange as any}
                          required
                          className={`col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${formErrors.priority ? "border-red-500" : ""}`}
                        >
                          <option value="">Select a priority</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                        {formErrors.priority && (
                          <p className="text-sm text-red-500">{formErrors.priority}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="description" className="text-right pt-2">
                        Description <span className="text-red-500">*</span>
                      </Label>
                      <div className="col-span-3 space-y-1">
                      <textarea
                        id="description"
                        name="description"
                        value={newTicket.description}
                        onChange={handleNewTicketChange as any}
                          required
                          className={`col-span-3 flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${formErrors.description ? "border-red-500" : ""}`}
                      />
                        {formErrors.description && (
                          <p className="text-sm text-red-500">{formErrors.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={createTicket}>Create Ticket</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative w-full md:w-64">
                <Input 
                  placeholder="Search tickets..." 
                  className="pl-8" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute left-2 top-2.5 text-muted-foreground"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full md:w-44 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export
              </Button>
              <Button variant="outline" size="sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <path d="M3 3v18h18"></path>
                  <path d="m19 9-5 5-4-4-3 3"></path>
                </svg>
                Analytics
              </Button>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTickets ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-6">
                      <div className="space-y-3">
                        {Array(5).fill(0).map((_, i) => (
                          <Skeleton key={i} className="h-10 w-full" />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : ticketsError ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      Failed to load tickets. Please refresh.
                    </TableCell>
                  </TableRow>
                ) : filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      No tickets found. Try a different search term or create a new ticket.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map(ticket => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.id}</TableCell>
                      <TableCell>
                        <Button 
                          variant="link" 
                          className="p-0 h-auto font-medium text-left justify-start"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          {ticket.subject}
                        </Button>
                      </TableCell>
                      <TableCell>{ticket.client}</TableCell>
                      <TableCell>
                        <Badge className={getPriorityBadge(ticket.priority)}>
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(ticket.status)}>
                          {formatStatusText(ticket.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{ticket.assignedTo}</TableCell>
                      <TableCell>{ticket.lastUpdated}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={openAssignTicketId === ticket.id} onOpenChange={(open) => setOpenAssignTicketId(open ? ticket.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" title="Assign Ticket">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                              </svg>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Assign Ticket</DialogTitle>
                              <DialogDescription>
                                Assign this ticket to a support agent.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="agent" className="text-right">
                                  Agent
                                </Label>
                                <select
                                  id="agent"
                                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  defaultValue=""
                                >
                                  <option value="" disabled>Select an agent</option>
                                  {agents.isLoading ? (
                                    <option value="" disabled>Loading agents...</option>
                                  ) : agents.error ? (
                                    <option value="" disabled>Error loading agents</option>
                                  ) : (
                                    // Validate response structure before mapping
                                    agents.data?.agents?.map((agent: Agent) => (
                                      <option key={agent.id} value={agent.id}>
                                        {agent.name || agent.email}
                                      </option>
                                    )) || []
                                  )}
                                </select>
                              </div>
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button
                                disabled={updateTicketMutation.isPending}
                                onClick={() => {
                                  const select = document.getElementById('agent') as HTMLSelectElement;
                                  if (select && select.value) {
                                    assignTicket(ticket, parseInt(select.value));
                                  }
                                }}
                              >
                                {updateTicketMutation.isPending ? 'Assigning…' : 'Assign'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog open={openStatusTicketId === ticket.id} onOpenChange={(open) => setOpenStatusTicketId(open ? ticket.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" title="Change Status">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                              </svg>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Change Ticket Status</DialogTitle>
                              <DialogDescription>
                                Update the status of ticket {ticket.id}.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="status" className="text-right">
                                  Status
                                </Label>
                                <select
                                  id="status"
                                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  defaultValue={ticket.status}
                                >
                                  <option value="open">Open</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="on_hold">On Hold</option>
                                  <option value="resolved">Resolved</option>
                                  <option value="closed">Closed</option>
                                </select>
                              </div>
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button
                                disabled={updateTicketMutation.isPending}
                                onClick={() => {
                                  const select = document.getElementById('status') as HTMLSelectElement;
                                  if (select && select.value) {
                                    changeTicketStatus(ticket, select.value as string);
                                  }
                                }}
                              >
                                {updateTicketMutation.isPending ? 'Updating…' : 'Update Status'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedTicket(ticket)}
                          title="View Details"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing <strong>1-{filteredTickets.length}</strong> of <strong>{filteredTickets.length}</strong> tickets
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={filteredTickets.length < 10}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Ticket Details Dialog */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Ticket {selectedTicket.id}</DialogTitle>
                <Badge className={getStatusBadge(selectedTicket.status)}>
                  {formatStatusText(selectedTicket.status)}
                </Badge>
              </div>
              <DialogDescription>
                {selectedTicket.subject}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Client</p>
                  <p>{selectedTicket.client}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Category</p>
                  <p>{selectedTicket.category}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Priority</p>
                  <Badge className={getPriorityBadge(selectedTicket.priority)}>
                    {selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Assigned To</p>
                  <p>{selectedTicket.assignedTo}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Created</p>
                  <p>{selectedTicket.createdAt}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Last Updated</p>
                  <p>{selectedTicket.lastUpdated}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Conversation</h3>
                <div className="space-y-4">
                  {selectedTicket.messages?.map((message, index) => (
                    <div 
                      key={message.id} 
                      className={`p-3 rounded-lg ${
                        message.role === 'client' 
                          ? 'bg-gray-100' 
                          : message.role === 'support' 
                            ? 'bg-blue-50' 
                            : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium">
                          {message.sender}
                          {message.role === 'client' && <span className="ml-2 text-xs text-gray-500">(Client)</span>}
                          {message.role === 'support' && <span className="ml-2 text-xs text-blue-500">(Support)</span>}
                          {message.role === 'system' && <span className="ml-2 text-xs text-gray-500">(System)</span>}
                        </div>
                        <div className="text-xs text-gray-500">{message.timestamp}</div>
                      </div>
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedTicket.status !== 'closed' && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Add Reply</h3>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-24"
                    placeholder="Type your reply here..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                  ></textarea>
                  <div className="mt-2 flex justify-end">
                    <Button onClick={addReply} disabled={!replyMessage.trim()}>
                      Send Reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="border-t pt-4 flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={updateTicketMutation.isPending} onClick={() => {
                  const newStatus = selectedTicket.status === 'open' || selectedTicket.status === 'on_hold' 
                    ? 'in_progress' 
                    : selectedTicket.status === 'in_progress' 
                      ? 'resolved' 
                      : selectedTicket.status === 'resolved' 
                        ? 'closed' 
                        : 'open';
                  changeTicketStatus(selectedTicket, newStatus);
                }}>
                  {updateTicketMutation.isPending 
                    ? 'Updating…' 
                    : selectedTicket.status === 'open' || selectedTicket.status === 'on_hold' 
                    ? 'Start Working' 
                    : selectedTicket.status === 'in_progress' 
                      ? 'Mark Resolved' 
                      : selectedTicket.status === 'resolved' 
                        ? 'Close Ticket' 
                          : selectedTicket.status === 'closed' 
                            ? 'Reopen' 
                            : 'Open'}
                </Button>
                <Dialog open={openAssignTicketId === (selectedTicket?.id || 0)} onOpenChange={(open) => setOpenAssignTicketId(open ? (selectedTicket?.id || null) : null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Assign
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Assign Ticket</DialogTitle>
                      <DialogDescription>
                        Assign this ticket to a support agent.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="assignAgent" className="text-right">
                          Agent
                        </Label>
                        <select
                          id="assignAgent"
                          className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          defaultValue=""
                        >
                          <option value="" disabled>Select an agent</option>
                          {agents.isLoading ? (
                            <option value="" disabled>Loading agents...</option>
                          ) : agents.error ? (
                            <option value="" disabled>Error loading agents</option>
                          ) : (
                            // Validate response structure before mapping
                            agents.data?.agents?.map((agent: Agent) => (
                              <option key={agent.id} value={agent.id}>
                                {agent.name || agent.email}
                              </option>
                            )) || []
                          )}
                        </select>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        disabled={updateTicketMutation.isPending}
                        onClick={() => {
                          const select = document.getElementById('assignAgent') as HTMLSelectElement;
                          if (select && select.value) {
                            assignTicket(selectedTicket, parseInt(select.value));
                          }
                        }}
                      >
                        {updateTicketMutation.isPending ? 'Assigning…' : 'Assign'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Edit Info Dialog in modal */}
                <Dialog open={openEditTicketId === (selectedTicket?.id || 0)} onOpenChange={(open) => {
                  if (open && selectedTicket) {
                    setEditForm({
                      subject: selectedTicket.subject,
                      priority: selectedTicket.priority,
                      type: selectedTicket.type,
                      description: selectedTicket.description || ''
                    });
                    setOpenEditTicketId(selectedTicket.id);
                  } else {
                    setOpenEditTicketId(null);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Edit Info
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Edit Ticket Info</DialogTitle>
                      <DialogDescription>Update subject, priority, type, or description.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="editSubject" className="text-right pt-2">Subject</Label>
                        <div className="col-span-3">
                          <Input id="editSubject" value={editForm.subject} onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="editPriority" className="text-right pt-2">Priority</Label>
                        <div className="col-span-3">
                          <select
                            id="editPriority"
                            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={editForm.priority}
                            onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="editType" className="text-right pt-2">Type</Label>
                        <div className="col-span-3">
                          <select
                            id="editType"
                            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={editForm.type}
                            onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                          >
                            <option value="technical_issue">Technical Issue</option>
                            <option value="billing">Billing</option>
                            <option value="feature_request">Feature Request</option>
                            <option value="account">Account</option>
                            <option value="general">General</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="editDescription" className="text-right pt-2">Description</Label>
                        <div className="col-span-3">
                          <textarea
                            id="editDescription"
                            className="col-span-3 flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        disabled={updateTicketMutation.isPending}
                        onClick={() => {
                          if (!selectedTicket) return;
                          updateTicketMutation.mutate({
                            id: selectedTicket.id,
                            data: {
                              subject: editForm.subject.trim(),
                              priority: editForm.priority,
                              type: editForm.type,
                              description: editForm.description.trim()
                            }
                          });
                        }}
                      >
                        {updateTicketMutation.isPending ? 'Saving…' : 'Save Changes'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SupportTickets;
