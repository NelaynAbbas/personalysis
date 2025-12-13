import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import { 
  Menu, 
  X, 
  ChevronRight, 
  Calendar, 
  Building2, 
  Home, 
  LineChart, 
  Info, 
  BookOpen,
  CheckCircle2,
  LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [location, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window !== 'undefined') {
      const checkSize = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      const handleScroll = () => {
        setScrolled(window.scrollY > 10);
      };
      
      // Initial checks
      checkSize();
      handleScroll();
      
      // Add event listeners
      window.addEventListener('resize', checkSize);
      window.addEventListener('scroll', handleScroll);
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', checkSize);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);
  
  // Check if user is logged in
  useEffect(() => {
    // Check if we're in the dashboard (indicating user is logged in)
    const isDashboardPath = location.startsWith('/dashboard');
    setIsLoggedIn(isDashboardPath);
  }, [location]);
  
  const handleBookDemo = () => {
    // If we're not on the home page, navigate to home page first
    if (location !== '/') {
      setLocation('/?showDemo=true');
    } else {
      // Use custom event to communicate with Home component
      window.dispatchEvent(new CustomEvent('openDemoDialog'));
    }
    
    // Close mobile menu if open
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  };
  
  const handleLogout = () => {
    // Call logout API endpoint
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
    .then(() => {
      // Redirect to home page after logout
      setLocation('/');
      
      // Close mobile menu if open
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
    })
    .catch(error => {
      console.error('Logout failed:', error);
    });
  };

  // Determine active link
  const isActive = (path: string) => location === path;
  
  // Get icon for navigation item
  const getNavIcon = (path: string) => {
    switch(path) {
      case '/':
        return <Home className="w-4 h-4" />;
      case '/survey':
        return <CheckCircle2 className="w-4 h-4" />;
      case '/how-it-works':
        return <LineChart className="w-4 h-4" />;
      case '/about':
        return <Info className="w-4 h-4" />;
      case '/blog':
        return <BookOpen className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <header 
      className={`sticky top-0 bg-white/95 backdrop-blur-sm z-50 transition-all duration-300 ${
        scrolled ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between h-16 md:h-20 items-center">
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <Link href="/">
                <div className="text-transparent bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-2xl md:text-3xl font-display font-bold cursor-pointer">
                  PersonalysisPro
                </div>
              </Link>
            </div>
            <nav className="hidden md:flex space-x-1">
              {[
                { path: '/', label: 'Home', disabled: false },
                { path: '/survey', label: 'Take Survey', disabled: false },
                { path: '/how-it-works', label: 'How It Works', disabled: false },
                { path: '/about', label: 'About', disabled: true },
                { path: '/blog', label: 'Blog', disabled: true }
              ].map(({ path, label, disabled }) => (
                <div 
                  key={path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    disabled 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : isActive(path)
                        ? 'text-primary bg-primary/5 shadow-sm cursor-pointer' 
                        : 'text-gray-700 hover:text-primary hover:bg-gray-50 cursor-pointer'
                  }`}
                  onClick={() => !disabled && setLocation(path)}
                >
                  {getNavIcon(path)}
                  {label}
                </div>
              ))}
            </nav>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {!isLoggedIn && (
                <Link href="/login">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border-gray-300 hover:border-primary/80 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <Building2 className="w-4 h-4" />
                    Business Login
                  </Button>
                </Link>
              )}
              
              {isLoggedIn ? (
                <Button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-500/90 hover:to-red-500 shadow-md shadow-red-500/10 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              ) : (
                <Button 
                  onClick={handleBookDemo}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-primary to-indigo-600 text-white hover:from-primary/90 hover:to-indigo-500 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200"
                >
                  <Calendar className="w-4 h-4" />
                  Book a Demo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-primary transition-colors"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Mobile menu with animation */}
        <AnimatePresence>
          {isMenuOpen && isMobile && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-lg border-t z-50 overflow-hidden"
            >
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="px-4 py-3 space-y-2"
              >
                {[
                  { path: '/', label: 'Home' },
                  { path: '/survey', label: 'Take Survey' },
                  { path: '/how-it-works', label: 'How It Works' },
                  { path: '/about', label: 'About' },
                  { path: '/blog', label: 'Blog' },
                  ...(!isLoggedIn ? [{ path: '/login', label: 'Business Login', icon: <Building2 className="w-4 h-4" /> }] : [])
                ].map(({ path, label, icon }, index) => (
                  <Link 
                    key={path}
                    href={path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center justify-between py-3 px-4 rounded-lg ${
                      isActive(path) 
                        ? 'text-primary bg-primary/5 font-medium shadow-sm' 
                        : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getNavIcon(path) || icon}
                      {label}
                    </div>
                    {isActive(path) && <ChevronRight className="w-4 h-4" />}
                  </Link>
                ))}
                
                {isLoggedIn ? (
                  <div 
                    onClick={handleLogout} 
                    className="flex items-center justify-center gap-2 mt-4 py-3 px-4 rounded-lg text-white cursor-pointer bg-gradient-to-r from-rose-500 to-red-600 font-medium shadow-md"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </div>
                ) : (
                  <div 
                    onClick={handleBookDemo} 
                    className="flex items-center justify-center gap-2 mt-4 py-3 px-4 rounded-lg text-white cursor-pointer bg-gradient-to-r from-primary to-indigo-600 font-medium shadow-md"
                  >
                    <Calendar className="w-4 h-4" />
                    Book a Demo
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
