import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "@/hooks/useRealtime";
import DashboardView from "@/components/dashboard/DashboardView";
import BusinessIntelligence from "@/components/dashboard/BusinessIntelligenceFix";
import SurveyList from "@/components/SurveyList";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  LineChart,
  Users,
  Share2,
  BarChart3,
  Settings,
  ArrowLeft,
  MessageSquare,
  BarChart,
  FileText,
  ChevronRight,
  CheckCircle,
  Filter
} from "lucide-react";
import { apiRequest } from "@/lib/api";

// Define the Survey type
interface Survey {
  id: number;
  title: string;
  type?: string;
  surveyType?: string;
  status?: string;
  isActive?: boolean;
  createdAt: string;
  lastModified?: string;
  updatedAt?: string;
  respondents?: number;
  responseCount?: number;
  completionRate?: number;
  averageTime?: number;
  client?: string;
  clientId?: number;
}

// Define the DashboardStats type
interface DashboardStats {
  surveyId?: number;
  title?: string;
  responseCount: number;
  completionRate: number;
  averageSatisfactionScore: number;
  monthOverMonthGrowth: {
    respondents: number;
    completion: number;
    satisfaction: number;
    integrations: number;
  };
  topTraits: {
    name: string;
    score: number;
    category: string;
  }[];
  demographics: {
    genderDistribution: { label: string; value: number }[];
    ageDistribution: { range: string; percentage: number }[];
    locationDistribution: { location: string; count: number }[];
  };
  marketSegments: { segment: string; percentage: number }[];
  responsesByPeriod: { period: string; count: number }[];
  
  // Required properties for compatibility
  surveyCount: number;
  businessContext: {
    industries: any[];
    companySizes: any[];
    departments: any[];
    roles: any[];
    decisionStyles: any[];
  };
  
  // Backward compatibility
  totalResponses?: number;
  completedResponses?: number;
  averageTraits?: {
    name: string;
    average: number;
  }[];
  growthRate?: number;
  lastMonthResponses?: number;
  thisMonthResponses?: number;
  [key: string]: any;
}

// Define company type to display company information
interface Company {
  id: number;
  name: string;
  subscriptionTier: string;
  licenseStatus: string;
  licenseStartDate: Date;
  licenseEndDate: Date | null;
  maxUsers: number;
  maxSurveys: number;
  maxResponses: number;
  industry: string;
  size: string;
  logo?: string;
  license?: {
    id: number;
    features: {
      customBranding?: boolean;
      dataExport?: boolean;
      aiInsights?: boolean;
      advancedAnalytics?: boolean;
      apiAccess?: boolean;
      prioritySupport?: boolean;
      whiteLabeling?: boolean;
      socialSharing?: boolean;
      crmIntegration?: boolean;
    };
  };
  // Legacy fields for backward compatibility
  aiInsights?: boolean;
  advancedAnalytics?: boolean;
  dataExport?: boolean;
  socialSharing?: boolean;
  customBranding?: boolean;
  crmIntegration?: boolean;
}

