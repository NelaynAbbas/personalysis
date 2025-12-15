// Initialize i18n FIRST - must be before all other imports
import './config/i18n';

import { useEffect, useState, useRef, useCallback } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { ToastProvider } from "./hooks/use-toast";
import { useToast } from "./hooks/use-toast";
import NotFound from "./pages/not-found";
import Home from "./pages/Home";
import SurveyPage from "./pages/SurveyPage";
import ResultsPage from "./pages/ResultsPage";
import Dashboard from "./pages/Dashboard";
import SurveyCustomize from "./pages/SurveyCustomize";
import SurveyDetail from "./pages/SurveyDetail";
import AboutUs from "./pages/AboutUs";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import SurveyShare from "./pages/SurveyShare";
import SurveyCreate from "./pages/SurveyCreate";
import TemplatePreview from "./pages/TemplatePreview";
import SurveyEdit from "./pages/SurveyEdit";
import SurveyCollaboration from "./pages/SurveyCollaboration";
import AIResponsesPage from "./pages/AIResponsesPage";
import UseCases from "./pages/UseCases";
import Login from "./pages/Login";
import HowItWorks from "./pages/HowItWorks";
import Documentation from "./pages/Documentation";
import Careers from "./pages/Careers";
import Press from "./pages/Press";
import ContactUs from "./pages/ContactUs";
import ContactPage from "./pages/ContactPage";
import AdminConsole from "./pages/AdminConsole";
import AdminSurveyAnalytics from "./pages/AdminSurveyAnalytics";
import AnonymousSurvey from "./pages/AnonymousSurvey";
import BusinessContexts from "./pages/BusinessContexts";
import SharedReport from "./pages/SharedReport";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import CookieConsent from "./components/CookieConsent";
import { useCookieConsent } from "./hooks/useCookieConsent";

import { AccessibilityProvider, SkipToContentLink } from "./hooks/use-accessibility";
import { getWebSocketService } from "./lib/websocketService";
import { updateQueryCache } from "./lib/queryClient";
import { useRealtime } from "./hooks/useRealtime";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { LanguageProvider } from "./context/LanguageContext";

// Admin redirect component to protect the admin routes
function AdminRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    console.log('🔍 ADMIN REDIRECT DEBUG - AdminRedirect component triggered');

    // Check if user is already authenticated as admin
    const currentUserStr = localStorage.getItem('currentUser');
    console.log('🔍 ADMIN REDIRECT DEBUG - currentUser from localStorage:', currentUserStr);

    let currentUser;

    try {
      currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
      console.log('🔍 ADMIN REDIRECT DEBUG - Parsed currentUser:', currentUser);
    } catch (error) {
      console.error("❌ ADMIN REDIRECT DEBUG - Error parsing user data:", error);
      setLocation('/login');
      return;
    }

    // If no user or not authenticated, redirect to login
    if (!currentUser || !currentUser.isAuthenticated) {
      console.log('❌ ADMIN REDIRECT DEBUG - No user or not authenticated, redirecting to login');
      setLocation('/login');
      return;
    }

    console.log('🔍 ADMIN REDIRECT DEBUG - User role check:', {
      userRole: currentUser.role,
      expectedRole: 'platform_admin',
      isMatch: currentUser.role === 'platform_admin'
    });

    // FIX: Check for platform_admin role (consistent with schema)
    if (currentUser.role !== 'platform_admin' && currentUser.role !== 'admin') {
      console.log('❌ ADMIN REDIRECT DEBUG - User role does not match platform_admin or admin, redirecting to dashboard');
      setLocation('/dashboard');
      return;
    }

    console.log('✅ ADMIN REDIRECT DEBUG - User has correct admin role, allowing access to admin console');
  }, [setLocation]);

  // Return AdminConsole if we didn't redirect
  return <AdminConsole />;
}

// Define the base page props types
type SurveyPageProps = {
  id?: string;
};

type ResultsPageProps = {
  sessionId?: string;
};

