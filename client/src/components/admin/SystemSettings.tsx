import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { 
  ActivitySquare,
  AlertTriangle, 
  ChevronDown, 
  Clock,
  Cpu,
  Database,
  Globe, 
  HardDrive,
  Link2,
  Lock, 
  Mail, 
  MemoryStick,
  Play,
  RefreshCw,
  Save, 
  Server, 
  Settings as SettingsIcon, 
  ShieldAlert, 
  Timer,
  User, 
  Users,
  Loader2,
  XCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const SettingsSection = ({ title, description, children }: SettingsSectionProps) => (
  <div className="space-y-4 py-4">
    <div className="space-y-2">
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Separator />
    <div className="space-y-6">{children}</div>
  </div>
);

interface FormRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

const FormRow = ({ label, description, children }: FormRowProps) => (
  <div className="flex flex-col md:flex-row md:items-start space-y-2 md:space-y-0 md:space-x-4">
    <div className="md:w-1/3">
      <Label className="text-sm font-medium">{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
    <div className="md:w-2/3">{children}</div>
  </div>
);

interface SystemConfig {
  general: {
    platformName: string;
    supportEmail: string;
    logoUrl: string;
    favicon: string;
    defaultLanguage: string;
    dateFormat: string;
    timeFormat: string;
    timezone: string;
  };
  security: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
    mfaEnabled: boolean;
    sessionTimeout: number;
    ipWhitelist: string[];
    allowPublicSurveys: boolean;
    enableAPIAccess: boolean;
    csrfProtection: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    surveyCompletionAlerts: boolean;
    weeklyReports: boolean;
    systemAlerts: boolean;
  };
  storage: {
    dataRetentionPeriod: number;
    autoBackup: boolean;
    backupFrequency: string;
    storageProvider: string;
  };
  userManagement: {
    allowSelfRegistration: boolean;
    requireEmailVerification: boolean;
    defaultUserRole: string;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    primaryColor: string;
    customCss: string;
    allowCustomBranding: boolean;
  };
  systemMetrics?: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    activeConnections: number;
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
    lastUpdated: string;
  };
}

