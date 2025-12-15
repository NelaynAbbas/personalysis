import { useEffect, useState } from "react";
import {
  Briefcase,
  MapPin,
  Clock,
  Search,
  Filter,
  ChevronRight,
  CheckCircle,
  Users,
  Lightbulb,
  BarChart,
  Heart,
  Coffee,
  Award
} from "lucide-react";
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

export default function Careers() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  
  useEffect(() => {
    // Set page title
    document.title = "Careers | PersonalysisPro";
    // Scroll to top on page load
    window.scrollTo(0, 0);
  }, []);

  const careerOpenings = [
    {
      id: 1,
      title: "Senior Frontend Developer",
      department: "Engineering",
      location: "San Francisco, CA",
      type: "Full-time",
      posted: "3 days ago",
      description: "We're looking for a talented Frontend Developer to create exceptional user experiences for our enterprise customers."
    },
    {
      id: 2,
      title: "Machine Learning Engineer",
      department: "AI Research",
      location: "San Francisco, CA",
      type: "Full-time",
      posted: "1 week ago",
      description: "Join our AI team to develop cutting-edge personality analysis models and algorithms."
    },
    {
      id: 3,
      title: "DevOps Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      posted: "2 weeks ago",
      description: "Help us build and maintain our cloud infrastructure and deployment pipelines."
    },
    {
      id: 4,
      title: "Senior Product Manager",
      department: "Product",
      location: "New York, NY",
      type: "Full-time",
      posted: "2 days ago",
      description: "Drive the product roadmap for our enterprise platform and collaborate with cross-functional teams."
    },
    {
      id: 5,
      title: "UX/UI Designer",
      department: "Design",
      location: "San Francisco, CA",
      type: "Full-time",
      posted: "5 days ago",
      description: "Create beautiful, intuitive interfaces for our personality assessment tools."
    },
    {
      id: 6,
      title: "Account Executive",
      department: "Sales",
      location: "Remote",
      type: "Full-time",
      posted: "1 week ago",
      description: "Develop relationships with enterprise clients and help them leverage our platform."
    },
    {
      id: 7,
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "New York, NY",
      type: "Full-time",
      posted: "3 days ago",
      description: "Ensure our clients achieve their goals using our platform and drive retention."
    },
    {
      id: 8,
      title: "Technical Writer",
      department: "Engineering",
      location: "Remote",
      type: "Part-time",
      posted: "1 week ago",
      description: "Create clear documentation for our API and platform features."
    },
    {
      id: 9,
      title: "Data Scientist",
      department: "Data",
      location: "San Francisco, CA",
      type: "Full-time",
      posted: "2 weeks ago",
      description: "Analyze user behavior and personality data to uncover valuable insights."
    },
    {
      id: 10,
      title: "Marketing Manager",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
      posted: "4 days ago",
      description: "Develop and execute marketing strategies to drive awareness and adoption."
    },
  ];

  // Get unique departments and locations for filters
  const departments = ["all", ...new Set(careerOpenings.map(job => job.department))];
  const locations = ["all", ...new Set(careerOpenings.map(job => job.location))];

  // Filter job openings based on search query and filters
  const filteredJobs = careerOpenings.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = departmentFilter === "all" || job.department === departmentFilter;
    const matchesLocation = locationFilter === "all" || job.location === locationFilter;
    
    return matchesSearch && matchesDepartment && matchesLocation;
  });

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 to-indigo-500/10 rounded-2xl p-8 md:p-12 mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t('pages.careers.title')}</h1>
          <p className="text-lg text-gray-700 mb-8">
            {t('pages.careers.subtitle')}
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            {t('pages.careers.viewPositions')}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Core Values Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">{t('pages.careers.coreValues')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">People First</h3>
            <p className="text-gray-600">
              We believe in the potential of every individual and create an inclusive environment where diverse perspectives thrive.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
            <p className="text-gray-600">
              We're constantly pushing boundaries, experimenting with new ideas, and finding creative solutions to complex problems.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <BarChart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Data-Driven</h3>
            <p className="text-gray-600">
              We make decisions based on data and research, combining scientific methods with human-centered design.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Impact</h3>
            <p className="text-gray-600">
              We're focused on creating meaningful change by helping businesses better understand and serve their customers.
            </p>
          </div>
        </div>
      </div>
      
      {/* Benefits Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">{t('pages.careers.benefitsPerks')}</h2>
        <p className="text-center text-gray-600 max-w-3xl mx-auto mb-10">
          We believe in taking care of our team with competitive compensation and benefits that support your health, wealth, and well-being.
        </p>
        
        <Tabs defaultValue="health" className="w-full">
          <TabsList className="flex flex-wrap justify-center mb-8">
            <TabsTrigger value="health">Health & Wellness</TabsTrigger>
            <TabsTrigger value="financial">Financial Benefits</TabsTrigger>
            <TabsTrigger value="work">Work-Life Balance</TabsTrigger>
            <TabsTrigger value="growth">Growth & Development</TabsTrigger>
          </TabsList>
          
          <TabsContent value="health" className="mt-0">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Comprehensive Healthcare</h4>
                    <p className="text-gray-600 text-sm">Medical, dental, and vision insurance for you and your dependents</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Mental Health Support</h4>
                    <p className="text-gray-600 text-sm">Free access to therapy and counseling services</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Wellness Stipend</h4>
                    <p className="text-gray-600 text-sm">Monthly allowance for gym memberships, fitness classes, and wellness apps</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Healthy Snacks & Meals</h4>
                    <p className="text-gray-600 text-sm">Nutritious options in our offices and meal allowances for remote employees</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Fitness Challenges</h4>
                    <p className="text-gray-600 text-sm">Regular team activities to promote physical and mental well-being</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Ergonomic Equipment</h4>
                    <p className="text-gray-600 text-sm">Home office setup allowance for comfortable and productive work</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="financial" className="mt-0">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Competitive Salary</h4>
                    <p className="text-gray-600 text-sm">Above-market compensation based on your experience and impact</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Equity Ownership</h4>
                    <p className="text-gray-600 text-sm">Stock options to share in the company's success</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">401(k) Matching</h4>
                    <p className="text-gray-600 text-sm">Generous company match to help you save for retirement</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Performance Bonuses</h4>
                    <p className="text-gray-600 text-sm">Regular recognition of exceptional contributions</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Commuter Benefits</h4>
                    <p className="text-gray-600 text-sm">Pre-tax transportation allowances for office-based employees</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Relocation Assistance</h4>
                    <p className="text-gray-600 text-sm">Support for team members moving to join our in-office locations</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="work" className="mt-0">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Flexible Work</h4>
                    <p className="text-gray-600 text-sm">Remote-friendly options and flexible hours to fit your life</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Unlimited PTO</h4>
                    <p className="text-gray-600 text-sm">Take the time you need to rest, recharge, and enjoy life</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Paid Parental Leave</h4>
                    <p className="text-gray-600 text-sm">Generous leave for all parents to bond with new additions to their family</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Sabbatical Program</h4>
                    <p className="text-gray-600 text-sm">Extended paid time off after 3 years with the company</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Company Retreats</h4>
                    <p className="text-gray-600 text-sm">Annual gatherings to connect, collaborate, and celebrate as a team</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Volunteer Time Off</h4>
                    <p className="text-gray-600 text-sm">Paid time to give back to causes you care about</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="growth" className="mt-0">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Learning Budget</h4>
                    <p className="text-gray-600 text-sm">Annual stipend for courses, conferences, and learning materials</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Mentorship Program</h4>
                    <p className="text-gray-600 text-sm">Connect with experienced leaders who can guide your career</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Career Coaching</h4>
                    <p className="text-gray-600 text-sm">One-on-one support to help you define and achieve your goals</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Cross-Training</h4>
                    <p className="text-gray-600 text-sm">Opportunities to learn new skills across different areas of the business</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Book Club</h4>
                    <p className="text-gray-600 text-sm">Monthly discussions and free books to expand your knowledge</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Lunch & Learns</h4>
                    <p className="text-gray-600 text-sm">Regular sessions to share knowledge and learn from colleagues</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Open Positions Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('pages.careers.openPositions')}</h2>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search jobs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept === "all" ? "All Departments" : dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[180px]">
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc === "all" ? "All Locations" : loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {filteredJobs.length > 0 ? (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div 
                key={job.id} 
                className="border border-gray-200 rounded-lg p-6 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors duration-200">
                      {job.title}
                    </h3>
                    <p className="text-gray-600 mt-1 mb-3">{job.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {job.department}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        <MapPin className="h-3 w-3 mr-1" />
                        {job.location}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        <Clock className="h-3 w-3 mr-1" />
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-sm text-gray-500 mr-4 hidden md:block">Posted {job.posted}</div>
                    <Button size="sm" className="whitespace-nowrap">
                      View Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No positions found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search filters or check back later for new openings.</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setDepartmentFilter("all");
                setLocationFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
      
      {/* Application Process */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Application Process</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-primary font-bold">1</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Application Review</h3>
            <p className="text-gray-600 text-sm">
              Our recruiting team carefully reviews your application and resume
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-primary font-bold">2</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Initial Interview</h3>
            <p className="text-gray-600 text-sm">
              A 30-minute video call to discuss your experience and interest
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-primary font-bold">3</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Skills Assessment</h3>
            <p className="text-gray-600 text-sm">
              A practical exercise relevant to the role you're applying for
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-primary font-bold">4</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Team Interviews</h3>
            <p className="text-gray-600 text-sm">
              Meet with potential teammates and cross-functional partners
            </p>
          </div>
        </div>
      </div>
      
      {/* Culture Gallery */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Life at PersonalysisPro</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="aspect-square bg-primary/10 rounded-lg flex items-center justify-center">
            <Coffee className="h-12 w-12 text-primary/50" />
          </div>
          <div className="aspect-square bg-indigo-500/10 rounded-lg flex items-center justify-center">
            <Users className="h-12 w-12 text-indigo-500/50" />
          </div>
          <div className="aspect-square bg-primary/10 rounded-lg flex items-center justify-center">
            <Award className="h-12 w-12 text-primary/50" />
          </div>
          <div className="aspect-square bg-indigo-500/10 rounded-lg flex items-center justify-center">
            <Lightbulb className="h-12 w-12 text-indigo-500/50" />
          </div>
        </div>
      </div>
      
      {/* CTA */}
      <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-xl p-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Ready to Join Our Team?</h2>
        <p className="text-white/90 mb-6 max-w-2xl mx-auto">
          Browse our open positions and find the perfect fit for your skills and passion.
        </p>
        <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
          View All Openings
        </Button>
      </div>
    </div>
  );
}