// WebSocket connection component that initializes the real-time connection
// and handles app-wide connection status
function WebSocketConnectionManager() {
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState(false);
  const connectionAttempts = useRef(0);
  
  // Hook into connection status for WebSocket
  const { connected } = useRealtime('connection', (data) => {
    // Only update if the connected property exists
    if (data && typeof data.connected !== 'undefined') {
      setConnectionStatus(data.connected);
      
      console.log('WebSocket connection status changed:', data.connected);
      
      // Reset connection attempts on successful connection
      if (data.connected) {
        connectionAttempts.current = 0;
        
        // Only show a toast after reconnection, not on initial connect
        if (connectionAttempts.current > 0) {
          toast({
            title: "Connection Restored",
            description: "Real-time updates are now available.",
            duration: 3000,
          });
        }
      }
      // Only show a toast for disconnection events to avoid annoying the user on initial connect
      else if (connectionAttempts.current > 0) {
        connectionAttempts.current++;
        toast({
          title: "Connection Lost",
          description: "Real-time updates are temporarily unavailable. Reconnecting...",
          variant: "destructive",
        });
      }
    }
  });
  
  // Setup license update handling
  useRealtime('licenseUpdate', (data) => {
    console.log('Received license update:', data);
    
    // If this is a license validation failure, show a toast
    if (data?.action === 'validation_failed') {
      toast({
        title: "License Issue",
        description: data.message || "There was an issue with your license. Some features may be unavailable.",
        variant: "destructive",
      });
    } 
    // If it's a successful validation or update, update the cache
    else if (data?.action === 'validation_success' || data?.action === 'update') {
      // Show toast for license updates if needed
      if (data?.action === 'update') {
        toast({
          title: "License Updated",
          description: "Your license information has been updated.",
          duration: 3000,
        });
      }
      
      // Update cache with the received data
      updateQueryCache('licenseUpdate', data);
    }
  });
  
  // Setup business context update handling
  useRealtime('businessContextUpdate', (data) => {
    console.log('Received business context update:', data);
    updateQueryCache('businessContextUpdate', data);
  });
  
  // Setup survey update handling
  useRealtime('surveyUpdate', (data) => {
    console.log('Received survey update:', data);
    updateQueryCache('surveyUpdate', data);
  });
  
  // Setup survey analytics update handling
  useRealtime('surveyAnalyticsUpdate', (data) => {
    console.log('Received survey analytics update:', data);
    updateQueryCache('surveyAnalyticsUpdate', data);
  });
  
  // Setup support ticket update handling
  useRealtime('supportTicketUpdate', (data) => {
    console.log('Received support ticket update:', data);
    
    // Show toast for ticket updates
    if (data?.action) {
      let title = "Support Ticket";
      let description = "";
      
      switch (data.action) {
        case 'create':
          title = "New Support Ticket";
          description = "A new support ticket has been created.";
          break;
        case 'update':
          title = "Ticket Updated";
          description = "A support ticket has been updated.";
          break;
        case 'comment':
          title = "New Comment";
          description = "A new comment has been added to your ticket.";
          break;
        case 'status_change':
          title = "Ticket Status Changed";
          description = `Ticket #${data.ticketId} is now ${data.status}.`;
          break;
        case 'assignment':
          title = "Ticket Assigned";
          description = "A support ticket has been assigned.";
          break;
      }
      
      toast({
        title,
        description,
        duration: 5000,
      });
      
      // Update cache with the received data
      updateQueryCache('supportTicketUpdate', data);
    }
  });
  
  // Setup notification handling
  useRealtime('notificationUpdate', (data) => {
    console.log('Received notification update:', data);
    
    if (data) {
      toast({
        title: data.title || "Notification",
        description: data.message,
        variant: data.type === 'error' ? 'destructive' : 'default',
        duration: 5000,
      });
    }
  });
  
  return null; // This is a "headless" component that doesn't render any UI
}

