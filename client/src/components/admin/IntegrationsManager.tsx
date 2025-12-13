import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { 
  AlertCircle, 
  Check, 
  Loader2, 
  MoreVertical, 
  Plus, 
  RefreshCcw, 
  Settings,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types for integrations
interface Integration {
  id: string;
  name: string;
  type: string;
  category: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  apiKey?: string;
  config?: Record<string, any>;
}

// Integration categories with their descriptions
const INTEGRATION_CATEGORIES = {
  crm: {
    title: "CRM Systems",
    description: "Connect with your customer relationship management platforms"
  },
  analytics: {
    title: "Analytics Tools",
    description: "Integrate with analytics and data processing platforms"
  },
  marketing: {
    title: "Marketing Platforms",
    description: "Connect with email and marketing automation services"
  },
  communication: {
    title: "Communication Tools",
    description: "Integrate messaging and notification services"
  }
};

// Available integrations by category
const AVAILABLE_INTEGRATIONS = {
  crm: [
    { id: "salesforce", name: "Salesforce", logo: "salesforce.svg" },
    { id: "hubspot", name: "HubSpot", logo: "hubspot.svg" },
    { id: "zoho", name: "Zoho CRM", logo: "zoho.svg" }
  ],
  analytics: [
    { id: "google_analytics", name: "Google Analytics", logo: "google_analytics.svg" },
    { id: "mixpanel", name: "Mixpanel", logo: "mixpanel.svg" },
    { id: "amplitude", name: "Amplitude", logo: "amplitude.svg" }
  ],
  marketing: [
    { id: "mailchimp", name: "Mailchimp", logo: "mailchimp.svg" },
    { id: "sendgrid", name: "SendGrid", logo: "sendgrid.svg" },
    { id: "klaviyo", name: "Klaviyo", logo: "klaviyo.svg" }
  ],
  communication: [
    { id: "slack", name: "Slack", logo: "slack.svg" },
    { id: "twilio", name: "Twilio", logo: "twilio.svg" },
    { id: "discord", name: "Discord", logo: "discord.svg" }
  ]
};

// Sample initial integrations
const initialIntegrations: Integration[] = [
  {
    id: "slack-1",
    name: "Slack",
    type: "slack",
    category: "communication",
    status: "connected",
    lastSync: "2025-04-23T15:30:00Z",
    config: {
      webhook: "https://hooks.slack.com/services/XX/YY/ZZ",
      channel: "#surveys-notifications"
    }
  },
  {
    id: "google-analytics-1",
    name: "Google Analytics",
    type: "google_analytics",
    category: "analytics",
    status: "connected",
    lastSync: "2025-04-23T12:45:00Z",
    config: {
      trackingId: "UA-12345678-1",
      dataStream: "Web App"
    }
  }
];

const IntegrationsManager = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedIntegrationType, setSelectedIntegrationType] = useState<string>("");
  const [integrationName, setIntegrationName] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);

  // Filter integrations based on active tab
  const filteredIntegrations = activeTab === "all" 
    ? integrations 
    : integrations.filter(integration => integration.category === activeTab);

  // Handle adding a new integration
  const handleAddIntegration = () => {
    if (!selectedCategory || !selectedIntegrationType || !integrationName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);

    // Simulate API connection
    setTimeout(() => {
      const newIntegration: Integration = {
        id: `${selectedIntegrationType}-${Date.now()}`,
        name: integrationName,
        type: selectedIntegrationType,
        category: selectedCategory,
        status: "connected",
        lastSync: new Date().toISOString(),
        apiKey: apiKey,
        config: {} // Default empty config
      };

      setIntegrations([...integrations, newIntegration]);
      setShowAddIntegration(false);
      setIsConnecting(false);
      setSelectedCategory("");
      setSelectedIntegrationType("");
      setIntegrationName("");
      setApiKey("");

      toast({
        title: "Integration Added",
        description: `${integrationName} has been successfully connected`,
      });
    }, 1500);
  };

  // Handle removing an integration
  const handleRemoveIntegration = (id: string) => {
    setIntegrations(integrations.filter(integration => integration.id !== id));
    toast({
      title: "Integration Removed",
      description: "The integration has been successfully removed"
    });
  };

  // Handle reconnecting an integration
  const handleReconnectIntegration = (id: string) => {
    setIntegrations(integrations.map(integration => 
      integration.id === id 
        ? { ...integration, status: "connected", lastSync: new Date().toISOString() } 
        : integration
    ));
    
    toast({
      title: "Integration Reconnected",
      description: "The integration has been successfully reconnected"
    });
  };

  // Handle opening config dialog
  const handleOpenConfig = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowConfigDialog(true);
  };

  // Save integration configuration
  const handleSaveConfig = () => {
    if (!selectedIntegration) return;
    
    setIntegrations(integrations.map(integration => 
      integration.id === selectedIntegration.id 
        ? { ...selectedIntegration, lastSync: new Date().toISOString() } 
        : integration
    ));
    
    setShowConfigDialog(false);
    toast({
      title: "Configuration Saved",
      description: "Integration settings have been updated"
    });
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <Check className="h-3 w-3 mr-1" /> Connected
          </Badge>
        );
      case "disconnected":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">
            Disconnected
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" /> Error
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle className="text-xl font-bold">Integrations Manager</CardTitle>
              <CardDescription>
                Configure third-party integrations and APIs
              </CardDescription>
            </div>
            <div>
              <Button onClick={() => setShowAddIntegration(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
              <TabsTrigger 
                value="all" 
                className="rounded-md px-3 py-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
              >
                All Integrations
              </TabsTrigger>
              <TabsTrigger 
                value="crm" 
                className="rounded-md px-3 py-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
              >
                CRM
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="rounded-md px-3 py-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
              >
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="marketing" 
                className="rounded-md px-3 py-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
              >
                Marketing
              </TabsTrigger>
              <TabsTrigger 
                value="communication" 
                className="rounded-md px-3 py-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
              >
                Communication
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="space-y-4">
              {filteredIntegrations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="rounded-full bg-primary/10 p-3 mb-4">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No {activeTab !== 'all' ? INTEGRATION_CATEGORIES[activeTab as keyof typeof INTEGRATION_CATEGORIES]?.title : 'integrations'} configured</h3>
                  <p className="text-muted-foreground max-w-md">
                    Add an integration to connect PersonalysisPro with your existing tools and services
                  </p>
                  <Button className="mt-4" onClick={() => setShowAddIntegration(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Integration
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredIntegrations.map((integration) => (
                    <Card key={integration.id} className="overflow-hidden border-muted bg-card">
                      <CardContent className="p-0">
                        <div className="flex items-center justify-between p-6">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                              <span className="text-lg font-semibold text-primary">{integration.name.charAt(0)}</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">{integration.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {INTEGRATION_CATEGORIES[integration.category as keyof typeof INTEGRATION_CATEGORIES]?.title} • 
                                {integration.lastSync && ` Last synced ${new Date(integration.lastSync).toLocaleString()}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {renderStatusBadge(integration.status)}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenConfig(integration)}>
                                  <Settings className="h-4 w-4 mr-2" />
                                  Configure
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReconnectIntegration(integration.id)}>
                                  <RefreshCcw className="h-4 w-4 mr-2" />
                                  Reconnect
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleRemoveIntegration(integration.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Integration Dialog */}
      <Dialog open={showAddIntegration} onOpenChange={setShowAddIntegration}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Integration</DialogTitle>
            <DialogDescription>
              Connect PersonalysisPro with your existing tools and services.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="category">Integration Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INTEGRATION_CATEGORIES).map(([key, { title }]) => (
                    <SelectItem key={key} value={key}>{title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCategory && (
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="type">Integration Type</Label>
                <Select value={selectedIntegrationType} onValueChange={setSelectedIntegrationType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select integration type" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_INTEGRATIONS[selectedCategory as keyof typeof AVAILABLE_INTEGRATIONS]?.map(integration => (
                      <SelectItem key={integration.id} value={integration.id}>{integration.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="name">Integration Name</Label>
              <Input
                id="name"
                value={integrationName}
                onChange={(e) => setIntegrationName(e.target.value)}
                placeholder="My Slack Integration"
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="apiKey">API Key or Token</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddIntegration(false)}
              disabled={isConnecting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddIntegration}
              disabled={isConnecting || !selectedCategory || !selectedIntegrationType || !integrationName}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configure {selectedIntegration?.name}</DialogTitle>
            <DialogDescription>
              Adjust settings for this integration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedIntegration?.type === "slack" && (
              <>
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="webhook">Webhook URL</Label>
                  <Input
                    id="webhook"
                    value={selectedIntegration?.config?.webhook || ""}
                    onChange={(e) => setSelectedIntegration(prev => prev ? {
                      ...prev,
                      config: {
                        ...prev.config,
                        webhook: e.target.value
                      }
                    } : null)}
                    placeholder="https://hooks.slack.com/services/XXX/YYY/ZZZ"
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="channel">Channel</Label>
                  <Input
                    id="channel"
                    value={selectedIntegration?.config?.channel || ""}
                    onChange={(e) => setSelectedIntegration(prev => prev ? {
                      ...prev,
                      config: {
                        ...prev.config,
                        channel: e.target.value
                      }
                    } : null)}
                    placeholder="#channel-name"
                  />
                </div>
              </>
            )}

            {selectedIntegration?.type === "google_analytics" && (
              <>
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="trackingId">Tracking ID</Label>
                  <Input
                    id="trackingId"
                    value={selectedIntegration?.config?.trackingId || ""}
                    onChange={(e) => setSelectedIntegration(prev => prev ? {
                      ...prev,
                      config: {
                        ...prev.config,
                        trackingId: e.target.value
                      }
                    } : null)}
                    placeholder="UA-XXXXXXXXX-X"
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="dataStream">Data Stream</Label>
                  <Input
                    id="dataStream"
                    value={selectedIntegration?.config?.dataStream || ""}
                    onChange={(e) => setSelectedIntegration(prev => prev ? {
                      ...prev,
                      config: {
                        ...prev.config,
                        dataStream: e.target.value
                      }
                    } : null)}
                    placeholder="Web App"
                  />
                </div>
              </>
            )}

            <div className="flex items-center space-x-2 my-2">
              <Switch
                id="notifications"
                checked={selectedIntegration?.config?.notifications || false}
                onCheckedChange={(checked) => setSelectedIntegration(prev => prev ? {
                  ...prev,
                  config: {
                    ...prev.config,
                    notifications: checked
                  }
                } : null)}
              />
              <Label htmlFor="notifications">Enable notifications</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegrationsManager;