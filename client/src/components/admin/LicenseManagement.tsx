import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest, api } from "@/lib/api";
import { Loader2, RefreshCw, AlertCircle, Calendar, FileKey, Crown, Users, BarChart, Package, Terminal, Plus, Pencil, Trash2, CheckCircle, ArrowRight, Info } from "lucide-react";
import { format, addMonths } from "date-fns";

// API Response interfaces
interface ApiResponse<T> {
  status: string;
  data: T;
}

interface LicensesResponse {
  licenses: License[];
}

interface ClientsResponse {
  clients: any[];
}

// License interface matching our backend schema
interface License {
  id: number;
  clientName: string;
  plan: string; // "trial", "annual", "project"
  status: string; // "active", "expired", "suspended"
  startDate: string;
  endDate: string | null;
  limits: {
    users: number | null;
    surveys: number | null;
    responses: number | null;
  };
  isActive: boolean;
  // Legacy fields that might still be referenced in the code
  type?: string;
  name?: string;
  description?: string | null;
  licenseKey?: string;
  maxSurveys?: number;
  maxResponses?: number;
  maxSeats?: number;
  maxUsers?: number;
  cost?: number;
  features?: Record<string, boolean> | string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  clientId?: number | string | null;
  usageStats?: {
    surveysUsed: number;
    responsesUsed: number;
    seatsUsed: number;
  }
}

// New license form interface
interface NewLicenseForm {
  licenseName: string; // Required
  plan: string; // Required: trial, annual, project
  status: string; // Required: active, inactive, suspended
  maxSeats: string; // Required
  maxSurveys: string; // Required
  maxResponses: string; // Required
  cost: string; // Required
  durationMonths: string; // Required - used to calculate start/end dates
  description: string | null; // Optional
  features: Record<string, boolean>; // At least one required
  notes: string; // Optional
  clientId?: string | null; // Optional - for assignment to client
  
  // Legacy fields for backward compatibility
  clientName?: string;
  name?: string;
  type?: string;
}

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center p-12">
    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
    <p className="text-lg text-muted-foreground">Loading license data...</p>
  </div>
);