function App() {
  const { updatePreferences } = useCookieConsent();

  // Initialize Google Analytics when app loads
  useEffect(() => {
    // Verify required environment variable is present
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
    }
  }, []);

  // Handle cookie consent changes and save to backend
  const handleCookieConsentChange = useCallback(async (preferences: any) => {
    // Only save if this is a new preference change, not a repeated call
    const existingConsent = localStorage.getItem('cookie-consent');
    if (existingConsent) {
      try {
        const parsed = JSON.parse(existingConsent);
        // If preferences haven't changed, don't make API call
        if (JSON.stringify(parsed.preferences) === JSON.stringify(preferences)) {
          return;
        }
      } catch (error) {
        console.error('Error parsing existing consent:', error);
      }
    }
    
    try {
      // Generate a session ID for anonymous users
      const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      const response = await fetch('/api/cookie-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          necessary: preferences.necessary,
          analytics: preferences.analytics,
          marketing: preferences.marketing,
          functional: preferences.functional,
          consentVersion: '1.0'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save cookie preferences');
      }
    } catch (error) {
      console.error('Error saving cookie consent:', error);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <ToastProvider>
          <AccessibilityProvider>
            <AuthProvider>
              <LanguageProvider>
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
                  {/* Skip link for keyboard users */}
                  <SkipToContentLink />

                  {/* Initialize WebSocket connection */}
                  <WebSocketConnectionManager />

                  {/* Main Router with Analytics Tracking */}
                  <RouterWithAnalytics />

                  {/* Cookie Consent Banner - Global across all pages */}
                  <CookieConsent />

                  <Toaster />
                </div>
              </LanguageProvider>
            </AuthProvider>
          </AccessibilityProvider>
        </ToastProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

// Router component that handles analytics tracking
function RouterWithAnalytics() {
  // Track page views when routes change
  useAnalytics();
  const { isAuthenticated } = useAuth();
  
  return (
    <Switch>
              {/* Main Site Routes */}
          <Route path="/dashboard">
            <Header />
            <Dashboard />
            {!isAuthenticated ? <Footer /> : null}
          </Route>
          
          {/* Redirect typo in URL from /dahsboard to /dashboard */}
          <Route path="/dahsboard">
            {() => {
              const [, setLocation] = useLocation();
              useEffect(() => {
                setLocation('/dashboard');
              }, [setLocation]);
              return <div className="min-h-screen flex justify-center items-center">Redirecting...</div>;
            }}
          </Route>
          
          <Route path="/survey/customize">
            <Header />
            <SurveyCustomize />
            {!isAuthenticated ? <Footer /> : null}
          </Route>
          
          <Route path="/survey/create">
            <Header />
            <SurveyCreate />
            {!isAuthenticated ? <Footer /> : null}
          </Route>

          <Route path="/templates/:id/view">
            <Header />
            <TemplatePreview />
            <Footer />
          </Route>
          
          <Route path="/survey/share/:id">
            {() => (
              <>
                <Header />
                <SurveyShare />
              </>
            )}
          </Route>
          
          <Route path="/collaboration/:id">
            {(params) => (
              <>
                <Header />
                <SurveyCollaboration />
                {!isAuthenticated ? <Footer /> : null}
              </>
            )}
          </Route>
          
          <Route path="/collaboration">
            <Header />
            <SurveyCollaboration />
            {!isAuthenticated ? <Footer /> : null}
          </Route>
          
          <Route path="/business-contexts">
            <Header />
            <BusinessContexts />
            <Footer />
          </Route>
          
          <Route path="/dashboard/survey/:id/edit">
            {(params) => (
              <>
                <Header />
                <SurveyEdit />
                {!isAuthenticated ? <Footer /> : null}
              </>
            )}
          </Route>

          <Route path="/dashboard/survey/:id">
            {(params) => (
              <>
                <Header />
                <SurveyDetail id={params.id} />
                {!isAuthenticated ? <Footer /> : null}
              </>
            )}
          </Route>

          <Route path="/dashboard/survey/:id/ai-responses">
            {(params) => (
              <>
                <Header />
                <AIResponsesPage surveyId={params.id} />
                {!isAuthenticated ? <Footer /> : null}
              </>
            )}
          </Route>
          
          <Route path="/survey">
            <Header />
            <SurveyPage />
            <Footer />
          </Route>
          
          <Route path="/">
            <Header />
            <Home />
            <Footer />
          </Route>
          
          <Route path="/results/:sessionId">
            <>
              <Header />
              <ResultsPage />
              <Footer />
            </>
          </Route>
          
          <Route path="/about">
            <Header />
            <AboutUs />
            <Footer />
          </Route>
          
          <Route path="/about-us">
            <Header />
            <AboutUs />
            <Footer />
          </Route>
          
          <Route path="/how-it-works">
            <Header />
            <HowItWorks />
            <Footer />
          </Route>
          
          <Route path="/blog/:slug">
            {(params) => (
              <>
                <Header />
                <BlogArticle />
                <Footer />
              </>
            )}
          </Route>
          
          <Route path="/blog">
            <Header />
            <Blog />
            <Footer />
          </Route>
          
          <Route path="/privacy">
            <Header />
            <PrivacyPolicy />
            <Footer />
          </Route>
          
          <Route path="/terms">
            <Header />
            <TermsOfService />
            <Footer />
          </Route>
          
          <Route path="/cookies">
            <Header />
            <CookiePolicy />
            <Footer />
          </Route>
          
          <Route path="/documentation">
            <Header />
            <Documentation />
            <Footer />
          </Route>
          
          <Route path="/careers">
            <Header />
            <Careers />
            <Footer />
          </Route>
          
          <Route path="/press">
            <Header />
            <Press />
            <Footer />
          </Route>
          
          <Route path="/contact">
            <Header />
            <ContactPage />
            <Footer />
          </Route>
          
          <Route path="/contact-us">
            <Header />
            <ContactUs />
            <Footer />
          </Route>
          
          <Route path="/login">
            <Header />
            <Login />
            <Footer />
          </Route>
          
          <Route path="/reset-password">
            <Header />
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
              <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-xl shadow-xl">
                <h1 className="text-2xl font-bold text-center text-primary">Reset Password</h1>
                <p className="text-center text-gray-600">Enter your email address to recover your account</p>
                <div className="space-y-4">
                  <input type="email" placeholder="Your registered email" className="w-full p-3 border rounded-md" />
                  <button className="w-full p-3 bg-primary text-white rounded-md hover:bg-primary-dark">
                    Send Recovery Link
                  </button>
                </div>
                <div className="text-center mt-4">
                  <span 
                    onClick={() => window.history.back()} 
                    className="text-sm text-primary hover:underline cursor-pointer"
                  >
                    Return to login
                  </span>
                </div>
              </div>
            </div>
            <Footer />
          </Route>
          
          {/* Admin Survey Analytics Route - No header/footer */}
          <Route path="/admin/analyze-survey/:id">
            {(params) => (
              <AdminSurveyAnalytics />
            )}
          </Route>

          {/* Admin Console Routes */}
          <Route path="/admin/:section*">
            <AdminRedirect />
          </Route>
          
          <Route path="/admin">
            <AdminRedirect />
          </Route>
          
          {/* Use Cases Route */}
          <Route path="/use-cases">
            <>
              <Header />
              <UseCases />
              <Footer />
            </>
          </Route>
          
          {/* Anonymous Survey Route - No Header/Footer for White Labeling */}
          <Route path="/take-survey/:shareId">
            {(params) => (
              <AnonymousSurvey shareId={params.shareId} />
            )}
          </Route>
          
          {/* Shared Report Route - Public access with token */}
          <Route path="/shared-report/:token">
            {(params) => (
              <SharedReport />
            )}
          </Route>
          
          <Route path="/social/:platform">
            {(params) => (
              <>
                <Header />
                <div className="p-8 text-center">
                  <h1 className="text-2xl font-bold">Social Media Page</h1>
                  <p>This social media page will be implemented in the future.</p>
                  <p>Platform: {params.platform}</p>
                </div>
                <Footer />
              </>
            )}
          </Route>
          
          
          {/* Fallback route */}
          <Route>
            <Header />
            <NotFound />
            <Footer />
          </Route>
        </Switch>
    );
}

export default App;
