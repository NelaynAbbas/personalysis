import React, { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "../hooks/use-toast";
import { Info } from "lucide-react";
import { apiRequest } from "../lib/queryClient";
import { 
  BrainCircuit, 
  BarChart4, 
  Network, 
  Fingerprint, 
  Layers, 
  Lock, 
  ChevronRight, 
  Lightbulb, 
  Zap, 
  Database, 
  LineChart,
  Sparkles,
  Shield,
  Check,
  RefreshCcw
} from "lucide-react";

// SVG assets are defined inline for better compatibility

const HowItWorks = () => {
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Demo form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [message, setMessage] = useState("");

  const handleDemoRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const demoRequestData = {
        firstName,
        lastName,
        email,
        phone,
        role,
        company,
        industry,
        companySize,
        message: message || null,
        source: "how-it-works-page"
      };

      const response = await apiRequest("POST", "/api/demo-request", demoRequestData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit demo request");
      }

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
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-indigo-50/20 to-primary/5 -z-10"></div>
        <div className="absolute top-0 right-0 -mr-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-70 -z-10"></div>
        <div className="absolute bottom-0 left-0 -ml-20 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl opacity-70 -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Innovative Technology
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
            How PersonalysisPro Works
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Explore the cutting-edge science and technology powering our AI-driven personality analysis platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              size="lg" 
              className="rounded-full shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-600 transition-all duration-200"
              onClick={() => setShowDemoDialog(true)}
            >
              Book a Demo
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section id="tech-overview" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-6">
                <BrainCircuit className="w-4 h-4 mr-2" />
                Advanced Technology
              </div>
              <h2 className="text-4xl font-bold mb-6">Our AI-Driven Approach</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                PersonalysisPro combines established psychological frameworks with cutting-edge AI to create comprehensive
                digital profiles that accurately predict behaviors, preferences, and decision-making styles thanks to effortless and gamified surveys.
              </p>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="flex items-start">
                  <div className="rounded-full p-2 bg-primary/10 mr-4 mt-1">
                    <Fingerprint className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Unique Profiling</h4>
                    <p className="text-sm text-gray-500">Detailed personality insights based on 35+ characteristics</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="rounded-full p-2 bg-primary/10 mr-4 mt-1">
                    <LineChart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Predictive Models</h4>
                    <p className="text-sm text-gray-500">Behavior forecasting with 87% accuracy rate</p>
                  </div>
                </div>
              </div>

            </div>
            <div className="order-1 md:order-2 relative">
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl transform transition-transform duration-500 hover:scale-[1.02]">
                <div className="bg-white p-4" style={{ minHeight: "300px" }}>
                  {/* Direct embedded SVG for technology dashboard chart */}
                  <svg width="100%" height="100%" viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="chartGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.8"/>
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8"/>
                      </linearGradient>
                      <linearGradient id="chartGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8"/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8"/>
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    <g stroke="#e5e7eb" strokeWidth="1">
                      <line x1="50" y1="250" x2="550" y2="250" />
                      <line x1="50" y1="200" x2="550" y2="200" />
                      <line x1="50" y1="150" x2="550" y2="150" />
                      <line x1="50" y1="100" x2="550" y2="100" />
                      <line x1="50" y1="50" x2="550" y2="50" />
                    </g>
                    
                    {/* X and Y axis */}
                    <line x1="50" y1="250" x2="550" y2="250" stroke="#374151" strokeWidth="2" />
                    <line x1="50" y1="50" x2="50" y2="250" stroke="#374151" strokeWidth="2" />
                    
                    {/* Labels */}
                    <text x="300" y="290" textAnchor="middle" fill="#4b5563" fontSize="16">Time Period</text>
                    <text x="20" y="150" textAnchor="middle" fill="#4b5563" fontSize="16" transform="rotate(-90, 20, 150)">Performance Metrics</text>
                    
                    {/* Data Series 1 - Bar chart */}
                    <g>
                      <rect x="80" y="150" width="30" height="100" fill="url(#chartGradient1)" rx="3" />
                      <rect x="170" y="120" width="30" height="130" fill="url(#chartGradient1)" rx="3" />
                      <rect x="260" y="90" width="30" height="160" fill="url(#chartGradient1)" rx="3" />
                      <rect x="350" y="70" width="30" height="180" fill="url(#chartGradient1)" rx="3" />
                      <rect x="440" y="100" width="30" height="150" fill="url(#chartGradient1)" rx="3" />
                    </g>
                    
                    {/* Data Series 2 - Line chart */}
                    <polyline 
                      points="95,180 185,140 275,110 365,80 455,120" 
                      fill="none" 
                      stroke="url(#chartGradient2)" 
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Data points */}
                    <circle cx="95" cy="180" r="5" fill="#06b6d4" />
                    <circle cx="185" cy="140" r="5" fill="#06b6d4" />
                    <circle cx="275" cy="110" r="5" fill="#06b6d4" />
                    <circle cx="365" cy="80" r="5" fill="#06b6d4" />
                    <circle cx="455" cy="120" r="5" fill="#06b6d4" />
                    
                    {/* X-axis labels */}
                    <text x="95" y="270" textAnchor="middle" fill="#6b7280" fontSize="12">Q1</text>
                    <text x="185" y="270" textAnchor="middle" fill="#6b7280" fontSize="12">Q2</text>
                    <text x="275" y="270" textAnchor="middle" fill="#6b7280" fontSize="12">Q3</text>
                    <text x="365" y="270" textAnchor="middle" fill="#6b7280" fontSize="12">Q4</text>
                    <text x="455" y="270" textAnchor="middle" fill="#6b7280" fontSize="12">Q5</text>
                    
                    {/* Y-axis labels */}
                    <text x="40" y="250" textAnchor="end" fill="#6b7280" fontSize="12">0</text>
                    <text x="40" y="200" textAnchor="end" fill="#6b7280" fontSize="12">25</text>
                    <text x="40" y="150" textAnchor="end" fill="#6b7280" fontSize="12">50</text>
                    <text x="40" y="100" textAnchor="end" fill="#6b7280" fontSize="12">75</text>
                    <text x="40" y="50" textAnchor="end" fill="#6b7280" fontSize="12">100</text>
                    
                    {/* Legend */}
                    <rect x="380" y="20" width="15" height="15" fill="url(#chartGradient1)" rx="2" />
                    <text x="405" y="32" fill="#4b5563" fontSize="14">Accuracy</text>
                    
                    <circle cx="380" cy="45" r="7" fill="#06b6d4" />
                    <text x="405" y="50" fill="#4b5563" fontSize="14">Efficiency</text>
                  </svg>
                </div>
              </div>
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10"></div>
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-indigo-50/20 to-white -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
              <Network className="w-4 h-4 mr-2" />
              Cutting-Edge Technology
            </div>
            <h2 className="text-4xl font-bold mb-6">Our Technology Stack</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Built on the latest advancements in machine learning and psychometrics, our platform delivers unparalleled accuracy and insights.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 h-full border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-xl group">
              <div className="rounded-full w-16 h-16 flex items-center justify-center bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                <BrainCircuit className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">Advanced Neural Networks</h3>
              <p className="text-gray-600 mb-6">
                Our proprietary neural networks process responses and correlate them with thousands of behavioral patterns
                to create accurate personality profiles with exceptional precision.
              </p>
              <ul className="space-y-2 text-sm text-gray-500 mb-6">
                <li className="flex items-center">
                  <div className="rounded-full h-1.5 w-1.5 bg-primary mr-2"></div>
                  Deep learning architectures
                </li>
                <li className="flex items-center">
                  <div className="rounded-full h-1.5 w-1.5 bg-primary mr-2"></div>
                  Multi-layered pattern recognition
                </li>
                <li className="flex items-center">
                  <div className="rounded-full h-1.5 w-1.5 bg-primary mr-2"></div>
                  Real-time adaptive learning
                </li>
              </ul>
            </Card>

            <Card className="p-8 h-full border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-xl group">
              <div className="rounded-full w-16 h-16 flex items-center justify-center bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                <Layers className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">Natural Language Processing</h3>
              <p className="text-gray-600 mb-6">
                Sophisticated NLP capabilities allow our system to understand nuanced responses and extract meaningful
                personality insights from written answers with contextual understanding.
              </p>
              <ul className="space-y-2 text-sm text-gray-500 mb-6">
                <li className="flex items-center">
                  <div className="rounded-full h-1.5 w-1.5 bg-primary mr-2"></div>
                  Sentiment and emotion analysis
                </li>
                <li className="flex items-center">
                  <div className="rounded-full h-1.5 w-1.5 bg-primary mr-2"></div>
                  Contextual language understanding
                </li>
                <li className="flex items-center">
                  <div className="rounded-full h-1.5 w-1.5 bg-primary mr-2"></div>
                  Cross-cultural linguistic adaptation
                </li>
              </ul>
            </Card>

            <Card className="p-8 h-full border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-xl group">
              <div className="rounded-full w-16 h-16 flex items-center justify-center bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                <BarChart4 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">Predictive Analytics</h3>
              <p className="text-gray-600 mb-6">
                Our prediction models convert personality traits into actionable business insights, forecasting consumer
                behaviors and preferences with remarkable accuracy and reliability.
              </p>
              <ul className="space-y-2 text-sm text-gray-500 mb-6">
                <li className="flex items-center">
                  <div className="rounded-full h-1.5 w-1.5 bg-primary mr-2"></div>
                  Time-series forecasting models
                </li>
                <li className="flex items-center">
                  <div className="rounded-full h-1.5 w-1.5 bg-primary mr-2"></div>
                  Decision probability mapping
                </li>
                <li className="flex items-center">
                  <div className="rounded-full h-1.5 w-1.5 bg-primary mr-2"></div>
                  Behavior pattern extrapolation
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* The Science */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 md:order-1">
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl transform transition-transform duration-500 hover:scale-[1.02]">
                <div className="bg-white p-4" style={{ minHeight: "300px" }}>
                  {/* Direct embedded SVG for personality radar chart */}
                  <svg width="100%" height="100%" viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.7"/>
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1"/>
                      </radialGradient>
                    </defs>
                    
                    {/* Chart background */}
                    <g transform="translate(250, 150)">
                      {/* Circular grid lines */}
                      <circle cx="0" cy="0" r="120" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                      <circle cx="0" cy="0" r="90" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                      <circle cx="0" cy="0" r="60" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                      <circle cx="0" cy="0" r="30" fill="none" stroke="#e5e7eb" strokeWidth="1" />

                      {/* Radial lines */}
                      <line x1="0" y1="0" x2="0" y2="-120" stroke="#e5e7eb" strokeWidth="1" />
                      <line x1="0" y1="0" x2="114" y2="-38" stroke="#e5e7eb" strokeWidth="1" />
                      <line x1="0" y1="0" x2="72" y2="98" stroke="#e5e7eb" strokeWidth="1" />
                      <line x1="0" y1="0" x2="-72" y2="98" stroke="#e5e7eb" strokeWidth="1" />
                      <line x1="0" y1="0" x2="-114" y2="-38" stroke="#e5e7eb" strokeWidth="1" />
                      
                      {/* Axis labels */}
                      <text x="0" y="-130" textAnchor="middle" fill="#6b7280" fontSize="12">Openness</text>
                      <text x="124" y="-38" textAnchor="start" fill="#6b7280" fontSize="12">Extraversion</text>
                      <text x="80" y="110" textAnchor="middle" fill="#6b7280" fontSize="12">Agreeableness</text>
                      <text x="-80" y="110" textAnchor="middle" fill="#6b7280" fontSize="12">Conscientiousness</text>
                      <text x="-140" y="-38" textAnchor="end" fill="#6b7280" fontSize="12">Neuroticism</text>
                      
                      {/* Data polygon */}
                      <polygon 
                        points="0,-105 95,-31 60,82 -65,85 -95,-31" 
                        fill="url(#radarGradient)" 
                        stroke="#4f46e5" 
                        strokeWidth="2"
                        opacity="0.8"
                      />
                      
                      {/* Data points */}
                      <circle cx="0" cy="-105" r="5" fill="#4f46e5" />
                      <circle cx="95" cy="-31" r="5" fill="#4f46e5" />
                      <circle cx="60" cy="82" r="5" fill="#4f46e5" />
                      <circle cx="-65" cy="85" r="5" fill="#4f46e5" />
                      <circle cx="-95" cy="-31" r="5" fill="#4f46e5" />
                    </g>
                    
                    {/* Title */}
                    <text x="250" y="20" textAnchor="middle" fill="#374151" fontSize="14" fontWeight="bold">Big Five Personality Traits Profile</text>
                  </svg>
                </div>
              </div>
              <div className="absolute top-0 left-0 -mt-10 -ml-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10"></div>
              <div className="absolute bottom-0 right-0 -mb-10 -mr-10 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl -z-10"></div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-6">
                <Lightbulb className="w-4 h-4 mr-2" />
                Scientific Foundation
              </div>
              <h2 className="text-4xl font-bold mb-6">The Science Behind PersonalysisPro</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Unlike traditional assessments, our approach uses indirect questioning techniques and behavioral 
                analysis to overcome self-reporting biases, resulting in more accurate personality profiles. 
              </p>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                PersonalysisPro is built on decades of psychological research, combining established frameworks like the Big Five
                personality traits, cognitive behavioral theories, and modern psychometrics into a unified system.
              </p>
              <div className="p-6 bg-primary/5 rounded-xl mb-8">
                <h4 className="font-semibold text-xl mb-4 flex items-center">
                  <Zap className="text-primary mr-3 h-5 w-5" />
                  Scientific Validation
                </h4>
                <p className="text-gray-600">
                  We continuously validate our models against real-world outcomes, refining our algorithms to ensure
                  the highest predictive accuracy in the industry. Our methods have been validated in peer-reviewed
                  research with correlations exceeding 0.85 with established measures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Process */}
      <section id="process" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-indigo-50/20 to-white -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
              <Layers className="w-4 h-4 mr-2" />
              Our Methodology
            </div>
            <h2 className="text-4xl font-bold mb-6">The PersonalysisPro Process</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our streamlined four-stage process transforms user interactions into valuable business intelligence.
            </p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-primary/20 transform -translate-x-1/2 hidden md:block"></div>
            
            <div className="space-y-24">
              <div className="relative">
                {/* Stage circle for alignment - positioned absolutely to the center line */}
                <div className="absolute left-1/2 top-0 w-12 h-12 -translate-x-1/2 transform bg-gradient-to-r from-primary to-indigo-500 rounded-full flex items-center justify-center text-white font-bold z-20 hidden md:flex">1</div>
                
                <div className="grid md:grid-cols-2 gap-16 items-center">
                  <div className="relative z-10">
                    <div className="md:pr-12">
                      <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4 md:hidden">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">1</div>
                        Stage One
                      </div>
                      <h3 className="text-2xl font-bold mb-4">Gamified Data Collection</h3>
                      <p className="text-lg text-gray-600 mb-6">
                        Users engage with our interactive, scenario-based questionnaires designed to feel like games rather than
                        traditional surveys. This approach increases engagement and captures authentic responses.
                      </p>
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-start">
                          <div className="rounded-full p-1 bg-green-100 mr-3 mt-1">
                            <div className="rounded-full p-1 bg-green-500 text-white">
                              <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600">Interactive scenarios that adapt based on previous answers</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="rounded-full p-1 bg-green-100 mr-3 mt-1">
                            <div className="rounded-full p-1 bg-green-500 text-white">
                              <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600">Subtle behavioral measurements disguised as game mechanics</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="rounded-full p-1 bg-green-100 mr-3 mt-1">
                            <div className="rounded-full p-1 bg-green-500 text-white">
                              <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600">3-5x higher completion rates than traditional surveys</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block"></div>
                </div>
              </div>

              <div className="relative">
                {/* Stage circle for alignment - positioned absolutely to the center line */}
                <div className="absolute left-1/2 top-0 w-12 h-12 -translate-x-1/2 transform bg-gradient-to-r from-primary to-indigo-500 rounded-full flex items-center justify-center text-white font-bold z-20 hidden md:flex">2</div>
                
                <div className="grid md:grid-cols-2 gap-16 items-center">
                  <div className="hidden md:block"></div>
                  <div className="relative z-10">
                    <div className="md:pl-12">
                      <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4 md:hidden">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">2</div>
                        Stage Two
                      </div>
                      <h3 className="text-2xl font-bold mb-4">AI-Powered Analysis</h3>
                      <p className="text-lg text-gray-600 mb-6">
                        Our AI engine processes responses through multiple neural networks, comparing patterns against our 
                        extensive database of cognitive and behavioral models to generate comprehensive personality profiles.
                      </p>
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-start">
                          <div className="rounded-full p-1 bg-green-100 mr-3 mt-1">
                            <div className="rounded-full p-1 bg-green-500 text-white">
                              <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600">Real-time processing of response patterns and behaviors</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="rounded-full p-1 bg-green-100 mr-3 mt-1">
                            <div className="rounded-full p-1 bg-green-500 text-white">
                              <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600">Multi-model comparison for cross-validation of results</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="rounded-full p-1 bg-green-100 mr-3 mt-1">
                            <div className="rounded-full p-1 bg-green-500 text-white">
                              <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600">Continuous algorithm improvement through machine learning</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                {/* Stage circle for alignment - positioned absolutely to the center line */}
                <div className="absolute left-1/2 top-0 w-12 h-12 -translate-x-1/2 transform bg-gradient-to-r from-primary to-indigo-500 rounded-full flex items-center justify-center text-white font-bold z-20 hidden md:flex">3</div>
                
                <div className="grid md:grid-cols-2 gap-16 items-center">
                  <div className="relative z-10">
                    <div className="md:pr-12">
                      <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4 md:hidden">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">3</div>
                        Stage Three
                      </div>
                      <h3 className="text-2xl font-bold mb-4">Digital Profile Creation</h3>
                      <p className="text-lg text-gray-600 mb-6">
                        The system generates detailed digital profiles mapping over 35 personality characteristics, including
                        decision-making styles, risk tolerance, communication preferences, and emotional patterns.
                      </p>
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-start">
                          <div className="rounded-full p-1 bg-green-100 mr-3 mt-1">
                            <div className="rounded-full p-1 bg-green-500 text-white">
                              <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600">Comprehensive mapping of 35+ personality dimensions</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="rounded-full p-1 bg-green-100 mr-3 mt-1">
                            <div className="rounded-full p-1 bg-green-500 text-white">
                              <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600">Detailed visualization of individual trait combinations</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="rounded-full p-1 bg-green-100 mr-3 mt-1">
                            <div className="rounded-full p-1 bg-green-500 text-white">
                              <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600">Confidence scoring for each identified characteristic</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block"></div>
                </div>
              </div>

              <div className="relative">
                {/* Stage circle for alignment - positioned absolutely to the center line */}
                <div className="absolute left-1/2 top-0 w-12 h-12 -translate-x-1/2 transform bg-gradient-to-r from-primary to-indigo-500 rounded-full flex items-center justify-center text-white font-bold z-20 hidden md:flex">4</div>
                
                <div className="grid md:grid-cols-2 gap-16 items-center">
                  <div className="hidden md:block"></div>
                  <div className="relative z-10">
                    <div className="md:pl-12">
                      <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4 md:hidden">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">4</div>
                        Stage Four
                      </div>
                      <h3 className="text-2xl font-bold mb-4 md:mt-6">Business Intelligence Integration</h3>
                      <p className="text-lg text-gray-600 mb-6">
                        These profiles are translated into actionable business insights through our industry-specific algorithms,
                        providing companies with unprecedented customer understanding and predictive capabilities.
                      </p>
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-start">
                          <div className="rounded-full p-1 bg-green-100 mr-3 mt-1">
                            <div className="rounded-full p-1 bg-green-500 text-white">
                              <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600">Industry-specific insight generation and recommendations</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="rounded-full p-1 bg-green-100 mr-3 mt-1">
                            <div className="rounded-full p-1 bg-green-500 text-white">
                              <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600">Integration with existing CRM and marketing systems</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="rounded-full p-1 bg-green-100 mr-3 mt-1">
                            <div className="rounded-full p-1 bg-green-500 text-white">
                              <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600">Customized dashboards with real-time data visualization</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-24 text-center">
            <Button 
              size="lg" 
              className="rounded-full shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-600 transition-all duration-200"
              onClick={() => setShowDemoDialog(true)}
            >
              Schedule a Platform Demo
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Data Security */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-xl -z-10 transform translate-x-1/3 -translate-y-1/3"></div>
            <div className="grid md:grid-cols-5 gap-8 items-center">
              <div className="md:col-span-1 flex justify-center md:justify-start">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/10 to-indigo-500/10 flex items-center justify-center">
                  <Lock className="h-12 w-12 text-primary" />
                </div>
              </div>
              <div className="md:col-span-4">
                <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
                  <Shield className="w-4 h-4 mr-2" />
                  Enterprise-Grade Security
                </div>
                <h3 className="text-3xl font-bold mb-6">Data Security & Ethics</h3>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  PersonalysisPro is built with privacy and security at its core. We employ bank-grade encryption,
                  regular security audits, and strict access controls to protect all data throughout our system.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start">
                    <div className="rounded-full p-2 bg-green-100 mr-4 mt-1">
                      <Shield className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Enterprise-Grade Encryption</h4>
                      <p className="text-gray-600">AES-256 encryption for all data at rest and in transit</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="rounded-full p-2 bg-green-100 mr-4 mt-1">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Regulatory Compliance</h4>
                      <p className="text-gray-600">Full GDPR, CCPA, and SOC 2 Type II compliant</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="rounded-full p-2 bg-green-100 mr-4 mt-1">
                      <Database className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Data Isolation</h4>
                      <p className="text-gray-600">Secure multi-tenant architecture with strict data separation</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="rounded-full p-2 bg-green-100 mr-4 mt-1">
                      <RefreshCcw className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Regular Audits</h4>
                      <p className="text-gray-600">Quarterly penetration testing and security assessments</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Business?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
            Join leading companies using PersonalysisPro to gain unprecedented insights into customer behavior.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-primary hover:bg-gray-100 rounded-full shadow-lg px-8 py-6 text-lg"
              onClick={() => setShowDemoDialog(true)}
            >
              Schedule a Demo
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Demo Request Dialog */}
      <Dialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Request a Demo
            </DialogTitle>
            <DialogDescription>
              Fill out the form below to schedule a personalized demo of our personality assessment platform.
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
                  <SelectTrigger>
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
                  <SelectTrigger>
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

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDemoDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Submitting..." : "Book Your Demo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HowItWorks;