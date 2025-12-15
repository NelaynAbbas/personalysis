import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Brain,
  LineChart,
  BarChart4,
  Share2,
  Database,
  Globe2,
  UserCheck,
  ChevronRight,
  Sparkles,
  Shield,
  Info
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";

export default function AboutUs() {
  const { t } = useTranslation();
  // Demo dialog state
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        source: "about-us-page"
      };

      const response = await apiRequest("POST", "/api/demo-request", demoRequestData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit demo request");
      }

      toast({
        title: t('pages.aboutUs.demoRequestReceived'),
        description: t('pages.aboutUs.demoThankYou'),
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
  const teamMembers = [
    {
      name: "Jennifer Wright",
      role: "Chief Executive Officer",
      bio: "With over 15 years in digital analytics and consumer psychology, Jennifer leads our strategic vision.",
      avatar: "JW",
      color: "from-primary to-indigo-500"
    },
    {
      name: "Michael Chen",
      role: "Chief Technology Officer",
      bio: "Former senior data scientist at Meta, Michael oversees our machine learning infrastructure and algorithmic development.",
      avatar: "MC",
      color: "from-blue-500 to-cyan-400"
    },
    {
      name: "Sofia Gomez",
      role: "Chief Science Officer",
      bio: "PhD in Behavioral Psychology, Sofia leads our personality assessment methodologies and research initiatives.",
      avatar: "SG",
      color: "from-violet-500 to-purple-600"
    },
    {
      name: "David Park",
      role: "VP of Business Development",
      bio: "Former Director at Gartner, David leads our enterprise client solutions and partnership programs.",
      avatar: "DP",
      color: "from-emerald-500 to-green-600"
    }
  ];

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="container mx-auto py-16 px-4 max-w-6xl">
      {/* Demo Form Dialog */}
      <Dialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
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
          
          <form onSubmit={handleDemoRequest} className="grid gap-4 py-4">
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
            
            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Book Your Demo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <motion.div 
        className="text-center mb-24"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-6">
          <Sparkles className="w-4 h-4 mr-2" />
          Transforming Customer Understanding
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">About PersonalysisPro</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Unlock next-gen customer intelligence with AI-driven behavioral predictions, built on Stanford, Google, and Nobel-backed psychological research.
        </p>
      </motion.div>

      {/* Our Story and Mission */}
      <div className="grid md:grid-cols-2 gap-16 mb-28">
        <motion.div 
          className="relative"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="absolute -top-4 -left-4 w-20 h-20 bg-primary/5 rounded-full blur-xl -z-10"></div>
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
            <Globe2 className="w-4 h-4 mr-2" />
            Our Story
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Redefining customer understanding from the ground up</h2>
          <div className="prose prose-lg">
            <p>
              PersonalysisPro was born out of a clear gap in the way businesses made decisions: relying on surface-level, historical data that failed to reveal why customers behave the way they do.
            </p>
            <p>
              We saw the need for a new kind of intelligence — one rooted in behavioral science, not just clickstreams. That’s why our founders, a team of psychologists, data scientists, and strategists, set out to build a platform that translates personality data into strategic value.
            </p>
            <p>
              By decoding the psychological layers behind decisions, PersonalysisPro equips businesses to anticipate preferences, fine-tune messaging, and build lasting loyalty with precision.
            </p>
          </div>
        </motion.div>

        <motion.div
          className="relative"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl -z-10"></div>
          <div className="inline-flex items-center px-4 py-2 bg-indigo-500/10 rounded-full text-sm font-medium text-indigo-600 mb-4">
            <UserCheck className="w-4 h-4 mr-2" />
            Our Mission
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Bridging human psychology and business strategy</h2>
          <div className="prose prose-lg">
            <p>
              PersonalysisPro empower companies design smarter, more human-centric strategies by tapping into the traits, motivations, and decision-making styles of their audiences. From product innovation to performance marketing, every business move with what truly resonates at a cognitive level.
            </p>
            <p>
              We believe that by understanding the personality traits, cognitive patterns, and behavioral tendencies of customers, businesses can create products, services, and experiences that truly resonate with their audience.
            </p>
            <p>
              Through ethical data practices and scientific rigor, we aim to bridge the gap between customer analytics and human psychology.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Technology Section */}
      <motion.div 
        className="mb-28"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
            <Database className="w-4 h-4 mr-2" />
            Our Foundation
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Scientific precision meets scalable intelligence</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            PersonalysisPro is built on a multidisciplinary foundation that blends psychology, data science, and AI to map out the intricate landscape of human behavior.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 shadow-lg border border-gray-100 rounded-xl hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-xl -z-10 transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="mb-5 p-3 bg-primary/10 rounded-xl inline-block text-primary">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Nobel Behavioral Science</h3>
            <p className="text-gray-600">
              Rooted in behavioral economics and psychology, our models incorporate Nobel Prize-winning research, our framework identifies over 35 distinct personality traits.
            </p>
          </Card>
          
          <Card className="p-6 shadow-lg border border-gray-100 rounded-xl hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl -z-10 transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="mb-5 p-3 bg-indigo-500/10 rounded-xl inline-block text-indigo-500">
              <BarChart4 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Proprietary AI Engine</h3>
            <p className="text-gray-600">
              Our proprietary algorithms analyze behavioral patterns to create comprehensive digital profiles with remarkable predictive accuracy.
            </p>
          </Card>
          
          <Card className="p-6 shadow-lg border border-gray-100 rounded-xl hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-xl -z-10 transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="mb-5 p-3 bg-blue-500/10 rounded-xl inline-block text-blue-500">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Digital Twin Profiling</h3>
            <p className="text-gray-600">
              Leveraging advanced research from Stanford University and Google, we create psychological digital twins that simulate real users by enabling precise hyper-personalized behavioral predictions.
            </p>
          </Card>
        </div>
      </motion.div>

      {/* Values Section */}
      <motion.div 
        className="mb-28 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 relative overflow-hidden"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 transform -translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10 transform translate-x-1/3 translate-y-1/3"></div>
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
            <Shield className="w-4 h-4 mr-2" />
            Our Pillars
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Core Values</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            The principles powering our mission to revolutionize human understanding at scale.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-xl font-bold mb-3 flex items-center">
              <span className="inline-block w-8 h-8 bg-primary/10 rounded-full text-primary mr-3 flex items-center justify-center">1</span>
              Scientific Depth
            </h3>
            <p className="text-gray-600 ml-11">
              We made Nobel-backed behavioral psychology and Stanford-validated models accessible to every business into a scalable digital tool. 
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-xl font-bold mb-3 flex items-center">
              <span className="inline-block w-8 h-8 bg-primary/10 rounded-full text-primary mr-3 flex items-center justify-center">2</span>
              Radical Data Integrity
            </h3>
            <p className="text-gray-600 ml-11">
              Our insights begin with trust. We uphold transparent, privacy-first practices that exceed industry standards and ensure ethical use of psychometric and behavioral data.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-xl font-bold mb-3 flex items-center">
              <span className="inline-block w-8 h-8 bg-primary/10 rounded-full text-primary mr-3 flex items-center justify-center">3</span>
              Continuous Innovation
            </h3>
            <p className="text-gray-600 ml-11">
              We don’t follow trends, we set them. From AI-powered digital twins to predictive modeling, we continuously push the frontier of what’s possible in customer intelligence.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-xl font-bold mb-3 flex items-center">
              <span className="inline-block w-8 h-8 bg-primary/10 rounded-full text-primary mr-3 flex items-center justify-center">4</span>
              Business Impact
            </h3>
            <p className="text-gray-600 ml-11">
              Every insight we deliver is built to create measurable business impact: sharper segmentation, higher conversion, and smarter decision-making at every touchpoint.


            </p>
          </div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div 
        className="text-center bg-gradient-to-r from-primary to-indigo-600 p-12 rounded-2xl shadow-xl relative overflow-hidden"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2"></div>
        
        <h2 className="text-3xl font-bold text-white mb-6">Ready to transform your Business?</h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
          Discover how PersonalysisPro can help your business understand customers at a deeper level and make more informed strategic decisions.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg"
            className="bg-white hover:bg-gray-100 text-primary hover:text-primary/90 px-6 rounded-full shadow-xl shadow-primary/20 border-none"
            onClick={() => setShowDemoDialog(true)}
          >
            Book a Demo
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}