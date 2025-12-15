import { useEffect, useState } from "react";
import { Calendar, Download, ExternalLink, Filter, Newspaper, Search, Award, TrendingUp, Users, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";

export default function Press() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  useEffect(() => {
    // Set page title
    document.title = "Press & News | PersonalysisPro";
    // Scroll to top on page load
    window.scrollTo(0, 0);
  }, []);

  const pressReleases = [
    {
      id: 1,
      title: "PersonalysisPro Raises $25M Series B to Expand Enterprise Personality Assessment Platform",
      date: "April 12, 2025",
      year: "2025",
      category: "Funding",
      summary: "New funding will accelerate growth and expand AI-powered personality assessment capabilities for enterprise clients.",
      link: "#"
    },
    {
      id: 2,
      title: "PersonalysisPro Launches Advanced Team Compatibility Analysis for Enterprise Clients",
      date: "February 28, 2025",
      year: "2025",
      category: "Product",
      summary: "New feature helps organizations build more effective teams based on personality traits and working styles.",
      link: "#"
    },
    {
      id: 3,
      title: "PersonalysisPro Appoints Dr. Emily Johnson as Chief Psychology Officer",
      date: "January 15, 2025",
      year: "2025",
      category: "Leadership",
      summary: "Former Harvard professor brings expertise in organizational psychology to lead research initiatives.",
      link: "#"
    },
    {
      id: 4,
      title: "PersonalysisPro Partners with Fortune 500 Retailer to Enhance Customer Experience",
      date: "November 20, 2024",
      year: "2024",
      category: "Partnership",
      summary: "Major retailer adopts PersonalysisPro to better understand customer preferences and personalize shopping experiences.",
      link: "#"
    },
    {
      id: 5,
      title: "PersonalysisPro Reaches 1 Million Personality Assessments Milestone",
      date: "September 5, 2024",
      year: "2024",
      category: "Growth",
      summary: "Platform achieves significant usage milestone as adoption among enterprise clients accelerates.",
      link: "#"
    },
    {
      id: 6,
      title: "PersonalysisPro Unveils Next-Generation AI Model for Deeper Personality Insights",
      date: "July 17, 2024",
      year: "2024",
      category: "Technology",
      summary: "New machine learning algorithms enable more accurate and nuanced personality assessments.",
      link: "#"
    },
    {
      id: 7,
      title: "PersonalysisPro Named to Fast Company's Most Innovative Companies List",
      date: "March 10, 2024",
      year: "2024",
      category: "Award",
      summary: "Recognition highlights company's innovative approach to personality assessment in business contexts.",
      link: "#"
    },
    {
      id: 8,
      title: "PersonalysisPro Expands International Presence with New EMEA Headquarters",
      date: "January 25, 2024",
      year: "2024",
      category: "Expansion",
      summary: "New London office will serve growing client base in Europe, Middle East, and Africa regions.",
      link: "#"
    },
    {
      id: 9,
      title: "PersonalysisPro Secures $10M Series A Funding",
      date: "October 5, 2023",
      year: "2023",
      category: "Funding",
      summary: "Investment led by leading venture capital firms to accelerate product development and market expansion.",
      link: "#"
    },
    {
      id: 10,
      title: "PersonalysisPro Launches Enterprise Platform for Personality-Based Customer Insights",
      date: "May 18, 2023",
      year: "2023",
      category: "Product",
      summary: "New B2B SaaS platform helps businesses better understand and serve their customers through personality insights.",
      link: "#"
    },
  ];

  const mediaFeatures = [
    {
      id: 1,
      outlet: "TechCrunch",
      title: "PersonalysisPro is revolutionizing how businesses understand their customers",
      date: "March 28, 2025",
      year: "2025",
      image: "",
      link: "#"
    },
    {
      id: 2,
      outlet: "Forbes",
      title: "The AI-Powered Future of Customer Psychology: PersonalysisPro Leading the Way",
      date: "February 12, 2025",
      year: "2025",
      image: "",
      link: "#"
    },
    {
      id: 3,
      outlet: "Harvard Business Review",
      title: "How Personality Assessment is Transforming Enterprise Decision-Making",
      date: "December 5, 2024",
      year: "2024",
      image: "",
      link: "#"
    },
    {
      id: 4,
      outlet: "CNBC",
      title: "PersonalysisPro CEO Discusses $25M Funding Round and Growth Strategy",
      date: "April 15, 2025",
      year: "2025",
      image: "",
      link: "#"
    },
    {
      id: 5,
      outlet: "Wired",
      title: "The Science of Personality: How PersonalysisPro is Making Psychology Actionable for Business",
      date: "November 20, 2024",
      year: "2024",
      image: "",
      link: "#"
    },
    {
      id: 6,
      outlet: "The Wall Street Journal",
      title: "Retail Giants Turn to PersonalysisPro for Customer Insights Edge",
      date: "October 3, 2024",
      year: "2024",
      image: "",
      link: "#"
    },
  ];

  // Get unique years and categories for filters
  const years = ["all", ...new Set(pressReleases.map(release => release.year))];
  const categories = ["all", ...new Set(pressReleases.map(release => release.category))];

  // Filter press releases based on search query and filters
  const filteredReleases = pressReleases.filter(release => {
    const matchesSearch = release.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         release.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = yearFilter === "all" || release.year === yearFilter;
    const matchesCategory = categoryFilter === "all" || release.category === categoryFilter;
    
    return matchesSearch && matchesYear && matchesCategory;
  });

  // Filter media features based on search query and year filter
  const filteredFeatures = mediaFeatures.filter(feature => {
    const matchesSearch = feature.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         feature.outlet.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = yearFilter === "all" || feature.year === yearFilter;
    
    return matchesSearch && matchesYear;
  });

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 to-indigo-500/10 rounded-2xl p-8 md:p-12 mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t('pages.press.title')}</h1>
          <p className="text-lg text-gray-700 mb-8">
            {t('pages.press.subtitle')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="default">{t('pages.press.mediaKit')}</Button>
            <Button variant="outline">{t('pages.press.contactPressTeam')}</Button>
          </div>
        </div>
      </div>
      
      {/* Company Overview Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('pages.press.companyOverview')}</h2>
        
        <div className="prose prose-primary max-w-none">
          <p className="text-gray-700">
            PersonalysisPro is the leading enterprise platform for AI-powered personality assessment and insights. 
            Our platform helps businesses better understand their customers, employees, and markets through 
            sophisticated personality analysis, enabling more personalized experiences and data-driven decisions.
          </p>
          
          <p className="text-gray-700">
            Founded in 2023 by a team of experienced technologists and organizational psychologists, 
            PersonalysisPro has quickly grown to serve hundreds of enterprise clients worldwide. The company 
            is headquartered in San Francisco with additional offices in New York and London.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="font-bold text-3xl text-gray-900 mb-2">250+</div>
            <div className="text-gray-600">{t('pages.press.enterpriseClients')}</div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div className="font-bold text-3xl text-gray-900 mb-2">1M+</div>
            <div className="text-gray-600">{t('pages.press.assessments')}</div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div className="font-bold text-3xl text-gray-900 mb-2">12</div>
            <div className="text-gray-600">{t('pages.press.industryAwards')}</div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 mt-8">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Fact Sheet
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Logo Pack
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Media Kit
          </Button>
        </div>
      </div>
      
      {/* News Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-12">
        <Tabs defaultValue="press-releases" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="press-releases" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              Press Releases
            </TabsTrigger>
            <TabsTrigger value="media-coverage" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Media Coverage
            </TabsTrigger>
          </TabsList>
          
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  type="text" 
                  placeholder="Search news..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year === "all" ? "All Years" : year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Only show category filter in press releases tab */}
                <TabsContent value="press-releases" className="m-0 p-0">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category === "all" ? "All Categories" : category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TabsContent>
              </div>
            </div>
          </div>
          
          <TabsContent value="press-releases" className="mt-0">
            {filteredReleases.length > 0 ? (
              <div className="space-y-6">
                {filteredReleases.map((release) => (
                  <div key={release.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-center text-sm text-gray-500 mb-2 gap-4">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1.5" />
                        {release.date}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {release.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-primary transition-colors">
                      <a href={release.link}>{release.title}</a>
                    </h3>
                    <p className="text-gray-600 mb-4">{release.summary}</p>
                    <Button variant="ghost" size="sm" className="hover:bg-primary/5 hover:text-primary transition-colors gap-1.5" asChild>
                      <a href={release.link}>
                        Read full release
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Newspaper className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No press releases found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search filters or check back later for new releases.</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setYearFilter("all");
                    setCategoryFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="media-coverage" className="mt-0">
            {filteredFeatures.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredFeatures.map((feature) => (
                  <a 
                    key={feature.id} 
                    href={feature.link}
                    className="group block bg-gray-50 rounded-lg p-6 hover:bg-primary/5 transition-colors"
                  >
                    <div className="text-sm text-gray-500 mb-2">
                      <span className="font-semibold text-primary">{feature.outlet}</span> • {feature.date}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <div className="flex items-center text-primary text-sm font-medium">
                      Read article
                      <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <ExternalLink className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No media coverage found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search filters or check back later for new articles.</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setYearFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Press Contact Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Press Contact</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Media Inquiries</h3>
            <p className="text-gray-600 mb-4">
              For press inquiries, interview requests, or additional information about PersonalysisPro, 
              please contact our communications team.
            </p>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-gray-700">
                <LinkIcon className="h-4 w-4 mr-2 text-primary" />
                <a href="mailto:press@personalysispro.com" className="hover:text-primary">press@personalysispro.com</a>
              </div>
              <div className="flex items-center text-gray-700">
                <LinkIcon className="h-4 w-4 mr-2 text-primary" />
                <a href="tel:+18001234567" className="hover:text-primary">+1 (800) 123-4567 ext. 555</a>
              </div>
            </div>
            
            <Button variant="default" className="flex items-center gap-2">
              Contact Press Team
            </Button>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Press Kit</h3>
            <p className="text-gray-600 mb-4">
              Download our press kit for company information, executive bios, logo files, product images, 
              and other resources for media coverage.
            </p>
            
            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
              <Download className="h-4 w-4" />
              Download Press Kit (ZIP, 24MB)
            </Button>
          </div>
        </div>
      </div>
      
      {/* Newsletter Signup */}
      <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-xl p-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Stay Updated</h2>
        <p className="text-white/90 mb-6 max-w-2xl mx-auto">
          Subscribe to our press releases and company news to receive the latest updates directly in your inbox.
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