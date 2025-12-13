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
        title: "Demo Request Received",
        description: "Thank you! We'll contact you shortly to schedule your personalized demo.",
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
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit demo request. Please try again.",
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
                AI-Powered Business Intelligence Platform
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Transform Personality Data into <br/>
                <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
                  Actionable Business Intelligence
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Reveal deep customer insights with AI-driven personality analytics to fuel strategic, measurable growth.
              </p>
              <nav className="flex flex-col sm:flex-row gap-4" role="navigation" aria-label="Primary actions">
                <Button size="lg" className="rounded-full shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-600 transition-all duration-200" onClick={() => setShowDemoDialog(true)} aria-describedby="demo-button-description">
                  <Calendar className="w-5 h-5 mr-2" aria-hidden="true" />
                  Book a Demo
                </Button>
                <Link href="/how-it-works" aria-describedby="how-it-works-link-description">
                  <Button size="lg" variant="outline" className="rounded-full border-2">
                    <Info className="w-5 h-5 mr-2" aria-hidden="true" />
                    How It Works
                  </Button>
                </Link>
              </nav>
              <div className="sr-only">
                <span id="demo-button-description">Schedule a personalized demo to see PersonalysisPro's AI-powered personality analytics in action</span>
                <span id="how-it-works-link-description">Learn about our comprehensive personality profiling and business intelligence process</span>
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
              Predict Consumer Behavior with AI
            </div>
            <h2 id="features-heading" className="text-4xl font-bold mb-6">Advanced Personality Analytics</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              A powerful AI platform that blends psychology, analytics, and machine learning to unlock customer understanding, competitive positioning, and strategic market insights.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group">
              <Card className="p-8 h-full border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-xl">
                <div className="rounded-full w-14 h-14 flex items-center justify-center bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                  <BrainCircuit className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">Gamified Micro-Experiences</h3>
                <p className="text-gray-600 mb-6">Interactive surveys designed to drive engagement and collect rich psychographic data effortlessly.
</p>
                <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Link href="/how-it-works#ai-analysis">
                    <Button variant="ghost" className="p-0 h-auto text-primary font-medium flex items-center">
                      Learn more <ArrowRight className="ml-2 h-4 w-4" />
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
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">Identify Psychographic Profiles</h3>
                <p className="text-gray-600 mb-6">Advanced algorithms uncover actionable insights from customer behavior, going beyond traditional A/B testing to optimize decision-making.
