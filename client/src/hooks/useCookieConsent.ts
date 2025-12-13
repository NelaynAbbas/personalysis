import { useState, useEffect, useCallback } from 'react';
import { CookiePreferences } from '@/components/CookieConsent';

interface CookieConsentData {
  preferences: CookiePreferences;
  timestamp: string;
  version: string;
}

export const useCookieConsent = () => {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  });
  
  const [hasConsent, setHasConsent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load consent data from localStorage
    const loadConsentData = () => {
      try {
        const consentData = localStorage.getItem('cookie-consent');
        if (consentData) {
          const parsedData: CookieConsentData = JSON.parse(consentData);
          setPreferences(parsedData.preferences);
          setHasConsent(true);
        }
      } catch (error) {
        console.error('Error loading cookie consent data:', error);
        // Clear corrupted data
        localStorage.removeItem('cookie-consent');
      } finally {
        setIsLoading(false);
      }
    };

    loadConsentData();
  }, []);

  const updatePreferences = useCallback((newPreferences: CookiePreferences) => {
    const consentData: CookieConsentData = {
      preferences: newPreferences,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    localStorage.setItem('cookie-consent', JSON.stringify(consentData));
    sessionStorage.setItem('cookie-preferences', JSON.stringify(newPreferences));
    
    setPreferences(newPreferences);
    setHasConsent(true);

    // Initialize or disable analytics based on consent
    if (newPreferences.analytics) {
      initializeAnalytics();
    } else {
      disableAnalytics();
    }

    // Handle marketing cookies
    if (newPreferences.marketing) {
      initializeMarketing();
    } else {
      disableMarketing();
    }

    // Handle functional cookies
    if (newPreferences.functional) {
      initializeFunctional();
    } else {
      disableFunctional();
    }
  }, []);

  const clearConsent = useCallback(() => {
    localStorage.removeItem('cookie-consent');
    sessionStorage.removeItem('cookie-preferences');
    setHasConsent(false);
    setPreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    });
    
    // Disable all non-essential cookies
    disableAnalytics();
    disableMarketing();
    disableFunctional();
  }, []);

  const canUseAnalytics = useCallback(() => {
    return hasConsent && preferences.analytics;
  }, [hasConsent, preferences.analytics]);

  const canUseMarketing = useCallback(() => {
    return hasConsent && preferences.marketing;
  }, [hasConsent, preferences.marketing]);

  const canUseFunctional = useCallback(() => {
    return hasConsent && preferences.functional;
  }, [hasConsent, preferences.functional]);

  return {
    preferences,
    hasConsent,
    isLoading,
    updatePreferences,
    clearConsent,
    canUseAnalytics,
    canUseMarketing,
    canUseFunctional,
  };
};

// Analytics functions
const initializeAnalytics = () => {
  // Initialize Google Analytics or other analytics services
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'granted'
    });
  }
  
  // Track consent granted event
  trackEvent('cookie_consent', 'analytics_granted');
};

const disableAnalytics = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'denied'
    });
  }
};

// Marketing functions
const initializeMarketing = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      ad_storage: 'granted'
    });
  }
  
  trackEvent('cookie_consent', 'marketing_granted');
};

const disableMarketing = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      ad_storage: 'denied'
    });
  }
};

// Functional functions
const initializeFunctional = () => {
  // Initialize functional features like chat widgets, personalization, etc.
  trackEvent('cookie_consent', 'functional_granted');
};

const disableFunctional = () => {
  // Disable functional features
  // Remove any functional cookies or disable features
};

// Event tracking helper
const trackEvent = (eventName: string, eventAction: string, eventLabel?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventAction, {
      event_category: eventName,
      event_label: eventLabel,
    });
  }
};

// Global gtag type definition
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default useCookieConsent;