// Error alert component
const ErrorAlert = ({ message, onRetry }: { message: string, onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-destructive/10">
    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
    <h3 className="text-lg font-medium mb-2">Failed to load licenses</h3>
    <p className="text-muted-foreground mb-4">{message}</p>
    <Button onClick={onRetry} variant="outline" size="sm">
      <RefreshCw className="mr-2 h-4 w-4" />
      Retry
    </Button>
  </div>
);

// No licenses found component
const NoLicensesFound = () => (
  <div className="flex flex-col items-center justify-center p-8 border rounded-lg border-dashed">
    <FileKey className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="text-lg font-medium mb-2">No Licenses Found</h3>
    <p className="text-muted-foreground mb-4 text-center">
      There are no licenses in the system yet.<br />
      Create your first license to get started.
    </p>
  </div>
);

type LicenseManagementProps = { initialOpenLicenseId?: number; onInitialOpenHandled?: () => void };

const LicenseManagement = ({ initialOpenLicenseId, onInitialOpenHandled }: LicenseManagementProps) => {
  // Fetch licenses from API
  const {
    data: licensesData,
    isLoading: isLoadingLicenses,
    isError: isLicensesError,
    error: licensesError,
    refetch: refetchLicenses
  } = useQuery<ApiResponse<License[]>>({
    queryKey: ['/api/licenses'],
    retry: 2,
    refetchOnWindowFocus: false
  });

  // Fetch clients data for dropdown selection
  const {
    data: clientsData,
    isLoading: isLoadingClients,
    isError: isClientsError,
    error: clientsError
  } = useQuery<ApiResponse<any[]>>({
    queryKey: ['/api/clients'],
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  // Helper function to reset new license form
  const resetNewLicenseForm = () => {
    setNewLicense({
      licenseName: "",
      plan: "trial",
      status: "active",
      maxSeats: "",
      maxSurveys: "",
      maxResponses: "",
      cost: "",
      durationMonths: "12",
      description: "",
      features: {
        customBranding: false,
        dataExport: false,
        aiInsights: false,
        advancedAnalytics: false,
        apiAccess: false,
        prioritySupport: false,
        whiteLabeling: false
      },
      notes: ""
    });
  };

  // Create mutation for adding a new license
  const createLicenseMutation = useMutation({
    mutationFn: async (licenseForm: NewLicenseForm) => {
      // Calculate start and end dates based on duration
      const startDate = new Date();
      const durationMonths = parseInt(licenseForm.durationMonths || "12");
      const endDate = addMonths(startDate, durationMonths);
      
      // Convert form data to proper API format
      const apiData = {
        name: licenseForm.licenseName,
        type: licenseForm.plan, // trial, annual, or project
        status: licenseForm.status,
        description: licenseForm.description || null,
        maxSeats: parseInt(licenseForm.maxSeats) || 1,
        maxSurveys: parseInt(licenseForm.maxSurveys) || 1,
        maxResponses: parseInt(licenseForm.maxResponses) || 100,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        cost: parseInt(licenseForm.cost) || 0, // Store cost directly as entered
        features: JSON.stringify(licenseForm.features),
        notes: licenseForm.notes || null,
        licenseKey: `lic_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
      };
      
      return api.post('/api/licenses', apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/licenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "License Created",
        description: "New license has been created successfully."
      });
      resetNewLicenseForm();
    },
    onError: (error: any) => {
      console.error('License creation error:', error);
      toast({
        title: "Error",
        description: `Failed to create license: ${error.response?.data?.message || error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  // Update mutation for editing an existing license
  const updateLicenseMutation = useMutation({
    mutationFn: async (license: any) => {
      // Convert license data to proper API format
      const apiData = {
        name: license.name,
        type: license.type || license.plan,
        status: license.status,
        description: license.description || null,
        maxSeats: parseInt(license.maxSeats?.toString() || "1"),
        maxSurveys: parseInt(license.maxSurveys?.toString() || "1"),
        maxResponses: parseInt(license.maxResponses?.toString() || "100"),
        startDate: license.startDate instanceof Date ? license.startDate.toISOString() : 
                   typeof license.startDate === 'string' ? license.startDate : 
                   new Date().toISOString(),
        endDate: license.endDate instanceof Date ? license.endDate.toISOString() :
                 typeof license.endDate === 'string' ? license.endDate :
                 license.endDate === null ? null :
                 addMonths(new Date(), 12).toISOString(),
        cost: parseInt(license.cost?.toString() || "0"),
        features: typeof license.features === 'string' ? license.features : JSON.stringify(license.features || {}),
        notes: license.notes || null,
        licenseKey: license.licenseKey || `lic_${Math.random().toString(36).substring(2, 15)}`
      };
      
      return api.put(`/api/licenses/${license.id}`, apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/licenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "License Updated",
        description: "License has been updated successfully."
      });
      setEditLicense(null);
    },
    onError: (error: any) => {
      console.error('License update error:', error);
      toast({
        title: "Error",
        description: `Failed to update license: ${error.response?.data?.message || error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  // Delete mutation for removing a license
  const deleteLicenseMutation = useMutation({
    mutationFn: (licenseId: number) => 
      api.delete(`/api/licenses/${licenseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/licenses'] });
      toast({
        title: "License Deleted",
        description: "License has been deleted successfully."
      });
      setLicenseToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete license: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  // State for new license
  const [newLicense, setNewLicense] = useState<NewLicenseForm>({
    licenseName: "",
    plan: "trial",
    status: "active",
    maxSeats: "",
    maxSurveys: "",
    maxResponses: "",
    cost: "",
    durationMonths: "12",
    description: "",
    features: {
      customBranding: false,
      dataExport: false,
      aiInsights: false,
      advancedAnalytics: false,
      apiAccess: false,
      prioritySupport: false,
      whiteLabeling: false
    },
    notes: ""
  });

  // State for license to edit
  const [editLicense, setEditLicense] = useState<License | null>(null);

  // State for license to delete
  const [licenseToDelete, setLicenseToDelete] = useState<License | null>(null);

  // State for license details to view
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  // State for search query
  const [searchQuery, setSearchQuery] = useState("");
  
  // Function to refresh clients data
  const refreshClientsData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
  };

  // Handle feature toggle change for new license
  const handleFeatureToggle = (feature: keyof NewLicenseForm['features']) => {
    setNewLicense({
      ...newLicense,
      features: {
        ...newLicense.features,
        [feature]: !newLicense.features[feature]
      }
    });
  };

  // Handle feature toggle change for editing license
  const handleEditFeatureToggle = (feature: string) => {
    if (!editLicense) return;
    
    // Default empty features object if features is null/undefined
    const currentFeatures = typeof editLicense.features === 'string' 
      ? JSON.parse(editLicense.features as string) 
      : (editLicense.features || {
          customBranding: false,
          dataExport: false,
          aiInsights: false,
          advancedAnalytics: false,
          apiAccess: false,
          prioritySupport: false,
          whiteLabeling: false
        });
      
    const updatedFeatures = {
      ...currentFeatures,
      [feature]: !currentFeatures[feature]
    };
    
    setEditLicense({
      ...editLicense,
      features: updatedFeatures
    });
  };

  // Handle input change for new license form
  const handleNewLicenseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setNewLicense({
      ...newLicense,
      [e.target.name]: e.target.value
    });
  };

  // This function was replaced with direct state setters in each Select component

  // Handle input change for edit license form
  const handleEditLicenseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (editLicense) {
      let value: any = e.target.value;
      
      // Convert numeric fields to numbers, but handle empty strings and 0 properly
      if (["maxSeats", "maxSurveys", "maxResponses", "cost"].includes(e.target.name)) {
        // Allow empty string while user is typing, convert to number when there's a value
        if (e.target.value === "" || e.target.value === null) {
          // For cost, allow empty string temporarily (will be validated on submit)
          // For other fields, keep as empty string
          value = e.target.value === "" ? "" : null;
        } else {
          const parsed = parseInt(e.target.value);
          // Only set if it's a valid number (including 0)
          value = isNaN(parsed) ? e.target.value : parsed;
        }
      }
      
      setEditLicense({
        ...editLicense,
        [e.target.name]: value
      });
    }
  };

  // Handle select change for edit license form
  const handleEditLicenseSelectChange = (name: string, value: string) => {
    console.log(`Edit license select change - Field: ${name}, Value: ${value}`);
    
    if (editLicense) {
      // Special handling for clientId
      if (name === 'clientId') {
        const clientIdValue = value === 'null' ? null : parseInt(value);
        setEditLicense({
          ...editLicense,
          [name]: clientIdValue
        });
      } else {
        setEditLicense({
          ...editLicense,
          [name]: value
        });
      }
    }
  };

  // Helper function to get license type badge styling
  const getTypeBadge = (type: string | undefined) => {
    if (!type) return "bg-gray-100 text-gray-800";
    
    switch (type.toLowerCase()) {
      case 'basic':
        return "bg-blue-100 text-blue-800";
      case 'pro':
        return "bg-indigo-100 text-indigo-800";
      case 'enterprise':
        return "bg-violet-100 text-violet-800";
      case 'trial':
        return "bg-amber-100 text-amber-800";
      // Legacy types
      case 'annual_unlimited':
        return "bg-blue-100 text-blue-800";
      case 'single_survey':
        return "bg-purple-100 text-purple-800";
      case 'annual':
        return "bg-blue-100 text-blue-800";
      case 'project':
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get status badge styling
  // Function to safely check if a value is a Date object (type guard)
  const isDateObject = (value: any): value is Date => {
    return Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime());
  };
  
  const getStatusBadge = (status: string | undefined) => {
    if (!status) return "bg-gray-100 text-gray-800";
    
    switch (status.toLowerCase()) {
      case 'active':
        return "bg-green-100 text-green-800";
      case 'inactive':
        return "bg-gray-100 text-gray-800";
      case 'expiring_soon':
        return "bg-amber-100 text-amber-800";
      case 'expired':
        return "bg-red-100 text-red-800";
      case 'suspended':
        return "bg-red-100 text-red-800";
      case 'trial':
        return "bg-blue-100 text-blue-800";
      case 'pending':
        return "bg-purple-100 text-purple-800";
      case 'cancelled':
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '$0.00';
    
    // Format the amount directly as currency
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Helper function to format dates
  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return 'N/A';
    
    try {
      const date = new Date(dateStr);
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return dateStr;
    }
  };

  // Helper function to render status text
  const renderStatusText = (status: string | undefined) => {
    if (!status) return "Unknown";
    
    switch (status.toLowerCase()) {
      case 'active':
        return "Active";
      case 'inactive':
        return "Inactive";
      case 'expiring_soon':
        return "Expiring Soon";
      case 'expired':
        return "Expired";
      case 'suspended':
        return "Suspended";
      case 'trial':
        return "Trial";
      case 'pending':
        return "Pending Activation";
      case 'cancelled':
        return "Cancelled";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    }
  };

  // Add new license
  const addLicense = () => {
    // Validate required fields
    if (!newLicense.licenseName?.trim()) {
      toast({
        title: "Validation Error",
        description: "License Name is required.",
        variant: "destructive"
      });
      return;
    }

    if (!newLicense.plan) {
      toast({
        title: "Validation Error",
        description: "Plan is required.",
        variant: "destructive"
      });
      return;
    }

    if (!newLicense.status) {
      toast({
        title: "Validation Error",
        description: "Status is required.",
        variant: "destructive"
      });
      return;
    }

    // Validate maxSeats - allow 1 or above
    if (newLicense.maxSeats === undefined || newLicense.maxSeats === null || newLicense.maxSeats === "") {
      toast({
        title: "Validation Error",
        description: "Max Seats is required.",
        variant: "destructive"
      });
      return;
    }
    const maxSeatsValue = parseInt(newLicense.maxSeats);
    if (isNaN(maxSeatsValue) || maxSeatsValue < 1) {
      toast({
        title: "Validation Error",
        description: "Max Seats must be at least 1.",
        variant: "destructive"
      });
      return;
    }

    // Validate maxSurveys - allow 1 or above
    if (newLicense.maxSurveys === undefined || newLicense.maxSurveys === null || newLicense.maxSurveys === "") {
      toast({
        title: "Validation Error",
        description: "Max Surveys is required.",
        variant: "destructive"
      });
      return;
    }
    const maxSurveysValue = parseInt(newLicense.maxSurveys);
    if (isNaN(maxSurveysValue) || maxSurveysValue < 1) {
      toast({
        title: "Validation Error",
        description: "Max Surveys must be at least 1.",
        variant: "destructive"
      });
      return;
    }

    // Validate maxResponses - allow 1 or above
    if (newLicense.maxResponses === undefined || newLicense.maxResponses === null || newLicense.maxResponses === "") {
      toast({
        title: "Validation Error",
        description: "Max Responses is required.",
        variant: "destructive"
      });
      return;
    }
    const maxResponsesValue = parseInt(newLicense.maxResponses);
    if (isNaN(maxResponsesValue) || maxResponsesValue < 1) {
      toast({
        title: "Validation Error",
        description: "Max Responses must be at least 1.",
        variant: "destructive"
      });
      return;
    }

    // Allow cost to be 0 or above
    if (newLicense.cost === undefined || newLicense.cost === null || newLicense.cost === "") {
      toast({
        title: "Validation Error",
        description: "Cost is required.",
        variant: "destructive"
      });
      return;
    }
    const costValue = parseInt(newLicense.cost);
    if (isNaN(costValue) || costValue < 0 || costValue % 1 !== 0) {
      toast({
        title: "Validation Error",
        description: "Cost must be a whole number greater than or equal to 0 (e.g., 0, 100, 125).",
        variant: "destructive"
      });
      return;
    }

    if (!newLicense.durationMonths) {
      toast({
        title: "Validation Error",
        description: "Duration is required.",
        variant: "destructive"
      });
      return;
    }

    // Validate at least one feature is selected
    const hasAtLeastOneFeature = Object.values(newLicense.features).some(value => value === true);
    if (!hasAtLeastOneFeature) {
      toast({
        title: "Validation Error",
        description: "At least one feature must be selected.",
        variant: "destructive"
      });
      return;
    }

    // Submit to API
    createLicenseMutation.mutate(newLicense);
  };

  // Update license
  const updateLicense = async () => {
    if (!editLicense) return;

    // Validate required fields - matching creation form validation
    const licenseName = editLicense.name;
    if (!licenseName?.trim()) {
      toast({
        title: "Validation Error",
        description: "License Name is required.",
        variant: "destructive"
      });
      return;
    }

    if (!editLicense.plan) {
      toast({
        title: "Validation Error",
        description: "Plan is required.",
        variant: "destructive"
      });
      return;
    }

    if (!editLicense.status) {
      toast({
        title: "Validation Error",
        description: "Status is required.",
        variant: "destructive"
      });
      return;
    }

    // Validate maxSeats - check both limits.users and maxSeats, allow 1 or above
    const maxSeats = editLicense.limits?.users !== undefined ? editLicense.limits.users : editLicense.maxSeats;
    if (maxSeats === undefined || maxSeats === null || maxSeats === "") {
      toast({
        title: "Validation Error",
        description: "Max Seats is required.",
        variant: "destructive"
      });
      return;
    }
    const maxSeatsValue = typeof maxSeats === 'number' ? maxSeats : parseInt(String(maxSeats));
    if (isNaN(maxSeatsValue) || maxSeatsValue < 1) {
      toast({
        title: "Validation Error",
        description: "Max Seats must be at least 1.",
        variant: "destructive"
      });
      return;
    }

    // Validate maxSurveys - check both limits.surveys and maxSurveys, allow 1 or above
    const maxSurveys = editLicense.limits?.surveys !== undefined ? editLicense.limits.surveys : editLicense.maxSurveys;
    if (maxSurveys === undefined || maxSurveys === null || maxSurveys === "") {
      toast({
        title: "Validation Error",
        description: "Max Surveys is required.",
        variant: "destructive"
      });
      return;
    }
    const maxSurveysValue = typeof maxSurveys === 'number' ? maxSurveys : parseInt(String(maxSurveys));
    if (isNaN(maxSurveysValue) || maxSurveysValue < 1) {
      toast({
        title: "Validation Error",
        description: "Max Surveys must be at least 1.",
        variant: "destructive"
      });
      return;
    }

    // Validate maxResponses - check both limits.responses and maxResponses, allow 1 or above
    const maxResponses = editLicense.limits?.responses !== undefined ? editLicense.limits.responses : editLicense.maxResponses;
    if (maxResponses === undefined || maxResponses === null || maxResponses === "") {
      toast({
        title: "Validation Error",
        description: "Max Responses is required.",
        variant: "destructive"
      });
      return;
    }
    const maxResponsesValue = typeof maxResponses === 'number' ? maxResponses : parseInt(String(maxResponses));
    if (isNaN(maxResponsesValue) || maxResponsesValue < 1) {
      toast({
        title: "Validation Error",
        description: "Max Responses must be at least 1.",
        variant: "destructive"
      });
      return;
    }

    // Allow cost to be 0 or above
    if (editLicense.cost === undefined || editLicense.cost === null || editLicense.cost === "") {
      toast({
        title: "Validation Error",
        description: "Cost is required.",
        variant: "destructive"
      });
      return;
    }
    const costValue = typeof editLicense.cost === 'number' ? editLicense.cost : parseInt(String(editLicense.cost));
    if (isNaN(costValue) || costValue < 0 || costValue % 1 !== 0) {
      toast({
        title: "Validation Error",
        description: "Cost must be a whole number greater than or equal to 0 (e.g., 0, 100, 125).",
        variant: "destructive"
      });
      return;
    }

    if (!editLicense.startDate || !editLicense.endDate) {
      toast({
        title: "Validation Error",
        description: "Duration is required.",
        variant: "destructive"
      });
      return;
    }

    // Validate at least one feature is selected
    let featuresObj = editLicense.features;
    if (typeof featuresObj === 'string') {
      try {
        featuresObj = JSON.parse(featuresObj);
      } catch (e) {
        featuresObj = {};
      }
    }
    const hasAtLeastOneFeature = featuresObj && Object.values(featuresObj).some(value => value === true);
    if (!hasAtLeastOneFeature) {
      toast({
        title: "Validation Error",
        description: "At least one feature must be selected.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if the license ID exists in our loaded data
    if (licensesData?.data && Array.isArray(licensesData.data)) {
      const licenseExists = licensesData.data.some((license: any) => license.id === editLicense.id);
      if (!licenseExists) {
        toast({
          title: "Update Failed",
          description: `License with ID ${editLicense.id} does not exist in the database. It may have been deleted.`,
          variant: "destructive"
        });
        
        // Refresh the licenses data
        refetchLicenses();
        setEditLicense(null);
        return;
      }
    }

    // Convert features to JSON string if it's an object
    let featuresForApi = editLicense.features;
    if (typeof featuresForApi === 'object') {
      featuresForApi = JSON.stringify(featuresForApi);
    }

    // Extract date values for type-safe handling
    const startDateValue = editLicense.startDate;
    const endDateValue = editLicense.endDate;
    
    // Log what's happening with detailed information
    console.log("Editing license with dates:", {
      startDate: startDateValue,
      endDate: endDateValue,
      startDateType: typeof startDateValue,
      endDateType: typeof endDateValue,
      isStartDateObject: isDateObject(startDateValue),
      isEndDateObject: isDateObject(endDateValue),
      startDateConverted: isDateObject(startDateValue)
          ? startDateValue.toISOString()
          : new Date(startDateValue || new Date()).toISOString(),
      endDateConverted: isDateObject(endDateValue)
          ? endDateValue.toISOString()
          : endDateValue
            ? new Date(endDateValue).toISOString()
            : new Date().toISOString()
    });
    
    // Prepare data for API
    const licenseData = {
      id: editLicense.id,
      name: editLicense.name, // Save as licenses.name in database
      plan: editLicense.plan || editLicense.type, // Use the new field or fallback to legacy
      description: editLicense.description,
      limits: {
        users: editLicense.limits?.users || editLicense.maxSeats || 1,
        surveys: editLicense.limits?.surveys || editLicense.maxSurveys || 1,
        responses: editLicense.limits?.responses || editLicense.maxResponses || 100
      },
      // Format dates safely as ISO strings using our helper function
      startDate: isDateObject(startDateValue)
          ? startDateValue.toISOString()
          : new Date(startDateValue || new Date()).toISOString(),
      endDate: isDateObject(endDateValue)
          ? endDateValue.toISOString()
          : endDateValue
            ? new Date(endDateValue).toISOString()
            : new Date().toISOString(),
      status: editLicense.status,
      cost: typeof editLicense.cost === 'number' ? editLicense.cost : parseInt(String(editLicense.cost || "0")), // Store cost directly as entered
      features: featuresForApi,
      notes: editLicense.notes,
      clientId: (editLicense.clientId && editLicense.clientId !== "null") ? parseInt(editLicense.clientId as string) : null
    };

    try {
      // Use direct fetch instead of the mutation to better debug
      console.log("Sending PUT request to /api/licenses/" + editLicense.id, licenseData);
      
      const response = await fetch(`/api/licenses/${editLicense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(licenseData)
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("Error response:", errorData);
        } catch (e) {
          console.error("Failed to parse error response");
        }
        
        toast({
          title: "Update Failed",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }
      
      const data = await response.json();
      console.log("Update success:", data);
      
      toast({
        title: "License Updated",
        description: "License has been updated successfully."
      });
      
      // Refresh the licenses data
      queryClient.invalidateQueries({ queryKey: ['/api/licenses'] });
      
      // Close the dialog
      setEditLicense(null);
    } catch (error) {
      console.error("Error during license update:", error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  // Delete license
  const deleteLicense = () => {
    if (!licenseToDelete) return;
    deleteLicenseMutation.mutate(licenseToDelete.id);
  };

  // Export licenses data
  const exportLicenses = () => {
    // In a real app, this would generate a CSV/PDF file
    toast({
      title: "Export Started",
      description: "License data export has been initiated."
    });
  };

  // View license analytics
  const viewAnalytics = () => {
    toast({
      title: "Analytics Loading",
      description: "License usage analytics is being prepared."
    });
  };

  // Auto-open license details when navigated with a specific license ID
  useEffect(() => {
    if (!initialOpenLicenseId) return;
    const all = licensesData?.data || [];
    if (!Array.isArray(all) || all.length === 0) return;
    const target = all.find((l: any) => l.id === initialOpenLicenseId);
    if (target) {
      setSelectedLicense(target as any);
      if (onInitialOpenHandled) onInitialOpenHandled();
    }
  }, [initialOpenLicenseId, licensesData]);

  // Filtered licenses based on search query
  const licenses = licensesData?.data || [];
  const filteredLicenses = licenses.filter((license: License) => 
    (license.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (license.plan?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (license.status?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Render appropriate content based on loading/error state
  const renderContent = () => {
    if (isLoadingLicenses) {
      return <LoadingSpinner />;
    }

    if (isLicensesError) {
      return (
        <ErrorAlert 
          message={`Error loading licenses: ${(licensesError as Error)?.message || 'Unknown error'}`}
          onRetry={refetchLicenses}
        />
      );
    }

    if (!licensesData || !licensesData.data || licensesData.data.length === 0) {
      return <NoLicensesFound />;
    }

    return (
      <>
        <div className="flex justify-between mb-6">
          <div className="relative w-64">
            <Input 
              placeholder="Search licenses..." 
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
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={exportLicenses}>
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
            <Button variant="outline" size="sm" onClick={viewAnalytics}>
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
                <rect x="2" y="2" width="20" height="20" rx="2"></rect>
                <path d="M7 12v5"></path>
                <path d="M12 7v10"></path>
                <path d="M17 12v5"></path>
              </svg>
              Analytics
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Max Users</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLicenses.map((license: License) => (
                <TableRow key={license.id}>
                  <TableCell className="font-medium">{license.name || "Unknown"}</TableCell>
                  <TableCell>
                    <Badge className={getTypeBadge(license.plan || 'unknown')}>
                      {license.plan ? license.plan.charAt(0).toUpperCase() + license.plan.slice(1) : 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(license.status)}>
                      {renderStatusText(license.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{license.limits?.users || "N/A"}</TableCell>
                  <TableCell>{license.endDate ? formatDate(license.endDate) : "No Expiry"}</TableCell>
                  <TableCell>{license.cost ? formatCurrency(license.cost) : "$0.00"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedLicense(license)}
                      >
                        <Info className="h-4 w-4" />
                        <span className="sr-only">Details</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          refreshClientsData(); 
                          setEditLicense(license);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      {/* <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLicenseToDelete(license)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button> */}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle className="text-xl font-bold">License Management</CardTitle>
              <CardDescription>
                Manage subscription licenses and access permissions
              </CardDescription>
            </div>
            <div>
              <Dialog onOpenChange={(open) => {
                  if (!open) {
                    // Reset the form when dialog closes
                    resetNewLicenseForm();
                  } else {
                    // Refresh client data when dialog opens
                    refreshClientsData();
                  }
                }}>
                <DialogTrigger asChild>
                  <Button 
                    data-create-license-button="true"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Create License
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New License</DialogTitle>
                    <DialogDescription>
                      Enter license details for the new subscription.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="licenseName" className="text-right">
                        License Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="licenseName"
                        name="licenseName"
                        value={newLicense.licenseName}
                        onChange={handleNewLicenseChange}
                        className="col-span-3"
                        placeholder="Enter license name"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="plan" className="text-right">
                        Plan <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={newLicense.plan || "trial"}
                        onValueChange={(value) => {
                          setNewLicense({
                            ...newLicense,
                            plan: value,
                            type: value  // For backward compatibility
                          });
                        }}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="status" className="text-right">
                        Status <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={newLicense.status || "active"}
                        onValueChange={(value) => {
                          setNewLicense({
                            ...newLicense,
                            status: value
                          });
                        }}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="maxSeats" className="text-right">
                        Max Seats <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="maxSeats"
                        name="maxSeats"
                        type="number"
                        min="1"
                        value={newLicense.maxSeats}
                        onChange={handleNewLicenseChange}
                        className="col-span-3"
                        placeholder="Enter number of seats"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="maxSurveys" className="text-right">
                        Max Surveys <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="maxSurveys"
                        name="maxSurveys"
                        type="number"
                        min="1"
                        value={newLicense.maxSurveys}
                        onChange={handleNewLicenseChange}
                        className="col-span-3"
                        placeholder="Enter number of surveys"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="maxResponses" className="text-right">
                        Max Responses <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="maxResponses"
                        name="maxResponses"
                        type="number"
                        min="1"
                        value={newLicense.maxResponses}
                        onChange={handleNewLicenseChange}
                        className="col-span-3"
                        placeholder="Enter number of responses"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="cost" className="text-right">
                        Cost (USD) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="cost"
                        name="cost"
                        type="number"
                        min="0"
                        step="1"
                        value={newLicense.cost}
                        onChange={handleNewLicenseChange}
                        className="col-span-3"
                        placeholder="Enter cost in USD (e.g., 100)"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="durationMonths" className="text-right">
                        Duration <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={newLicense.durationMonths || "12"}
                        onValueChange={(value) => {
                          setNewLicense({
                            ...newLicense,
                            durationMonths: value
                          });
                        }}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 Months</SelectItem>
                          <SelectItem value="6">6 Months</SelectItem>
                          <SelectItem value="12">1 Year</SelectItem>
                          <SelectItem value="24">2 Years</SelectItem>
                          <SelectItem value="36">3 Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="description" className="text-right pt-2">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={newLicense.description || ""}
                        onChange={handleNewLicenseChange}
                        className="col-span-3"
                        placeholder="License description (optional)..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2">
                        Features <span className="text-red-500">*</span>
                      </Label>
                      <div className="col-span-3 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="customBranding" 
                            checked={newLicense.features.customBranding}
                            onClick={() => handleFeatureToggle("customBranding")}
                          />
                          <Label htmlFor="customBranding">Custom Branding</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="dataExport" 
                            checked={newLicense.features.dataExport}
                            onClick={() => handleFeatureToggle("dataExport")}
                          />
                          <Label htmlFor="dataExport">Data Export</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="aiInsights" 
                            checked={newLicense.features.aiInsights}
                            onClick={() => handleFeatureToggle("aiInsights")}
                          />
                          <Label htmlFor="aiInsights">AI Insights</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="advancedAnalytics" 
                            checked={newLicense.features.advancedAnalytics}
                            onClick={() => handleFeatureToggle("advancedAnalytics")}
                          />
                          <Label htmlFor="advancedAnalytics">Advanced Analytics</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="apiAccess" 
                            checked={newLicense.features.apiAccess}
                            onClick={() => handleFeatureToggle("apiAccess")}
                          />
                          <Label htmlFor="apiAccess">API Access</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="prioritySupport" 
                            checked={newLicense.features.prioritySupport}
                            onClick={() => handleFeatureToggle("prioritySupport")}
                          />
                          <Label htmlFor="prioritySupport">Priority Support</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="whiteLabeling" 
                            checked={newLicense.features.whiteLabeling}
                            onClick={() => handleFeatureToggle("whiteLabeling")}
                          />
                          <Label htmlFor="whiteLabeling">White Labeling</Label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="notes" className="text-right pt-2">
                        Notes
                      </Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        value={newLicense.notes}
                        onChange={handleNewLicenseChange}
                        className="col-span-3"
                        placeholder="Additional notes..."
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button 
                      onClick={addLicense}
                      disabled={createLicenseMutation.isPending}
                    >
                      {createLicenseMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create License
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>

      {/* Edit License Dialog */}
      {editLicense && (
        <Dialog open={!!editLicense} onOpenChange={(open) => !open && setEditLicense(null)}>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit License</DialogTitle>
              <DialogDescription>
                Update license details and settings.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-licenseName" className="text-right">
                  License Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-licenseName"
                  name="licenseName"
                  value={editLicense.name || ""}
                  onChange={(e) => {
                    setEditLicense({
                      ...editLicense,
                      name: e.target.value
                    });
                  }}
                  className="col-span-3"
                  placeholder="Enter license name"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-plan" className="text-right">
                  Plan <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={editLicense.plan || editLicense.type || "trial"}
                  onValueChange={(value) => {
                    setEditLicense({
                      ...editLicense,
                      plan: value,
                      type: value  // For backward compatibility
                    });
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={editLicense.status || "active"}
                  onValueChange={(value) => {
                    setEditLicense({
                      ...editLicense,
                      status: value
                    });
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-maxSeats" className="text-right">
                  Max Seats <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-maxSeats"
                  name="maxSeats"
                  type="number"
                  min="1"
                  value={
                    editLicense.limits?.users !== undefined 
                      ? editLicense.limits.users 
                      : (editLicense.maxSeats !== undefined && editLicense.maxSeats !== null 
                          ? (typeof editLicense.maxSeats === 'number' ? editLicense.maxSeats : parseInt(String(editLicense.maxSeats)) || 1)
                          : 1)
                  }
                  onChange={(e) => {
                    handleEditLicenseChange(e);
                    // Also update the limits structure
                    const value = e.target.value === "" ? "" : parseInt(e.target.value);
                    setEditLicense({
                      ...editLicense,
                      limits: {
                        ...editLicense.limits,
                        users: isNaN(value as number) ? undefined : (value as number)
                      }
                    });
                  }}
                  className="col-span-3"
                  placeholder="Enter number of seats"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-maxSurveys" className="text-right">
                  Max Surveys <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-maxSurveys"
                  name="maxSurveys"
                  type="number"
                  min="1"
                  value={
                    editLicense.limits?.surveys !== undefined 
                      ? editLicense.limits.surveys 
                      : (editLicense.maxSurveys !== undefined && editLicense.maxSurveys !== null 
                          ? (typeof editLicense.maxSurveys === 'number' ? editLicense.maxSurveys : parseInt(String(editLicense.maxSurveys)) || 1)
                          : 1)
                  }
                  onChange={(e) => {
                    handleEditLicenseChange(e);
                    // Also update the limits structure
                    const value = e.target.value === "" ? "" : parseInt(e.target.value);
                    setEditLicense({
                      ...editLicense,
                      limits: {
                        ...editLicense.limits,
                        surveys: isNaN(value as number) ? undefined : (value as number)
                      }
                    });
                  }}
                  className="col-span-3"
                  placeholder="Enter number of surveys"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-maxResponses" className="text-right">
                  Max Responses <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-maxResponses"
                  name="maxResponses"
                  type="number"
                  min="1"
                  value={
                    editLicense.limits?.responses !== undefined 
                      ? editLicense.limits.responses 
                      : (editLicense.maxResponses !== undefined && editLicense.maxResponses !== null 
                          ? (typeof editLicense.maxResponses === 'number' ? editLicense.maxResponses : parseInt(String(editLicense.maxResponses)) || 100)
                          : 100)
                  }
                  onChange={(e) => {
                    handleEditLicenseChange(e);
                    // Also update the limits structure
                    const value = e.target.value === "" ? "" : parseInt(e.target.value);
                    setEditLicense({
                      ...editLicense,
                      limits: {
                        ...editLicense.limits,
                        responses: isNaN(value as number) ? undefined : (value as number)
                      }
                    });
                  }}
                  className="col-span-3"
                  placeholder="Enter number of responses"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-cost" className="text-right">
                  Cost (USD) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-cost"
                  name="cost"
                  type="number"
                  min="0"
                  step="1"
                  value={
                    editLicense.cost === undefined || editLicense.cost === null || editLicense.cost === ""
                      ? ""
                      : typeof editLicense.cost === 'number'
                        ? editLicense.cost
                        : editLicense.cost === "0" || parseInt(String(editLicense.cost)) === 0
                          ? 0
                          : parseInt(String(editLicense.cost)) || ""
                  }
                  onChange={handleEditLicenseChange}
                  className="col-span-3"
                  placeholder="Enter cost in USD (e.g., 0, 100)"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-durationMonths" className="text-right">
                  Duration <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={(() => {
                    // Calculate duration from existing dates if available
                    if (editLicense.startDate && editLicense.endDate) {
                      try {
                        const start = new Date(editLicense.startDate);
                        const end = new Date(editLicense.endDate);
                        const monthsDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
                        // Match to closest option
                        if (monthsDiff <= 3) return "3";
                        if (monthsDiff <= 6) return "6";
                        if (monthsDiff <= 12) return "12";
                        if (monthsDiff <= 24) return "24";
                        return "36";
                      } catch (e) {
                        return "12";
                      }
                    }
                    return "12";
                  })()}
                  onValueChange={(value) => {
                    const durationMonths = parseInt(value);
                    const startDate = editLicense.startDate ? new Date(editLicense.startDate) : new Date();
                    const endDate = addMonths(startDate, durationMonths);
                    setEditLicense({
                      ...editLicense,
                      startDate: startDate.toISOString(),
                      endDate: endDate.toISOString()
                    });
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">1 Year</SelectItem>
                    <SelectItem value="24">2 Years</SelectItem>
                    <SelectItem value="36">3 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-description" className="text-right pt-2">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={editLicense.description || ''}
                  onChange={handleEditLicenseChange}
                  className="col-span-3"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">
                  Features <span className="text-red-500">*</span>
                </Label>
                <div className="col-span-3 space-y-2">
                  {(() => {
                    // Parse features from string if needed
                    let features = editLicense.features;
                    if (typeof features === 'string') {
                      try {
                        features = JSON.parse(features);
                      } catch (e) {
                        features = {};
                      }
                    }
                    const featuresObj = (features && typeof features === 'object' && !Array.isArray(features)) ? features as Record<string, boolean> : {};
                    
                    return (
                      <>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="edit-customBranding" 
                            checked={featuresObj.customBranding || false}
                            onClick={() => handleEditFeatureToggle("customBranding")}
                          />
                          <Label htmlFor="edit-customBranding">Custom Branding</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="edit-dataExport" 
                            checked={featuresObj.dataExport || false}
                            onClick={() => handleEditFeatureToggle("dataExport")}
                          />
                          <Label htmlFor="edit-dataExport">Data Export</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="edit-aiInsights" 
                            checked={featuresObj.aiInsights || false}
                            onClick={() => handleEditFeatureToggle("aiInsights")}
                          />
                          <Label htmlFor="edit-aiInsights">AI Insights</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="edit-advancedAnalytics" 
                            checked={featuresObj.advancedAnalytics || false}
                            onClick={() => handleEditFeatureToggle("advancedAnalytics")}
                          />
                          <Label htmlFor="edit-advancedAnalytics">Advanced Analytics</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="edit-apiAccess" 
                            checked={featuresObj.apiAccess || false}
                            onClick={() => handleEditFeatureToggle("apiAccess")}
                          />
                          <Label htmlFor="edit-apiAccess">API Access</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="edit-prioritySupport" 
                            checked={featuresObj.prioritySupport || false}
                            onClick={() => handleEditFeatureToggle("prioritySupport")}
                          />
                          <Label htmlFor="edit-prioritySupport">Priority Support</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="edit-whiteLabeling" 
                            checked={featuresObj.whiteLabeling || false}
                            onClick={() => handleEditFeatureToggle("whiteLabeling")}
                          />
                          <Label htmlFor="edit-whiteLabeling">White Labeling</Label>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-notes" className="text-right pt-2">
                  Notes
                </Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  value={editLicense.notes || ''}
                  onChange={handleEditLicenseChange}
                  className="col-span-3"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditLicense(null)}>
                Cancel
              </Button>
              <Button 
                onClick={updateLicense}
                disabled={false}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* License Details Dialog */}
      {selectedLicense && (
        <Dialog open={!!selectedLicense} onOpenChange={(open) => !open && setSelectedLicense(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold">{selectedLicense.name || "Unknown License"}</DialogTitle>
                  <DialogDescription className="mt-1">
                    Complete license information and specifications
                  </DialogDescription>
                </div>
                <Badge className={`${getStatusBadge(selectedLicense.status)} text-sm px-3 py-1`}>
                  {renderStatusText(selectedLicense.status)}
                </Badge>
              </div>
            </DialogHeader>
            
            <div className="space-y-6 pt-4">
              {/* Basic Information Section */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileKey className="h-4 w-4" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Plan Type</p>
                    <Badge className={getTypeBadge(selectedLicense.plan || "unknown")} variant="outline">
                      {selectedLicense.plan ? selectedLicense.plan.charAt(0).toUpperCase() + selectedLicense.plan.slice(1) : "Unknown"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">License Status</p>
                    <p className="font-medium">{renderStatusText(selectedLicense.status)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Start Date
                    </p>
                    <p className="font-medium">{selectedLicense.startDate ? formatDate(selectedLicense.startDate) : "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Expiry Date
                    </p>
                    <p className="font-medium">{selectedLicense.endDate ? formatDate(selectedLicense.endDate) : "No Expiry"}</p>
                  </div>
                  {selectedLicense.cost !== undefined && selectedLicense.cost !== null && (
                    <div className="space-y-1 col-span-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Package Cost
                      </p>
                      <p className="text-lg font-bold text-primary">{formatCurrency(selectedLicense.cost)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* License Limits Section */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  License Limits
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Max Users
                    </p>
                    <p className="text-2xl font-bold">
                      {selectedLicense.limits?.users === null ? (
                        <span className="text-green-600">∞</span>
                      ) : (
                        selectedLicense.limits?.users || "0"
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <FileKey className="h-3 w-3" />
                      Max Surveys
                    </p>
                    <p className="text-2xl font-bold">
                      {selectedLicense.limits?.surveys === null ? (
                        <span className="text-green-600">∞</span>
                      ) : (
                        selectedLicense.limits?.surveys || "0"
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Max Responses
                    </p>
                    <p className="text-2xl font-bold">
                      {selectedLicense.limits?.responses === null ? (
                        <span className="text-green-600">∞</span>
                      ) : (
                        selectedLicense.limits?.responses || "0"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Features section - only shown if it exists */}
              {selectedLicense.features && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    Features
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {typeof selectedLicense.features === 'string' ? (
                      <div className="col-span-2">
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(JSON.parse(selectedLicense.features), null, 2)}
                        </pre>
                      </div>
                    ) : selectedLicense.features && Object.keys(selectedLicense.features).length > 0 ? (
                      Object.entries(selectedLicense.features).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-1">
                          {value ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                          )}
                          <span className="text-sm">
                            {key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-sm text-muted-foreground">No feature details available</div>
                    )}
                  </div>
                </div>
              )}

              {selectedLicense.description && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Description
                  </h4>
                  <p className="text-sm whitespace-pre-line">{selectedLicense.description}</p>
                </div>
              )}

              {selectedLicense.notes && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Notes
                  </h4>
                  <p className="text-sm whitespace-pre-line">{selectedLicense.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedLicense(null);
                  setEditLicense(selectedLicense);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button onClick={() => setSelectedLicense(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete License Confirmation */}
      <AlertDialog open={!!licenseToDelete} onOpenChange={(open) => !open && setLicenseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the license 
              {licenseToDelete?.name && <strong> "{licenseToDelete.name}"</strong>} and remove it from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteLicense}
              disabled={deleteLicenseMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLicenseMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LicenseManagement;
