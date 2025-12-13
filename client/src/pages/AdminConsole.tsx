import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import ClientManagement from "@/components/admin/ClientManagement";
import LicenseManagement from "@/components/admin/LicenseManagement";
import SurveyTemplates from "@/components/admin/SurveyTemplates";
import SupportTickets from "@/components/admin/SupportTickets";
import SurveyManagement from "@/components/admin/SurveyManagement";
import AdminSurveyAnalytics from "@/pages/AdminSurveyAnalytics";
import ClientSupport from "@/components/admin/ClientSupport";
import PlatformAnalytics from "@/components/admin/PlatformAnalytics";
import BillingManagement from "@/components/admin/BillingManagement";
import NotificationCenter from "@/components/admin/NotificationCenter";
import AuditLogs from "@/components/admin/AuditLogs";
import IntegrationsManager from "@/components/admin/IntegrationsManager";
import SystemSettings from "@/components/admin/SystemSettings";
import DemoDataGenerator from "@/components/admin/DemoDataGenerator";
import BlogManagement from "@/components/admin/BlogManagement";
import DemoRequestManagement from "@/components/admin/DemoRequestManagement";
import BackupManager from "@/components/admin/BackupManager";
import { AdminResponsesViewer } from "@/components/admin/AdminResponsesViewer";
import { toast } from "@/hooks/use-toast";
import { UserRole } from "@shared/schema";
import { AnalyticsData, SystemMetrics } from "@shared/adminTypes";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useSystemPerformance } from "@/lib/useSystemPerformance";
import { performLogout } from "@/lib/logout";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";

// No more demo data generators - using real API data only

