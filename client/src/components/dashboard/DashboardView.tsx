import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import TraitChart from "./TraitChart";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner, LoadingCard } from "@/components/ui/loading";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useToast } from "@/hooks/use-toast";
import { toast } from "@/hooks/use-toast";
import { 
  HelpCircle, 
  Download, 
  Users, 
  Activity,
  Clock,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  CircleUser,
  UserRound,
  Info,
  Download as Save,
  Share2,
  Star,
  Loader2,
  Minus
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


interface DashboardStats {
  // Core metrics
  surveyCount: number;
  responseCount: number;
  completionRate: number;
  averageSatisfactionScore: number;
  
  // Time-based data
  responsesByPeriod: { period: string; count: number }[];
  
  // Traits data
  topTraits: { name: string; score: number; category: string }[];
  
  // Demographics
  demographics: {
    genderDistribution: { label: string; value: number }[];
    ageDistribution: { range: string; percentage: number }[];
    locationDistribution: { location: string; count: number }[];
  };
  
  // Market segments
  marketSegments: { segment: string; percentage: number }[];
  
  // Business context
  businessContext: {
    industries: { name: string; percentage: number }[];
    companySizes: { size: string; percentage: number }[];
    departments: { name: string; percentage: number }[];
    roles: { name: string; percentage: number }[];
    decisionStyles?: { style: string; percentage: number }[];
  };
  
  // Growth metrics
  monthOverMonthGrowth?: {
    respondents: number;
    completion: number;
    satisfaction: number;
  };
  
  // Integration metrics
  integrations?: {
    total: number;
    newCount: number;
  };
  
  // Backward compatibility for existing code
  totalResponses?: number;
  completedResponses?: number;
  averageTraits?: { name: string; average: number }[];
  growthRate?: number;
  lastMonthResponses?: number;
  thisMonthResponses?: number;
  genderStereotypes?: {
    maleAssociated?: { trait: string; score: number; description?: string }[];
    femaleAssociated?: { trait: string; score: number; description?: string }[];
    neutralAssociated?: { trait: string; score: number; description?: string }[];
  };
  productRecommendations?: {
    categories?: Record<string, number>;
    topProducts?: {
      name: string; 
      category: string; 
      confidence: number;
      description?: string;
      attributes?: string[];
    }[];
  };
}

interface DashboardViewProps {
  stats?: DashboardStats;
  surveyId?: string;
}

const DashboardView = ({ stats, surveyId = 'all' }: DashboardViewProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [exportDataTypes, setExportDataTypes] = useState({
    responses: true,
    analytics: true,
    demographics: true,
    traits: true,
    businessContext: false,
    engagement: false,
  });

  // Get authenticated user's company ID from localStorage first, then fallback to API
  const getCurrentUser = () => {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  };

  const currentUser = getCurrentUser();
  const companyIdFromStorage = currentUser?.companyId;

  // Fetch current user from API as backup
  const { data: userData } = useQuery({
    queryKey: ['/api/me'],
    queryFn: () => fetch('/api/me').then(res => res.json()),
    enabled: !companyIdFromStorage // Only fetch if we don't have companyId from localStorage
  });
  
  // Get current user data from userData query
  const user = userData?.user;
  
  // Use API data as fallback if localStorage doesn't have companyId
  // For admin users, default to company ID 1
  const companyId = companyIdFromStorage || user?.companyId || (user?.id === 1 ? 1 : null) || 1;

  // Add console log to debug stats at this point
  console.log("Stats from props:", stats);
  console.log("Selected survey ID:", surveyId);

  // Define the API endpoint based on whether a specific survey is selected
  const analyticsEndpoint = surveyId === 'all' 
    ? `/api/company/${companyId}/analytics`
    : `/api/surveys/${surveyId}/analytics`;
  
  // Helper function to create a proper queryFn for consistent API requests
  const getQueryFn = (endpoint: string) => async () => {
    const response = await apiRequest('GET', endpoint, null);
    return response.json();
  };
    
  // Fetch analytics data from the API only if stats are not provided
  const { data: apiData, isLoading, error } = useQuery({
    queryKey: [analyticsEndpoint, surveyId, companyId],
    queryFn: getQueryFn(analyticsEndpoint),
    onError: (err) => {
      toast({
        title: "Error loading dashboard",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive"
      });
    },
    enabled: !stats && !!companyId, // Only fetch if stats are not provided and we have a company ID
    staleTime: 60000  // Cache data for 1 minute
  });
  
  // Process stats data into format needed by components
  // If neither apiData nor stats are available, provide empty structure for proper UI rendering
  const statsData = apiData?.data || stats || {
    surveyCount: 0,
    responseCount: 0,
    completionRate: 0,
    averageSatisfactionScore: 0,
    totalResponses: 0,
    completedResponses: 0,
    monthOverMonthGrowth: {
      respondents: 0,
      completion: 0,
      satisfaction: 0
    },
    integrations: {
      total: 0,
      newCount: 0
    },
    topTraits: [],
    demographics: {
      genderDistribution: [],
      ageDistribution: [],
      locationDistribution: []
    },
    marketSegments: [],
    businessContext: {
      industries: [],
      companySizes: [],
      departments: [],
      roles: [],
      decisionStyles: []
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="mx-auto mt-10" />;
  }

  if (error) {
    return (
      <ErrorBoundary>
        <div className="text-center p-6">
          <p className="text-red-600">Failed to load dashboard data: {error.message}</p> {/* Display error message */}
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </ErrorBoundary>
    );
  }


  const handleExportData = async () => {
    setShowExportModal(true);
  };

  const handleExportConfirm = async () => {
    try {
      setIsExporting(true);
      setShowExportModal(false);

      // Build query parameters
      const params = new URLSearchParams({
        format: exportFormat,
        surveyId: surveyId === 'all' ? 'all' : surveyId.toString(),
        ...Object.fromEntries(
          Object.entries(exportDataTypes).map(([key, value]) => [`include${key.charAt(0).toUpperCase() + key.slice(1)}`, value.toString()])
        ),
      });

      const endpoint = surveyId === 'all' 
        ? `/api/company/${companyId}/export?${params.toString()}`
        : `/api/surveys/${surveyId}/export?${params.toString()}`;

      // Fetch the export data with credentials
      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': exportFormat === 'json' ? 'application/json' : exportFormat === 'pdf' ? 'text/html' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Handle PDF differently - open in new window for printing
      if (exportFormat === 'pdf') {
        const htmlContent = await response.text();
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        if (newWindow) {
          newWindow.onload = () => {
            setTimeout(() => {
              newWindow.print();
            }, 250);
          };
        }
        // Clean up after a delay
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        toast({ title: "PDF opened", description: "Use your browser's print dialog to save as PDF.", variant: "default" });
        setIsExporting(false);
        return;
      }

      // Get the blob data for CSV and JSON
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `survey-data-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      if (contentDisposition) {
        // Extract filename from Content-Disposition header
        // Handle both quoted and unquoted filenames
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=([^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          // Remove quotes if present and trim
          filename = filenameMatch[1].trim().replace(/^["']|["']$/g, '');
        }
      }
      
      // Ensure correct file extension (CSV exports are actually Excel files)
      const extension = exportFormat === 'csv' ? 'xlsx' : exportFormat;
      // Remove any existing extension and add the correct one
      filename = filename.replace(/\.[^.]*$/, '') + `.${extension}`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export completed",
        description: "Your data has been exported successfully.",
        variant: "default"
      });

      setIsExporting(false);
    } catch (error) {
      console.error("Error exporting data:", error);
      setIsExporting(false);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export data. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleShareReport = async () => {
    try {
      setIsSharing(true);
      
      // Call backend to generate shareable link
      const response = await fetch('/api/reports/share', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: companyId,
          surveyId: surveyId,
          expiresInDays: 30
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create shareable link');
      }

      const data = await response.json();
      const shareableLink = data.shareableLink;
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareableLink)
        .then(() => {
          toast({
            title: "Link copied to clipboard",
            description: "You can now share this link with others. The link will expire in 30 days.",
            variant: "default"
          });
        })
        .catch(err => {
          console.error("Failed to copy link:", err);
          // Show the link in a toast if clipboard fails
          toast({
            title: "Shareable link created",
            description: shareableLink,
            variant: "default"
          });
        })
        .finally(() => {
          setIsSharing(false);
        });
    } catch (error) {
      console.error("Error sharing report:", error);
      setIsSharing(false);
      toast({
        title: "Error sharing report",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Card className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
        <CardHeader className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-display font-bold text-gray-900">
              Business Analytics Dashboard
            </CardTitle>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">Demo mode</span>
              <span className="inline-flex rounded-full h-6 w-12 bg-gray-200 p-1 transition-colors ease-in-out duration-200">
                <span className="rounded-full h-4 w-4 bg-white shadow transform translate-x-6"></span>
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">Total Respondents</h3>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{statsData?.responseCount?.toLocaleString() || statsData?.totalResponses?.toLocaleString() || 0}</p>
              <div className="flex items-center mt-1">
                <span className={`text-sm flex items-center ${
                  statsData?.monthOverMonthGrowth?.respondents > 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {statsData?.monthOverMonthGrowth?.respondents > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  )}
                  {Math.abs(statsData?.monthOverMonthGrowth?.respondents || 0).toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500 ml-1">vs last month</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
                <Activity className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{statsData?.completionRate?.toFixed(1) || '0.0'}%</p>
              <div className="flex items-center mt-1">
                <span className={`text-sm flex items-center ${
                  statsData?.monthOverMonthGrowth?.completion > 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {statsData?.monthOverMonthGrowth?.completion > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  )}
                  {Math.abs(statsData?.monthOverMonthGrowth?.completion || 0).toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500 ml-1">vs last month</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">Satisfaction Score</h3>
                <Star className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{statsData?.averageSatisfactionScore?.toFixed(1) || '0.0'}</p>
              <div className="flex items-center mt-1">
                <span className={`text-sm flex items-center ${statsData?.monthOverMonthGrowth?.satisfaction > 0 ? 'text-success' : 'text-destructive'}`}>
                  {statsData?.monthOverMonthGrowth?.satisfaction > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  )}
                  {Math.abs(statsData?.monthOverMonthGrowth?.satisfaction || 0).toFixed(1)}
                </span>
                <span className="text-xs text-gray-500 ml-1">vs last month</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">CRM Integrations</h3>
                <RefreshCw className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{statsData?.integrations?.total || 0}</p>
              <div className="flex items-center mt-1">
                <span className={`text-sm flex items-center ${statsData?.integrations?.newCount > 0 ? 'text-success' : 'text-gray-500'}`}>
                  {statsData?.integrations?.newCount > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <Minus className="h-3 w-3 mr-1 text-gray-500" />
                  )}
                  {statsData?.integrations?.newCount || 0}
                </span>
                <span className="text-xs text-gray-500 ml-1">new this month</span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="traits" className="mb-8">
            <TabsList className="flex flex-wrap w-full mb-2 h-auto min-h-[2.5rem] gap-1 p-1">
              <TabsTrigger value="traits" className="px-3 py-2 text-sm whitespace-nowrap">Personality Traits</TabsTrigger>
              <TabsTrigger value="demographics" className="px-3 py-2 text-sm whitespace-nowrap">Demographics</TabsTrigger>
              <TabsTrigger value="stereotypes" className="px-3 py-2 text-sm whitespace-nowrap">Gender Stereotypes</TabsTrigger>
              <TabsTrigger value="products" className="px-3 py-2 text-sm whitespace-nowrap">Recommended Products</TabsTrigger>
              <TabsTrigger value="engagement" className="px-3 py-2 text-sm whitespace-nowrap">Engagement</TabsTrigger>
              <TabsTrigger value="business" className="px-3 py-2 text-sm whitespace-nowrap">
                Business Context
              </TabsTrigger>
            </TabsList>
            <TabsContent value="traits" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personality Trait Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <TraitChart traits={
                    // Map personalityTraits from API to the format expected by TraitChart
                    statsData?.personalityTraits?.map(trait => ({
                      name: trait.trait || trait.name,
                      score: Math.round(trait.score * (trait.score <= 1 ? 100 : 1)), // Convert 0-1 range to 0-100 if needed
                      category: "personality"
                    })) || 
                    statsData?.topTraits || 
                    statsData?.averageTraits || 
                    []
                  } height={300} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="demographics" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Age Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {statsData?.demographics?.ageDistribution && statsData.demographics.ageDistribution.length > 0 ? (
                        // New API format
                        statsData.demographics.ageDistribution.map((item, index) => (
                          <div key={index}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{item.range}</span>
                              <span className="text-sm font-medium text-gray-700">{item.percentage}%</span>
                            </div>
                            <Progress 
                              value={item.percentage} 
                              className="h-2 bg-gray-200"
                            />
                          </div>
                        ))
                      ) : statsData?.demographics?.ageGroups && Object.keys(statsData.demographics.ageGroups).length > 0 ? (
                        // Fallback to old format if available
                        Object.entries(statsData.demographics.ageGroups)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([group, count]) => (
                            <div key={group}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{group}</span>
                                <span className="text-sm font-medium text-gray-700">{count}</span>
                              </div>
                              <Progress 
                                value={count > 0 && statsData?.totalResponses ? (count / statsData.totalResponses) * 100 : 0} 
                                className="h-2 bg-gray-200"
                              />
                            </div>
                          ))
                      ) : (
                        <div className="py-8 text-center text-gray-500">
                          <p className="text-sm">No age distribution data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Gender Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {statsData?.demographics?.genderDistribution && statsData.demographics.genderDistribution.length > 0 ? (
                        // New API format
                        statsData.demographics.genderDistribution.map((item, index) => (
                          <div key={index}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{item.label}</span>
                              <span className="text-sm font-medium text-gray-700">{item.value}%</span>
                            </div>
                            <Progress 
                              value={item.value} 
                              className="h-2 bg-gray-200"
                            />
                          </div>
                        ))
                      ) : statsData?.demographics?.genders && Object.keys(statsData.demographics.genders).length > 0 ? (
                        // Fallback to old format if available
                        Object.entries(statsData.demographics.genders)
                          .sort(([a], [b]) => b.localeCompare(a))
                          .map(([gender, count]) => (
                            <div key={gender}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{gender}</span>
                                <span className="text-sm font-medium text-gray-700">{count}</span>
                              </div>
                              <Progress 
                                value={count > 0 && statsData?.totalResponses ? (count / statsData.totalResponses) * 100 : 0} 
                                className="h-2 bg-gray-200"
                              />
                            </div>
                          ))
                      ) : (
                        <div className="py-8 text-center text-gray-500">
                          <p className="text-sm">No gender distribution data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Location Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {statsData?.demographics?.locationDistribution && statsData.demographics.locationDistribution.length > 0 ? (
                        // New API format - show top 10 locations only
                        statsData.demographics.locationDistribution
                          .slice(0, 10)
                          .map((item, index) => (
                          <div key={index}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{item.location}</span>
                              <span className="text-sm font-medium text-gray-700">{item.count}</span>
                            </div>
                            <Progress 
                              value={item.count > 0 ? (item.count / statsData.responseCount) * 100 : 0} 
                              className="h-2 bg-gray-200"
                            />
                          </div>
                          ))
                      ) : statsData?.demographics?.locations && Object.keys(statsData.demographics.locations).length > 0 ? (
                        // Fallback to old format if available
                        Object.entries(statsData.demographics.locations)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .slice(0, 10)
                          .map(([location, count]) => (
                            <div key={location}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{location}</span>
                                <span className="text-sm font-medium text-gray-700">{count}</span>
                              </div>
                              <Progress 
                                value={count > 0 && statsData?.totalResponses ? (count / statsData.totalResponses) * 100 : 0} 
                                className="h-2 bg-gray-200"
                              />
                            </div>
                          ))
                      ) : (
                        <div className="py-8 text-center text-gray-500">
                          <p className="text-sm">No location distribution data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Market Segments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {statsData?.marketSegments ? (
                        // New API format
                        statsData.marketSegments.map((item, index) => (
                          <div key={index}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{item.segment}</span>
                              <span className="text-sm font-medium text-gray-700">{item.percentage}%</span>
                            </div>
                            <Progress 
                              value={item.percentage} 
                              className="h-2 bg-gray-200"
                            />
                          </div>
                        ))
                      ) : (
                        // Fallback to old format if available
                        statsData?.marketSegments && typeof statsData.marketSegments === 'object' && Object.entries(statsData.marketSegments)
                          .sort(([, a], [, b]) => Number(b) - Number(a))
                          .map(([segment, percentage]) => (
                            <div key={segment}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{segment}</span>
                                <span className="text-sm font-medium text-gray-700">{percentage}%</span>
                              </div>
                              <Progress 
                                value={Number(percentage)} 
                                className="h-2 bg-gray-200"
                              />
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="stereotypes" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="col-span-1">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                    <CardTitle className="flex items-center">
                      <CircleUser className="h-5 w-5 mr-2 text-blue-500" />
                      Male-Associated Traits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    {statsData?.genderStereotypes && statsData?.genderStereotypes.maleAssociated ? (
                      <div className="space-y-4">
                        {statsData?.genderStereotypes.maleAssociated.map((trait, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{trait.trait}</span>
                              <span className="text-sm font-medium text-gray-700">{trait.score}</span>
                            </div>
                            <Progress 
                              value={trait.score} 
                              className="h-2 bg-gray-200"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-500">No data available</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="col-span-1">
                  <CardHeader className="bg-gradient-to-r from-pink-50 to-pink-100 border-b border-pink-200">
                    <CardTitle className="flex items-center">
                      <UserRound className="h-5 w-5 mr-2 text-pink-500" />
                      Female-Associated Traits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    {statsData?.genderStereotypes && statsData?.genderStereotypes.femaleAssociated ? (
                      <div className="space-y-4">
                        {statsData?.genderStereotypes.femaleAssociated.map((trait, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{trait.trait}</span>
                              <span className="text-sm font-medium text-gray-700">{trait.score}</span>
                            </div>
                            <Progress 
                              value={trait.score} 
                              className="h-2 bg-gray-200"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-500">No data available</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Gender Stereotype Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    This analysis shows how users' personality traits correlate with traditional gender stereotypes, 
                    highlighting potential biases in your customer base. Understanding these patterns can help develop 
                    more inclusive marketing strategies and product designs.
                  </p>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Info className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          Note: This data reflects cultural stereotypes, not inherent gender differences. 
                          Use this information to challenge stereotypes rather than reinforce them.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {statsData?.productRecommendations && statsData?.productRecommendations.categories && 
                  Object.entries(statsData.productRecommendations.categories)
                    .sort(([, a], [, b]) => Number(b) - Number(a))
                    .slice(0, 6)
                    .map(([category, count], index) => (
                      <Card key={index} className="col-span-1">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{category}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{count}</div>
                          <p className="text-sm text-gray-500 mt-1">relevance score</p>
                          <div className="mt-2">
                            <Progress 
                              value={count > 0 && statsData?.totalResponses ? (count / statsData.totalResponses) * 100 : 0} 
                              className="h-2 bg-gray-200"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                }
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Top Product Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3">Product</th>
                          <th scope="col" className="px-6 py-3">Category</th>
                          <th scope="col" className="px-6 py-3">Confidence</th>
                          <th scope="col" className="px-6 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsData?.productRecommendations && statsData?.productRecommendations.topProducts ? (
                          statsData?.productRecommendations.topProducts.slice(0, 10).map((product, index) => (
                            <tr key={index} className="bg-white border-b hover:bg-gray-50">
                              <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                {product.name}
                              </th>
                              <td className="px-6 py-4">{product.category}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <Progress 
                                    value={product.confidence} 
                                    className="w-full max-w-[100px] h-2 bg-gray-200 mr-2"
                                  />
                                  <span>{product.confidence}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.confidence > 80 ? 'bg-green-100 text-green-800' : product.confidence > 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {product.confidence > 80 ? 'High Match' : product.confidence > 60 ? 'Medium Match' : 'Low Match'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center">No recommendations available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business" className="mt-6">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="relative mr-2 h-5 w-5 flex items-center justify-center">
                      <span className="absolute h-full w-full rounded-full bg-purple-100"></span>
                      <span className="relative text-purple-600">💼</span>
                    </span>
                    Business Context Profile
                  </CardTitle>
                  <CardDescription>
                    Insights gathered from business-context questions across various survey types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Card className="border-none shadow-none">
                      <CardHeader className="px-0 pb-2">
                        <CardTitle className="text-base">Industry Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent className="px-0">
                        <div className="space-y-4">
                          {statsData?.businessContext?.industries ? (
                            // New API format
                            statsData.businessContext.industries
                              .sort((a, b) => b.percentage - a.percentage)
                              .map((item, index) => (
                                <div key={index} className="bg-gray-50 p-3 rounded-lg hover:shadow-md transition-shadow">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium text-gray-800">{item.name}</span>
                                    <div className="flex items-center">
                                      <span className="text-sm font-medium text-gray-700 mr-2">{item.percentage}</span>
                                      <span className="text-xs text-gray-500">{item.percentage}%</span>
                                    </div>
                                  </div>
                                  <div className="relative pt-1">
                                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                                      <div 
                                        style={{ width: `${item.percentage}%` }} 
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500">
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                          ) : (
                            // Fallback to old format if available
                            statsData?.businessContext?.industry && Object.entries(statsData.businessContext.industry)
                              .sort(([, a], [, b]) => Number(b) - Number(a))
                              .map(([industry, count], index) => (
                                <div key={industry} className="bg-gray-50 p-3 rounded-lg hover:shadow-md transition-shadow">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium text-gray-800">{industry}</span>
                                    <div className="flex items-center">
                                      <span className="text-sm font-medium text-gray-700 mr-2">{count}</span>
                                      <span className="text-xs text-gray-500">{count > 0 && statsData?.totalResponses ? ((count / statsData.totalResponses) * 100).toFixed(1) : 0}%</span>
                                    </div>
                                  </div>
                                  <div className="relative pt-1">
                                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                                      <div 
                                        style={{ width: `${count > 0 && statsData?.totalResponses ? (count / statsData.totalResponses) * 100 : 0}%` }} 
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500">
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-none">
                      <CardHeader className="px-0 pb-2">
                        <CardTitle className="text-base">Company Size</CardTitle>
                      </CardHeader>
                      <CardContent className="px-0">
                        <div className="space-y-4">
                          {statsData?.businessContext?.companySizes ? (
                            // New API format
                            statsData.businessContext.companySizes
                              .sort((a, b) => {
                                const sizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
                                return sizes.indexOf(a.size) - sizes.indexOf(b.size);
                              })
                              .map((item, index) => (
                                <div key={index} className={`bg-gray-50 p-3 rounded-lg hover:shadow-md transition-shadow ${index === 0 && 'animate-pulse'}`}>
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium text-gray-800">{item.size}</span>
                                    <div className="flex items-center">
                                      <span className="text-sm font-medium text-gray-700 mr-2">{item.percentage}</span>
                                      <span className="text-xs text-gray-500">{item.percentage}%</span>
                                    </div>
                                  </div>
                                  <div className="relative pt-1">
                                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                                      <div 
                                        style={{ width: `${item.percentage}%` }} 
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500">
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                          ) : (
                            // Fallback to old format if available
                            statsData?.businessContext?.companySize && Object.entries(statsData.businessContext.companySize)
                              .sort(([a], [b]) => {
                                const sizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
                                return sizes.indexOf(a) - sizes.indexOf(b);
                              })
                              .map(([size, count], index) => (
                                <div key={size} className={`bg-gray-50 p-3 rounded-lg hover:shadow-md transition-shadow ${index === 0 && 'animate-pulse'}`}>
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium text-gray-800">{size}</span>
                                    <div className="flex items-center">
                                      <span className="text-sm font-medium text-gray-700 mr-2">{count}</span>
                                      <span className="text-xs text-gray-500">{count > 0 && statsData?.totalResponses ? ((count / statsData.totalResponses) * 100).toFixed(1) : 0}%</span>
                                    </div>
                                  </div>
                                  <div className="relative pt-1">
                                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                                      <div 
                                        style={{ width: `${count > 0 && statsData?.totalResponses ? (count / statsData.totalResponses) * 100 : 0}%` }} 
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500">
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Card className="border-none shadow-none">
                      <CardHeader className="px-0 pb-2">
                        <CardTitle className="text-base">Decision Timeframe</CardTitle>
                      </CardHeader>
                      <CardContent className="px-0">
                        <div className="space-y-4">
                          {statsData?.businessContext?.decisionTimeframes ? (
                            // New API format
                            statsData.businessContext.decisionTimeframes
                              .sort((a, b) => {
                                const timeframes = ['Immediate', '1-3 months', '3-6 months', '6-12 months', '1+ year', 'No timeline'];
                                return timeframes.indexOf(a.timeframe) - timeframes.indexOf(b.timeframe);
                              })
                              .map((item, index) => (
                                <div key={index} className="bg-gray-50 p-3 rounded-lg hover:shadow-md transition-shadow">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium text-gray-800">{item.timeframe}</span>
                                    <span className="text-sm font-medium text-gray-700">{item.percentage}%</span>
                                  </div>
                                  <Progress 
                                    value={item.percentage} 
                                    className="h-2 bg-gray-200"
                                  />
                                </div>
                              ))
                          ) : (
                            // Fallback to old format if available
                            statsData?.businessContext?.decisionTimeframe && Object.entries(statsData.businessContext.decisionTimeframe)
                              .sort(([a], [b]) => {
                                const timeframes = ['Immediate', '1-3 months', '3-6 months', '6-12 months', '1+ year', 'No timeline'];
                                return timeframes.indexOf(a) - timeframes.indexOf(b);
                              })
                              .map(([timeframe, count], index) => (
                                <div key={timeframe} className="bg-gray-50 p-3 rounded-lg hover:shadow-md transition-shadow">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium text-gray-800">{timeframe}</span>
                                    <span className="text-sm font-medium text-gray-700">{count}</span>
                                  </div>
                                  <Progress 
                                    value={count > 0 && statsData?.totalResponses ? (count / statsData.totalResponses) * 100 : 0} 
                                    className="h-2 bg-gray-200"
                                  />
                                </div>
                              ))
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-none">
                      <CardHeader className="px-0 pb-2">
                        <CardTitle className="text-base">Growth Stage</CardTitle>
                      </CardHeader>
                      <CardContent className="px-0">
                        <div className="space-y-4">
                          {statsData?.businessContext?.growthStages ? (
                            // New API format
                            statsData.businessContext.growthStages
                              .sort((a, b) => {
                                const stages = ['Startup', 'Early growth', 'Expansion', 'Mature', 'Renewal/Decline'];
                                return stages.indexOf(a.stage) - stages.indexOf(b.stage);
                              })
                              .map((item, index) => (
                                <div key={index} className="group bg-gray-50 p-3 rounded-lg hover:shadow-md transition-shadow">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium text-gray-800 group-hover:text-primary transition-colors">{item.stage}</span>
                                    <span className="text-sm font-medium text-gray-700">{item.percentage}%</span>
                                  </div>
                                  <div className="relative pt-1">
                                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                                      <div 
                                        style={{ width: `${item.percentage}%` }} 
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 group-hover:bg-green-600 transition-colors">
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                          ) : (
                            // Fallback to old format if available
                            statsData?.businessContext?.growthStage && Object.entries(statsData.businessContext.growthStage)
                              .sort(([a], [b]) => {
                                const stages = ['Startup', 'Early growth', 'Expansion', 'Mature', 'Renewal/Decline'];
                                return stages.indexOf(a) - stages.indexOf(b);
                              })
                              .map(([stage, count], index) => (
                                <div key={stage} className="group bg-gray-50 p-3 rounded-lg hover:shadow-md transition-shadow">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium text-gray-800 group-hover:text-primary transition-colors">{stage}</span>
                                    <span className="text-sm font-medium text-gray-700">{count}</span>
                                  </div>
                                  <div className="relative pt-1">
                                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                                      <div 
                                        style={{ width: `${count > 0 && statsData?.totalResponses ? (count / statsData.totalResponses) * 100 : 0}%` }} 
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 group-hover:bg-green-600 transition-colors">
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Learning Preferences</CardTitle>
                    <CardDescription>How respondents prefer to acquire new skills</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {statsData?.businessContext?.learningPreferences ? (
                        // New API format
                        statsData.businessContext.learningPreferences
                          .sort((a, b) => b.percentage - a.percentage)
                          .map((item, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{item.preference}</span>
                                <div className="flex space-x-1">
                                  {Array.from({ length: Math.min(5, Math.ceil(item.percentage / 10)) }).map((_, i) => (
                                    <span key={i} className="h-4 w-4 bg-amber-400 rounded-full"></span>
                                  ))}
                                </div>
                              </div>
                              <Progress 
                                value={item.percentage} 
                                className="h-2 bg-gray-200"
                              />
                            </div>
                          ))
                      ) : (
                        // Fallback to old format if available
                        statsData?.businessContext?.learningPreferences && Object.entries(statsData.businessContext.learningPreferences)
                          .sort(([, a], [, b]) => Number(b) - Number(a))
                          .map(([preference, count], index) => (
                            <div key={preference} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{preference}</span>
                                <div className="flex space-x-1">
                                  {Array.from({ length: Math.min(5, Math.ceil((count > 0 && statsData?.totalResponses ? (count / statsData.totalResponses) * 10 : 0))) }).map((_, i) => (
                                    <span key={i} className="h-4 w-4 bg-amber-400 rounded-full"></span>
                                  ))}
                                </div>
                              </div>
                              <Progress 
                                value={count > 0 && statsData?.totalResponses ? (count / statsData.totalResponses) * 100 : 0} 
                                className="h-2 bg-gray-200"
                              />
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Skill Needs</CardTitle>
                    <CardDescription>Key skills relevant to business needs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                      {statsData?.businessContext?.skills ? (
                        // New API format
                        statsData.businessContext.skills
                          .sort((a, b) => b.percentage - a.percentage)
                          .map((item, index) => (
                            <div key={index} className="flex items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold mr-3">
                                {Math.round(item.percentage)}%
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{item.skill}</p>
                                <p className="text-xs text-gray-500">{Math.round((item.percentage * statsData.responseCount) / 100)} respondents</p>
                              </div>
                            </div>
                          ))
                      ) : (
                        // Fallback to old format if available
                        statsData?.businessContext?.skillNeeds && Object.entries(statsData.businessContext.skillNeeds)
                          .sort(([, a], [, b]) => Number(b) - Number(a))
                          .map(([skill, count], index) => (
                            <div key={skill} className="flex items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold mr-3">
                                {Math.round(count > 0 && statsData?.totalResponses ? (count / statsData.totalResponses) * 100 : 0)}%
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{skill}</p>
                                <p className="text-xs text-gray-500">{count} respondents</p>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Business Challenges</CardTitle>
                  <CardDescription>Key challenges faced by respondents' businesses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {statsData?.businessContext?.challenges ? (
                      // New API format
                      statsData.businessContext.challenges
                        .sort((a, b) => b.percentage - a.percentage)
                        .slice(0, 9)
                        .map((item, index) => (
                          <div 
                            key={index} 
                            className="bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-700">{item.challenge}</span>
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100">
                                {Math.round((item.percentage * statsData.responseCount) / 100)}
                              </span>
                            </div>
                            <Progress 
                              value={item.percentage} 
                              className="h-1 bg-gray-100"
                            />
                            <div className="mt-2 text-xs text-gray-500">
                              {item.percentage.toFixed(1)}% of respondents
                            </div>
                          </div>
                        ))
                    ) : (
                      // Fallback to old format if available
                      statsData?.businessContext?.businessChallenges && Object.entries(statsData.businessContext.businessChallenges)
                        .sort(([, a], [, b]) => Number(b) - Number(a))
                        .slice(0, 9)
                        .map(([challenge, count], index) => (
                          <div 
                            key={challenge} 
                            className="bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-700">{challenge}</span>
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100">{count}</span>
                            </div>
                            <Progress 
                              value={count > 0 && statsData?.totalResponses ? (count / statsData.totalResponses) * 100 : 0} 
                              className="h-1 bg-gray-100"
                            />
                            <div className="mt-2 text-xs text-gray-500">
                              {count > 0 && statsData?.totalResponses ? ((count / statsData.totalResponses) * 100).toFixed(1) : 0}% of respondents
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engagement" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                {statsData?.engagementMetrics ? (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Daily Active Users</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{statsData.engagementMetrics.dailyActiveUsers.toLocaleString()}</div>
                        <p className="text-sm text-gray-500 mt-1">Average per day</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Monthly Active Users</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{statsData.engagementMetrics.monthlyActiveUsers.toLocaleString()}</div>
                        <p className="text-sm text-gray-500 mt-1">Total unique users</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Session Duration</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{statsData.engagementMetrics.averageSessionDuration} min</div>
                        <p className="text-sm text-gray-500 mt-1">Average time spent</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Retention Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{statsData.engagementMetrics.retentionRate}%</div>
                        <p className="text-sm text-gray-500 mt-1">30-day retention</p>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Completion Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{Math.round(statsData?.completionRate || 0)}%</div>
                        <p className="text-sm text-gray-500 mt-1">Completed / Total</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Average Satisfaction</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{Math.round(statsData?.averageSatisfactionScore || 0)}</div>
                        <p className="text-sm text-gray-500 mt-1">0–100 scale</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Avg Completion Time</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{Math.round((statsData as any)?.averageCompletionTime || 0)}s</div>
                        <p className="text-sm text-gray-500 mt-1">Across responses</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Responses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{statsData?.responseCount || statsData?.totalResponses || 0}</div>
                        <p className="text-sm text-gray-500 mt-1">Total received</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {statsData?.engagementMetrics && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Activity Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {statsData.engagementMetrics.activities.map((activity, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="font-medium">{activity.name}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-lg font-bold mr-2">{activity.count.toLocaleString()}</span>
                                {activity.trend === "up" ? (
                                  <TrendingUp className="h-4 w-4 text-green-500" />
                                ) : activity.trend === "down" ? (
                                  <TrendingDown className="h-4 w-4 text-red-500" />
                                ) : (
                                  <span className="h-4 w-4 block border-t-2 border-gray-400"></span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Device Usage</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {statsData.engagementMetrics.deviceUsage.map((device, index) => (
                            <div key={index}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{device.device}</span>
                                <span className="text-sm font-medium text-gray-700">{device.percentage}%</span>
                              </div>
                              <Progress 
                                value={device.percentage} 
                                className="h-2 bg-gray-200"
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Peak Usage Times</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {statsData.engagementMetrics.peakUsageTimes.map((time, index) => (
                            <div key={index}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{time.time}</span>
                                <span className="text-sm font-medium text-gray-700">{time.percentage}%</span>
                              </div>
                              <Progress 
                                value={time.percentage} 
                                className="h-2 bg-gray-200"
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Conversion Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">Bounce Rate</span>
                              <span className="font-medium">{statsData.engagementMetrics.bounceRate}%</span>
                            </div>
                            <Progress 
                              value={100 - statsData.engagementMetrics.bounceRate} 
                              className="h-2 mt-2 bg-gray-200"
                            />
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">Conversion Rate</span>
                              <span className="font-medium">{statsData.engagementMetrics.conversionRate}%</span>
                            </div>
                            <Progress 
                              value={statsData.engagementMetrics.conversionRate} 
                              className="h-2 mt-2 bg-gray-200"
                            />
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">Growth Rate (Monthly)</span>
                              <span className="font-medium text-green-600">+{statsData.engagementMetrics.growthRate}%</span>
                            </div>
                            <Progress 
                              value={statsData.engagementMetrics.growthRate * 10} 
                              className="h-2 mt-2 bg-gray-200"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Segments</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-4">
                  {isLoading ? (
                    // Still loading
                    <div className="py-6 flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
                      <p className="text-sm text-gray-500">Loading user segments data...</p>
                    </div>
                  ) : statsData?.marketSegments && statsData.marketSegments.length > 0 ? (
                    // New API format
                    statsData.marketSegments
                      .sort((a, b) => b.percentage - a.percentage)
                      .slice(0, 4)
                      .map((segment, index) => {
                        // Define background colors for each segment
                        const bgColors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-success'];
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className={`w-3 h-3 rounded-full ${bgColors[index % bgColors.length]}`}></span>
                              <span className="ml-2 text-sm font-medium text-gray-700">{segment.segment}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-700">{segment.percentage}%</span>
                          </div>
                        );
                      })
                  ) : (
                    // No data available
                    <div className="py-6 text-center text-gray-500">
                      <p className="text-sm">No user segments data available</p>
                      <p className="text-xs mt-1">Complete a survey to see user segments</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Decision-Making Styles</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-4">
                  {isLoading ? (
                    // Still loading
                    <div className="py-6 flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
                      <p className="text-sm text-gray-500">Loading decision-making styles data...</p>
                    </div>
                  ) : statsData?.businessContext?.decisionStyles && statsData.businessContext.decisionStyles.length > 0 ? (
                    // New API format
                    statsData.businessContext.decisionStyles
                      .sort((a, b) => b.percentage - a.percentage)
                      .slice(0, 3)
                      .map((style, index) => {
                        // Define indicator classes for each style
                        const indicatorClasses = ['bg-primary', 'bg-secondary', 'bg-accent'];
                        return (
                          <div key={index}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{style.style}</span>
                              <span className="text-sm font-medium text-gray-700">{style.percentage}%</span>
                            </div>
                            <Progress 
                              value={style.percentage} 
                              className="w-full bg-gray-200 rounded-full h-2"
                              indicatorClassName={`${indicatorClasses[index % indicatorClasses.length]} h-2 rounded-full`}
                            />
                          </div>
                        );
                      })
                  ) : (
                    // No data available
                    <div className="py-6 text-center text-gray-500">
                      <p className="text-sm">No decision-making styles data available</p>
                      <p className="text-xs mt-1">Complete a survey to see decision-making styles</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <div className="inline-flex rounded-md shadow-sm">
              <Button
                variant="outline"
                onClick={handleExportData}
                disabled={isExporting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>
              <Button
                className="ml-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
                onClick={handleShareReport}
                disabled={isSharing}
              >
                <Share2 className="h-4 w-4 mr-2" />
                {isSharing ? 'Sharing...' : 'Share Report'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Data Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
            <DialogDescription>
              Select the data types and format you want to export. The export will include data for {surveyId === 'all' ? 'all surveys' : 'the selected survey'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Format Selection */}
            <div className="space-y-2">
              <Label htmlFor="export-format">Export Format</Label>
              <Select value={exportFormat} onValueChange={(value: 'csv' | 'json' | 'pdf') => setExportFormat(value)}>
                <SelectTrigger id="export-format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Comma-Separated Values)</SelectItem>
                  <SelectItem value="json">JSON (JavaScript Object Notation)</SelectItem>
                  <SelectItem value="pdf">PDF (Portable Document Format)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {exportFormat === 'csv' && 'Best for spreadsheet applications and data analysis'}
                {exportFormat === 'json' && 'Best for developers and API integrations'}
                {exportFormat === 'pdf' && 'Best for reports and presentations'}
              </p>
            </div>

            {/* Data Type Selection */}
            <div className="space-y-2">
              <Label>Data to Include</Label>
              <div className="space-y-3 border rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-responses"
                    checked={exportDataTypes.responses}
                    onCheckedChange={(checked) =>
                      setExportDataTypes({ ...exportDataTypes, responses: checked as boolean })
                    }
                  />
                  <Label htmlFor="export-responses" className="font-normal cursor-pointer">
                    Survey Responses
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-analytics"
                    checked={exportDataTypes.analytics}
                    onCheckedChange={(checked) =>
                      setExportDataTypes({ ...exportDataTypes, analytics: checked as boolean })
                    }
                  />
                  <Label htmlFor="export-analytics" className="font-normal cursor-pointer">
                    Analytics & Metrics
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-demographics"
                    checked={exportDataTypes.demographics}
                    onCheckedChange={(checked) =>
                      setExportDataTypes({ ...exportDataTypes, demographics: checked as boolean })
                    }
                  />
                  <Label htmlFor="export-demographics" className="font-normal cursor-pointer">
                    Demographics
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-traits"
                    checked={exportDataTypes.traits}
                    onCheckedChange={(checked) =>
                      setExportDataTypes({ ...exportDataTypes, traits: checked as boolean })
                    }
                  />
                  <Label htmlFor="export-traits" className="font-normal cursor-pointer">
                    Personality Traits
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-business"
                    checked={exportDataTypes.businessContext}
                    onCheckedChange={(checked) =>
                      setExportDataTypes({ ...exportDataTypes, businessContext: checked as boolean })
                    }
                  />
                  <Label htmlFor="export-business" className="font-normal cursor-pointer">
                    Business Context
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-engagement"
                    checked={exportDataTypes.engagement}
                    onCheckedChange={(checked) =>
                      setExportDataTypes({ ...exportDataTypes, engagement: checked as boolean })
                    }
                  />
                  <Label htmlFor="export-engagement" className="font-normal cursor-pointer">
                    Engagement Metrics
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportModal(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExportConfirm}
              disabled={isExporting || !Object.values(exportDataTypes).some(v => v)}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Export Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardView;