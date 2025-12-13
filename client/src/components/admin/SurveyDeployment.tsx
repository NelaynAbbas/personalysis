import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { api } from "@/lib/api";
import { Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Component interface
interface SurveyDeploymentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  survey: any; // The survey template to deploy
}

const SurveyDeployment: React.FC<SurveyDeploymentProps> = ({ 
  open, 
  onOpenChange, 
  survey 
}) => {
  // State for the form
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [customBranding, setCustomBranding] = useState<boolean>(false);
  const [maxResponses, setMaxResponses] = useState<string>("");
  const [expirationDate, setExpirationDate] = useState<string>("");
  
  // Query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Reset form when dialog opens
  useEffect(() => {
    if (open && survey) {
      setSelectedClientId("");
      setCustomBranding(false);
      setMaxResponses("");
      setExpirationDate("");
    }
  }, [open, survey]);
  
  // Fetch clients
  const { data: clientsData, isLoading: clientsLoading, error: clientsError } = useQuery({
    queryKey: ['/api/clients'],
    enabled: open && !!survey, // Only fetch when dialog is open and survey exists
    refetchOnMount: true
  });
  
  // Filter clients with licenses
  const clients = clientsData?.data ? clientsData.data.filter(client => client.licenseId !== null) : [];
  
  // Fetch client license if a client is selected
  const { data: licenseData, isLoading: licenseLoading } = useQuery({
    queryKey: ['/api/licenses', selectedClientId ? clients.find(c => c.id.toString() === selectedClientId)?.licenseId : null],
    enabled: !!selectedClientId && open,
  });
  
  // Check if the client already has deployments (important for Project licenses)
  const { data: clientDeploymentsData, isLoading: deploymentsLoading } = useQuery({
    queryKey: ['/api/clients', selectedClientId, 'deployments'],
    enabled: !!selectedClientId && open,
  });
  
  const clientDeployments = clientDeploymentsData?.data?.deployments || [];
  
  // Create deployment mutation
  const deployMutation = useMutation({
    mutationFn: async (deploymentData: any) => {
      // Use api.post instead of apiRequest directly to correctly set method
      return api.post('/api/deployments', deploymentData);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/deployments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/surveys'] });
      
      // Show success message
      toast({
        title: "Success",
        description: "Survey deployed successfully",
      });
      
      // Close the dialog
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Deployment error:", error);
      toast({
        title: "Deployment Failed",
        description: error.message || "Failed to deploy survey",
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClientId) {
      toast({
        title: "Validation Error",
        description: "Please select a client",
        variant: "destructive",
      });
      return;
    }
    
    if (!survey) {
      toast({
        title: "Error",
        description: "No survey selected for deployment",
        variant: "destructive",
      });
      return;
    }

    // Create deployment data
    const deploymentData = {
      surveyId: survey.id,
      clientId: parseInt(selectedClientId),
      status: "active",
      customBranding: customBranding,
      maxResponses: maxResponses ? parseInt(maxResponses) : null,
      expirationDate: expirationDate ? new Date(expirationDate).toISOString() : null,
    };
    
    deployMutation.mutate(deploymentData);
  };
  
  // UI for loading state
  if (clientsLoading || licenseLoading || deploymentsLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deploy Survey</DialogTitle>
            <DialogDescription>
              Loading client information...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  // Get license details if a client is selected
  const selectedClient = clients.find(c => c.id.toString() === selectedClientId);
  const license = licenseData?.data || licenseData;
  const licenseType = license?.type;
  const isProjectLicense = licenseType === "project";
  
  // Check for deployment restrictions
  const hasExistingDeployments = clientDeployments.length > 0;
  const deploymentLimit = isProjectLicense ? 1 : null;
  const limitReached = isProjectLicense && hasExistingDeployments;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deploy Survey{survey ? `: ${survey.title}` : ''}</DialogTitle>
          <DialogDescription>
            Deploy this survey template to a client account
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {clientsError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load clients. Please try again.
                </AlertDescription>
              </Alert>
            )}
            
            {clients.length === 0 && !clientsLoading && !clientsError && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Eligible Clients</AlertTitle>
                <AlertDescription>
                  There are no clients with active licenses. Please assign licenses to clients first.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select 
                value={selectedClientId} 
                onValueChange={setSelectedClientId}
                disabled={clients.length === 0 || deployMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Available Clients</SelectLabel>
                    {clients.map(client => (
                      <SelectItem 
                        key={client.id} 
                        value={client.id.toString()}
                      >
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            {/* Show license information if a client is selected */}
            {selectedClientId && license && (
              <div className="space-y-2">
                <Label>License Information</Label>
                <div className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <div>
                    <Badge variant={isProjectLicense ? "outline" : "default"}>
                      {license.type} License
                    </Badge>
                    {isProjectLicense && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        This client has a Project License, which allows for deployment of only 1 survey.
                      </p>
                    )}
                    
                    {/* Warning about existing deployments */}
                    {hasExistingDeployments && isProjectLicense && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Deployment Limit Reached</AlertTitle>
                        <AlertDescription>
                          This client already has a deployed survey. With a Project License, only one survey can be deployed.
                          Please upgrade their license or remove the existing deployment.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {/* Show existing deployments */}
                    {hasExistingDeployments && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Existing Deployments:</p>
                        <ul className="ml-4 mt-1 list-disc text-sm text-muted-foreground">
                          {clientDeployments.map(deployment => (
                            <li key={deployment.id}>
                              {deployment.survey?.name || `Survey #${deployment.surveyId}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Only show remaining form fields if a client with a valid license is selected */}
            {selectedClientId && license && !limitReached && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="custom-branding" 
                      checked={customBranding} 
                      onCheckedChange={(checked) => setCustomBranding(!!checked)}
                      disabled={deployMutation.isPending}
                    />
                    <Label htmlFor="custom-branding">Enable Custom Branding</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Allows the client to customize the appearance of the survey
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-responses">Maximum Responses (Optional)</Label>
                  <Input 
                    id="max-responses" 
                    type="number" 
                    min="1"
                    value={maxResponses} 
                    onChange={(e) => setMaxResponses(e.target.value)}
                    placeholder="Unlimited"
                    disabled={deployMutation.isPending}
                  />
                  <p className="text-sm text-muted-foreground">
                    Limit the number of responses that can be collected
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expiration-date">Expiration Date (Optional)</Label>
                  <Input 
                    id="expiration-date" 
                    type="date" 
                    value={expirationDate} 
                    onChange={(e) => setExpirationDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    disabled={deployMutation.isPending}
                  />
                  <p className="text-sm text-muted-foreground">
                    Date when the survey will no longer be accessible
                  </p>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={deployMutation.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={
                !survey ||
                !selectedClientId || 
                limitReached || 
                deployMutation.isPending || 
                !license
              }
            >
              {deployMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Deploy Survey
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SurveyDeployment;