import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Cookie, Settings, X, Shield, Info } from 'lucide-react';
import { Link } from 'wouter';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

interface CookieConsentProps {
  onConsentChange?: (preferences: CookiePreferences) => void;
}

const CookieConsent: React.FC<CookieConsentProps> = ({ onConsentChange }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consentData = localStorage.getItem('cookie-consent');
    if (!consentData) {
      // Show banner after a brief delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      try {
        const savedPreferences = JSON.parse(consentData);
        setPreferences(savedPreferences.preferences);
        // Only call onConsentChange if preferences have actually changed
        // This prevents unnecessary API calls on every render
      } catch (error) {
        console.error('Error parsing saved cookie preferences:', error);
        setIsVisible(true);
      }
    }
  }, []); // Remove onConsentChange from dependencies to prevent unnecessary calls

  const saveConsent = (consentPreferences: CookiePreferences) => {
    const consentData = {
      preferences: consentPreferences,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    localStorage.setItem('cookie-consent', JSON.stringify(consentData));
    
    // Also save to session storage for immediate access
    sessionStorage.setItem('cookie-preferences', JSON.stringify(consentPreferences));
    
    // Notify parent component
    onConsentChange?.(consentPreferences);
    
    // Hide banner
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    saveConsent(allAccepted);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    saveConsent(necessaryOnly);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const handlePreferenceChange = (type: keyof CookiePreferences, value: boolean) => {
    if (type === 'necessary') return; // Cannot disable necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [type]: value
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/20 backdrop-blur-sm">
      <Card className="w-full max-w-4xl shadow-2xl border-2 animate-in slide-in-from-bottom-5 duration-500">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Cookie className="h-6 w-6 text-amber-600" />
              <div>
                <CardTitle className="text-xl font-bold">Cookie Preferences</CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1">
                  We use cookies to enhance your experience and analyze our traffic.
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              GDPR Compliant
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!showDetails ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                This website uses cookies to provide you with a better user experience. 
                Some cookies are essential for the website to function, while others help us 
                understand how you interact with our website and improve our services.
              </p>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">Your privacy matters to us</p>
                    <p>
                      You can choose which types of cookies we use. Essential cookies cannot be disabled 
                      as they are required for the website to function properly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setShowDetails(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  <Settings className="h-4 w-4 inline mr-1" />
                  Customize preferences
                </button>
                <div className="flex space-x-2 text-xs text-gray-500">
                  <Link href="/privacy" className="hover:text-gray-700 underline">
                    Privacy Policy
                  </Link>
                  <span>•</span>
                  <Link href="/cookies" className="hover:text-gray-700 underline">
                    Cookie Policy
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4">
                {/* Necessary Cookies */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="necessary" className="font-medium text-sm">
                        Essential Cookies
                      </Label>
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      These cookies are essential for the website to function and cannot be disabled.
                    </p>
                  </div>
                  <Switch
                    id="necessary"
                    checked={preferences.necessary}
                    disabled={true}
                    className="ml-4"
                  />
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor="analytics" className="font-medium text-sm">
                      Analytics Cookies
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      Help us understand how visitors interact with our website.
                    </p>
                  </div>
                  <Switch
                    id="analytics"
                    checked={preferences.analytics}
                    onCheckedChange={(checked) => handlePreferenceChange('analytics', checked)}
                    className="ml-4"
                  />
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor="marketing" className="font-medium text-sm">
                      Marketing Cookies
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      Used to deliver personalized advertisements and track ad performance.
                    </p>
                  </div>
                  <Switch
                    id="marketing"
                    checked={preferences.marketing}
                    onCheckedChange={(checked) => handlePreferenceChange('marketing', checked)}
                    className="ml-4"
                  />
                </div>

                {/* Functional Cookies */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor="functional" className="font-medium text-sm">
                      Functional Cookies
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      Enable enhanced functionality like chat widgets and personalized content.
                    </p>
                  </div>
                  <Switch
                    id="functional"
                    checked={preferences.functional}
                    onCheckedChange={(checked) => handlePreferenceChange('functional', checked)}
                    className="ml-4"
                  />
                </div>
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                ← Back to simple view
              </button>
            </div>
          )}
        </CardContent>

        <Separator />
        
        <CardFooter className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 pt-4">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAcceptNecessary}
              className="w-full sm:w-auto"
            >
              Accept Necessary Only
            </Button>
            {showDetails && (
              <Button
                variant="default"
                size="sm"
                onClick={handleSavePreferences}
                className="w-full sm:w-auto"
              >
                Save Preferences
              </Button>
            )}
          </div>
          
          <Button
            onClick={handleAcceptAll}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            size="sm"
          >
            Accept All Cookies
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CookieConsent;