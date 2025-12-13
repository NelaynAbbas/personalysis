
import { useLocation } from "wouter";
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
            title: "Login Successful",
            description: `Welcome back, ${userData.user?.firstName || userData.user?.username || 'User'}!`,
          });
        } catch (error: any) {
          console.error("Error with demo login:", error);
          setIsLoggingIn(false);
          setFormError(error.message || 'Demo login failed');
          toast({
            title: "Login Error",
            description: error.message || "Demo login failed. Please try again.",
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
            title: "Admin Login Successful",
            description: `Welcome back, ${userData.user?.firstName || userData.user?.username || 'Admin'}!`,
          });
        } catch (error) {
          console.error("❌ CLIENT DEBUG - Error with admin login:", error);
          toast({
            title: "Login Error",
            description: "Admin login failed. Please try again.",
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
        title: "Login Successful",
        description: `Welcome back, ${userData.firstName || userData.username}!`,
      });
    } catch (error: any) {
      setIsLoggingIn(false);
      setFormError(error.message || 'Authentication failed. Please check your credentials.');
      
      toast({
        title: "Login Failed",
        description: error.message || "Authentication failed. Please try again.",
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
        title: "Registration Successful",
        description: "Your account has been created. You can now log in.",
      });
    } catch (error: any) {
      setIsRegistering(false);
      setFormError(error.message || 'Registration failed. Please try again.');
      
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleDemoSubmit = async () => {
    if (!demoFirstName || !demoLastName || !demoEmail || !demoCompany || !demoPhone || !demoRole || !demoIndustry || !demoCompanySize) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields.",
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
        throw new Error(errorData.message || "Failed to submit demo request");
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
        title: "Demo Request Received",
        description: "Thank you! We'll contact you shortly to schedule your personalized demo.",
      });
    } catch (error) {
      console.error("Error submitting demo request:", error);
      setIsSubmittingDemo(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit demo request. Please try again.",
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
          <CardTitle className="text-2xl text-center font-bold">Business Platform Access</CardTitle>
          <CardDescription className="text-center">
            Log in to your organization's account to analyze customer insights and drive business decisions.
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
                label="Email"
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
                    Password
                  </FormLabel>
                  <div 
                    onClick={() => setLocation('/reset-password')} 
                    className="text-xs text-primary hover:text-primary-dark cursor-pointer"
                  >
                    Forgot password?
                  </div>
                </div>
                <EnhancedFormField
                  form={loginForm}
                  name="password"
                  type="password"
                  placeholder="Enter your password"
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
                        aria-label="Remember me for 30 days"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel 
                        htmlFor="remember"
                        className="text-sm font-normal text-gray-500 cursor-pointer"
                      >
                        Remember me for 30 days
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary-dark text-white"
                disabled={isLoggingIn}
                aria-label="Sign in to your account"
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
                    Signing in...
                  </>
                ) : (
                  "Sign In"
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
              Book a Demo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/contact"}
            >
              Need Help?
            </Button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-4 space-y-2">
            <p>GRS Ventures Limited<strong></strong></p>
            <p> All rights reserved <strong> </strong></p>
          </div>
        </CardFooter>
      </Card>
      
      {/* Demo Request Form Dialog */}
      <Dialog open={showDemoConfirmation} onOpenChange={setShowDemoConfirmation}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Book a Product Demo
            </DialogTitle>
            <DialogDescription>
              Fill out the form below to schedule a personalized demo of our personality assessment platform for your business.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="demoFirstName" className="after:content-['*'] after:ml-0.5 after:text-red-500">Name</Label>
                <Input
                  id="demoFirstName"
                  value={demoFirstName}
                  onChange={(e) => setDemoFirstName(e.target.value)}
                  placeholder="Your first name"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="demoLastName" className="after:content-['*'] after:ml-0.5 after:text-red-500">Surname</Label>
                <Input
                  id="demoLastName"
                  value={demoLastName}
                  onChange={(e) => setDemoLastName(e.target.value)}
                  placeholder="Your last name"
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="demoEmail" className="after:content-['*'] after:ml-0.5 after:text-red-500">Email address</Label>
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
              <Label htmlFor="demoPhone" className="after:content-['*'] after:ml-0.5 after:text-red-500">Phone</Label>
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
              <Label htmlFor="demoRole" className="after:content-['*'] after:ml-0.5 after:text-red-500">Role</Label>
              <Select value={demoRole} onValueChange={setDemoRole} required>
                <SelectTrigger id="demoRole">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ceo">CEO / Founder</SelectItem>
                  <SelectItem value="cto">CTO / Technical Director</SelectItem>
                  <SelectItem value="cmo">CMO / Marketing Director</SelectItem>
                  <SelectItem value="product">Product Manager</SelectItem>
                  <SelectItem value="sales">Sales Manager</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="demoCompany" className="after:content-['*'] after:ml-0.5 after:text-red-500">Company</Label>
              <Input
                id="demoCompany"
                value={demoCompany}
                onChange={(e) => setDemoCompany(e.target.value)}
                placeholder="Your company name"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="demoIndustry" className="after:content-['*'] after:ml-0.5 after:text-red-500">Industry</Label>
                <Select value={demoIndustry} onValueChange={setDemoIndustry} required>
                  <SelectTrigger id="demoIndustry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Marketing">Marketing & Advertising</SelectItem>
                    <SelectItem value="Retail">Retail & E-commerce</SelectItem>
                    <SelectItem value="Financial">Financial Services</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="demoCompanySize" className="after:content-['*'] after:ml-0.5 after:text-red-500">Company Size</Label>
                <Select value={demoCompanySize} onValueChange={setDemoCompanySize} required>
                  <SelectTrigger id="demoCompanySize">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="501-1000">501-1000 employees</SelectItem>
                    <SelectItem value="1000+">1000+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="demoMessage">Message (Optional)</Label>
            <Textarea
              id="demoMessage"
              value={demoMessage}
              onChange={(e) => setDemoMessage(e.target.value)}
              placeholder="Tell us about your specific needs or questions..."
              className="resize-none"
              rows={4}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDemoConfirmation(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDemoSubmit}
              disabled={isSubmittingDemo}
            >
              {isSubmittingDemo ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Submitting...
                </>
              ) : (
                "Book Your Demo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}
