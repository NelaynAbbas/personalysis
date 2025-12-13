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
  ClientStatusDropdown, 
  CLIENT_STATUS, 
  LICENSE_STATUS,
  mapClientStatusToLicenseStatus,
  mapLicenseStatusToClientStatus
} from "./ClientStatusDropdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { api } from "@/lib/api";
import { Loader2, AlertCircle, Search, UserPlus, Edit, Trash2, MoreHorizontal, FileText, Download } from "lucide-react";
import { ErrorAlert, LoadingState } from "../../components/common";
import useLogger from "../../hooks/useLogger";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Client type definition
interface Client {
  id: number;
  name: string;
  company: string;
  email: string;
  status: "active" | "pending" | "inactive";
  licenseStatus?: string;
  subscriptionTier?: string;
  website?: string;
  contactPhone?: string;
  address?: string;
  licenseId?: number | null;
  licenseName?: string | null;
  createdAt: string;
  // User information
  firstName?: string;
  lastName?: string;
  userName?: string;
  userRole?: string;
  userActive?: boolean;
  // Business context fields
  industry?: string;
  companySize?: string;
  budget?: string;
  decisionTimeframe?: string;
  businessChallenges?: string[];
  growthStage?: string;
  techStack?: string[];
  keyObjectives?: string[];
  preferredCommunication?: string;
  previousSolutions?: string[];
}

// License type definition
// Note: licenses are not directly assignable in current schema

// Using LICENSE_STATUS from ClientStatusDropdown component

