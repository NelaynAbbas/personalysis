import { useLocation, Link } from "wouter";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "../hooks/use-toast";
import { Calendar, Info, ArrowRight, Sparkles, FileKey, Users, BarChart, CheckCircle, BrainCircuit, Lock, LightbulbIcon } from "lucide-react";
import { SiGoogle, SiHubspot, SiSalesforce, SiMailchimp, SiDiscord, SiSlack, SiAsana } from "react-icons/si";
import { FaChartBar, FaEnvelope, FaDatabase } from "react-icons/fa";
import type { IconType } from "react-icons";
// Import components for image management
import HeroImage from "../components/HeroImage";
import PersonalityTraitsChart from "../components/PersonalityTraitsChart";
import { apiRequest } from "../lib/queryClient";
import { useTranslation } from "react-i18next";

// Client Logos Component with Static Layout
const ClientLogosCarousel = () => {
  // Complete list of client logos (all restored)
  const clientLogos = [
    { icon: SiGoogle, color: "#4285F4", name: "Google" },
    { icon: SiHubspot, color: "#FF7A59", name: "HubSpot" },
    { icon: SiSalesforce, color: "#00A1E0", name: "Salesforce" },
    { icon: SiMailchimp, color: "#FFE01B", name: "Mailchimp" },
    { icon: SiDiscord, color: "#5865F2", name: "Discord" },
    { icon: SiSlack, color: "#4A154B", name: "Slack" },
    { icon: SiAsana, color: "#FC636B", name: "Asana" },
    { icon: FaEnvelope, color: "#1A82E2", name: "SendGrid" },
    { icon: FaDatabase, color: "#C00", name: "Zoho CRM" }
  ];

  return (
    <div className="w-full py-8">
      <div className="flex justify-center">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-6 md:gap-8">
          {clientLogos.map((logo, index) => {
            const Logo = logo.icon;
            return (
              <div key={index} className="flex flex-col items-center justify-center">
                <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-center" style={{ width: "100px", height: "70px" }}>
                  <Logo className="w-10 h-10" style={{ color: logo.color }} />
                </div>
                <span className="mt-2 text-sm font-medium text-gray-700">{logo.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Usa asset dal percorso relativo corretto con nuovo file
const heroIllustration = "/img/illustrations/hero-illustration.png"; // Cambiato in un file che abbiamo appena copiato
const analyticsDashboard = "/img/illustrations/analytics-dashboard.svg";
const personalityTraits = "/img/illustrations/personality-traits.svg";
const businessInsights = "/img/illustrations/business-insights.svg";
const teamCollaboration = "/img/illustrations/team-collaboration.svg";
const gamifiedSurvey = "/img/illustrations/gamified-survey.svg";
const complianceSeals = "/img/illustrations/compliance-seals.png";

const Home = () => {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Demo booking form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [message, setMessage] = useState("");

  // Check URL params for demo dialog trigger
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('showDemo') === 'true') {
      setShowDemoDialog(true);
    }

    // Listen for custom event from Header component
    const handleOpenDemoDialog = () => {
      setShowDemoDialog(true);
    };

    window.addEventListener('openDemoDialog', handleOpenDemoDialog);

    // Clean up event listener
    return () => {
      window.removeEventListener('openDemoDialog', handleOpenDemoDialog);
    };
  }, []);

  const handleDemoRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare the demo request data
      const demoRequestData = {
        firstName,
        lastName,
        email,
        company,
        phone,
        jobTitle: role, // Map role to jobTitle field
        source: "website", // Track the source of the request
        industry,
        companySize,
        message: message || null
      };

      // Save to localStorage for admin panel visibility
      try {
        // Create a demo request object with additional required fields for localStorage
        const demoRequestWithMeta = {
          ...demoRequestData,
          id: Date.now(), // Use timestamp as a unique ID
          status: 'new',
          viewed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: null,
          scheduledAt: null
        };

        // Get existing requests from localStorage
        const savedRequests = localStorage.getItem('savedDemoRequests');
        let existingRequests = [];

        if (savedRequests) {
          existingRequests = JSON.parse(savedRequests);
        }

        // Add the new request and save back to localStorage
        existingRequests.push(demoRequestWithMeta);
        localStorage.setItem('savedDemoRequests', JSON.stringify(existingRequests));
        console.log('Saved demo request to localStorage for admin panel visibility');
      } catch (storageError) {
        console.error('Failed to save to localStorage:', storageError);
      }

      // Call the API to create a demo request
      const response = await apiRequest("POST", "/api/demo-request", demoRequestData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit demo request");
      }

      // Show success message
      toast({
        title: t('pages.login.demoRequestReceived'),
        description: t('pages.login.demoRequestDescription'),
      });

      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setRole("");
      setCompany("");
      setIndustry("");
      setCompanySize("");
      setMessage("");

      // Close the dialog
      setShowDemoDialog(false);
    } catch (error) {
      console.error("Error submitting demo request:", error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('errors.somethingWentWrong'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "PersonalysisPro - Advanced B2B Personality Analytics Platform",
            "description": "Transform personality data into actionable business intelligence with AI-powered analytics, customer segmentation, and market research insights for enterprises.",
            "url": "https://personalysispro.com",
            "mainEntity": {
              "@type": "SoftwareApplication",
              "name": "PersonalysisPro",
              "applicationCategory": "BusinessApplication",
              "description": "AI-powered personality analytics platform for customer segmentation, competitive intelligence, and market research",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "description": "Free demo available"
              },
              "featureList": [
                "AI-Powered Personality Analytics",
                "Customer Segmentation",
                "Competitive Intelligence",
                "Market Research Insights",
                "Business Intelligence Dashboard",
                "Real-time Collaboration"
              ]
            },
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://personalysispro.com/"
                }
              ]
            }
          })
        }}
      />
      {/* Hero Section */}
      <header className="py-20 lg:py-32 overflow-hidden" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-6" aria-label="Product category">
                <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
                {t('pages.home.hero.badge')}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {t('pages.home.hero.title')} <br/>
                <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
                  {t('pages.home.hero.titleHighlight')}
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {t('pages.home.hero.subtitle')}
              </p>
              <nav className="flex flex-col sm:flex-row gap-4" role="navigation" aria-label="Primary actions">
                <Button size="lg" className="rounded-full shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-600 transition-all duration-200" onClick={() => setShowDemoDialog(true)} aria-describedby="demo-button-description">
                  <Calendar className="w-5 h-5 mr-2" aria-hidden="true" />
                  {t('pages.home.hero.bookDemo')}
                </Button>
                <Link href="/how-it-works" aria-describedby="how-it-works-link-description">
                  <Button size="lg" variant="outline" className="rounded-full border-2">
                    <Info className="w-5 h-5 mr-2" aria-hidden="true" />
                    {t('pages.home.hero.howItWorks')}
                  </Button>
                </Link>
              </nav>
              <div className="sr-only">
                <span id="demo-button-description">{t('pages.home.hero.demoDescription')}</span>
                <span id="how-it-works-link-description">{t('pages.home.hero.howItWorksDescription')}</span>
              </div>
            </div>
            <div className="relative">
              <HeroImage />
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-24 relative" aria-labelledby="features-heading">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary/5 to-white -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4" role="note">
              <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
              {t('pages.home.features.badge')}
            </div>
            <h2 id="features-heading" className="text-4xl font-bold mb-6">{t('pages.home.features.title')}</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t('pages.home.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group">
              <Card className="p-8 h-full border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-xl">
                <div className="rounded-full w-14 h-14 flex items-center justify-center bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                  <BrainCircuit className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">{t('pages.home.features.gamified.title')}</h3>
                <p className="text-gray-600 mb-6">{t('pages.home.features.gamified.description')}</p>
                <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Link href="/how-it-works#ai-analysis">
                    <Button variant="ghost" className="p-0 h-auto text-primary font-medium flex items-center">
                      {t('pages.home.features.gamified.learnMore')} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>

            <div className="group">
              <Card className="p-8 h-full border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-xl">
                <div className="rounded-full w-14 h-14 flex items-center justify-center bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                  <FileKey className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">{t('pages.home.features.psychographic.title')}</h3>
                <p className="text-gray-600 mb-6">{t('pages.home.features.psychographic.description')}</p>
                <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Link href="/how-it-works#integrations">
                    <Button variant="ghost" className="p-0 h-auto text-primary font-medium flex items-center">
                      {t('pages.home.features.gamified.learnMore')} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>

            <div className="group">
              <Card className="p-8 h-full border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-xl">
                <div className="rounded-full w-14 h-14 flex items-center justify-center bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                  <Lock className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">{t('pages.home.features.ctas.title')}</h3>
                <p className="text-gray-600 mb-6">{t('pages.home.features.ctas.description')}</p>
                <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Link href="/how-it-works#security">
                    <Button variant="ghost" className="p-0 h-auto text-primary font-medium flex items-center">
                      {t('pages.home.features.gamified.learnMore')} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>

          <div className="mt-24 grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
                <BarChart className="w-4 h-4 mr-2" />
                {t('pages.home.features.businessIntelligence.badge')}
              </div>
              <h3 className="text-3xl font-bold mb-6">{t('pages.home.features.businessIntelligence.title')}</h3>
              <p className="text-lg text-gray-600 mb-6">
                {t('pages.home.features.businessIntelligence.subtitle')}
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="text-primary mr-3 h-6 w-6 mt-0.5 flex-shrink-0" />
                  <span>{t('pages.home.features.businessIntelligence.feature1')}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-primary mr-3 h-6 w-6 mt-0.5 flex-shrink-0" />
                  <span>{t('pages.home.features.businessIntelligence.feature2')}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-primary mr-3 h-6 w-6 mt-0.5 flex-shrink-0" />
                  <span>{t('pages.home.features.businessIntelligence.feature3')}</span>
                </li>
              </ul>
              <Link href="/how-it-works#visual-analytics">
                <Button className="rounded-full">
                  {t('pages.home.features.businessIntelligence.exploreMore')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="relative order-1 md:order-2">
              <PersonalityTraitsChart />
              <div className="absolute -top-6 -right-6 -bottom-6 -left-6 rounded-xl bg-gradient-to-r from-primary/10 to-indigo-500/10 -z-10 transform rotate-3"></div>
            </div>
          </div>




        </div>
      </section>

      {/* Industry-Specific Benefits Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-indigo-50/30 to-white -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
              <Users className="w-4 h-4 mr-2" />
              {t('pages.home.industries.badge')}
            </div>
            <h2 className="text-4xl font-bold mb-6">{t('pages.home.industries.title')}</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t('pages.home.industries.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-primary/20 opacity-0 group-hover:opacity-100 rounded-xl transition-all duration-300 -z-10"></div>
              <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 h-full transform transition-transform duration-300 group-hover:-translate-y-2">
                <div className="rounded-full w-16 h-16 flex items-center justify-center bg-blue-100 mb-6 group-hover:bg-blue-200 transition-colors duration-300">
                  <div className="rounded-full w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-500 to-primary text-white">
                    <i className="material-icons text-xl">account_balance</i>
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">{t('pages.home.industries.finance.title')}</h3>
                <p className="text-gray-600 mb-6">{t('pages.home.industries.finance.description')}</p>
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>{t('pages.home.industries.finance.benefit1')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>{t('pages.home.industries.finance.benefit2')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>{t('pages.home.industries.finance.benefit3')}</span>
                  </li>
                </ul>
                <Button variant="ghost" className="p-0 h-auto text-primary font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {t('pages.home.features.gamified.learnMore')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 rounded-xl transition-all duration-300 -z-10"></div>
              <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 h-full transform transition-transform duration-300 group-hover:-translate-y-2">
                <div className="rounded-full w-16 h-16 flex items-center justify-center bg-purple-100 mb-6 group-hover:bg-purple-200 transition-colors duration-300">
                  <div className="rounded-full w-12 h-12 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    <i className="material-icons text-xl">health_and_safety</i>
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-4 group-hover:text-purple-600 transition-colors duration-300">{t('pages.home.industries.marketResearch.title')}</h3>
                <p className="text-gray-600 mb-6">{t('pages.home.industries.marketResearch.description')}</p>
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>{t('pages.home.industries.marketResearch.benefit1')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>{t('pages.home.industries.marketResearch.benefit2')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>{t('pages.home.industries.marketResearch.benefit3')}</span>
                  </li>
                </ul>
                <Button variant="ghost" className="p-0 h-auto text-purple-600 font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {t('pages.home.features.gamified.learnMore')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 rounded-xl transition-all duration-300 -z-10"></div>
              <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 h-full transform transition-transform duration-300 group-hover:-translate-y-2">
                <div className="rounded-full w-16 h-16 flex items-center justify-center bg-green-100 mb-6 group-hover:bg-green-200 transition-colors duration-300">
                  <div className="rounded-full w-12 h-12 flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                    <i className="material-icons text-xl">shopping_cart</i>
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-4 group-hover:text-green-600 transition-colors duration-300">{t('pages.home.industries.marketing.title')}</h3>
                <p className="text-gray-600 mb-6">{t('pages.home.industries.marketing.description')}</p>
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>{t('pages.home.industries.marketing.benefit1')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>{t('pages.home.industries.marketing.benefit2')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>{t('pages.home.industries.marketing.benefit3')}</span>
                  </li>
                </ul>
                <Button variant="ghost" className="p-0 h-auto text-green-600 font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {t('pages.home.features.gamified.learnMore')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-orange-500/20 opacity-0 group-hover:opacity-100 rounded-xl transition-all duration-300 -z-10"></div>
              <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 h-full transform transition-transform duration-300 group-hover:-translate-y-2">
                <div className="rounded-full w-16 h-16 flex items-center justify-center bg-amber-100 mb-6 group-hover:bg-amber-200 transition-colors duration-300">
                  <div className="rounded-full w-12 h-12 flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                    <i className="material-icons text-xl">trending_up</i>
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-4 group-hover:text-amber-600 transition-colors duration-300">{t('pages.home.industries.venture.title')}</h3>
                <p className="text-gray-600 mb-6">{t('pages.home.industries.venture.description')}</p>
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>{t('pages.home.industries.venture.benefit1')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>{t('pages.home.industries.venture.benefit2')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>{t('pages.home.industries.venture.benefit3')}</span>
                  </li>
                </ul>
                <Button variant="ghost" className="p-0 h-auto text-amber-600 font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {t('pages.home.features.gamified.learnMore')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">{t('pages.home.benefits.title')}</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold mb-4">{t('pages.home.benefits.growth.title')}</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <i className="material-icons text-primary mr-2">check_circle</i>
                  <span>{t('pages.home.benefits.growth.benefit1')}</span>
                </li>
                <li className="flex items-start">
                  <i className="material-icons text-primary mr-2">check_circle</i>
                  <span>{t('pages.home.benefits.growth.benefit2')}</span>
                </li>
                <li className="flex items-start">
                  <i className="material-icons text-primary mr-2">check_circle</i>
                  <span>{t('pages.home.benefits.growth.benefit3')}</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4">{t('pages.home.benefits.insights.title')}</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <i className="material-icons text-primary mr-2">check_circle</i>
                  <span>{t('pages.home.benefits.insights.benefit1')}</span>
                </li>
                <li className="flex items-start">
                  <i className="material-icons text-primary mr-2">check_circle</i>
                  <span>{t('pages.home.benefits.insights.benefit2')}</span>
                </li>
                <li className="flex items-start">
                  <i className="material-icons text-primary mr-2">check_circle</i>
                  <span>{t('pages.home.benefits.insights.benefit3')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Client Logos Section */}
      <section className="py-10 md:py-14 w-full bg-gray-50" aria-labelledby="clients-heading">
        <div className="w-full text-center">
          <h2 id="clients-heading" className="text-2xl md:text-3xl font-bold mb-4">{t('pages.home.clients.title')}</h2>
          <p className="text-gray-600 mb-8">{t('pages.home.clients.subtitle')}</p>

          <div className="w-full max-w-[100vw] overflow-hidden" role="img" aria-label={t('pages.home.clients.ariaLabel')}>
            <ClientLogosCarousel />
          </div>
          

        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">{t('pages.home.cta.title')}</h2>
          <p className="text-xl mb-8 opacity-90">
            {t('pages.home.cta.subtitle')}
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => setShowDemoDialog(true)}
            className="bg-white text-primary hover:bg-gray-100"
          >
            {t('pages.home.cta.scheduleDemo')}
          </Button>
        </div>
      </section>



      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pages.home.loginDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('pages.home.loginDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button onClick={() => setLocation("/login")} className="w-full">
              {t('pages.home.loginDialog.continueToLogin')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Demo Request Dialog */}
      <Dialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">{t('pages.home.demoDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('pages.home.demoDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDemoRequest} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('pages.home.demoDialog.name')} *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t('pages.home.demoDialog.namePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">{t('pages.home.demoDialog.surname')} *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t('pages.home.demoDialog.surnamePlaceholder')}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('pages.home.demoDialog.email')} *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('pages.home.demoDialog.emailPlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('pages.home.demoDialog.phone')} *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('pages.home.demoDialog.phonePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{t('pages.home.demoDialog.role')} *</Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('pages.home.demoDialog.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ceo">{t('pages.home.demoDialog.ceo')}</SelectItem>
                  <SelectItem value="cto">{t('pages.home.demoDialog.cto')}</SelectItem>
                  <SelectItem value="cmo">{t('pages.home.demoDialog.cmo')}</SelectItem>
                  <SelectItem value="product">{t('pages.home.demoDialog.product')}</SelectItem>
                  <SelectItem value="sales">{t('pages.home.demoDialog.sales')}</SelectItem>
                  <SelectItem value="other">{t('pages.home.demoDialog.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">{t('pages.home.demoDialog.company')} *</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={t('pages.home.demoDialog.companyPlaceholder')}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">{t('pages.home.demoDialog.industry')} *</Label>
                <Select value={industry} onValueChange={setIndustry} required>
                  <SelectTrigger id="industry">
                    <SelectValue placeholder={t('pages.home.demoDialog.selectIndustry')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">{t('pages.home.demoDialog.technology')}</SelectItem>
                    <SelectItem value="Marketing">{t('pages.home.demoDialog.marketing')}</SelectItem>
                    <SelectItem value="Retail">{t('pages.home.demoDialog.retail')}</SelectItem>
                    <SelectItem value="Financial">{t('pages.home.demoDialog.financial')}</SelectItem>
                    <SelectItem value="Healthcare">{t('pages.home.demoDialog.healthcare')}</SelectItem>
                    <SelectItem value="Education">{t('pages.home.demoDialog.education')}</SelectItem>
                    <SelectItem value="Manufacturing">{t('pages.home.demoDialog.manufacturing')}</SelectItem>
                    <SelectItem value="Consulting">{t('pages.home.demoDialog.consulting')}</SelectItem>
                    <SelectItem value="Other">{t('pages.home.demoDialog.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize">{t('pages.home.demoDialog.companySize')} *</Label>
                <Select value={companySize} onValueChange={setCompanySize} required>
                  <SelectTrigger id="companySize">
                    <SelectValue placeholder={t('pages.home.demoDialog.selectSize')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">{t('pages.home.demoDialog.size1to10')}</SelectItem>
                    <SelectItem value="11-50">{t('pages.home.demoDialog.size11to50')}</SelectItem>
                    <SelectItem value="51-200">{t('pages.home.demoDialog.size51to200')}</SelectItem>
                    <SelectItem value="201-500">{t('pages.home.demoDialog.size201to500')}</SelectItem>
                    <SelectItem value="501-1000">{t('pages.home.demoDialog.size501to1000')}</SelectItem>
                    <SelectItem value="1000+">{t('pages.home.demoDialog.size1000plus')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t('pages.home.demoDialog.message')}</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('pages.home.demoDialog.messagePlaceholder')}
                className="resize-none"
                rows={4}
              />
            </div>

            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t('pages.home.demoDialog.submitting') : t('pages.home.demoDialog.bookDemo')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;