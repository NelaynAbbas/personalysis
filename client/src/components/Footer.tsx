import { Link, useLocation } from "wouter";
import { useState } from "react";
import { 
  Facebook, 
  Linkedin, 
  Twitter, 
  ChevronRight, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight,
  LogIn,
  Globe,
  BookOpen,
  Shield,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import complianceSealsImage from "../../../attached_assets/3-Compliant-seals_1749132994435.png";

const Footer = () => {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setSubscriptionStatus('idle');
    
    try {
      const response = await apiRequest('/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 'success') {
        setEmail('');
        setSubscriptionStatus('success');
        toast({
          title: "Subscription successful",
          description: "Thank you for subscribing to our newsletter!",
          variant: "default"
        });
      } else {
        throw new Error(response.message || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setSubscriptionStatus('error');
      toast({
        title: "Subscription failed",
        description: error instanceof Error ? error.message : "An error occurred. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setSubscriptionStatus('idle');
      }, 5000);
    }
  };

  return (
    <footer className="bg-gradient-to-br from-gray-50 to-gray-100 border-t border-gray-200 pt-16 pb-8 relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-70"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl opacity-70"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-5">
            <div className="text-transparent bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-3xl font-display font-bold mb-4">
              PersonalysisPro
            </div>
            <p className="text-gray-600 mb-8 max-w-md leading-relaxed">
              Advanced psychographic intelligence for businesses. 
              Understand what truly drives your customers with AI-powered personality insights designed
               to enhance targeting, personalize engagement, and inform smarter decisions.
            </p>

            {/* Compliance Seals */}
            <div className="mb-6">
              <p className="text-gray-600 text-sm mb-3">
                Compliant with major privacy regulations
              </p>
              <div className="flex items-center">
                <img 
                  src={complianceSealsImage} 
                  alt="GDPR, CCPA, and HIPAA Compliance Seals" 
                  className="h-12 w-auto opacity-80 hover:opacity-100 transition-opacity duration-200"
                />
              </div>
            </div>
          
            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-gray-600">
                <span>GRS Ventures Limited
                71-75 Shelton Street, London, WC2H 9JQ,
                Company number 16294113
                </span>
              </div>
            </div>
          
        
            {/* Social Icons */}
            <div className="flex space-x-4">
              <a 
                onClick={() => setLocation('/social/facebook')} 
                className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                onClick={() => setLocation('/social/linkedin')} 
                className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                onClick={() => setLocation('/social/twitter')} 
                className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
              <Globe className="w-4 h-4 mr-2 text-primary" />
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-primary transition-colors duration-200 flex items-center group">
                  <ChevronRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-600 hover:text-primary transition-colors duration-200 flex items-center group">
                  <ChevronRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-gray-600 hover:text-primary transition-colors duration-200 flex items-center group">
                  <ChevronRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                  Press
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-primary transition-colors duration-200 flex items-center group">
                  <ChevronRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Resources */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-primary" />
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/blog" className="text-gray-600 hover:text-primary transition-colors duration-200 flex items-center group">
                  <ChevronRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/documentation" className="text-gray-600 hover:text-primary transition-colors duration-200 flex items-center group">
                  <ChevronRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-gray-600 hover:text-primary transition-colors duration-200 flex items-center group">
                  <ChevronRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/survey" className="text-gray-600 hover:text-primary transition-colors duration-200 flex items-center group">
                  <ChevronRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                  Take Survey
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal */}
          <div className="col-span-1 md:col-span-3">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
              <Shield className="w-4 h-4 mr-2 text-primary" />
              Legal
            </h3>
            <ul className="space-y-3 mb-6">
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-primary transition-colors duration-200 flex items-center group">
                  <ChevronRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-primary transition-colors duration-200 flex items-center group">
                  <ChevronRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-gray-600 hover:text-primary transition-colors duration-200 flex items-center group">
                  <ChevronRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                  Cookie Policy
                </Link>
              </li>
            </ul>
            
            {/* Newsletter Form */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <FileText className="w-3.5 h-3.5 mr-1.5 text-primary" />
                Subscribe to our newsletter
              </h4>
              <p className="text-gray-600 text-xs mb-3">
                Stay updated with the latest personality insights and product updates
              </p>
              
              {subscriptionStatus === 'success' ? (
                <div className="flex items-center text-green-600 text-xs p-2 bg-green-50 rounded-md">
                  <CheckCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                  <span>Thank you for subscribing!</span>
                </div>
              ) : subscriptionStatus === 'error' ? (
                <div className="flex items-center text-red-600 text-xs p-2 bg-red-50 rounded-md">
                  <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                  <span>Subscription failed. Please try again.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex w-full">
                  <div className="relative flex w-full">
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email" 
                      className="w-full text-sm py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary pr-10"
                      disabled={isLoading}
                    />
                    <Button 
                      type="submit"
                      size="sm"
                      className="absolute right-0 top-0 h-full rounded-l-none rounded-r-md bg-primary hover:bg-primary/90"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer Bottom */}
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} PersonalysisPro. All rights reserved to GRS Ventures Limited.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <button 
              onClick={scrollToTop}
              className="text-gray-500 hover:text-primary transition-colors duration-200"
              aria-label="Scroll to top"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="12" fill="currentColor" fillOpacity="0.1"/>
                <path d="M8 14L12 10L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <Link href="/login">
              <div className="text-primary hover:text-primary-dark cursor-pointer text-sm flex items-center transition-colors duration-200">
                <LogIn className="w-4 h-4 mr-1.5" />
                Business Login
              </div>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;