const Dashboard = () => {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [dashboardTab, setDashboardTab] = useState<"basic" | "business-intelligence">("basic");
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>("all");
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [hasLoadingTimeoutElapsed, setHasLoadingTimeoutElapsed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedSurveyForShare, setSelectedSurveyForShare] = useState<string>("");
  
  // HubSpot-like layout styling
  // Removed unused styling variables
  const [company, setCompany] = useState<Company | null>(null);
  const [usagePercentage, setUsagePercentage] = useState<number>(0);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  
  // Get authenticated user's company ID from localStorage first, then fallback to API
  const getCurrentUser = () => {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  };

  const currentUser = getCurrentUser();
  const companyId = currentUser?.companyId;

  // Fetch current user from API as backup
  const { data: userData } = useQuery({
    queryKey: ['/api/me'],
    queryFn: () => fetch('/api/me').then(res => res.json()),
    enabled: !companyId // Only fetch if we don't have companyId from localStorage
  });
  
  // Get current user data from userData query
  const user = userData?.user;
  
  // Use API data as fallback if localStorage doesn't have companyId
  // For admin users, default to company ID 1
  const finalCompanyId = companyId || user?.companyId || (user?.id === 1 ? 1 : null);
  
  // WebSocket subscriptions for real-time updates
  // Subscribe to license updates
  useRealtime('licenseUpdate', (data: any) => {
    console.log('Received license update:', data);
    if (data?.companyId === finalCompanyId) {
      queryClient.invalidateQueries({ queryKey: [`/api/company/${finalCompanyId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/company/${finalCompanyId}/usage`] });
    }
  });

  // Subscribe to usage updates
  useRealtime('usageUpdate', (data: any) => {
    console.log('Received usage update:', data);
    if (data?.companyId === finalCompanyId) {
      queryClient.invalidateQueries({ queryKey: [`/api/company/${finalCompanyId}/usage`] });
      queryClient.invalidateQueries({ queryKey: ['/api/surveys'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/surveys'] });
    }
  });

  // Subscribe to survey updates (including deletions)
  useRealtime('surveyUpdate', (data: any) => {
    console.log('Received survey update:', data);
    if (data?.surveyId) {
      // For deletions, check company match and invalidate usage
      if (data?.action === 'delete' && data?.companyId === finalCompanyId) {
        queryClient.invalidateQueries({ queryKey: ['/api/surveys'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/surveys'] });
        queryClient.invalidateQueries({ queryKey: [`/api/company/${finalCompanyId}/usage`] });
      } else if (data?.companyId === finalCompanyId) {
        // For regular updates, invalidate survey queries
        queryClient.invalidateQueries({ queryKey: ['/api/surveys'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/surveys'] });
        queryClient.invalidateQueries({ queryKey: [`/api/surveys/${data.surveyId}`] });
      }
    }
  });

  // Subscribe to survey status updates
  useRealtime('surveyStatusUpdate', (data: any) => {
    console.log('Received survey status update:', data);
    if (data?.surveyId) {
      queryClient.invalidateQueries({ queryKey: ['/api/surveys'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/surveys'] });
    }
  });
  
  // Fetch company data from API only if we have a valid company ID
  const { data: companyData, isLoading: isCompanyLoading } = useQuery({
    queryKey: [`/api/company/${finalCompanyId}`],
    enabled: !!finalCompanyId, // Only fetch if we have a valid company ID
    queryFn: () => fetch(`/api/company/${finalCompanyId}`, {
      credentials: 'include' // Include session cookies for authentication
    }).then(res => {
      if (!res.ok) {
        throw new Error(`Failed to fetch company data: ${res.statusText}`);
      }
      return res.json();
    })
  });
  
  // Fetch usage data from API
  const { data: usageData, isLoading: isUsageLoading } = useQuery({
    queryKey: [`/api/company/${finalCompanyId}/usage`],
    queryFn: () => fetch(`/api/company/${finalCompanyId}/usage`, {
      credentials: 'include' // Include session cookies for authentication
    }).then(res => {
      if (!res.ok) {
        throw new Error(`Failed to fetch usage data: ${res.statusText}`);
      }
      return res.json();
    }),
    enabled: !!finalCompanyId
  });

  // Prevent indefinite loading: after 15s, allow UI to render with partial data
  useEffect(() => {
    const timer = setTimeout(() => setHasLoadingTimeoutElapsed(true), 15000);
    return () => clearTimeout(timer);
  }, []);
  
  // Handle tab switching with proper loading states
  const handleTabChange = (value: string) => {
    const newTab = value as "basic" | "business-intelligence";
    setIsTabLoading(true);
    setDashboardTab(newTab);
    
    // Refetch analytics data when switching tabs to ensure fresh data
    setTimeout(async () => {
      try {
        await refetchAnalytics();
      } catch (error) {
        console.warn('Failed to refetch analytics on tab change:', error);
      } finally {
        setIsTabLoading(false);
      }
    }, 100);
  };

  // Removed unused survey change handler

  // Update state when data is loaded
  useEffect(() => {
    if (companyData?.data) {
      setCompany(companyData.data);

      // Calculate days remaining in license if we have a license end date
      if (companyData.data.licenseEndDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset to midnight for accurate day calculation
        const endDate = new Date(companyData.data.licenseEndDate);
        endDate.setHours(0, 0, 0, 0);
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Can be negative if expired
        setDaysRemaining(Math.max(0, diffDays)); // Show 0 if expired instead of negative
      } else {
        // NULL end_date means license never expires
        setDaysRemaining(Infinity);
      }
    }
    
    // Set usage percentage from API data
    if (usageData?.data) {
      setUsagePercentage(usageData.data.responseUsagePercent || 0);
    }
  }, [companyData, usageData]);

  // Fetch surveys for dropdown selection
  const { data: surveysData, isLoading: surveysLoading } = useQuery<{ data: Survey[] }>({
    queryKey: ['/api/dashboard/surveys'],
  });

  // Determine analytics endpoint
  const analyticsEndpoint = selectedSurveyId === 'all'
    ? `/api/company/${finalCompanyId}/analytics`
    : `/api/surveys/${selectedSurveyId}/analytics`;

  // Fetch analytics data based on selected survey
  const { data: analyticsData, isLoading, error, refetch: refetchAnalytics } = useQuery<{ status: string; data: DashboardStats }>({
    queryKey: [analyticsEndpoint],
    enabled: !surveysLoading && !!finalCompanyId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      // Use shared API client to include credentials and handle errors uniformly
      const result = await apiRequest(analyticsEndpoint, { method: 'GET' });
      // Ensure the returned shape matches { status, data } for existing consumers
      if (result && result.status === 'success' && result.data !== undefined) {
        return result as { status: string; data: DashboardStats };
      }
      return { status: 'success', data: (result as DashboardStats) };
    }
  });

  // Extract the stats data from the response
  const stats = analyticsData?.data;
  
  // Derived gating flags (dashboard-only)
  const surveysCount = surveysData?.data?.length || 0;
  const licenseStatus = (company?.licenseStatus || '').toLowerCase();
  const isLicenseExpired = licenseStatus === 'expired' || licenseStatus === 'suspended' || licenseStatus === 'inactive' || daysRemaining === 0;
  const isExpiringSoon = !isLicenseExpired && isFinite(daysRemaining) && daysRemaining <= 14;
  const maxResponses = company?.maxResponses || 0;
  const actualResponses = usageData?.data?.actualResponses || 0;
  const isResponseBlocked = maxResponses > 0 && actualResponses >= maxResponses;
  const isResponseNearCap = !isResponseBlocked && usagePercentage >= 80;
  const maxSurveys = company?.maxSurveys || 0;
  const isSurveyBlocked = maxSurveys > 0 && surveysCount >= maxSurveys;
  const isAnyBlocked = isLicenseExpired || isResponseBlocked || isSurveyBlocked;
  
  const handleBackToSurvey = () => {
    setLocation('/survey');
  };
  
  // Format date function
  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Set default company ID for authenticated users to avoid company lookup issues
  const defaultCompanyId = user?.id === 1 ? 1 : (user?.companyId || 1);
  
  // Always use a valid company ID - no more "Company Not Found" errors
  const workingCompanyId = finalCompanyId || defaultCompanyId;

  // Show loading state (gate on critical data; allow fallback after timeout)
  if (!hasLoadingTimeoutElapsed && (isCompanyLoading || isLoading)) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="p-6">
        <Card className="p-6 border-red-200 bg-red-50">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600">
            Failed to load dashboard data. Please check your connection and try again.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }
  
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Dashboard gating banners (company/admin only) */}
      <div className="space-y-3 mb-4">
        {isLicenseExpired && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-red-800">
              <div className="font-semibold">License issue</div>
              <div className="text-sm">Your company license is not active. Renew or contact support to resume creating or sharing surveys.</div>
            </CardContent>
          </Card>
        )}
        {!isLicenseExpired && isExpiringSoon && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-amber-900">
              <div className="font-semibold">License expiring soon</div>
              <div className="text-sm">Your license expires in {daysRemaining} day{daysRemaining === 1 ? '' : 's'}. Please renew to avoid interruptions.</div>
            </CardContent>
          </Card>
        )}
        {isResponseBlocked && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-red-800">
              <div className="font-semibold">Response quota reached</div>
              <div className="text-sm">You have collected {actualResponses}/{maxResponses} responses. Upgrade to increase your response quota.</div>
            </CardContent>
          </Card>
        )}
        {!isResponseBlocked && isResponseNearCap && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-amber-900">
              <div className="font-semibold">Approaching response limit</div>
              <div className="text-sm">{usagePercentage}% of your response quota used ({actualResponses}/{maxResponses}). Consider upgrading.</div>
            </CardContent>
          </Card>
        )}
        {isSurveyBlocked && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-red-800">
              <div className="font-semibold">Survey limit reached</div>
              <div className="text-sm">You have reached your plan's survey limit ({surveysCount}/{maxSurveys}). Upgrade to create more surveys.</div>
            </CardContent>
          </Card>
        )}
      </div>
      {/* Company header section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            {company?.logo && (
              <div className="w-16 h-16 rounded-md overflow-hidden">
                <img 
                  src={company.logo} 
                  alt={`${company.name} logo`} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{company?.name || 'Company Dashboard'}</h1>
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Plan:</span>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {company?.subscriptionTier ? company.subscriptionTier.charAt(0).toUpperCase() + company.subscriptionTier.slice(1) : 'Not Set'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">License:</span>
                    <Badge
                      variant="outline"
                      className={
                        isLicenseExpired
                          ? "bg-red-100 text-red-700 border-red-200"
                          : isExpiringSoon
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : "bg-green-100 text-green-700 border-green-200"
                      }
                    >
                      {company?.licenseStatus ? company.licenseStatus.charAt(0).toUpperCase() + company.licenseStatus.slice(1) : 'Unknown'}
                    </Badge>
                  </div>
                </div>
                {company?.size && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Company Size:</span>
                    <span className="text-sm text-gray-700">{company.size} employees</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setLocation('/survey/create')}
              disabled={isAnyBlocked || isSurveyBlocked}
              title={
                isLicenseExpired ? 'License not active' :
                isResponseBlocked ? 'Response quota reached' :
                isSurveyBlocked ? 'Survey limit reached' : undefined
              }
              className="bg-primary hover:bg-primary-dark text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Create New Survey
            </Button>
            <Button
              onClick={() => setShowShareModal(true)}
              disabled={isAnyBlocked}
              title={
                isLicenseExpired ? 'License not active' :
                isResponseBlocked ? 'Response quota reached' :
                undefined
              }
              className="bg-primary/80 hover:bg-primary text-white"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Survey
            </Button>
            <Button
              onClick={() => setLocation('/collaboration')}
              disabled={isAnyBlocked}
              title={
                isLicenseExpired ? 'License not active' :
                isResponseBlocked ? 'Response quota reached' :
                undefined
              }
              className="bg-primary/80 hover:bg-primary text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Collaborate on Survey
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation('/survey/customize')}
              disabled={isAnyBlocked}
              title={
                isLicenseExpired ? 'License not active' :
                isResponseBlocked ? 'Response quota reached' :
                undefined
              }
              className="border-primary text-primary hover:bg-primary/10"
            >
              <Settings className="h-4 w-4 mr-2" />
              Customize Survey
            </Button>
          </div>
        </div>
        
        {/* License information */}
        <Card className="mb-8 border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">License Period</h3>
                <p className="text-base font-medium">
                  {formatDate(company?.licenseStartDate)} - {formatDate(company?.licenseEndDate)}
                </p>
                <p className="text-sm text-green-600 font-medium mt-1">
                  <CheckCircle className="h-4 w-4 inline mr-1" />
                  {isFinite(daysRemaining) ? `${daysRemaining} days remaining` : 'Never expires'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Response Quota</h3>
                <div className="flex items-center gap-2">
                  <p className="text-base font-medium">
                    {usagePercentage}% used
                  </p>
                  <span className="text-xs text-gray-500">
                    ({usageData?.data?.actualResponses || 0}/{company?.maxResponses || 0})
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-2 mt-2" />
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">User Accounts</h3>
                <p className="text-base font-medium">
                  {usageData?.data?.actualUsers ?? 0}/{company?.maxUsers ?? 0} seats used
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  <Users className="h-4 w-4 inline mr-1" /> 
                  {usageData?.data?.availableUsers ?? (company?.maxUsers ? Math.max(0, (company.maxUsers - (usageData?.data?.actualUsers ?? 0))) : 0)} seats available
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    // Get features from license.features if available, otherwise fall back to company fields
                    const features = company?.license?.features || {
                      customBranding: company?.customBranding,
                      dataExport: company?.dataExport,
                      aiInsights: company?.aiInsights,
                      advancedAnalytics: company?.advancedAnalytics,
                      socialSharing: company?.socialSharing,
                      crmIntegration: company?.crmIntegration,
                      apiAccess: false,
                      prioritySupport: false,
                      whiteLabeling: false
                    };
                    
                    const enabledFeatures = [];
                    if (features.customBranding) enabledFeatures.push(<Badge key="customBranding" variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100">Custom Branding</Badge>);
                    if (features.dataExport) enabledFeatures.push(<Badge key="dataExport" variant="outline" className="bg-green-50 text-green-700 border-green-100">Data Export</Badge>);
                    if (features.aiInsights) enabledFeatures.push(<Badge key="aiInsights" variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">AI Insights</Badge>);
                    if (features.advancedAnalytics) enabledFeatures.push(<Badge key="advancedAnalytics" variant="outline" className="bg-purple-50 text-purple-700 border-purple-100">Advanced Analytics</Badge>);
                    if (features.apiAccess) enabledFeatures.push(<Badge key="apiAccess" variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-100">API Access</Badge>);
                    if (features.prioritySupport) enabledFeatures.push(<Badge key="prioritySupport" variant="outline" className="bg-amber-50 text-amber-700 border-amber-100">Priority Support</Badge>);
                    if (features.whiteLabeling) enabledFeatures.push(<Badge key="whiteLabeling" variant="outline" className="bg-slate-50 text-slate-700 border-slate-100">White Labeling</Badge>);
                    if (features.socialSharing) enabledFeatures.push(<Badge key="socialSharing" variant="outline" className="bg-orange-50 text-orange-700 border-orange-100">Social Sharing</Badge>);
                    if (features.crmIntegration) enabledFeatures.push(<Badge key="crmIntegration" variant="outline" className="bg-teal-50 text-teal-700 border-teal-100">CRM Integration</Badge>);
                    
                    return enabledFeatures.length > 0 ? enabledFeatures : <span className="text-sm text-gray-400">No features enabled</span>;
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Survey Management Section */}
      <div className="mb-8">
        {/* Embed SurveyList component directly */}
        <SurveyList
          showCreateButton={false}
          title=""
          description=""
        />
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <span className="text-red-500 text-3xl">!</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">We couldn't load your dashboard data. Please try again.</p>
          <Button 
            variant="outline" 
            onClick={() => setLocation('/dashboard')}
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            {/* Survey Performance Header and Selection */}
            <Card className="mb-6">
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <div>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                    Survey Performance
                  </CardTitle>
                  <CardDescription>
                    Overview of your survey performance and response data
                  </CardDescription>
                </div>
                
                {/* Survey selector */}
                <div className="mt-4 sm:mt-0 w-full sm:w-64">
                  <Select
                    value={selectedSurveyId}
                    onValueChange={(value) => setSelectedSurveyId(value)}
                    disabled={surveysLoading}
                  >
                    <SelectTrigger className="w-full border-primary/30 focus:ring-primary">
                      <div className="flex items-center">
                        <Filter className="mr-2 h-4 w-4 text-gray-500" />
                        <SelectValue placeholder="Select a survey" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Surveys</SelectItem>
                      {surveysData?.data?.map((survey) => (
                        <SelectItem key={survey.id} value={survey.id.toString()}>
                          {survey.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
            </Card>

            <Tabs 
              value={dashboardTab}
              className="w-full"
              onValueChange={handleTabChange}
            >
              <div className="border-b border-gray-200 mb-4">
                <TabsList className="bg-transparent h-14">
                  <TabsTrigger 
                    value="basic" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-14 px-6"
                  >
                    <LineChart className="h-4 w-4 mr-2" />
                    Basic Analytics
                  </TabsTrigger>
                  <TabsTrigger 
                    value="business-intelligence" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-14 px-6"
                  >
                    <BarChart className="h-4 w-4 mr-2" />
                    Business Intelligence
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="basic" className="mt-0">
                {isTabLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <DashboardView stats={stats as any} surveyId={selectedSurveyId} />
                )}
              </TabsContent>
              
              <TabsContent value="business-intelligence" className="mt-0">
                {isTabLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <BusinessIntelligence surveyId={selectedSurveyId} companyId={companyId} />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}

      {/* Share Survey Selection Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Select Survey to Share</DialogTitle>
            <DialogDescription>
              Choose a survey from the list below to share with others.
            </DialogDescription>
          </DialogHeader>
          
          {surveysLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading surveys...
            </div>
          ) : !surveysData?.data || surveysData.data.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4">No surveys available to share.</p>
              <p className="text-sm text-muted-foreground">
                Create a survey first to share it with others.
              </p>
            </div>
          ) : (
            <div className="py-4">
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {surveysData.data.map((survey) => (
                  <div
                    key={survey.id}
                    onClick={() => setSelectedSurveyForShare(survey.id.toString())}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSurveyForShare === survey.id.toString()
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{survey.title}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Responses: {(survey as any).responseCount ?? 0}</span>
                          <span>Status: {(survey as any).status ?? (survey.isActive ? 'Active' : 'Inactive')}</span>
                          <span>Type: {(survey as any).surveyType ?? 'Custom'}</span>
                        </div>
                      </div>
                      {selectedSurveyForShare === survey.id.toString() && (
                        <CheckCircle className="h-5 w-5 text-primary ml-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowShareModal(false);
                setSelectedSurveyForShare("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedSurveyForShare) {
                  setShowShareModal(false);
                  setLocation(`/survey/share/${selectedSurveyForShare}`);
                  setSelectedSurveyForShare("");
                }
              }}
              disabled={!selectedSurveyForShare || surveysData?.data?.length === 0}
            >
              Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Dashboard;