// Create client form schema - status is copied from license, not set in form
const clientFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  company: z.string().min(1, { message: "Company name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  // Status is copied from license, not set in form
  // Require a concrete licenseId from DB
  licenseId: z.string().min(1, { message: "License is required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  website: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  contactPhone: z.string().optional(),

  // Business context fields
  industry: z.string().optional(),
  companySize: z.string().optional(),
  budget: z.string().optional(),
  decisionTimeframe: z.string().optional(),
  businessChallenges: z.array(z.string()).default([]),
  growthStage: z.string().optional(),
  techStack: z.array(z.string()).default([]),
  keyObjectives: z.array(z.string()).default([]),
  preferredCommunication: z.string().optional(),
  previousSolutions: z.array(z.string()).default([])
});

// Edit client form schema - password is optional for updates, status is copied from license
const editClientFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  company: z.string().min(1, { message: "Company name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  // Status is copied from license, not set in form
  // License selection in edit flow
  licenseId: z.string().optional(),
  password: z.string().optional(), // Optional for updates
  website: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  contactPhone: z.string().optional(),

  // Business context fields
  industry: z.string().optional(),
  companySize: z.string().optional(),
  budget: z.string().optional(),
  decisionTimeframe: z.string().optional(),
  businessChallenges: z.array(z.string()).default([]),
  growthStage: z.string().optional(),
  techStack: z.array(z.string()).default([]),
  keyObjectives: z.array(z.string()).default([]),
  preferredCommunication: z.string().optional(),
  previousSolutions: z.array(z.string()).default([])
});

type ClientFormValues = z.infer<typeof clientFormSchema>;
type EditClientFormValues = z.infer<typeof editClientFormSchema>;

// Helper functions for user-friendly labels
const getDecisionTimeframeLabel = (value: string | undefined) => {
  const labels: Record<string, string> = {
    'immediate': 'Immediate (within 1 month)',
    'short': 'Short term (1-3 months)',
    'medium': 'Medium term (3-6 months)',
    'long': 'Long term (6+ months)'
  };
  return value ? labels[value] || value : undefined;
};

const getGrowthStageLabel = (value: string | undefined) => {
  const labels: Record<string, string> = {
    'startup': 'Startup',
    'growth': 'Growth',
    'expansion': 'Expansion',
    'mature': 'Mature',
    'renewal': 'Renewal/Transformation',
    'decline': 'Decline'
  };
  return value ? labels[value] || value : undefined;
};

const getBudgetLabel = (value: string | undefined) => {
  const labels: Record<string, string> = {
    'under-10k': 'Under $10,000',
    '10k-50k': '$10,000 - $50,000',
    '50k-100k': '$50,000 - $100,000',
    '100k-500k': '$100,000 - $500,000',
    'over-500k': 'Over $500,000'
  };
  return value ? labels[value] || value : undefined;
};

const getCompanySizeLabel = (value: string | undefined) => {
  const labels: Record<string, string> = {
    '1-10': '1-10 employees',
    '11-50': '11-50 employees',
    '51-200': '51-200 employees',
    '201-500': '201-500 employees',
    '501-1000': '501-1000 employees',
    '1001+': '1001+ employees'
  };
  return value ? labels[value] || value : undefined;
};

const getPreferredCommunicationLabel = (value: string | undefined) => {
  const labels: Record<string, string> = {
    'email': 'Email',
    'phone': 'Phone',
    'video': 'Video Calls',
    'in-person': 'In-Person Meetings',
    'chat': 'Chat/Messaging'
  };
  return value ? labels[value] || value : undefined;
};

// Removed custom loading and error components - now using common components

const ClientManagement = () => {
  const [showAddClient, setShowAddClient] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [showViewClient, setShowViewClient] = useState(false);
  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImportClients, setShowImportClients] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);

  // Lightweight chip input used for array fields
  const ChipInput: React.FC<{ value: string[]; onChange: (v: string[]) => void; placeholder?: string; }>=({ value, onChange, placeholder })=>{
    const [inputValue, setInputValue] = React.useState("");
    
    // Ensure value is always an array
    const safeValue = Array.isArray(value) ? value : [];
    
    const addChip = () => {
      const v = inputValue.trim();
      if (!v) return;
      if (!safeValue.includes(v)) onChange([...safeValue, v]);
      setInputValue("");
    };
    const removeChip = (idx: number) => {
      onChange(safeValue.filter((_, i) => i !== idx));
    };
    const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addChip();
      }
      if (e.key === "Backspace" && !inputValue && safeValue && safeValue.length) {
        removeChip(safeValue.length - 1);
      }
    };
    return (
      <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md">
        {safeValue.map((chip, idx) => (
          <span key={`${chip}-${idx}`} className="inline-flex items-center bg-muted text-foreground px-2 py-1 rounded-full text-xs">
            {chip}
            <button type="button" className="ml-1 opacity-70 hover:opacity-100" onClick={() => removeChip(idx)}>×</button>
          </span>
        ))}
        <input
          className="flex-1 min-w-[120px] outline-none bg-transparent"
          value={inputValue}
          onChange={(e)=>setInputValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder || "Type and press Enter"}
        />
      </div>
    );
  };

  // Fetch clients data
  const { 
    data, 
    isLoading, 
    error, 
    refetch
  } = useQuery({
    queryKey: ['/api/clients'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch available licenses for dropdowns
  const {
    data: availableLicenses,
    isLoading: isLoadingLicenses,
    error: licensesError
  } = useQuery({
    queryKey: ['/api/licenses/available'],
    staleTime: 1000 * 60 * 5,
  });

  // Licenses list not needed for current UI

  // Extract clients array from response data with proper error handling
  console.log("Clients API response:", data);
  
  const clients = React.useMemo(() => {
    if (!data) return [];
    
    // Handle different response structures
    let clientsArray: any[] = [];
    const dataTyped = data as any;
    if (dataTyped && typeof dataTyped === 'object' && 'status' in dataTyped && dataTyped.status === "success" && Array.isArray(dataTyped.data)) {
      clientsArray = dataTyped.data;
    } else if (Array.isArray(dataTyped)) {
      clientsArray = dataTyped;
    } else {
      console.warn("Unexpected clients data structure:", dataTyped);
      return [];
    }
    
    return clientsArray.map((client: any) => {
      // Prefer licenseStatus from DB and map to UI status
      const status = client.licenseStatus
        ? (mapLicenseStatusToClientStatus(client.licenseStatus) as "active" | "pending" | "inactive")
        : (client.status && typeof client.status === 'string'
            ? (client.status.toLowerCase() === 'active' ? 'active'
              : client.status.toLowerCase() === 'trial' || client.status.toLowerCase() === 'pending' ? 'pending'
              : 'inactive')
            : 'inactive');

      return {
        ...client,
        status,
        company: client.name || client.company || '',
        createdAt: client.createdAt || new Date().toISOString()
      } as Client;
    });
  }, [data]);
    
  console.log("Extracted and mapped clients array:", clients);

  // Initialize form for adding a new client
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      licenseId: "",
      password: "",
      website: "",
      contactPhone: "",
      industry: "",
      companySize: "",
      budget: "",
      decisionTimeframe: "",
      businessChallenges: [],
      growthStage: "",
      techStack: [],
      keyObjectives: [],
      preferredCommunication: "",
      previousSolutions: []
    },
  });

  // Initialize form for editing a client
  const editForm = useForm<EditClientFormValues>({
    resolver: zodResolver(editClientFormSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      licenseId: "",
      password: "",
      website: "",
      contactPhone: "",
      industry: "",
      companySize: "",
      budget: "",
      decisionTimeframe: "",
      businessChallenges: [],
      growthStage: "",
      techStack: [],
      keyObjectives: [],
      preferredCommunication: "",
      previousSolutions: []
    },
  });

  // State for tracking client creation status
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Handle client creation
  const handleCreateClient = async (values: ClientFormValues) => {
    setIsCreating(true);
    setCreateError(null);

    try {
      // Deep clone values to avoid modifying original form values
      const processedValues = JSON.parse(JSON.stringify(values));
      
      // Status will be copied from license on the backend, no need to send it
      // Build payload with supported fields only
      const payload = {
        name: processedValues.name,
        company: processedValues.company,
        email: processedValues.email,
        password: processedValues.password,
        // parse licenseId to number server-side; send as-is string ok
        licenseId: processedValues.licenseId,
        website: processedValues.website || undefined,
        contactPhone: processedValues.contactPhone || undefined,
        industry: processedValues.industry || undefined,
        companySize: processedValues.companySize || undefined,
         // business context scalar fields
         budget: processedValues.budget || undefined,
         decisionTimeframe: processedValues.decisionTimeframe || undefined,
         growthStage: processedValues.growthStage || undefined,
        // preferred communication maps to company's primary_contact
        preferredCommunication: processedValues.preferredCommunication || undefined,
        // business context arrays
        businessChallenges: Array.isArray(processedValues.businessChallenges) ? processedValues.businessChallenges : [],
        techStack: Array.isArray(processedValues.techStack) ? processedValues.techStack : [],
        keyObjectives: Array.isArray(processedValues.keyObjectives) ? processedValues.keyObjectives : [],
        previousSolutions: Array.isArray(processedValues.previousSolutions) ? processedValues.previousSolutions : []
      };

      await api.post("/api/clients", payload);

      toast({
        title: "Client created",
        description: "The client has been created successfully",
      });

      // Reset form and close dialog
      form.reset();
      setShowAddClient(false);

      // Refetch clients to update the list
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });

    } catch (error: any) {
      console.error("Error creating client:", error);
      
      // Extract more detailed error message if available
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "Failed to create client. Please try again.";
      
      setCreateError(errorMessage);
      
      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // State for tracking client update status
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Handle client update
  const handleUpdateClient = async (values: EditClientFormValues) => {
    if (!currentClient) {
      console.error("No current client selected for update");
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      console.log("Raw form values:", values);
      
      // Deep clone values to avoid modifying original form values
      const updatedValues = JSON.parse(JSON.stringify(values));
      
      // Ensure proper data types for backend
      // licenseId is already number | null from form, no conversion needed
      // Status will be copied from license on the backend, no need to send it
      
      // Ensure company size is included
      updatedValues.companySize = updatedValues.companySize || '';
      
      // Ensure array fields are actually arrays
      updatedValues.businessChallenges = Array.isArray(updatedValues.businessChallenges) 
        ? updatedValues.businessChallenges 
        : [];
      updatedValues.techStack = Array.isArray(updatedValues.techStack) 
        ? updatedValues.techStack 
        : [];
      updatedValues.keyObjectives = Array.isArray(updatedValues.keyObjectives) 
        ? updatedValues.keyObjectives 
        : [];
      updatedValues.previousSolutions = Array.isArray(updatedValues.previousSolutions) 
        ? updatedValues.previousSolutions 
        : [];

      console.log("Updating client ID:", currentClient.id);
      console.log("With values:", JSON.stringify(updatedValues, null, 2));
      
      // Status will be copied from license on the backend, no need to send it
      // Only send fields supported by backend; include password only if changed
      const finalValues: any = {
        name: updatedValues.name,
        company: updatedValues.company,
        email: updatedValues.email,
        licenseId: updatedValues.licenseId || undefined,
        website: updatedValues.website || undefined,
        contactPhone: updatedValues.contactPhone || undefined,
        industry: updatedValues.industry || undefined,
        companySize: updatedValues.companySize || undefined,
        // Status is copied from license on the backend, no need to send it
        // Include password only if it's provided (admin wants to change it)
        ...(updatedValues.password && updatedValues.password.trim() !== '' && { password: updatedValues.password }),
        // Business context fields
        budget: updatedValues.budget || undefined,
        decisionTimeframe: updatedValues.decisionTimeframe || undefined,
        growthStage: updatedValues.growthStage || undefined,
        preferredCommunication: updatedValues.preferredCommunication || undefined,
        // Array fields
        businessChallenges: Array.isArray(updatedValues.businessChallenges) ? updatedValues.businessChallenges : [],
        techStack: Array.isArray(updatedValues.techStack) ? updatedValues.techStack : [],
        keyObjectives: Array.isArray(updatedValues.keyObjectives) ? updatedValues.keyObjectives : [],
        previousSolutions: Array.isArray(updatedValues.previousSolutions) ? updatedValues.previousSolutions : []
      };
      
      console.log("Final values being sent to API:", finalValues);
      const response = await api.put(`/api/clients/${currentClient.id}`, finalValues);
      console.log("Update response:", response);

      toast({
        title: "Client updated",
        description: "The client has been updated successfully",
      });

      // Reset form and close dialog
      editForm.reset();
      setShowEditClient(false);
      setCurrentClient(null);

      // Refetch clients to update the list
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });

    } catch (error: any) {
      console.error("Error updating client:", error);
      console.error("Error details:", error.response?.data);
      
      // Extract more detailed error message if available
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "Failed to update client. Please try again.";
      
      setUpdateError(errorMessage);
      
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // State for tracking client deletion status
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Export removed (no backend endpoint)

  // Handle client deletion
  const handleDeleteClient = async () => {
    if (!currentClient) return;

    setIsDeleting(true);

    try {
      await api.delete(`/api/clients/${currentClient.id}`);

      toast({
        title: "Client deleted",
        description: "The client has been deleted successfully",
      });

      setShowDeleteConfirm(false);
      setCurrentClient(null);

      // Refetch clients to update the list
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });

    } catch (error: any) {
      console.error("Error deleting client:", error);
      
      // Extract more detailed error message if available
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "Failed to delete client. Please try again.";
      
      toast({
        title: "Deletion Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Open edit dialog and populate form with client data
  const openEditDialog = async (client: Client) => {
    setCurrentClient(client);
    try {
      // Fetch full client details to prefill all fields
      const res = await api.get(`/api/clients/${client.id}`);
      const payload = res || client;

      // Status is copied from license, no need to map it
      const fullName = (payload.userName || `${payload.firstName || ''} ${payload.lastName || ''}`.trim());
      editForm.reset({
        name: fullName || client.userName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || '',
        company: payload.company || payload.name || client.company,
        email: payload.email || client.email,
        licenseId: payload.licenseId != null ? String(payload.licenseId) : "",
        website: payload.website || '',
        contactPhone: payload.contactPhone || '',
        industry: payload.industry || '',
        companySize: payload.companySize || payload.size || '',
        budget: payload.budget || '',
        decisionTimeframe: payload.decisionTimeframe || '',
        businessChallenges: Array.isArray(payload.businessChallenges) ? payload.businessChallenges : [],
        growthStage: payload.growthStage || '',
        techStack: Array.isArray(payload.techStack) ? payload.techStack : [],
        keyObjectives: Array.isArray(payload.keyObjectives) ? payload.keyObjectives : [],
        preferredCommunication: payload.preferredCommunication || '',
        previousSolutions: Array.isArray(payload.previousSolutions) ? payload.previousSolutions : []
      });
      setShowEditClient(true);
    } catch (e) {
      console.error('Failed to load client details for edit:', e);
      // Fallback to existing client object
      // Status is copied from license, no need to map it
      const fallbackFullName = (client.userName || `${client.firstName || ''} ${client.lastName || ''}`.trim());
      editForm.reset({
        name: fallbackFullName || '',
        company: client.company,
        email: client.email,
        licenseId: client.licenseId ? String(client.licenseId) : "",
        website: client.website || '',
        contactPhone: client.contactPhone || '',
        industry: client.industry || '',
        companySize: client.companySize || '',
        budget: client.budget || '',
        decisionTimeframe: client.decisionTimeframe || '',
        businessChallenges: Array.isArray(client.businessChallenges) ? client.businessChallenges : [],
        growthStage: client.growthStage || '',
        techStack: Array.isArray(client.techStack) ? client.techStack : [],
        keyObjectives: Array.isArray(client.keyObjectives) ? client.keyObjectives : [],
        preferredCommunication: client.preferredCommunication || '',
        previousSolutions: Array.isArray(client.previousSolutions) ? client.previousSolutions : []
      });
      setShowEditClient(true);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (client: Client) => {
    setCurrentClient(client);
    setShowDeleteConfirm(true);
  };

  // Open view dialog and load client details
  const openViewDialog = async (client: Client) => {
    try {
      const res = await api.get(`/api/clients/${client.id}`);
      const payload = res || client;
      // Normalize arrays and fields
      const normalized: Client = {
        id: payload.id,
        name: payload.name || client.name,
        company: payload.company || payload.name || client.company,
        email: payload.email || client.email,
        status: (payload.status || client.status || 'inactive'),
        licenseStatus: payload.licenseStatus,
        subscriptionTier: payload.subscriptionTier,
        website: payload.website,
        contactPhone: payload.contactPhone,
        address: payload.address,
         licenseId: payload.licenseId ?? null,
         licenseName: payload.licenseName,
         createdAt: payload.createdAt || client.createdAt,
        firstName: payload.firstName,
        lastName: payload.lastName,
        userName: payload.userName,
        userRole: payload.userRole,
        userActive: payload.userActive,
        industry: payload.industry,
        companySize: payload.companySize || payload.size,
        budget: payload.budget,
        decisionTimeframe: payload.decisionTimeframe,
        businessChallenges: Array.isArray(payload.businessChallenges) ? payload.businessChallenges : [],
        growthStage: payload.growthStage,
        techStack: Array.isArray(payload.techStack) ? payload.techStack : [],
        keyObjectives: Array.isArray(payload.keyObjectives) ? payload.keyObjectives : [],
        preferredCommunication: payload.preferredCommunication,
        previousSolutions: Array.isArray(payload.previousSolutions) ? payload.previousSolutions : []
      };
      setViewClient(normalized);
      setShowViewClient(true);
    } catch (e) {
      console.error('Failed to load client details for view:', e);
      setViewClient(client);
      setShowViewClient(true);
    }
  };

  // Initialize logger for this component
  const logger = useLogger('ClientManagement');
  
  // Filter clients based on search query and status filter
  const filteredClients = Array.isArray(clients) ? clients.filter(client => {
    const matchesSearch = 
      !searchQuery || 
      (client.name && client.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = !statusFilter || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) : [];

  // Handle loading state
  if (isLoading) {
    return <LoadingState variant="table" text="Loading client data..." count={5} />;
  }

  // Handle error state
  if (error) {
    logger.error('Failed to load clients', { error });
    return (
      <ErrorAlert 
        title="Failed to load clients"
        message={(error as Error).message} 
        onRetry={() => refetch()}
        variant="server"
        helpText="Please try again or contact support if the problem persists."
      />
    );
  }

  // Export function removed (no backend route)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Client Management</h2>
        <div className="flex gap-2">
          {/* Import/Export actions removed until backend support exists */}
          <Button 
            onClick={() => setShowAddClient(true)}
            data-add-client-button="true"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Filters section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <SelectItem value={LICENSE_STATUS.ACTIVE}>Active</SelectItem>
            <SelectItem value={LICENSE_STATUS.EXPIRED}>Expired</SelectItem>
            <SelectItem value={LICENSE_STATUS.SUSPENDED}>Suspended</SelectItem>
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
                    <TableHead>Plan</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.userName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'N/A'}</TableCell>
                      <TableCell>{client.company || client.name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>
                        <Badge variant={
                          client.status === "active" ? "default" : 
                          client.status === "pending" ? "outline" : "secondary"
                        }>
                          {client.status || "inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{client.subscriptionTier || 'trial'}</TableCell>
                      <TableCell>{new Date(client.createdAt).toLocaleDateString()}</TableCell>
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
                            <DropdownMenuItem onClick={() => openViewDialog(client)}>
                              <FileText className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(client)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(client)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
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

      {/* Add Client Dialog */}
      <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Create a new client account in the system
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateClient)} className="space-y-4">
              {/* Show error message if any */}
              {createError && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-600 text-sm mb-4 flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" />
                  <div>
                    <p className="font-medium mb-1">Error creating client</p>
                    <p>{createError}</p>
                  </div>
                </div>
              )}
              <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company *</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Set account password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="licenseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingLicenses ? "Loading licenses..." : "Select license"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingLicenses ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                          ) : licensesError ? (
                            <SelectItem value="error" disabled>Failed to load licenses</SelectItem>
                          ) : Array.isArray((availableLicenses as any)?.data) && (availableLicenses as any).data.length > 0 ? (
                            (availableLicenses as any).data.map((lic: any) => (
                              <SelectItem key={lic.id} value={String(lic.id)}>
                                {lic.label} ({lic.type})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-licenses" disabled>No licenses available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />


























              {/* License selection removed; not supported by backend schema */}



              <h3 className="text-lg font-medium mt-8 mb-4">Business Context Information</h3>

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Healthcare, Technology, Finance" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessChallenges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Challenges</FormLabel>
                    <FormControl>
                      <ChipInput value={field.value} onChange={field.onChange} placeholder="Add a challenge and press Enter" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="techStack"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technology Stack</FormLabel>
                    <FormControl>
                      <ChipInput value={field.value} onChange={field.onChange} placeholder="Add a technology and press Enter" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keyObjectives"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Objectives</FormLabel>
                    <FormControl>
                      <ChipInput value={field.value} onChange={field.onChange} placeholder="Add an objective and press Enter" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="previousSolutions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous Solutions</FormLabel>
                    <FormControl>
                      <ChipInput value={field.value} onChange={field.onChange} placeholder="Add a solution and press Enter" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companySize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Size</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="501-1000">501-1000 employees</SelectItem>
                        <SelectItem value="1001+">1001+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Range</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="under-10k">Under $10,000</SelectItem>
                        <SelectItem value="10k-50k">$10,000 - $50,000</SelectItem>
                        <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                        <SelectItem value="100k-500k">$100,000 - $500,000</SelectItem>
                        <SelectItem value="over-500k">Over $500,000</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="decisionTimeframe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Decision Timeframe</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timeframe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate (within 1 month)</SelectItem>
                        <SelectItem value="short">Short term (1-3 months)</SelectItem>
                        <SelectItem value="medium">Medium term (3-6 months)</SelectItem>
                        <SelectItem value="long">Long term (6+ months)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="growthStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Growth Stage</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select growth stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="startup">Startup</SelectItem>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="expansion">Expansion</SelectItem>
                        <SelectItem value="mature">Mature</SelectItem>
                        <SelectItem value="renewal">Renewal/Transformation</SelectItem>
                        <SelectItem value="decline">Decline</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredCommunication"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Communication</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select preferred communication" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="video">Video Calls</SelectItem>
                        <SelectItem value="in-person">In-Person Meetings</SelectItem>
                        <SelectItem value="chat">Chat/Messaging</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setShowAddClient(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Client"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Client Dialog */}
      <Dialog open={showViewClient} onOpenChange={setShowViewClient}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>
              Read-only view of all available fields
            </DialogDescription>
          </DialogHeader>

          {viewClient ? (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Account</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div><span className="text-xs text-muted-foreground">Name</span><div>{viewClient.userName || `${viewClient.firstName || ''} ${viewClient.lastName || ''}`.trim() || viewClient.name}</div></div>
                  <div><span className="text-xs text-muted-foreground">Company</span><div>{viewClient.company}</div></div>
                  <div><span className="text-xs text-muted-foreground">Email</span><div>{viewClient.email}</div></div>
                  <div><span className="text-xs text-muted-foreground">Status</span><div>{viewClient.status}</div></div>
                   <div><span className="text-xs text-muted-foreground">License</span><div>{viewClient.licenseName || viewClient.licenseId || '—'}</div></div>
                  <div><span className="text-xs text-muted-foreground">Subscription Tier</span><div>{viewClient.subscriptionTier || '—'}</div></div>
                  <div><span className="text-xs text-muted-foreground">Preferred Communication</span><div>{getPreferredCommunicationLabel(viewClient.preferredCommunication) || '—'}</div></div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Contact</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div><span className="text-xs text-muted-foreground">Website</span><div>{viewClient.website || '—'}</div></div>
                  <div><span className="text-xs text-muted-foreground">Phone</span><div>{viewClient.contactPhone || '—'}</div></div>
                  <div><span className="text-xs text-muted-foreground">Address</span><div>{viewClient.address || '—'}</div></div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Business Context</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div><span className="text-xs text-muted-foreground">Industry</span><div>{viewClient.industry || '—'}</div></div>
                  <div><span className="text-xs text-muted-foreground">Company Size</span><div>{getCompanySizeLabel(viewClient.companySize) || '—'}</div></div>
                  <div><span className="text-xs text-muted-foreground">Budget</span><div>{getBudgetLabel(viewClient.budget) || '—'}</div></div>
                  <div><span className="text-xs text-muted-foreground">Decision Timeframe</span><div>{getDecisionTimeframeLabel(viewClient.decisionTimeframe) || '—'}</div></div>
                  <div><span className="text-xs text-muted-foreground">Growth Stage</span><div>{getGrowthStageLabel(viewClient.growthStage) || '—'}</div></div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Details</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Business Challenges</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(viewClient.businessChallenges || []).length ? (
                        (viewClient.businessChallenges || []).map((c, i) => (
                          <span key={`bc-${i}`} className="px-2 py-1 rounded-full bg-muted text-xs">{c}</span>
                        ))
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Technology Stack</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(viewClient.techStack || []).length ? (
                        (viewClient.techStack || []).map((t, i) => (
                          <span key={`ts-${i}`} className="px-2 py-1 rounded-full bg-muted text-xs">{t}</span>
                        ))
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Key Objectives</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(viewClient.keyObjectives || []).length ? (
                        (viewClient.keyObjectives || []).map((k, i) => (
                          <span key={`ko-${i}`} className="px-2 py-1 rounded-full bg-muted text-xs">{k}</span>
                        ))
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Previous Solutions</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(viewClient.previousSolutions || []).length ? (
                        (viewClient.previousSolutions || []).map((p, i) => (
                          <span key={`ps-${i}`} className="px-2 py-1 rounded-full bg-muted text-xs">{p}</span>
                        ))
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">Created: {new Date(viewClient.createdAt).toLocaleString()}</div>
            </div>
          ) : (
            <div className="py-6 text-sm text-muted-foreground">No client selected.</div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" type="button" onClick={() => setShowViewClient(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Client Dialog */}
      <Dialog open={showEditClient} onOpenChange={setShowEditClient}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client information
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={(e) => {
                e.preventDefault();
                console.log("Form submitted");
                const formData = editForm.getValues();
                console.log("Form data:", formData);
                handleUpdateClient(formData);
              }} 
              className="space-y-4">
              {updateError && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-600 text-sm mb-4 flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" />
                  <div>
                    <p className="font-medium mb-1">Error updating client</p>
                    <p>{updateError}</p>
                  </div>
                </div>
              )}
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password (leave empty to keep current)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="New password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="licenseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingLicenses ? "Loading licenses..." : "Select license"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingLicenses ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : licensesError ? (
                          <SelectItem value="error" disabled>Failed to load licenses</SelectItem>
                        ) : Array.isArray((availableLicenses as any)?.data) && (availableLicenses as any).data.length > 0 ? (
                          (availableLicenses as any).data.map((lic: any) => (
                            <SelectItem key={lic.id} value={String(lic.id)}>
                              {lic.label} ({lic.type})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-licenses" disabled>No licenses available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status is copied from license, not set in form */}



              <h3 className="text-lg font-medium mt-8 mb-4">Business Context Information</h3>

              <FormField
                control={editForm.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Healthcare, Technology, Finance" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="businessChallenges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Challenges</FormLabel>
                    <FormControl>
                      <ChipInput value={field.value} onChange={field.onChange} placeholder="Add a challenge and press Enter" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="techStack"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technology Stack</FormLabel>
                    <FormControl>
                      <ChipInput value={field.value} onChange={field.onChange} placeholder="Add a technology and press Enter" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="keyObjectives"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Objectives</FormLabel>
                    <FormControl>
                      <ChipInput value={field.value} onChange={field.onChange} placeholder="Add an objective and press Enter" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="previousSolutions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous Solutions</FormLabel>
                    <FormControl>
                      <ChipInput value={field.value} onChange={field.onChange} placeholder="Add a solution and press Enter" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="companySize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Size</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="501-1000">501-1000 employees</SelectItem>
                        <SelectItem value="1001+">1001+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Range</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="under-10k">Under $10,000</SelectItem>
                        <SelectItem value="10k-50k">$10,000 - $50,000</SelectItem>
                        <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                        <SelectItem value="100k-500k">$100,000 - $500,000</SelectItem>
                        <SelectItem value="over-500k">Over $500,000</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="decisionTimeframe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Decision Timeframe</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timeframe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate (within 1 month)</SelectItem>
                        <SelectItem value="short">Short term (1-3 months)</SelectItem>
                        <SelectItem value="medium">Medium term (3-6 months)</SelectItem>
                        <SelectItem value="long">Long term (6+ months)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="growthStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Growth Stage</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select growth stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="startup">Startup</SelectItem>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="expansion">Expansion</SelectItem>
                        <SelectItem value="mature">Mature</SelectItem>
                        <SelectItem value="renewal">Renewal/Transformation</SelectItem>
                        <SelectItem value="decline">Decline</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="preferredCommunication"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Communication</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select preferred communication" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="video">Video Calls</SelectItem>
                        <SelectItem value="in-person">In-Person Meetings</SelectItem>
                        <SelectItem value="chat">Chat/Messaging</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex gap-2 mt-6">
                <Button variant="outline" type="button" onClick={() => setShowEditClient(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isUpdating}
                  onClick={(e) => {
                    if (!editForm.formState.isSubmitting) {
                      e.preventDefault();
                      console.log("Manual submit button clicked");
                      
                      // Get form data and ensure it has correct types
                      const formData = editForm.getValues();
                      
                      // Make sure status is a valid value for database
                      if (!formData.status || formData.status === '') {
                        formData.status = 'active';
                      }
                      
                      // licenseId is already number | null from form, no conversion needed
                      
                      console.log("Form data after processing:", formData);
                      handleUpdateClient(formData);
                    }
                  }}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Client"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the client {currentClient?.name} from {currentClient?.company} and all associated data. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteClient} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientManagement;