const defaultConfig: SystemConfig = {
  general: {
    platformName: "PersonalysisPro",
    supportEmail: "support@personalysispro.com",
    logoUrl: "/assets/logo.svg",
    favicon: "/assets/favicon.ico",
    defaultLanguage: "en",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    timezone: "UTC",
  },
  security: {
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },
    mfaEnabled: true,
    sessionTimeout: 30,
    ipWhitelist: [],
    allowPublicSurveys: true,
    enableAPIAccess: true,
    csrfProtection: true,
  },
  notifications: {
    emailNotifications: true,
    surveyCompletionAlerts: true,
    weeklyReports: true,
    systemAlerts: true,
  },
  storage: {
    dataRetentionPeriod: 365,
    autoBackup: true,
    backupFrequency: "daily",
    storageProvider: "cloud",
  },
  userManagement: {
    allowSelfRegistration: false,
    requireEmailVerification: true,
    defaultUserRole: "client",
  },
  appearance: {
    theme: "system",
    primaryColor: "#4F46E5",
    customCss: "",
    allowCustomBranding: true,
  },
  systemMetrics: {
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    activeConnections: 0,
    requestsPerMinute: 0,
    averageResponseTime: 0,
    errorRate: 0,
    lastUpdated: new Date().toISOString()
  }
};

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch system settings on component mount
  useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        const response = await api.get('/api/system/settings');
        if (response.ok) {
          const data = await response.json();
          setConfig(prev => ({
            ...prev,
            ...data,
          }));
        } else {
          toast({
            title: "Error fetching settings",
            description: "Could not load system settings. Please try again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching system settings:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to the server. Please check your connection.",
          variant: "destructive"
        });
      }
    };
    
    fetchSystemSettings();
  }, []);
  
  // Connect to the WebSocket server for real-time metrics updates
  useEffect(() => {
    // Only set up WebSocket when the system-metrics tab is active
    if (activeTab !== 'system-metrics') return;
    
    setRefreshing(true);
    
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log('Connecting to WebSocket server at', wsUrl);
    
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connected');
      // Send initial connection message
      socket.send(JSON.stringify({ type: 'connection' }));
      setRefreshing(false);
    };
    
    socket.onmessage = (event) => {
      console.log('Received WebSocket message:', event.data);
      try {
        const data = JSON.parse(event.data);
        
        // Handle system metrics updates
        if (data.type === 'systemUpdate' && data.updateType === 'metrics') {
          setConfig(prev => ({
            ...prev,
            systemMetrics: {
              cpuUsage: data.cpu.usage,
              memoryUsage: data.memory.usage,
              diskUsage: data.diskUsage || 0, // Default if not provided
              activeConnections: data.activeConnections.total,
              requestsPerMinute: prev.systemMetrics?.requestsPerMinute || 0,
              averageResponseTime: prev.systemMetrics?.averageResponseTime || 0,
              errorRate: prev.systemMetrics?.errorRate || 0,
              lastUpdated: data.timestamp
            }
          }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setRefreshing(false);
      
      // Fallback to REST API if WebSocket fails
      fetchSystemMetricsFromApi();
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    // Fallback method to fetch metrics from the REST API
    const fetchSystemMetricsFromApi = async () => {
      try {
        const response = await fetch('/api/system/performance');
        if (response.ok) {
          const metrics = await response.json();
          setConfig(prev => ({
            ...prev,
            systemMetrics: {
              cpuUsage: metrics.cpu?.usage || 0,
              memoryUsage: metrics.memory?.usage || 0,
              diskUsage: metrics.disk?.usage || 0,
              activeConnections: metrics.network?.activeConnections || 0,
              requestsPerMinute: metrics.api?.requestsPerMinute || 0,
              averageResponseTime: metrics.api?.averageResponseTime || 0,
              errorRate: metrics.api?.errorRate || 0,
              lastUpdated: new Date().toISOString()
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching system metrics from API:', error);
      }
    };
    
    // Also make an initial API call to get any metrics not provided by WebSocket
    fetchSystemMetricsFromApi();
    
    // Clean up WebSocket connection when component unmounts or tab changes
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [activeTab]);

  // Update config field
  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      };
      setIsDirty(true);
      return newConfig;
    });
  };

  // Update nested config field
  const updateNestedConfig = (
    section: keyof SystemConfig,
    nestedSection: string,
    field: string,
    value: any
  ) => {
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        [section]: {
          ...prev[section],
          [nestedSection]: {
            ...prev[section][nestedSection as keyof typeof prev[typeof section]],
            [field]: value,
          },
        },
      };
      setIsDirty(true);
      return newConfig;
    });
  };

  // Save configuration
  const handleSaveConfig = async () => {
    setIsLoading(true);
    
    try {
      // Create a copy of the config without the system metrics
      const configToSave = { ...config };
      delete configToSave.systemMetrics;
      
      const response = await api.post('/api/system/settings', configToSave);
      
      if (response.ok) {
        setIsDirty(false);
        toast({
          title: "Settings Saved",
          description: "Your system settings have been updated successfully",
        });
      } else {
        const errorData = await response.json().catch(() => null);
        toast({
          title: "Error Saving Settings",
          description: errorData?.message || "An error occurred while saving settings. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving system settings:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the server. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle className="text-xl font-bold">System Settings</CardTitle>
              <CardDescription>
                Configure platform settings and preferences
              </CardDescription>
            </div>
            <div>
              <Button 
                onClick={handleSaveConfig} 
                disabled={isLoading || !isDirty}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="flex h-10 space-x-1 overflow-x-auto bg-muted p-1 text-muted-foreground">
              <TabsTrigger 
                value="general" 
                className={cn(
                  "flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
                  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                )}
              >
                <SettingsIcon className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className={cn(
                  "flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
                  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                )}
              >
                <Lock className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className={cn(
                  "flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
                  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                )}
              >
                <Mail className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger 
                value="storage" 
                className={cn(
                  "flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
                  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                )}
              >
                <Server className="h-4 w-4 mr-2" />
                Storage
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className={cn(
                  "flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
                  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                )}
              >
                <Users className="h-4 w-4 mr-2" />
                User Management
              </TabsTrigger>
              <TabsTrigger 
                value="appearance" 
                className={cn(
                  "flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
                  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                )}
              >
                <Globe className="h-4 w-4 mr-2" />
                Appearance
              </TabsTrigger>
              <TabsTrigger 
                value="system-metrics" 
                className={cn(
                  "flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
                  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                )}
              >
                <ActivitySquare className="h-4 w-4 mr-2" />
                System Metrics
              </TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general">
              <SettingsSection
                title="Platform Information"
                description="Basic information about your PersonalysisPro instance"
              >
                <FormRow label="Platform Name">
                  <Input
                    value={config.general.platformName}
                    onChange={(e) => updateConfig('general', 'platformName', e.target.value)}
                  />
                </FormRow>
                <FormRow 
                  label="Support Email" 
                  description="Used for system notifications and user support requests"
                >
                  <Input
                    type="email"
                    value={config.general.supportEmail}
                    onChange={(e) => updateConfig('general', 'supportEmail', e.target.value)}
                  />
                </FormRow>
                <FormRow 
                  label="Logo URL" 
                  description="Path to your platform logo"
                >
                  <Input
                    value={config.general.logoUrl}
                    onChange={(e) => updateConfig('general', 'logoUrl', e.target.value)}
                  />
                </FormRow>
                <FormRow 
                  label="Favicon" 
                  description="Path to your browser tab icon"
                >
                  <Input
                    value={config.general.favicon}
                    onChange={(e) => updateConfig('general', 'favicon', e.target.value)}
                  />
                </FormRow>
              </SettingsSection>

              <SettingsSection
                title="Localization"
                description="Configure language and regional settings"
              >
                <FormRow label="Default Language">
                  <Select
                    value={config.general.defaultLanguage}
                    onValueChange={(value) => updateConfig('general', 'defaultLanguage', value)}
                  >
                    <SelectTrigger className="w-full md:w-3/4">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </FormRow>
                <FormRow label="Date Format">
                  <Select
                    value={config.general.dateFormat}
                    onValueChange={(value) => updateConfig('general', 'dateFormat', value)}
                  >
                    <SelectTrigger className="w-full md:w-3/4">
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="MMM DD, YYYY">MMM DD, YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </FormRow>
                <FormRow label="Time Format">
                  <Select
                    value={config.general.timeFormat}
                    onValueChange={(value) => updateConfig('general', 'timeFormat', value)}
                  >
                    <SelectTrigger className="w-full md:w-3/4">
                      <SelectValue placeholder="Select time format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </FormRow>
                <FormRow label="Timezone">
                  <Select
                    value={config.general.timezone}
                    onValueChange={(value) => updateConfig('general', 'timezone', value)}
                  >
                    <SelectTrigger className="w-full md:w-3/4">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Central European Time</SelectItem>
                      <SelectItem value="Asia/Tokyo">Japan (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormRow>
              </SettingsSection>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security">
              <SettingsSection
                title="Password Policy"
                description="Configure password requirements for platform users"
              >
                <FormRow 
                  label="Minimum Password Length" 
                  description="Minimum number of characters required"
                >
                  <div className="flex w-full md:w-3/4 space-x-2 items-center">
                    <Slider 
                      value={[config.security.passwordPolicy.minLength]}
                      onValueChange={(value) => updateNestedConfig('security', 'passwordPolicy', 'minLength', value[0])}
                      min={6}
                      max={16}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-8 text-center font-medium">
                      {config.security.passwordPolicy.minLength}
                    </span>
                  </div>
                </FormRow>
                <FormRow label="Password Requirements">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requireUppercase"
                        checked={config.security.passwordPolicy.requireUppercase}
                        onCheckedChange={(checked) => updateNestedConfig('security', 'passwordPolicy', 'requireUppercase', checked)}
                      />
                      <Label htmlFor="requireUppercase">Require uppercase letters</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requireLowercase"
                        checked={config.security.passwordPolicy.requireLowercase}
                        onCheckedChange={(checked) => updateNestedConfig('security', 'passwordPolicy', 'requireLowercase', checked)}
                      />
                      <Label htmlFor="requireLowercase">Require lowercase letters</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requireNumbers"
                        checked={config.security.passwordPolicy.requireNumbers}
                        onCheckedChange={(checked) => updateNestedConfig('security', 'passwordPolicy', 'requireNumbers', checked)}
                      />
                      <Label htmlFor="requireNumbers">Require numbers</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requireSpecialChars"
                        checked={config.security.passwordPolicy.requireSpecialChars}
                        onCheckedChange={(checked) => updateNestedConfig('security', 'passwordPolicy', 'requireSpecialChars', checked)}
                      />
                      <Label htmlFor="requireSpecialChars">Require special characters</Label>
                    </div>
                  </div>
                </FormRow>
              </SettingsSection>

              <SettingsSection
                title="Authentication & Access"
                description="Configure user authentication and access controls"
              >
                <FormRow 
                  label="Multi-Factor Authentication" 
                  description="Require MFA for admin and client accounts"
                >
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="mfaEnabled"
                      checked={config.security.mfaEnabled}
                      onCheckedChange={(checked) => updateConfig('security', 'mfaEnabled', checked)}
                    />
                    <Label htmlFor="mfaEnabled">Enable MFA</Label>
                  </div>
                </FormRow>
                <FormRow 
                  label="Session Timeout" 
                  description="Minutes until user sessions expire"
                >
                  <div className="flex w-full md:w-3/4 space-x-2 items-center">
                    <Slider 
                      value={[config.security.sessionTimeout]}
                      onValueChange={(value) => updateConfig('security', 'sessionTimeout', value[0])}
                      min={5}
                      max={120}
                      step={5}
                      className="flex-1"
                    />
                    <span className="w-12 text-center font-medium">
                      {config.security.sessionTimeout}
                    </span>
                  </div>
                </FormRow>
                <FormRow 
                  label="IP Whitelist" 
                  description="Comma-separated list of allowed IP addresses (leave empty to allow all)"
                >
                  <Input
                    value={config.security.ipWhitelist.join(', ')}
                    onChange={(e) => {
                      const ips = e.target.value.split(',').map(ip => ip.trim()).filter(Boolean);
                      updateConfig('security', 'ipWhitelist', ips);
                    }}
                    placeholder="192.168.1.1, 10.0.0.1"
                  />
                </FormRow>
              </SettingsSection>

              <SettingsSection
                title="Security Features"
                description="Configure additional security features"
              >
                <FormRow 
                  label="Public Survey Access" 
                  description="Allow non-authenticated users to access surveys via shareable links"
                >
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowPublicSurveys"
                      checked={config.security.allowPublicSurveys}
                      onCheckedChange={(checked) => updateConfig('security', 'allowPublicSurveys', checked)}
                    />
                    <Label htmlFor="allowPublicSurveys">Enable public surveys</Label>
                  </div>
                </FormRow>
                <FormRow 
                  label="API Access" 
                  description="Allow external systems to access the platform via API"
                >
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableAPIAccess"
                      checked={config.security.enableAPIAccess}
                      onCheckedChange={(checked) => updateConfig('security', 'enableAPIAccess', checked)}
                    />
                    <Label htmlFor="enableAPIAccess">Enable API access</Label>
                  </div>
                </FormRow>
                <FormRow 
                  label="CSRF Protection" 
                  description="Prevent cross-site request forgery attacks"
                >
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="csrfProtection"
                      checked={config.security.csrfProtection}
                      onCheckedChange={(checked) => updateConfig('security', 'csrfProtection', checked)}
                    />
                    <Label htmlFor="csrfProtection">Enable CSRF protection</Label>
                  </div>
                </FormRow>
              </SettingsSection>
            </TabsContent>

            {/* Notifications Settings */}
            <TabsContent value="notifications">
              <SettingsSection
                title="Email Notifications"
                description="Configure when the system should send email notifications"
              >
                <FormRow 
                  label="Email Notifications" 
                  description="Enable sending email notifications to users"
                >
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="emailNotifications"
                      checked={config.notifications.emailNotifications}
                      onCheckedChange={(checked) => updateConfig('notifications', 'emailNotifications', checked)}
                    />
                    <Label htmlFor="emailNotifications">Enable email notifications</Label>
                  </div>
                </FormRow>
                <FormRow 
                  label="Survey Completion Alerts" 
                  description="Notify relevant users when a survey is completed"
                >
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="surveyCompletionAlerts"
                      checked={config.notifications.surveyCompletionAlerts}
                      onCheckedChange={(checked) => updateConfig('notifications', 'surveyCompletionAlerts', checked)}
                      disabled={!config.notifications.emailNotifications}
                    />
                    <Label htmlFor="surveyCompletionAlerts">Enable survey completion alerts</Label>
                  </div>
                </FormRow>
                <FormRow 
                  label="Weekly Reports" 
                  description="Send weekly activity and analytics reports to administrators"
                >
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="weeklyReports"
                      checked={config.notifications.weeklyReports}
                      onCheckedChange={(checked) => updateConfig('notifications', 'weeklyReports', checked)}
                      disabled={!config.notifications.emailNotifications}
                    />
                    <Label htmlFor="weeklyReports">Enable weekly reports</Label>
                  </div>
                </FormRow>
                <FormRow 
                  label="System Alerts" 
                  description="Notify administrators about system events and potential issues"
                >
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="systemAlerts"
                      checked={config.notifications.systemAlerts}
                      onCheckedChange={(checked) => updateConfig('notifications', 'systemAlerts', checked)}
                      disabled={!config.notifications.emailNotifications}
                    />
                    <Label htmlFor="systemAlerts">Enable system alerts</Label>
                  </div>
                </FormRow>
              </SettingsSection>
            </TabsContent>

            {/* Storage Settings */}
            <TabsContent value="storage">
              <SettingsSection
                title="Data Retention"
                description="Configure how long data is stored in the system"
              >
                <FormRow 
                  label="Data Retention Period" 
                  description="Number of days to keep survey data before automatic archiving (0 = indefinite)"
                >
                  <div className="flex w-full md:w-3/4 items-center space-x-4">
                    <Input
                      type="number"
                      min="0"
                      max="3650"
                      value={config.storage.dataRetentionPeriod}
                      onChange={(e) => updateConfig('storage', 'dataRetentionPeriod', parseInt(e.target.value) || 0)}
                      className="w-24"
                    />
                    <Label>days</Label>
                  </div>
                </FormRow>
              </SettingsSection>

              <SettingsSection
                title="Backup Configuration"
                description="Configure automatic system backups"
              >
                <FormRow 
                  label="Automatic Backups" 
                  description="Enable scheduled system backups"
                >
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoBackup"
                      checked={config.storage.autoBackup}
                      onCheckedChange={(checked) => updateConfig('storage', 'autoBackup', checked)}
                    />
                    <Label htmlFor="autoBackup">Enable automatic backups</Label>
                  </div>
                </FormRow>
                <FormRow 
                  label="Backup Frequency" 
                  description="How often the system performs backups"
                >
                  <Select
                    value={config.storage.backupFrequency}
                    onValueChange={(value) => updateConfig('storage', 'backupFrequency', value)}
                    disabled={!config.storage.autoBackup}
                  >
                    <SelectTrigger className="w-full md:w-3/4">
                      <SelectValue placeholder="Select backup frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Every Hour</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </FormRow>
                <FormRow 
                  label="Storage Provider" 
                  description="Where backup data is stored"
                >
                  <Select
                    value={config.storage.storageProvider}
                    onValueChange={(value) => updateConfig('storage', 'storageProvider', value)}
                    disabled={!config.storage.autoBackup}
                  >
                    <SelectTrigger className="w-full md:w-3/4">
                      <SelectValue placeholder="Select storage provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local Storage</SelectItem>
                      <SelectItem value="cloud">Cloud Storage</SelectItem>
                      <SelectItem value="s3">Amazon S3</SelectItem>
                      <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </FormRow>
              </SettingsSection>
            </TabsContent>

            {/* User Management Settings */}
            <TabsContent value="users">
              <SettingsSection
                title="User Registration"
                description="Configure how new users can join the platform"
              >
                <FormRow 
                  label="Self-Registration" 
                  description="Allow users to create their own accounts"
                >
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowSelfRegistration"
                      checked={config.userManagement.allowSelfRegistration}
                      onCheckedChange={(checked) => updateConfig('userManagement', 'allowSelfRegistration', checked)}
                    />
                    <Label htmlFor="allowSelfRegistration">Allow self-registration</Label>
                  </div>
                </FormRow>
                <FormRow 
                  label="Email Verification" 
                  description="Require users to verify their email address"
                >
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requireEmailVerification"
                      checked={config.userManagement.requireEmailVerification}
                      onCheckedChange={(checked) => updateConfig('userManagement', 'requireEmailVerification', checked)}
                    />
                    <Label htmlFor="requireEmailVerification">Require email verification</Label>
                  </div>
                </FormRow>
                <FormRow 
                  label="Default User Role" 
                  description="Role assigned to newly registered users"
                >
                  <Select
                    value={config.userManagement.defaultUserRole}
                    onValueChange={(value) => updateConfig('userManagement', 'defaultUserRole', value)}
                  >
                    <SelectTrigger className="w-full md:w-3/4">
                      <SelectValue placeholder="Select default role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="contributor">Contributor</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </FormRow>
              </SettingsSection>
            </TabsContent>

            {/* Appearance Settings */}
            <TabsContent value="appearance">
              <SettingsSection
                title="Theme Configuration"
                description="Configure the visual appearance of the platform"
              >
                <FormRow 
                  label="Theme Mode" 
                  description="Set the default color scheme"
                >
                  <Select
                    value={config.appearance.theme}
                    onValueChange={(value: 'light' | 'dark' | 'system') => updateConfig('appearance', 'theme', value)}
                  >
                    <SelectTrigger className="w-full md:w-3/4">
                      <SelectValue placeholder="Select theme mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System (Auto)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormRow>
                <FormRow 
                  label="Primary Color" 
                  description="Main brand color used throughout the platform"
                >
                  <div className="flex w-full md:w-3/4 items-center space-x-4">
                    <Input 
                      type="color"
                      value={config.appearance.primaryColor}
                      onChange={(e) => updateConfig('appearance', 'primaryColor', e.target.value)}
                      className="w-24 h-10 p-1"
                    />
                    <Input 
                      type="text"
                      value={config.appearance.primaryColor}
                      onChange={(e) => updateConfig('appearance', 'primaryColor', e.target.value)}
                      className="w-32"
                      placeholder="#000000"
                    />
                  </div>
                </FormRow>
                <FormRow 
                  label="Custom CSS" 
                  description="Additional CSS styles for customizing the platform appearance"
                >
                  <Input
                    as="textarea"
                    value={config.appearance.customCss}
                    onChange={(e) => updateConfig('appearance', 'customCss', e.target.value)}
                    className="h-32 font-mono text-sm"
                    placeholder="/* Add your custom CSS here */"
                  />
                </FormRow>
                <FormRow 
                  label="Custom Branding" 
                  description="Allow clients to use their own branding on surveys"
                >
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowCustomBranding"
                      checked={config.appearance.allowCustomBranding}
                      onCheckedChange={(checked) => updateConfig('appearance', 'allowCustomBranding', checked)}
                    />
                    <Label htmlFor="allowCustomBranding">Allow custom branding</Label>
                  </div>
                </FormRow>
              </SettingsSection>
            </TabsContent>
            
            <TabsContent value="system-metrics">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold">System Performance Metrics</h2>
                  <p className="text-sm text-muted-foreground">
                    Real-time monitoring of system resources and performance
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveTab('system-metrics')} 
                  disabled={refreshing}
                  className="flex items-center gap-1"
                >
                  {refreshing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      <span>Refresh</span>
                    </>
                  )}
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground mb-6 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Last updated: {new Date(config.systemMetrics?.lastUpdated || '').toLocaleString()}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Server Resources */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Server Resources</CardTitle>
                    <CardDescription>System resource utilization</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center">
                          <Cpu className="h-4 w-4 mr-2 text-blue-500" />
                          <span>CPU Usage</span>
                        </div>
                        <span className="font-medium">{config.systemMetrics?.cpuUsage.toFixed(1)}%</span>
                      </div>
                      <Progress value={config.systemMetrics?.cpuUsage} className="h-2" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center">
                          <MemoryStick className="h-4 w-4 mr-2 text-purple-500" />
                          <span>Memory Usage</span>
                        </div>
                        <span className="font-medium">{config.systemMetrics?.memoryUsage.toFixed(1)}%</span>
                      </div>
                      <Progress value={config.systemMetrics?.memoryUsage} className="h-2" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center">
                          <HardDrive className="h-4 w-4 mr-2 text-amber-500" />
                          <span>Disk Usage</span>
                        </div>
                        <span className="font-medium">{config.systemMetrics?.diskUsage.toFixed(1)}%</span>
                      </div>
                      <Progress value={config.systemMetrics?.diskUsage} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
                
                {/* API Performance */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">API Performance</CardTitle>
                    <CardDescription>API response metrics and usage</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Link2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Active Connections</span>
                      </div>
                      <div className="font-medium">{config.systemMetrics?.activeConnections}</div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ActivitySquare className="h-4 w-4 text-indigo-500" />
                        <span className="text-sm">Requests per Minute</span>
                      </div>
                      <div className="font-medium">{config.systemMetrics?.requestsPerMinute}</div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Timer className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">Avg Response Time</span>
                      </div>
                      <div className="font-medium">{config.systemMetrics?.averageResponseTime} ms</div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm">Error Rate</span>
                      </div>
                      <div className="font-medium">{config.systemMetrics?.errorRate.toFixed(2)}%</div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* System Status */}
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">System Status History</CardTitle>
                    <CardDescription>Performance metrics over the last 24 hours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] w-full flex items-center justify-center text-muted-foreground text-sm border rounded-md p-6">
                      <div className="text-center">
                        <Database className="h-8 w-8 mb-2 mx-auto text-muted-foreground/50" />
                        <p>Historical metrics visualization will appear here</p>
                        <p className="text-xs mt-1">Collecting data for future performance analysis</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between bg-muted/50 border-t">
          <div className="flex items-center">
            {isDirty && (
              <div className="flex items-center text-yellow-600">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <p className="text-sm">You have unsaved changes</p>
              </div>
            )}
          </div>
          <Button 
            onClick={handleSaveConfig} 
            disabled={isLoading || !isDirty}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SystemSettings;