</p>
                <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Link href="/how-it-works#integrations">
                    <Button variant="ghost" className="p-0 h-auto text-primary font-medium flex items-center">
                      Learn more <ArrowRight className="ml-2 h-4 w-4" />
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
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">Hyper-Personalized CTAs</h3>
                <p className="text-gray-600 mb-6">Dynamic call-to-action generation designed to deliver tailored offers, recommendations, and messages that maximize engagement.</p>
                <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Link href="/how-it-works#security">
                    <Button variant="ghost" className="p-0 h-auto text-primary font-medium flex items-center">
                      Learn more <ArrowRight className="ml-2 h-4 w-4" />
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
                Business Intelligence
              </div>
              <h3 className="text-3xl font-bold mb-6">Turn Insights Into Strategic Advantage</h3>
              <p className="text-lg text-gray-600 mb-6">
                Gain strategic clarity through a Business Intelligence Suite that decode behavior patterns and transform psychographic data into decision-ready business insights.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="text-primary mr-3 h-6 w-6 mt-0.5 flex-shrink-0" />
                  <span>Dashboards highlight campaign performance and audience engagement</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-primary mr-3 h-6 w-6 mt-0.5 flex-shrink-0" />
                  <span>Traits, behaviors and recommended products charts uncover drivers of decision-making and loyalty</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-primary mr-3 h-6 w-6 mt-0.5 flex-shrink-0" />
                  <span>Compare against industry benchmarks, market fit, features priorities and much more</span>
                </li>
              </ul>
              <Link href="/how-it-works#visual-analytics">
                <Button className="rounded-full">
                  Explore more
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
              Tailored for any Industry
            </div>
            <h2 className="text-4xl font-bold mb-6">Industry-Specific Solutions</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              From market validation to hyper-personalized engagement, PersonalysisPro adapts to any industry’s needs to drive performance.
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
                <h3 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">Finance & Insurance</h3>
                <p className="text-gray-600 mb-6">Move beyond past data with predictive psychographic insights that let you design products, content, and acquisition strategies aligned with deeper consumer traits.</p>
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>Hyper-personalized campaigns based on personality clusters</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>Identify communication styles that improve conversion</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>Refine product targeting with risk and trust indicators</span>
                  </li>
                </ul>
                <Button variant="ghost" className="p-0 h-auto text-primary font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Learn more <ArrowRight className="ml-2 h-4 w-4" />
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
                <h3 className="text-2xl font-semibold mb-4 group-hover:text-purple-600 transition-colors duration-300">Market Research & Insight Providers</h3>
                <p className="text-gray-600 mb-6">Add new layer of behavioral intelligence for every project and transform traditional surveys into immersive, data-rich psychographic experiences.</p>
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>Reveal emotional motivators behind consumer choices</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>Deliver premium insights to win higher-value clients</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>Automated underwriting based on AI personality data</span>
                  </li>
                </ul>
                <Button variant="ghost" className="p-0 h-auto text-purple-600 font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Learn more <ArrowRight className="ml-2 h-4 w-4" />
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
                <h3 className="text-2xl font-semibold mb-4 group-hover:text-green-600 transition-colors duration-300">Marketing Agencie & E-commerce</h3>
                <p className="text-gray-600 mb-6">Transform your marketing strategy with deep personality-based insights that predict consumer behavior and preferences.</p>
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>Hyper-personalized campaigns with predictive segmentation</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>Increased conversion rates with psychometric targeting</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>Enhanced product recommendations with personality matching</span>
                  </li>
                </ul>
                <Button variant="ghost" className="p-0 h-auto text-green-600 font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Learn more <ArrowRight className="ml-2 h-4 w-4" />
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
                <h3 className="text-2xl font-semibold mb-4 group-hover:text-amber-600 transition-colors duration-300">Venture Capital & Business Builders</h3>
                <p className="text-gray-600 mb-6">Gain a competitive edge in investment decisions with market fit insights so you can shape, pivot, or scale ventures based on cognitive resonance with your audience.</p>
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>Define feature priorities based on the market gap</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>Focus group simulation with just a prompt</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>Define makret, pricing strategies and revenue forecast </span>
                  </li>
                </ul>
                <Button variant="ghost" className="p-0 h-auto text-amber-600 font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Learn more <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose PersonalysisPro?</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Drive Business Growth</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <i className="material-icons text-primary mr-2">check_circle</i>
                  <span>Increase customer retention by up to 40%</span>
                </li>
                <li className="flex items-start">
                  <i className="material-icons text-primary mr-2">check_circle</i>
                  <span>Optimize marketing campaigns with personality-based targeting</span>
                </li>
                <li className="flex items-start">
                  <i className="material-icons text-primary mr-2">check_circle</i>
                  <span>Reduce customer acquisition costs</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4">Actionable Insights</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <i className="material-icons text-primary mr-2">check_circle</i>
                  <span>Launch engaging personality surveys in minutes. No dev team required.</span>
                </li>
                <li className="flex items-start">
                  <i className="material-icons text-primary mr-2">check_circle</i>
                  <span>Predictive analysis for customer preferences</span>
                </li>
                <li className="flex items-start">
                  <i className="material-icons text-primary mr-2">check_circle</i>
                  <span>Auto-generate hyper-personalized CTAs based on profile traits</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Client Logos Section */}
      <section className="py-10 md:py-14 w-full bg-gray-50" aria-labelledby="clients-heading">
        <div className="w-full text-center">
          <h2 id="clients-heading" className="text-2xl md:text-3xl font-bold mb-4">Trusted by Industry Leaders</h2>
          <p className="text-gray-600 mb-8">Join innovative companies and gain an edge over competitors</p>

          <div className="w-full max-w-[100vw] overflow-hidden" role="img" aria-label="Logo carousel of companies using PersonalysisPro">
            <ClientLogosCarousel />
          </div>
          

        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Business?</h2>
          <p className="text-xl mb-8 opacity-90">
            Discover how PersonalysisPro can help your business understand customers at a deeper level and make more informed strategic decisions.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => setShowDemoDialog(true)}
            className="bg-white text-primary hover:bg-gray-100"
          >
            Schedule a Demo
          </Button>
        </div>
      </section>



      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Business Login</DialogTitle>
            <DialogDescription>
              Sign in to access your dashboard
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button onClick={() => setLocation("/login")} className="w-full">
              Continue to Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Demo Request Dialog */}
      <Dialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Request a Demo</DialogTitle>
            <DialogDescription>
              Fill the form to request a dedicated demo for PersonalysisPro.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDemoRequest} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Name *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Surname *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your last name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Your company name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select value={industry} onValueChange={setIndustry} required>
                  <SelectTrigger id="industry">
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

              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size *</Label>
                <Select value={companySize} onValueChange={setCompanySize} required>
                  <SelectTrigger id="companySize">
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

            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your specific needs or questions..."
                className="resize-none"
                rows={4}
              />
            </div>

            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Book Your Demo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;