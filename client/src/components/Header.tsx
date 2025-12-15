import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  LogOut,
  Users,
  LayoutDashboard,
  Target,
  Globe,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { performLogout } from "@/lib/logout";
import { useLanguage } from "@/context/LanguageContext";

const Header = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [location, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const { authLoaded, isAuthenticated } = useAuth();
  const { language, languages, changeLanguage } = useLanguage();
  
  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window !== 'undefined') {
      const checkSize = () => {
        setIsMobile(window.innerWidth < 768);
      };

      const handleScroll = () => {
        setScrolled(window.scrollY > 10);
      };

      // Close language dropdown when clicking outside
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-language-selector]')) {
          setIsLanguageDropdownOpen(false);
        }
      };

      // Initial checks
      checkSize();
      handleScroll();

      // Add event listeners
      window.addEventListener('resize', checkSize);
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('click', handleClickOutside);

      // Cleanup
      return () => {
        window.removeEventListener('resize', checkSize);
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('click', handleClickOutside);
      };
    }
  }, []);
  
  // No path-based detection; rely on global auth
  
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
  
  const handleLogout = async () => {
    // Close mobile menu if open
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
    
    // Use centralized logout function
    await performLogout({
      showToast: false, // Don't show toast for manual logout
      redirectTo: '/'
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
      case '/use-cases':
        return <Target className="w-4 h-4" />;
      case '/how-it-works':
        return <LineChart className="w-4 h-4" />;
      case '/about':
        return <Info className="w-4 h-4" />;
      case '/blog':
        return <BookOpen className="w-4 h-4" />;
      case '/dashboard':
        return <LayoutDashboard className="w-4 h-4" />;
      case '/collaboration':
        return <Users className="w-4 h-4" />;
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
                // Only show these menu items when user is not logged in
                ...(!isAuthenticated ? [
                  { path: '/', label: t('header.home') },
                  { path: '/use-cases', label: t('header.useCases'), icon: <Target className="w-4 h-4" /> },
                  { path: '/how-it-works', label: t('header.howItWorks') },
                  { path: '/about', label: t('header.about') },
                  { path: '/blog', label: t('header.blog') }
                ] : []),
                // Always show these items for logged-in users
                ...(isAuthenticated ? [
                  { path: '/dashboard', label: t('header.dashboard') },
                  { path: '/collaboration', label: t('header.collaborate') }
                ] : [])
              ].map(({ path, label }) => (
                <div 
                  key={path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    isActive(path)
                      ? 'text-primary bg-primary/5 shadow-sm cursor-pointer' 
                      : 'text-gray-700 hover:text-primary hover:bg-gray-50 cursor-pointer'
                  }`}
                  onClick={() => setLocation(path)}
                >
                  {getNavIcon(path)}
                  {label}
                </div>
              ))}
            </nav>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Language Selector Dropdown */}
              <div className="relative" data-language-selector>
                <button
                  onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-full border border-gray-300 transition-all duration-200"
                >
                  <Globe className="w-4 h-4" />
                  {languages.find(l => l.code === language)?.flag}
                  <ChevronDown className="w-3 h-3" />
                </button>

                {/* Dropdown Menu */}
                {isLanguageDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          changeLanguage(lang.code);
                          setIsLanguageDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition-colors ${
                          language === lang.code
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        {lang.name}
                        {language === lang.code && <ChevronRight className="w-4 h-4 ml-auto" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!isAuthenticated && (
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border-gray-300 hover:border-primary/80 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <Building2 className="w-4 h-4" />
                    {t('header.businessLogin')}
                  </Button>
                </Link>
              )}

              {isAuthenticated ? (
                <Button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-500/90 hover:to-red-500 shadow-md shadow-red-500/10 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  {t('header.logout')}
                </Button>
              ) : (
                <Button
                  onClick={handleBookDemo}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-primary to-indigo-600 text-white hover:from-primary/90 hover:to-indigo-500 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200"
                >
                  <Calendar className="w-4 h-4" />
                  {t('header.bookDemo')}
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
                  // Only show these menu items when user is not logged in
                ...(!isAuthenticated ? [
                    { path: '/', label: t('header.home') },
                    { path: '/use-cases', label: t('header.useCases'), icon: <Target className="w-4 h-4" /> },
                    { path: '/how-it-works', label: t('header.howItWorks') },
                    { path: '/about', label: t('header.about') },
                    { path: '/blog', label: t('header.blog') },
                    { path: '/login', label: t('header.businessLogin'), icon: <Building2 className="w-4 h-4" /> }
                  ] : []),
                  // Always show these items for logged-in users
                ...(isAuthenticated ? [
                    { path: '/dashboard', label: t('header.dashboard') },
                    { path: '/collaboration', label: t('header.collaborate') }
                  ] : [])
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

                {/* Mobile Language Selector */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-600 px-4 py-2">{t('header.language')}</div>
                  <div className="space-y-1">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          changeLanguage(lang.code);
                          setIsMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 rounded-lg transition-colors ${
                          language === lang.code
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        {lang.name}
                        {language === lang.code && <ChevronRight className="w-4 h-4 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>

                {isAuthenticated ? (
                  <div
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 mt-4 py-3 px-4 rounded-lg text-white cursor-pointer bg-gradient-to-r from-rose-500 to-red-600 font-medium shadow-md"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('header.logout')}
                  </div>
                ) : (
                  <div
                    onClick={handleBookDemo}
                    className="flex items-center justify-center gap-2 mt-4 py-3 px-4 rounded-lg text-white cursor-pointer bg-gradient-to-r from-primary to-indigo-600 font-medium shadow-md"
                  >
                    <Calendar className="w-4 h-4" />
                    {t('header.bookDemo')}
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