const AdminConsole = () => {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [timeRange, setTimeRange] = useState<"1week" | "1month" | "3months" | "6months" | "12months">("1week");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [pendingTicketId, setPendingTicketId] = useState<number | null>(null);
  const [pendingLicenseId, setPendingLicenseId] = useState<number | null>(null);
  const [viewingAnalytics, setViewingAnalytics] = useState<number | null>(null); // Track which survey analytics we're viewing
  useEffect(() => {
    if (activeTab === 'support' && pendingTicketId) {
      const timer = setTimeout(() => setPendingTicketId(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, pendingTicketId]);
  useEffect(() => {
    if (activeTab === 'licenses' && pendingLicenseId) {
      const timer = setTimeout(() => setPendingLicenseId(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, pendingLicenseId]);
  
  // Use the same metrics source as Analytics → System Performance
  const { data: perfData, wsConnectionStatus } = useSystemPerformance();
  const isConnected = wsConnectionStatus === 'connected';
  
  // Fetch analytics data at the component level
  const { 
    data: analyticsData, 
    isLoading: isAnalyticsLoading,
    error: analyticsError
  } = useQuery<AnalyticsData>({
    queryKey: [`/api/admin/analytics?period=${timeRange}`],
    queryFn: getQueryFn({
      on401: "throw"
    }),
    refetchOnWindowFocus: false,
    enabled: activeTab === 'dashboard' && isAuthenticated,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      if (error?.status === 401) return false;
      return failureCount < 3;
    }
  });

  // Dashboard cards data
  const {
    data: ticketsData,
    isLoading: isTicketsLoading,
    error: ticketsError
  } = useQuery<any>({
    queryKey: ['/api/support/tickets'],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: activeTab === 'dashboard' && isAuthenticated,
    refetchOnWindowFocus: false
  });

  const {
    data: licensesData,
    isLoading: isLicLoading,
    error: licError
  } = useQuery<any>({
    queryKey: ['/api/licenses'],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: activeTab === 'dashboard' && isAuthenticated,
    refetchOnWindowFocus: false
  });

  // Ensure component is properly mounted
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if user is authenticated with admin role
      useEffect(() => {
        const verifyAdminAccess = () => {
          try {
            console.log('🔍 ADMIN CONSOLE DEBUG - Verifying admin access');

            // Check for mock admin user in localStorage (development only)
            const currentUserStr = localStorage.getItem('currentUser');
            console.log('🔍 ADMIN CONSOLE DEBUG - currentUser from localStorage:', currentUserStr);

            if (!currentUserStr) {
              console.error("❌ ADMIN CONSOLE DEBUG - No user found in localStorage");
              setLocation('/login');
              return;
            }

            const currentUser = JSON.parse(currentUserStr);
            console.log('🔍 ADMIN CONSOLE DEBUG - Parsed currentUser:', currentUser);

            if (!currentUser || !currentUser.isAuthenticated) {
              console.error("❌ ADMIN CONSOLE DEBUG - User not authenticated");
              setLocation('/login');
              return;
            }

            console.log('🔍 ADMIN CONSOLE DEBUG - Role check:',currentUser.role, {
              userRole: currentUser.role,
              expectedRole: UserRole.PLATFORM_ADMIN,
              isMatch: currentUser.role === UserRole.PLATFORM_ADMIN || currentUser.role === 'platform_admin'
            });

            // FIX: Check for platform_admin role (consistent with schema)
            if (currentUser.role !== UserRole.PLATFORM_ADMIN && currentUser.role !== 'platform_admin' && currentUser.role !== 'admin') {
              console.error("❌ ADMIN CONSOLE DEBUG - User doesn't have admin permissions", currentUser.role);
              toast({
                title: "Access Denied",
                description: "You don't have permission to access the admin console.",
                variant: "destructive"
              });
              setLocation('/dashboard');
              return;
            }

            console.log('✅ ADMIN CONSOLE DEBUG - User has admin access, setting authenticated to true');
            // User has admin access
            setIsAuthenticated(true);
          } catch (error) {
            console.error("❌ ADMIN CONSOLE DEBUG - Error verifying admin access:", error);
            setLocation('/login');
          } finally {
            setIsLoading(false);
          }
        };

        if (isMounted) {
          verifyAdminAccess();
        }
      }, [setLocation, isMounted]);



  // Get the section from the URL if exists, otherwise default to "dashboard"
  const getInitialSection = () => {
    const path = location.split("/");
    const section = path[path.length - 1];
    if (section && section !== "admin") {
      return section;
    }
    return "dashboard";
  };

  useEffect(() => {
    setActiveTab(getInitialSection());
  }, [location]);

  // If still loading, show loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated as admin, this will redirect via the useEffect

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setLocation(`/admin/${tab === "dashboard" ? "" : tab}`);
  };

  return (
    <div id="admin-console-root" className="container px-4 py-6 mx-auto max-w-[1400px]" tabIndex={0} style={{ outline: 'none' }}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Console</h1>
            <p className="text-muted-foreground mt-1">
              Manage all aspects of the PersonalysisPro platform
            </p>
          </div>

        <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                setActiveTab("licenses");
                handleTabChange("licenses");
                // Allow time for tab change then open dialog
                setTimeout(() => {
                  const createLicenseButton = document.querySelector('[data-create-license-button="true"]') as HTMLButtonElement;
                  if (createLicenseButton) createLicenseButton.click();
                }, 100);
              }}
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
                className="mr-1"
              >
                <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"></path>
              </svg>
              Create License
            </Button>
            <Button
              onClick={() => {
                setActiveTab("clients");
                handleTabChange("clients");
                // Allow time for tab change then open dialog
                setTimeout(() => {
                  const addClientButton = document.querySelector('[data-add-client-button="true"]') as HTMLButtonElement;
                  if (addClientButton) addClientButton.click();
                }, 100);
              }}
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
                className="mr-1"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Add Client
            </Button>
            <Button 
              variant="destructive"
              onClick={async () => {
                // Use centralized logout function
                await performLogout({
                  showToast: true,
                  reason: 'You have been successfully logged out.',
                  redirectTo: '/login'
                });
              }}
              className="ml-2"
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
                className="mr-1"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <div className="border-b">
              <div className="flex flex-col gap-2">
                <TabsList className="h-auto bg-transparent gap-1 flex flex-wrap p-1.5 w-full justify-start">
                  <TabsTrigger 
                    value="dashboard"
                    className="h-8 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent flex items-center gap-1 whitespace-nowrap px-3 text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4 shrink-0"
                    >
                      <rect width="7" height="9" x="3" y="3" rx="1"></rect>
                      <rect width="7" height="5" x="14" y="3" rx="1"></rect>
                      <rect width="7" height="9" x="14" y="12" rx="1"></rect>
                      <rect width="7" height="5" x="3" y="16" rx="1"></rect>
                    </svg>
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger 
                    value="clients"
                    className="h-8 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent flex items-center gap-1 whitespace-nowrap px-3 text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4 shrink-0"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    Clients
                  </TabsTrigger>
                  <TabsTrigger 
                    value="licenses"
                    className="h-8 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent flex items-center gap-1 whitespace-nowrap px-3 text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4 shrink-0"
                    >
                      <rect width="20" height="12" x="2" y="6" rx="2"></rect>
                      <path d="M14 2v4"></path>
                      <path d="M10 2v4"></path>
                      <circle cx="8" cy="12" r="2"></circle>
                      <path d="M13.3 12h2.4"></path>
                      <path d="M13.3 16h2.4"></path>
                      <path d="M17.7 12h.3"></path>
                      <path d="M17.7 16h.3"></path>
                    </svg>
                    Licenses
                  </TabsTrigger>
                  <TabsTrigger 
                    value="templates"
                    className="h-8 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent flex items-center gap-1 whitespace-nowrap px-3 text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4 shrink-0"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <path d="M8 13h2"></path>
                      <path d="M8 17h2"></path>
                      <path d="M14 13h2"></path>
                      <path d="M14 17h2"></path>
                    </svg>
                    Templates
                  </TabsTrigger>
                  <TabsTrigger 
                    value="support"
                    className="h-8 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent flex items-center gap-1 whitespace-nowrap px-3 text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4 shrink-0"
                    >
                      <path d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0z"></path>
                    </svg>
                    Support
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analytics"
                    className="h-8 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent flex items-center gap-1 whitespace-nowrap px-3 text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4 shrink-0"
                    >
                      <path d="M3 3v18h18"></path>
                      <path d="m19 9-5 5-4-4-3 3"></path>
                    </svg>
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger 
                    value="billing"
                    className="h-8 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent flex items-center gap-1 whitespace-nowrap px-3 text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4 shrink-0"
                    >
                      <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                      <line x1="2" x2="22" y1="10" y2="10"></line>
                    </svg>
                    Billing
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notifications"
                    className="h-8 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent flex items-center gap-1 whitespace-nowrap px-3 text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4 shrink-0"
                    >
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                    </svg>
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger 
                    value="auditlogs"
                    className="h-8 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent flex items-center gap-1 whitespace-nowrap px-3 text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4 shrink-0"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <path d="M14 2v6h6"></path>
                      <path d="M16 13H8"></path>
                      <path d="M16 17H8"></path>
                      <path d="M10 9H8"></path>
                    </svg>
                    Audit Logs
                  </TabsTrigger>
                  <TabsTrigger 
                    value="responses"
                    className="h-8 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent flex items-center gap-1 whitespace-nowrap px-3 text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4 shrink-0"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      <line x1="9" y1="10" x2="15" y2="10"></line>
                      <line x1="12" y1="7" x2="12" y2="13"></line>
                    </svg>
                    Responses
                  </TabsTrigger>
                  <TabsTrigger 
                    value="demo-request"
                    className="h-8 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent flex items-center gap-1 whitespace-nowrap px-3 text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4 shrink-0"
                    >
                      <path d="M5.5 5.1L2 12v6c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2v-6l-3.4-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8 1.1z"></path>
                      <path d="M12 12v4"></path>
                      <path d="M12 12h4"></path>
                    </svg>
                    Demo Requests
                  </TabsTrigger>
                  <TabsTrigger 
                    value="integrations"
                    className="h-8 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent flex items-center gap-1 whitespace-nowrap px-3 text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4 shrink-0"
                    >
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    Integrations
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings"
                    className="h-8 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent flex items-center gap-1 whitespace-nowrap px-3 text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4 shrink-0"
                    >
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Settings
                  </TabsTrigger>
                  <TabsTrigger 
                    value="demodata"
                    className="h-8 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent flex items-center gap-1 whitespace-nowrap px-3 text-sm font-semibold"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4 shrink-0"
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
                      <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
                      <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                    DEMO DATA
                  </TabsTrigger>
                  <TabsTrigger 
                    value="backup"
                    className="h-8 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent flex items-center gap-1 whitespace-nowrap px-3 text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4 shrink-0"
                    >
                      <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1"></path>
                      <path d="M6 17v3"></path>
                      <path d="M10 17v3"></path>
                    </svg>
                    Backup
                  </TabsTrigger>
                  <TabsTrigger 
                    value="blog"
                    className="h-8 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none bg-transparent flex items-center gap-1 whitespace-nowrap px-3 text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4 shrink-0"
                    >
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                    </svg>
                    Blog
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="dashboard" className="space-y-6">
              {/* Time Range Selector (moved from header) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  <span>Time Range</span>
                </div>
                <div className="w-[220px]">
                  <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1week">Last Week</SelectItem>
                      <SelectItem value="1month">Last Month</SelectItem>
                      <SelectItem value="3months">Last 3 Months</SelectItem>
                      <SelectItem value="6months">Last 6 Months</SelectItem>
                      <SelectItem value="12months">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Key Metrics Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isAnalyticsLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg" />
                  ))
                ) : analyticsError ? (
                  <Card className="col-span-full">
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">
                        Analytics data unavailable. Please check API access.
                      </p>
                    </CardContent>
                  </Card>
                ) : analyticsData?.keyMetrics ? (
                  analyticsData.keyMetrics.map((metric: any) => (
                    <Card key={metric.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex flex-col space-y-1.5">
                          <p className="text-sm text-muted-foreground">{metric.metric}</p>
                          <div className="flex items-baseline justify-between">
                            <h3 className="text-2xl font-bold">
                              {metric.id === 'mrr' ? '$' : ''}{Number.isFinite(metric.value) ? metric.value.toLocaleString() : '0'}
                              {metric.id === 'churn-rate' ? '%' : ''}
                            </h3>
                            <div className={`flex items-center ${metric.trend === 'up' ? (metric.id === 'churn-rate' ? 'text-destructive' : 'text-green-600') : (metric.id === 'churn-rate' ? 'text-green-600' : 'text-destructive')}`}>
                              {metric.trend === 'up' ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="w-4 h-4 mr-1"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M12 7a1 1 0 01-1-1V5H9a1 1 0 01-1-1 1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1zm-8 5a1 1 0 011-1h3a1 1 0 110 2H5a1 1 0 01-1-1zm15-4a1 1 0 01-1 1H5a1 1 0 01-1-1 1 1 0 011-1h13a1 1 0 011 1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="w-4 h-4 mr-1"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M12 13a1 1 0 01-1 1v1a1 1 0 11-2 0v-1a1 1 0 01-1-1 1 1 0 011-1h2a1 1 0 011 1zm-8-5a1 1 0 011-1h3a1 1 0 110 2H5a1 1 0 01-1-1zm15-4a1 1 0 01-1 1H5a1 1 0 01-1-1 1 1 0 011-1h13a1 1 0 011 1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                              <span className="text-sm font-medium">
                                {Math.abs(metric.change).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="col-span-full">
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No analytics data available</p>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Client Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Client Growth</CardTitle>
                  <CardDescription>Total client acquisition and retention over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {isAnalyticsLoading ? (
                    <Skeleton className="h-80 w-full" />
                  ) : analyticsData?.clientGrowth ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={analyticsData.clientGrowth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="activeClients" name="Active Clients" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="newClients" name="New Clients" stroke="#10b981" strokeWidth={2} />
                        <Line type="monotone" dataKey="churnedClients" name="Churned Clients" stroke="#ef4444" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-80 flex items-center justify-center">
                      <p className="text-muted-foreground">Client growth data unavailable</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                  <CardDescription>Monthly revenue breakdown by type</CardDescription>
                </CardHeader>
                <CardContent>
                  {isAnalyticsLoading ? (
                    <Skeleton className="h-80 w-full" />
                  ) : analyticsData?.revenue ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={analyticsData.revenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, undefined]} />
                        <Legend />
                        <Bar dataKey="subscriptionRevenue" name="Subscription Revenue" fill="#3b82f6" />
                        <Bar dataKey="oneTimeRevenue" name="One-time Revenue" fill="#10b981" />
                        <Line type="monotone" dataKey="totalRevenue" name="Total Revenue" stroke="#6366f1" strokeWidth={2} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-80 flex items-center justify-center">
                      <p className="text-muted-foreground">Revenue data unavailable</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Industry Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Industry Distribution</CardTitle>
                    <CardDescription>Client distribution by industry</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isAnalyticsLoading ? (
                      <Skeleton className="h-60 w-full" />
                    ) : analyticsData?.industryBreakdown ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analyticsData.industryBreakdown}
                            cx="50%"
                            cy="50%"
                            outerRadius={110}
                            innerRadius={60}
                            labelLine={false}
                            dataKey="clients"
                            nameKey="name"
                            label={({ name, percent }) => {
                              const pct = (percent || 0) * 100;
                              return pct >= 8 ? `${name}: ${pct.toFixed(0)}%` : '';
                            }}
                          >
                            {analyticsData.industryBreakdown.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name, props) => [
                              `${value} clients`,
                              props.payload.name
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-60 flex items-center justify-center">
                        <p className="text-muted-foreground">Industry data unavailable</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Industry</CardTitle>
                    <CardDescription>Monthly revenue breakdown by industry</CardDescription>
                  </CardHeader>
                  <CardContent>
                  {isAnalyticsLoading ? (
                      <Skeleton className="h-60 w-full" />
                    ) : analyticsData?.industryBreakdown ? (
                      (() => {
                        const names = (analyticsData.industryBreakdown || []).map((d: any) => String(d.name || ''));
                        const maxLen = names.reduce((m: number, s: string) => Math.max(m, s.length), 0);
                        const yWidth = Math.min(160, Math.max(80, maxLen * 7));
                        return (
                        <ResponsiveContainer width="100%" height={300}>
                        <BarChart layout="vertical" data={analyticsData.industryBreakdown} margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={yWidth} tickLine={false} axisLine={false} />
                          <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, undefined]} />
                          <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                        );
                      })()
                    ) : (
                      <div className="h-60 flex items-center justify-center">
                        <p className="text-muted-foreground">Revenue by industry data unavailable</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* System Health Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    System Health
                    <div className={`w-2 h-2 rounded-full ${
                      (perfData?.health.status ?? 'unknown') === 'healthy' ? 'bg-green-500' : 
                      (perfData?.health.status ?? 'unknown') === 'degraded' ? 'bg-amber-500' : 
                      'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-normal text-muted-foreground">
                      {isConnected ? 'Live' : 'Offline'}
                    </span>
                  </CardTitle>
                  <CardDescription>Real-time performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="text-sm font-medium text-muted-foreground mb-1">CPU Usage</div>
                      <div className="text-2xl font-bold">{Math.round(perfData?.cpu.usage ?? 0)}%</div>
                      <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                        <div 
                          className={`h-2 rounded-full ${(perfData?.cpu.usage ?? 0) > 80 ? 'bg-red-500' : (perfData?.cpu.usage ?? 0) > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(perfData?.cpu.usage ?? 0, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Memory Usage</div>
                      <div className="text-2xl font-bold">{Math.round(perfData?.memory.usage ?? 0)}%</div>
                      <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                        <div 
                          className={`h-2 rounded-full ${(perfData?.memory.usage ?? 0) > 90 ? 'bg-red-500' : (perfData?.memory.usage ?? 0) > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(perfData?.memory.usage ?? 0, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Active Connections</div>
                      <div className="text-2xl font-bold">{perfData?.activeConnections.total ?? 0}</div>
                      <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                        <div 
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${Math.min((((perfData?.activeConnections.total ?? 0) / 50) * 100), 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="text-sm font-medium text-muted-foreground mb-1">System Status</div>
                      <div className="text-2xl font-bold capitalize">{perfData?.health.status ?? 'unknown'}</div>
                      <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (perfData?.health.status ?? 'unknown') === 'healthy' ? 'bg-green-500' : 
                            (perfData?.health.status ?? 'unknown') === 'degraded' ? 'bg-amber-500' : 
                            'bg-red-500'
                          }`}
                          style={{ width: (perfData?.health.status ?? 'unknown') === 'healthy' ? '100%' : (perfData?.health.status ?? 'unknown') === 'degraded' ? '60%' : '20%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Support and Licenses Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Recent Support Tickets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isTicketsLoading ? (
                      <div className="space-y-3">
                        {Array(3).fill(0).map((_, i) => (
                          <Skeleton key={i} className="h-14 w-full" />
                        ))}
                      </div>
                    ) : ticketsError ? (
                      <div className="text-sm text-muted-foreground">Unable to load tickets.</div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {((ticketsData?.data || []).slice(0, 4)).map((t: any) => {
                            const p = String(t.priority || '').toLowerCase();
                            const dot = p === 'high' || p === 'urgent' ? 'bg-red-500' : p === 'medium' ? 'bg-amber-500' : 'bg-emerald-500';
                            return (
                              <div key={t.id} className="flex items-center gap-4">
                                <div className={`w-2 h-2 rounded-full ${dot}`}></div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium truncate">{t.subject || 'Ticket'}</div>
                                  <div className="text-sm text-muted-foreground truncate">{t.clientName || 'Unknown Client'} - {new Date(t.createdAt).toLocaleString()}</div>
                                </div>
                                <div>
                                  <Button variant="ghost" size="sm" onClick={() => { setPendingTicketId(t.id); handleTabChange('support'); }}>View</Button>
                                </div>
                              </div>
                            );
                          })}
                          {((ticketsData?.data || []).slice(0, 4)).length === 0 && (
                            <div className="text-sm text-muted-foreground">No recent tickets.</div>
                          )}
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <Button variant="outline" size="sm" className="w-full" onClick={() => handleTabChange('support')}>View All Tickets</Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Expiring Licenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLicLoading ? (
                      <div className="space-y-3">
                        {Array(3).fill(0).map((_, i) => (
                          <Skeleton key={i} className="h-14 w-full" />
                        ))}
                      </div>
                    ) : licError ? (
                      <div className="text-sm text-muted-foreground">Unable to load licenses.</div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {(() => {
                            const allLicenses = licensesData?.data || [];
                            const now = new Date();
                            const inDays = (dateStr: string | null) => {
                              if (!dateStr) return Infinity;
                              const d = new Date(dateStr);
                              return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            };
                            const expiring = allLicenses
                              .filter((l: any) => (l.endDate && inDays(l.endDate) <= 30) || (l.status && String(l.status).toLowerCase() === 'expired'))
                              .sort((a: any, b: any) => inDays(a.endDate) - inDays(b.endDate))
                              .slice(0, 4);
                            const dot = (days: number) => days <= 7 ? 'bg-red-500' : 'bg-amber-500';
                            return expiring.map((l: any) => {
                              const days = inDays(l.endDate || null);
                              return (
                                <div key={l.id} className="flex items-center gap-4">
                                  <div className={`w-2 h-2 rounded-full ${dot(days)}`}></div>
                                  <div className="flex-1">
                                    <div className="text-sm font-medium truncate">{l.name || 'License'}</div>
                                    <div className="text-sm text-muted-foreground truncate">{(l.plan || 'Plan')} - {isFinite(days) ? `Expires in ${days} day${days === 1 ? '' : 's'}` : 'No expiry'}</div>
                                  </div>
                                  <div>
                                    <Button variant="ghost" size="sm" onClick={() => { setPendingLicenseId(l.id); handleTabChange('licenses'); }}>View</Button>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                          {(() => {
                            const allLicenses = licensesData?.data || [];
                            const now = new Date();
                            const inDays = (dateStr: string | null) => {
                              if (!dateStr) return Infinity;
                              const d = new Date(dateStr);
                              return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            };
                            const expiring = allLicenses
                              .filter((l: any) => (l.endDate && inDays(l.endDate) <= 30) || (l.status && String(l.status).toLowerCase() === 'expired'))
                              .sort((a: any, b: any) => inDays(a.endDate) - inDays(b.endDate))
                              .slice(0, 4);
                            return expiring.length === 0 ? (
                              <div className="text-sm text-muted-foreground">No licenses expiring soon.</div>
                            ) : null;
                          })()}
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <Button variant="outline" size="sm" className="w-full" onClick={() => handleTabChange('licenses')}>View All Expiring Licenses</Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="clients">
              <ClientManagement />
            </TabsContent>

            <TabsContent value="licenses">
              <LicenseManagement initialOpenLicenseId={pendingLicenseId || undefined} />
            </TabsContent>

            <TabsContent value="templates">
              {viewingAnalytics ? (
                <div className="space-y-4">
                  <Button
                    variant="ghost"
                    onClick={() => setViewingAnalytics(null)}
                    className="mb-4"
                  >
                    ← Back to Survey Management
                  </Button>
                  <AdminSurveyAnalytics surveyId={viewingAnalytics} onBack={() => setViewingAnalytics(null)} />
                </div>
              ) : (
                <Tabs defaultValue="templates">
                  <TabsList className="w-full">
                    <TabsTrigger value="templates">Survey Templates</TabsTrigger>
                    <TabsTrigger value="survey-management">Survey Management</TabsTrigger>
                  </TabsList>
                  <TabsContent value="templates">
                    <SurveyTemplates />
                  </TabsContent>
                  <TabsContent value="survey-management">
                    <SurveyManagement onViewAnalytics={(surveyId: number) => setViewingAnalytics(surveyId)} />
                  </TabsContent>
                </Tabs>
              )}
            </TabsContent>

            <TabsContent value="support">
              <Tabs defaultValue="tickets">
                <TabsList className="w-full">
                  <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
                  <TabsTrigger value="client-support">Client Support</TabsTrigger>
                </TabsList>
                <TabsContent value="tickets">
                  <SupportTickets initialOpenTicketId={pendingTicketId || undefined} />
                </TabsContent>
                <TabsContent value="client-support">
                  <ClientSupport />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="analytics">
              <PlatformAnalytics 
                timePeriod={timeRange as any} 
                onTimePeriodChange={(v) => setTimeRange(v as any)}
              />
            </TabsContent>

            <TabsContent value="billing">
              <BillingManagement />
            </TabsContent>

            <TabsContent value="notifications">
              <NotificationCenter />
            </TabsContent>

            <TabsContent value="auditlogs">
              <AuditLogs />
            </TabsContent>

            <TabsContent value="responses">
              <AdminResponsesViewer />
            </TabsContent>
            
            <TabsContent value="demo-request">
              <DemoRequestManagement />
            </TabsContent>

            <TabsContent value="integrations">
              <IntegrationsManager />
            </TabsContent>

            <TabsContent value="settings">
              <SystemSettings />
            </TabsContent>
            
            <TabsContent value="backup" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Backup & Restore</CardTitle>
                  <CardDescription>Manage system backups and restore points</CardDescription>
                </CardHeader>
                <CardContent>
                  <BackupManager />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="demodata" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Demo Data Generator</CardTitle>
                  <CardDescription>Generate test data for development and testing purposes</CardDescription>
                </CardHeader>
                <CardContent>
                  <DemoDataGenerator />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="blog" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Blog Management</CardTitle>
                  <CardDescription>Manage blog articles and categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <BlogManagement />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default AdminConsole;
