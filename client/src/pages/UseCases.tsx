import { Building2, Users, TrendingUp, Target, CheckCircle, ArrowRight, Megaphone, ShoppingCart, PieChart, Hammer, BarChart3, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function UseCases() {
  const industries = [
    {
      icon: <Megaphone className="h-8 w-8 text-primary" />,
      title: "Marketing Agencies",
      description: "Understand client psychology and create campaigns that resonate with target audiences",
      useCases: [
        "Client persona development",
        "Creative team optimization",
        "Campaign targeting strategies", 
        "Brand personality alignment"
      ],
      benefits: [
        "Enhanced campaign effectiveness",
        "Better client-agency relationships",
        "Improved creative collaboration"
      ]
    },
    {
      icon: <ShoppingCart className="h-8 w-8 text-primary" />,
      title: "E-commerce",
      description: "Optimize customer experience and build high-performing sales teams",
      useCases: [
        "Customer behavior analysis",
        "Sales team optimization",
        "Personalized shopping experiences",
        "Customer service excellence"
      ],
      benefits: [
        "Increased conversion rates",
        "Higher customer satisfaction",
        "Reduced cart abandonment"
      ]
    },
    {
      icon: <PieChart className="h-8 w-8 text-primary" />,
      title: "Venture Capital",
      description: "Evaluate founding teams and identify entrepreneurs with the right personality traits for success",
      useCases: [
        "Founder personality assessment",
        "Team dynamics evaluation",
        "Investment decision support",
        "Portfolio company guidance"
      ],
      benefits: [
        "Better investment outcomes",
        "Reduced founder conflicts",
        "Enhanced due diligence"
      ]
    },
    {
      icon: <Hammer className="h-8 w-8 text-primary" />,
      title: "Business Builders",
      description: "Build teams with complementary skills and personalities for startup success",
      useCases: [
        "Co-founder compatibility analysis",
        "Early team hiring decisions",
        "Leadership development",
        "Scaling team dynamics"
      ],
      benefits: [
        "Stronger founding teams",
        "Faster product development",
        "Better investor confidence"
      ]
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      title: "Market Research & Insights",
      description: "Understand consumer psychology and deliver deeper insights to clients",
      useCases: [
        "Consumer behavior profiling",
        "Segmentation strategies",
        "Research methodology enhancement",
        "Client advisory services"
      ],
      benefits: [
        "More accurate insights",
        "Enhanced client value",
        "Competitive differentiation"
      ]
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Finance & Insurance",
      description: "Build trust-based relationships and optimize risk assessment capabilities",
      useCases: [
        "Client relationship management",
        "Risk assessment enhancement",
        "Advisory team optimization",
        "Compliance team building"
      ],
      benefits: [
        "Improved client trust",
        "Better risk predictions",
        "Enhanced regulatory compliance"
      ]
    }
  ];

  const keyFeatures = [
    {
      icon: <Target className="h-6 w-6 text-primary" />,
      title: "Precision Targeting",
      description: "Identify the exact personality traits that drive success in your specific industry"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      title: "Iterate or Scale",
      description: "Refine strategy, CTAs, and product features by identifying what underperforms"
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: "Predictive Digital-Twining",
      description: "Build Ideal Customer Profiles and predict what drives engagement and loyalty"
    },
    {
      icon: <Building2 className="h-6 w-6 text-primary" />,
      title: "Achieve KPIs Faster",
      description: "Reach the forecasted KPIs faster than deadlines by replacing traditional workflows"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary/5">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Validate your MVP
            <span className="text-transparent bg-gradient-to-r from-primary to-indigo-600 bg-clip-text block">or scale what you've built.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
           Analize the target audience and set smarter campaigns, scale revenue streams, or iterate your product and pricing strategy. 
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200">
                Turn data into growth
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg" className="border-primary/30 text-primary hover:bg-gradient-to-r hover:from-primary/5 hover:to-indigo-50">
                Request Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 px-4 bg-gradient-to-br from-slate-50 to-primary/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Gain an edge over competitors
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {keyFeatures.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-br from-primary/10 to-indigo-100/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm shadow-primary/5">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Solutions */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-primary/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Solutions by Industry
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Empowering each industry to meet its unique demands and stay ahead in a competitive landscape.
          </p>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {industries.map((industry, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-primary/10 to-indigo-100/50 rounded-lg p-3 shadow-sm shadow-primary/5">
                      {industry.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{industry.title}</CardTitle>
                      <CardDescription className="text-base">
                        {industry.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Use Cases */}
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 mb-3">KEY USE CASES</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {industry.useCases.map((useCase, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="text-sm text-gray-700">{useCase}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Benefits */}
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 mb-3">KEY BENEFITS</h4>
                      <div className="space-y-2">
                        {industry.benefits.map((benefit, i) => (
                          <Badge key={i} variant="secondary" className="text-xs bg-gradient-to-r from-primary/10 to-indigo-100/50 text-primary border-primary/20 shadow-sm">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-indigo-50 to-primary/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Your industry isn’t listed? No problem.
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            We’ve helped companies across diverse sectors. Let’s talk about yours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200">
                Contact Us
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}