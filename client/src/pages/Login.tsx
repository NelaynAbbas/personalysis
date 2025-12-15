
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
// Tabs removed since only login is available now
import { UserRole, SubscriptionTier } from "@shared/schema";
import { Building, User, Shield, CreditCard, AlertCircle, Loader2, Info, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { EnhancedFormField } from "@/components/ui/enhanced-form-field";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

// Login form validation schema
const loginSchema = z.object({
  username: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Registration form validation schema
const registerSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required" }),
  lastName: z.string().min(2, { message: "Last name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  companyName: z.string().min(2, { message: "Company name is required" }),
  industry: z.string().min(1, { message: "Please select an industry" }),
  companySize: z.string().min(1, { message: "Please select company size" }),
  jobTitle: z.string().min(2, { message: "Job title is required" }),
  subscriptionTier: z.string(),
  terms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Login() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { setAuthenticated, setUser } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [formError, setFormError] = useState<string | null>(null);
  const [showDemoConfirmation, setShowDemoConfirmation] = useState(false);
  const [showHelpSheet, setShowHelpSheet] = useState(false);
  const [demoFirstName, setDemoFirstName] = useState('');
  const [demoLastName, setDemoLastName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoCompany, setDemoCompany] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [demoRole, setDemoRole] = useState('');
  const [demoIndustry, setDemoIndustry] = useState('');
  const [demoCompanySize, setDemoCompanySize] = useState('');
  const [demoMessage, setDemoMessage] = useState('');
  const [isSubmittingDemo, setIsSubmittingDemo] = useState(false);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      remember: false,
    },
  });

  // Registration is disabled - admin creates accounts directly
  // We're keeping the form type definition but not using the register form anymore

  const handleLogin = async (data: LoginFormValues) => {
    setIsLoggingIn(true);
    setFormError(null);
    
    try {
      // For demo purposes, we'll include special cases for demo and admin accounts
      if (data.username === "demo@personalysispro.com" && data.password === "demo123") {
        // Use the actual API login for demo user to get proper session
        try {
          const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              username: data.username,
              password: data.password,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Demo login failed');
          }

          const userData = await response.json();
          console.log('🔍 CLIENT DEBUG - Demo login response data:', userData);

          // Clear any previous user data before storing new user
          localStorage.removeItem('currentUser');
          sessionStorage.clear();
          queryClient.clear();

          // Store user data (server returns { user: {...}, session: {...} })
          if (!userData.user) {
            throw new Error('Invalid response: user data not found');
          }

          const userForStorage = {
            ...userData.user,
            isAuthenticated: true,
            loginTime: new Date().toISOString()
          };
          localStorage.setItem('currentUser', JSON.stringify(userForStorage));

          // Notify auth context immediately
          setAuthenticated(true);
          setUser({ id: userData.user.id, email: userData.user.email, role: userData.user.role, companyId: userData.user.companyId });
          window.dispatchEvent(new CustomEvent('auth:login', { detail: userForStorage }));

          // Successfully logged in
          setIsLoggingIn(false);

          // Redirect admin users to admin console, others to dashboard
          if (userData.user?.role === 'platform_admin' || userData.user?.role === 'admin') {
            setLocation('/admin');
          } else {
            setLocation('/dashboard');
          }

          toast({
            title: t('success.loginSuccess'),
            description: `${t('auth.login.welcome')}, ${userData.user?.firstName || userData.user?.username || 'User'}!`,
          });
        } catch (error: any) {
          console.error("Error with demo login:", error);
          setIsLoggingIn(false);
          setFormError(error.message || 'Demo login failed');
          toast({
            title: t('errors.error'),
            description: error.message || t('errors.somethingWentWrong'),
            variant: "destructive"
          });
        }
        return;
      }
      
      if (data.username === "admin@personalysispro.com" && data.password === "admin123") {
        // Use the actual API login for admin user to get proper session
        try {
          console.log('🔍 CLIENT DEBUG - Attempting hardcoded admin login');
          const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              username: data.username,
              password: data.password,
            }),
          });

          console.log('🔍 CLIENT DEBUG - Admin login response status:', response.status);
          if (!response.ok) {
            const errorData = await response.json();
            console.log('🔍 CLIENT DEBUG - Admin login error:', errorData);
            throw new Error(errorData.message || 'Admin login failed');
          }

          const userData = await response.json();
          console.log('🔍 CLIENT DEBUG - Admin login response data:', userData);

          // Clear any previous user data before storing new user
          localStorage.removeItem('currentUser');
          sessionStorage.clear();
          queryClient.clear(); // Clear React Query cache

          // Store user data in localStorage for client-side access
          const userForStorage = {
            ...userData.user,
            isAuthenticated: true,
            loginTime: new Date().toISOString()
          };
          localStorage.setItem('currentUser', JSON.stringify(userForStorage));
          setAuthenticated(true);
          setUser({ id: userData.user.id, email: userData.user.email, role: userData.user.role, companyId: userData.user.companyId });
          window.dispatchEvent(new CustomEvent('auth:login', { detail: userForStorage }));
          console.log('🔍 CLIENT DEBUG - Stored admin user in localStorage:', userForStorage);

          // Successfully logged in
          setIsLoggingIn(false);

          // FIX: Check for platform_admin role and redirect to /admin
          console.log('🔍 CLIENT DEBUG - Checking admin role:', userData.user?.role);
          if (userData.user?.role === 'platform_admin' || userData.user?.role === 'admin') {
            console.log('🔍 CLIENT DEBUG - Admin role confirmed, redirecting to /admin');
            setLocation('/admin');
          } else {
            console.log('🔍 CLIENT DEBUG - Admin role not found, redirecting to /dashboard');
            setLocation('/dashboard');
          }

          console.log('🔍 CLIENT DEBUG - Login response structure:', {
            userData,
            userDataUser: userData.user,
            userDataUserFirstName: userData.user?.firstName,
            userDataUserName: userData.user?.username,
            userDataRole: userData.user?.role
          });

          toast({
            title: t('success.loginSuccess'),
            description: `${t('auth.login.welcome')}, ${userData.user?.firstName || userData.user?.username || 'Admin'}!`,
          });
        } catch (error) {
          console.error("❌ CLIENT DEBUG - Error with admin login:", error);
          toast({
            title: t('errors.error'),
            description: t('errors.somethingWentWrong'),
            variant: "destructive"
          });
        }
        return;
      }
      
      // Otherwise try the actual API
      console.log('🔍 CLIENT DEBUG - Attempting API login for:', data.username);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });

      console.log('🔍 CLIENT DEBUG - API response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.log('🔍 CLIENT DEBUG - API error response:', errorData);
        throw new Error(errorData.message || 'Login failed');
      }

      const userData = await response.json();
      console.log('🔍 CLIENT DEBUG - API response data:', userData);

      // Clear any previous user data before storing new user
      localStorage.removeItem('currentUser');
      sessionStorage.clear();
      queryClient.clear(); // Clear React Query cache

      // Store user data in localStorage for client-side access
      const userForStorage = {
        ...userData.user,
        isAuthenticated: true,
        loginTime: new Date().toISOString()
      };
      localStorage.setItem('currentUser', JSON.stringify(userForStorage));
      setAuthenticated(true);
      setUser({ id: userData.user.id, email: userData.user.email, role: userData.user.role, companyId: userData.user.companyId });
      window.dispatchEvent(new CustomEvent('auth:login', { detail: userForStorage }));
      console.log('🔍 CLIENT DEBUG - Stored user in localStorage:', userForStorage);

      // CSRF protection disabled - no token needed

      // Successfully logged in
      setIsLoggingIn(false);

      // Redirect admin users to admin console, others to dashboard
      if (userData.user?.role === 'platform_admin' || userData.user?.role === 'admin') {
        console.log('🔍 CLIENT DEBUG - Redirecting to admin console');
        setLocation('/admin');
      } else {
        console.log('🔍 CLIENT DEBUG - Redirecting to dashboard');
        setLocation('/dashboard');
      }
      
      toast({
        title: t('success.loginSuccess'),
        description: `${t('auth.login.welcome')}, ${userData.firstName || userData.username}!`,
      });
    } catch (error: any) {
      setIsLoggingIn(false);
      setFormError(error.message || t('errors.pleaseLogin'));

      toast({
        title: t('errors.error'),
        description: error.message || t('errors.somethingWentWrong'),
        variant: "destructive"
      });
    }
  };

  const handleRegister = async (data: RegisterFormValues) => {
    setIsRegistering(true);
    setFormError(null);
    
    try {
      // Try to register via the API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.email,
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          companyName: data.companyName,
          industry: data.industry,
          companySize: data.companySize,
          jobTitle: data.jobTitle,
          subscriptionTier: data.subscriptionTier,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      // Registration successful
      setIsRegistering(false);
      setActiveTab("login");

      toast({
        title: t('success.signupSuccess'),
        description: t('auth.signup.accountCreated'),
      });
    } catch (error: any) {
      setIsRegistering(false);
      setFormError(error.message || t('errors.somethingWentWrong'));

      toast({
        title: t('errors.error'),
        description: error.message || t('errors.somethingWentWrong'),
        variant: "destructive"
      });
    }
  };
  
  const handleDemoSubmit = async () => {
    if (!demoFirstName || !demoLastName || !demoEmail || !demoCompany || !demoPhone || !demoRole || !demoIndustry || !demoCompanySize) {
      toast({
        title: t('validation.required'),
        description: t('validation.required'),
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingDemo(true);

    try {
      // Prepare the demo request data for API
      const demoRequestData = {
        firstName: demoFirstName,
        lastName: demoLastName,
        email: demoEmail,
        company: demoCompany,
        phone: demoPhone,
        role: demoRole,
        industry: demoIndustry,
        companySize: demoCompanySize,
        message: demoMessage || null,
        source: "login-page"
      };

      // Call the API to create a demo request
      const response = await fetch('/api/demo-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(demoRequestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('errors.somethingWentWrong'));
      }

      // Clear form fields after successful submission
      setIsSubmittingDemo(false);
      setShowDemoConfirmation(false);

      // Reset form fields
      setDemoFirstName('');
      setDemoLastName('');
      setDemoEmail('');
      setDemoCompany('');
      setDemoPhone('');
      setDemoRole('');
      setDemoIndustry('');
      setDemoCompanySize('');
      setDemoMessage('');

      toast({
        title: t('pages.login.demoRequestReceived'),
        description: t('pages.login.demoRequestDescription'),
      });
    } catch (error) {
      console.error("Error submitting demo request:", error);
      setIsSubmittingDemo(false);
      toast({
        title: t('errors.error'),
        description: error instanceof Error ? error.message : t('errors.somethingWentWrong'),
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <div className="text-primary text-3xl font-display font-bold cursor-pointer" onClick={() => setLocation('/')}>
              Personalysis<span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">Pro</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-bold">{t('pages.login.businessPlatformAccess')}</CardTitle>
          <CardDescription className="text-center">
            {t('pages.login.loginDescription')}
            <br />
            <span className="text-xs text-muted-foreground mt-1 block">

              <br/>

            </span>
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          
          {/* Login form - business accounts are created by admins */}
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <EnhancedFormField
                form={loginForm}
                name="username"
                label={t('auth.login.email')}
                type="email"
                placeholder="johndoe@personalysispro.com"
                required={true}
                autoComplete="email"
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <FormLabel
                    className="after:content-['*'] after:ml-0.5 after:text-red-500"
                    htmlFor="password"
                  >
                    {t('auth.login.password')}
                  </FormLabel>
                  {/*
                  <div
                    onClick={() => setLocation('/reset-password')}
                    className="text-xs text-primary hover:text-primary-dark cursor-pointer"
                  >
                    {t('auth.login.forgotPassword')}
                  </div>
                  */}
                </div>
                <EnhancedFormField
                  form={loginForm}
                  name="password"
                  type="password"
                  placeholder={t('auth.login.password')}
                  required={true}
                  autoComplete="current-password"
                />
              </div>

              <FormField
                control={loginForm.control}
                name="remember"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="remember"
                        aria-label={t('auth.login.rememberMe')}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel
                        htmlFor="remember"
                        className="text-sm font-normal text-gray-500 cursor-pointer"
                      >
                        {t('auth.login.rememberMe')}
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white"
                disabled={isLoggingIn}
                aria-label={t('auth.login.loginButton')}
              >
                {isLoggingIn ? (
                  <>
                    <ProgressIndicator
                      isLoading={isLoggingIn}
                      loadingText=""
                      variant="spinner"
                      size="sm"
                      className="mr-2"
                    />
                    {t('auth.login.loggingIn')}
                  </>
                ) : (
                  t('auth.login.loginButton')
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex flex-col">
          <Separator className="my-4" />
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDemoConfirmation(true)}
            >
              {t('pages.login.bookDemo')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/contact"}
            >
              {t('pages.login.needHelp')}
            </Button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-4 space-y-2">
            <p>GRS Ventures Limited<strong></strong></p>
            <p>{t('pages.login.allRightsReserved')}<strong> </strong></p>
          </div>
        </CardFooter>
      </Card>
      
      {/* Demo Request Form Dialog */}
      <Dialog open={showDemoConfirmation} onOpenChange={setShowDemoConfirmation}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              {t('pages.login.bookProductDemo')}
            </DialogTitle>
            <DialogDescription>
              {t('pages.login.demoFormDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="demoFirstName" className="after:content-['*'] after:ml-0.5 after:text-red-500">{t('pages.login.firstName')}</Label>
                <Input
                  id="demoFirstName"
                  value={demoFirstName}
                  onChange={(e) => setDemoFirstName(e.target.value)}
                  placeholder={t('pages.login.yourFirstName')}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="demoLastName" className="after:content-['*'] after:ml-0.5 after:text-red-500">{t('pages.login.surname')}</Label>
                <Input
                  id="demoLastName"
                  value={demoLastName}
                  onChange={(e) => setDemoLastName(e.target.value)}
                  placeholder={t('pages.login.yourLastName')}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="demoEmail" className="after:content-['*'] after:ml-0.5 after:text-red-500">{t('auth.login.email')}</Label>
              <Input
                id="demoEmail"
                value={demoEmail}
                onChange={(e) => setDemoEmail(e.target.value)}
                placeholder="your.email@company.com"
                type="email"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="demoPhone" className="after:content-['*'] after:ml-0.5 after:text-red-500">{t('pages.login.phone')}</Label>
              <Input
                id="demoPhone"
                value={demoPhone}
                onChange={(e) => setDemoPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                type="tel"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="demoRole" className="after:content-['*'] after:ml-0.5 after:text-red-500">{t('pages.login.role')}</Label>
              <Select value={demoRole} onValueChange={setDemoRole} required>
                <SelectTrigger id="demoRole">
                  <SelectValue placeholder={t('pages.login.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ceo">{t('pages.login.ceoFounder')}</SelectItem>
                  <SelectItem value="cto">{t('pages.login.ctoDirector')}</SelectItem>
                  <SelectItem value="cmo">{t('pages.login.cmoDirector')}</SelectItem>
                  <SelectItem value="product">{t('pages.login.productManager')}</SelectItem>
                  <SelectItem value="sales">{t('pages.login.salesManager')}</SelectItem>
                  <SelectItem value="other">{t('common.ok')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="demoCompany" className="after:content-['*'] after:ml-0.5 after:text-red-500">{t('pages.login.company')}</Label>
              <Input
                id="demoCompany"
                value={demoCompany}
                onChange={(e) => setDemoCompany(e.target.value)}
                placeholder={t('pages.login.yourCompanyName')}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="demoIndustry" className="after:content-['*'] after:ml-0.5 after:text-red-500">{t('pages.login.industry')}</Label>
                <Select value={demoIndustry} onValueChange={setDemoIndustry} required>
                  <SelectTrigger id="demoIndustry">
                    <SelectValue placeholder={t('pages.login.selectIndustry')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">{t('pages.login.technology')}</SelectItem>
                    <SelectItem value="Marketing">{t('pages.login.marketingAdvertising')}</SelectItem>
                    <SelectItem value="Retail">{t('pages.login.retailEcommerce')}</SelectItem>
                    <SelectItem value="Financial">{t('pages.login.financialServices')}</SelectItem>
                    <SelectItem value="Healthcare">{t('pages.login.healthcare')}</SelectItem>
                    <SelectItem value="Education">{t('pages.login.education')}</SelectItem>
                    <SelectItem value="Manufacturing">{t('pages.login.manufacturing')}</SelectItem>
                    <SelectItem value="Consulting">{t('pages.login.consulting')}</SelectItem>
                    <SelectItem value="Other">{t('common.ok')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="demoCompanySize" className="after:content-['*'] after:ml-0.5 after:text-red-500">{t('pages.login.companySize')}</Label>
                <Select value={demoCompanySize} onValueChange={setDemoCompanySize} required>
                  <SelectTrigger id="demoCompanySize">
                    <SelectValue placeholder={t('pages.login.selectSize')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">{t('pages.login.oneToTen')}</SelectItem>
                    <SelectItem value="11-50">{t('pages.login.elevenToFifty')}</SelectItem>
                    <SelectItem value="51-200">{t('pages.login.fiftyOneToTwoHundred')}</SelectItem>
                    <SelectItem value="201-500">{t('pages.login.twoHundredOneToFiveHundred')}</SelectItem>
                    <SelectItem value="501-1000">{t('pages.login.fiveHundredOneToThousand')}</SelectItem>
                    <SelectItem value="1000+">{t('pages.login.overThousand')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="demoMessage">{t('pages.login.messageOptional')}</Label>
            <Textarea
              id="demoMessage"
              value={demoMessage}
              onChange={(e) => setDemoMessage(e.target.value)}
              placeholder={t('pages.login.messagePlaceholder')}
              className="resize-none"
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDemoConfirmation(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleDemoSubmit}
              disabled={isSubmittingDemo}
            >
              {isSubmittingDemo ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  {t('pages.login.submitting')}
                </>
              ) : (
                t('pages.login.bookYourDemo')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}
