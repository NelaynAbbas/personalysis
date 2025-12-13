import React, { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { api } from "@/lib/api";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Settings,
  Link,
  Mail,
  BarChart,
  Filter,
  MessageSquare,
  Users,
  Check,
  ExternalLink,
  PlusCircle
} from "lucide-react";

// API Response interface
interface ApiResponse<T> {
  status: string;
  data: T;
}

// Type definitions
interface Integration {
  id: string;
  name: string;
  type: 'crm' | 'email' | 'analytics';
  provider: string;
  status: 'active' | 'inactive' | 'configured' | 'error';
  apiKey?: string;
  apiSecret?: string;
  apiUrl?: string;
  lastSynced?: string;
  config: Record<string, any>;
}

// Component definitions
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center p-12">
    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
    <p className="text-lg text-muted-foreground">Loading integrations data...</p>
  </div>
);

const ErrorAlert = ({ message, onRetry }: { message: string, onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-destructive/10">
    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
    <h3 className="text-lg font-medium mb-2">Failed to load integrations</h3>
    <p className="text-muted-foreground mb-4">{message}</p>
    <Button onClick={onRetry} variant="default" size="sm">
      <RefreshCw className="mr-2 h-4 w-4" />
      Retry
    </Button>
  </div>
);

// New Integration component
const NewIntegrationCard = ({ type, onAdd }: { type: string; onAdd: (type: string) => void }) => (
  <Card className="border-dashed cursor-pointer hover:border-primary/50 transition-colors"
    onClick={() => onAdd(type)}>
    <CardContent className="p-6 flex flex-col items-center justify-center h-[200px]">
      <PlusCircle className="h-10 w-10 text-muted-foreground mb-4" />
      <p className="font-medium text-center">Add {type === 'crm' ? 'CRM' : type === 'email' ? 'Email' : 'Analytics'} Integration</p>
      <p className="text-sm text-muted-foreground text-center mt-2">
        Connect to your {type === 'crm' ? 'customer relationship management' : type === 'email' ? 'email marketing' : 'analytics'} platform
      </p>
    </CardContent>
  </Card>
);

// Integration card component
const IntegrationCard = ({ integration, onEdit, onToggle }: { 
  integration: Integration; 
  onEdit: (integration: Integration) => void;
  onToggle: (integration: Integration, newStatus: 'active' | 'inactive') => void;
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactive</Badge>;
      case 'configured':
        return <Badge className="bg-blue-100 text-blue-800">Configured</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'crm':
        return <Users className="h-6 w-6 text-blue-500" />;
      case 'email':
        return <Mail className="h-6 w-6 text-purple-500" />;
      case 'analytics':
        return <BarChart className="h-6 w-6 text-emerald-500" />;
      default:
        return <Settings className="h-6 w-6" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {getIcon(integration.type)}
            <div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <CardDescription>{integration.provider}</CardDescription>
            </div>
          </div>
          {getStatusBadge(integration.status)}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {integration.lastSynced && (
          <p className="text-sm text-muted-foreground mb-2">
            Last synced: {new Date(integration.lastSynced).toLocaleString()}
          </p>
        )}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Switch 
              checked={integration.status === 'active'} 
              onCheckedChange={(checked) => 
                onToggle(integration, checked ? 'active' : 'inactive')
              }
            />
            <Label>Enabled</Label>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onEdit(integration)}>
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const IntegrationManager = () => {
  // State for tracking selected tab
  const [activeTab, setActiveTab] = useState<string>("crm");
  
  // State for adding/editing integrations
  const [currentIntegration, setCurrentIntegration] = useState<Integration | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [integrationType, setIntegrationType] = useState<'crm' | 'email' | 'analytics'>('crm');
  
  // Form state for new integration
  const [newIntegration, setNewIntegration] = useState({
    name: "",
    provider: "",
    apiKey: "",
    apiSecret: "",
    apiUrl: "",
    config: {}
  });

  // Fetch integrations data
  const {
    data: integrationsData,
    isLoading,
    error,
    refetch
  } = useQuery<ApiResponse<Integration[]>>({
    queryKey: ['/api/integrations'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Extract integrations array from response data, defaulting to empty array if not available
  const integrations: Integration[] = integrationsData?.data || [];

  // Add integration mutation
  const addIntegrationMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/integrations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: "Integration added",
        description: "The integration has been added successfully"
      });
      setShowAddDialog(false);
      resetNewIntegrationForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to add integration: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Update integration mutation
  const updateIntegrationMutation = useMutation({
    mutationFn: (data: any) => api.put(`/api/integrations/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: "Integration updated",
        description: "The integration has been updated successfully"
      });
      setShowEditDialog(false);
      setCurrentIntegration(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update integration: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Toggle integration status mutation
  const toggleIntegrationMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) => 
      api.patch(`/api/integrations/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: "Status updated",
        description: "Integration status has been updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Test integration mutation
  const testIntegrationMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/integrations/${id}/test`),
    onSuccess: () => {
      toast({
        title: "Test successful",
        description: "Connection to the service was successful"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test failed",
        description: `Connection test failed: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Filter integrations by type
  const filteredIntegrations = integrations.filter(
    integration => integration.type === activeTab
  );

  // Handle adding new integration
  const handleAddIntegration = (type: string) => {
    setIntegrationType(type as 'crm' | 'email' | 'analytics');
    setShowAddDialog(true);
  };

  // Handle editing integration
  const handleEditIntegration = (integration: Integration) => {
    setCurrentIntegration(integration);
    setShowEditDialog(true);
  };

  // Handle toggling integration status
  const handleToggleIntegration = (integration: Integration, newStatus: 'active' | 'inactive') => {
    toggleIntegrationMutation.mutate({ id: integration.id, status: newStatus });
  };

  // Handle input change for new integration form
  const handleNewIntegrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewIntegration({
      ...newIntegration,
      [e.target.name]: e.target.value
    });
  };

  // Handle input change for edit integration form
  const handleEditIntegrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentIntegration) {
      setCurrentIntegration({
        ...currentIntegration,
        [e.target.name]: e.target.value
      });
    }
  };

  // Handle testing integration connection
  const handleTestIntegration = () => {
    if (currentIntegration) {
      testIntegrationMutation.mutate(currentIntegration.id);
    }
  };

  // Submit new integration form
  const submitNewIntegration = () => {
    if (!newIntegration.name || !newIntegration.provider) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Create integration data
    const integrationData = {
      name: newIntegration.name,
      provider: newIntegration.provider,
      type: integrationType,
      status: 'configured',
      apiKey: newIntegration.apiKey,
      apiSecret: newIntegration.apiSecret,
      apiUrl: newIntegration.apiUrl,
      config: newIntegration.config
    };

    // Submit to API
    addIntegrationMutation.mutate(integrationData);
  };

  // Submit edit integration form
  const submitEditIntegration = () => {
    if (!currentIntegration || !currentIntegration.name || !currentIntegration.provider) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Submit to API
    updateIntegrationMutation.mutate(currentIntegration);
  };

  // Reset new integration form
  const resetNewIntegrationForm = () => {
    setNewIntegration({
      name: "",
      provider: "",
      apiKey: "",
      apiSecret: "",
      apiUrl: "",
      config: {}
    });
  };

  // If loading, show spinner
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // If error, show error message
  if (error) {
    return <ErrorAlert message={(error as Error).message} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Integration Manager</h2>
      </div>
      
      <div className="space-y-6">
        <Tabs defaultValue="crm" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="crm">CRM Systems</TabsTrigger>
            <TabsTrigger value="email">Email Services</TabsTrigger>
            <TabsTrigger value="analytics">Analytics Platforms</TabsTrigger>
          </TabsList>
          
          <TabsContent value="crm" className="space-y-4 mt-6">
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertTitle>CRM Integrations</AlertTitle>
              <AlertDescription>
                Connect with popular CRM platforms to sync contacts, companies and deals.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIntegrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onEdit={handleEditIntegration}
                  onToggle={handleToggleIntegration}
                />
              ))}
              <NewIntegrationCard type="crm" onAdd={handleAddIntegration} />
            </div>
          </TabsContent>
          
          <TabsContent value="email" className="space-y-4 mt-6">
            <Alert className="mb-4">
              <Mail className="h-4 w-4 mr-2" />
              <AlertTitle>Email Integrations</AlertTitle>
              <AlertDescription>
                Connect with email marketing platforms to send campaigns and track engagement.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIntegrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onEdit={handleEditIntegration}
                  onToggle={handleToggleIntegration}
                />
              ))}
              <NewIntegrationCard type="email" onAdd={handleAddIntegration} />
            </div>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4 mt-6">
            <Alert className="mb-4">
              <BarChart className="h-4 w-4 mr-2" />
              <AlertTitle>Analytics Integrations</AlertTitle>
              <AlertDescription>
                Connect with analytics platforms to track user behavior and survey performance.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIntegrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onEdit={handleEditIntegration}
                  onToggle={handleToggleIntegration}
                />
              ))}
              <NewIntegrationCard type="analytics" onAdd={handleAddIntegration} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Integration Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add {integrationType === 'crm' ? 'CRM' : integrationType === 'email' ? 'Email' : 'Analytics'} Integration</DialogTitle>
            <DialogDescription>
              Enter the details to connect with your {integrationType} service.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={newIntegration.name}
                onChange={handleNewIntegrationChange}
                className="col-span-3"
                placeholder="Integration name"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="provider" className="text-right">
                Provider
              </Label>
              <Input
                id="provider"
                name="provider"
                value={newIntegration.provider}
                onChange={handleNewIntegrationChange}
                className="col-span-3"
                placeholder="e.g. Salesforce, HubSpot"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiKey" className="text-right">
                API Key
              </Label>
              <Input
                id="apiKey"
                name="apiKey"
                value={newIntegration.apiKey}
                onChange={handleNewIntegrationChange}
                className="col-span-3"
                placeholder="Your API key"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiSecret" className="text-right">
                API Secret
              </Label>
              <Input
                id="apiSecret"
                name="apiSecret"
                type="password"
                value={newIntegration.apiSecret}
                onChange={handleNewIntegrationChange}
                className="col-span-3"
                placeholder="Your API secret"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiUrl" className="text-right">
                API URL
              </Label>
              <Input
                id="apiUrl"
                name="apiUrl"
                value={newIntegration.apiUrl}
                onChange={handleNewIntegrationChange}
                className="col-span-3"
                placeholder="https://api.example.com"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="default" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitNewIntegration}
              disabled={addIntegrationMutation.isPending}
            >
              {addIntegrationMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Integration Dialog */}
      {currentIntegration && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit {currentIntegration.name}</DialogTitle>
              <DialogDescription>
                Update your integration settings.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={currentIntegration.name}
                  onChange={handleEditIntegrationChange}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-provider" className="text-right">
                  Provider
                </Label>
                <Input
                  id="edit-provider"
                  name="provider"
                  value={currentIntegration.provider}
                  onChange={handleEditIntegrationChange}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-apiKey" className="text-right">
                  API Key
                </Label>
                <Input
                  id="edit-apiKey"
                  name="apiKey"
                  value={currentIntegration.apiKey || ""}
                  onChange={handleEditIntegrationChange}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-apiSecret" className="text-right">
                  API Secret
                </Label>
                <Input
                  id="edit-apiSecret"
                  name="apiSecret"
                  type="password"
                  value={currentIntegration.apiSecret || ""}
                  onChange={handleEditIntegrationChange}
                  className="col-span-3"
                  placeholder="••••••••"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-apiUrl" className="text-right">
                  API URL
                </Label>
                <Input
                  id="edit-apiUrl"
                  name="apiUrl"
                  value={currentIntegration.apiUrl || ""}
                  onChange={handleEditIntegrationChange}
                  className="col-span-3"
                />
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-end">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleTestIntegration}
                  disabled={testIntegrationMutation.isPending}
                  className="mr-2"
                >
                  {testIntegrationMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Link className="mr-2 h-4 w-4" />
                  )}
                  Test Connection
                </Button>
                
                <a 
                  href={`https://${currentIntegration.provider.toLowerCase().replace(/\s/g, '')}.com/docs`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    API Docs
                  </Button>
                </a>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="default" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={submitEditIntegration}
                disabled={updateIntegrationMutation.isPending}
              >
                {updateIntegrationMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default IntegrationManager;
