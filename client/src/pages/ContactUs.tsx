import { useEffect, useState } from "react";
import { 
  Mail, 
  Phone, 
  MapPin, 
  MessageSquare, 
  Users, 
  Building, 
  Briefcase, 
  Send,
  AlertCircle,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

import { toast } from "@/hooks/use-toast";

export default function ContactUs() {
  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [inquiry, setInquiry] = useState("sales");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // Set page title
    document.title = "Contact Us | PersonalysisPro";
    // Scroll to top on page load
    window.scrollTo(0, 0);
  }, []);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!firstName.trim()) errors.firstName = "First name is required";
    if (!lastName.trim()) errors.lastName = "Last name is required";
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!company.trim()) errors.company = "Company name is required";
    if (!message.trim()) errors.message = "Message is required";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      
      // Clear form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setCompany("");
      setJobTitle("");
      setInquiry("sales");
      setMessage("");
      
      // Show success message
      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll respond to your inquiry shortly.",
        variant: "default",
      });
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 to-indigo-500/10 rounded-2xl p-8 md:p-12 mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-lg text-gray-700 mb-8">
            Get in touch with our team to learn more about how PersonalysisPro can help your 
            business understand customers, employees, and markets through advanced 
            personality insights.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-8 mb-12">
        {/* Contact Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name*
                    </label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={formErrors.firstName ? "border-red-300" : ""}
                    />
                    {formErrors.firstName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {formErrors.firstName}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name*
                    </label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={formErrors.lastName ? "border-red-300" : ""}
                    />
                    {formErrors.lastName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {formErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address*
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={formErrors.email ? "border-red-300" : ""}
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                      Company*
                    </label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className={formErrors.company ? "border-red-300" : ""}
                    />
                    {formErrors.company && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {formErrors.company}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title
                    </label>
                    <Input
                      id="jobTitle"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="inquiry" className="block text-sm font-medium text-gray-700 mb-1">
                    Inquiry Type
                  </label>
                  <Select value={inquiry} onValueChange={setInquiry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your inquiry type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales Inquiry</SelectItem>
                      <SelectItem value="support">Support Request</SelectItem>
                      <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                      <SelectItem value="press">Press Inquiry</SelectItem>
                      <SelectItem value="careers">Careers</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message*
                  </label>
                  <Textarea
                    id="message"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={formErrors.message ? "border-red-300" : ""}
                  />
                  {formErrors.message && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {formErrors.message}
                    </p>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-8"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </form>
          </div>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 mb-2">What is PersonalysisPro?</h3>
            <p className="text-gray-600 mb-4">
              PersonalysisPro is an AI-powered personality assessment platform that helps businesses 
              better understand their customers, employees, and markets through sophisticated personality 
              analysis, enabling more personalized experiences and data-driven decisions.
            </p>
            
            <h3 className="font-semibold text-lg text-gray-900 mb-2">How does the platform work?</h3>
            <p className="text-gray-600 mb-4">
              Our platform uses advanced machine learning algorithms to analyze responses to carefully 
              designed surveys, providing deep insights into personality traits, preferences, and behavioral 
              patterns that can inform business strategy and customer engagement.
            </p>
            
            <h3 className="font-semibold text-lg text-gray-900 mb-2">Is my data secure?</h3>
            <p className="text-gray-600">
              Yes, we take data security very seriously. All data is encrypted both in transit and at rest, 
              and we comply with GDPR, CCPA, and other relevant privacy regulations. For more details, 
              please see our Privacy Policy.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg text-gray-900 mb-2">Do you offer custom solutions?</h3>
            <p className="text-gray-600 mb-4">
              Yes, we offer customized solutions tailored to your organization's specific needs. 
              Our team can work with you to create bespoke assessment tools, integrate with your 
              existing systems, and develop specialized reports and dashboards.
            </p>
            
            <h3 className="font-semibold text-lg text-gray-900 mb-2">How much does it cost?</h3>
            <p className="text-gray-600 mb-4">
              We offer various pricing tiers based on your organization's size and needs. Please 
              contact our sales team to discuss the best option for you and receive a customized quote.
            </p>
            
            <h3 className="font-semibold text-lg text-gray-900 mb-2">Do you offer a free trial?</h3>
            <p className="text-gray-600">
              Yes, we offer a limited free trial that allows you to explore the platform's capabilities 
              before committing. You can sign up for a trial or request a demo through our website.
            </p>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">Still have questions? We're here to help!</p>
          <Button
            variant="outline"
            className="mr-2"
            onClick={() => window.open('https://80a8d680-ec68-42b4-8ad3-b557ea0a51b5-00-5urcoh3p6qvs.kirk.replit.dev/documentation', '_blank')}
          >
            View Documentation
          </Button>
        </div>
      </div>
      
      {/* Newsletter Signup */}
      <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-xl p-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Stay Connected</h2>
        <p className="text-white/90 mb-6 max-w-2xl mx-auto">
          Subscribe to our newsletter to receive the latest news, product updates, and insights 
          about personality assessment in business.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <Input 
            type="email" 
            placeholder="Enter your email" 
            className="bg-white/20 text-white placeholder:text-white/60 border-white/30 focus:border-white"
          />
          <Button variant="secondary" className="bg-white text-primary hover:bg-white/90 whitespace-nowrap">
            Subscribe
          </Button>
        </div>
      </div>
    </div>
  );
}