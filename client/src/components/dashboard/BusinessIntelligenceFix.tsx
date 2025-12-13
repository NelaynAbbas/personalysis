import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  PieChart, 
  BarChart, 
  LineChart,
  Users,
  Lightbulb,
  TrendingUp,
  DollarSign,
  Target,
  MessageSquare
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { trackEvent } from "@/lib/analytics";

// Interface definitions
interface CompetitorAnalysis {
  name: string;
  marketShare: number;
  strengthScore: number;
  strengths: string[];
  weaknesses: string[];
  pricingPosition: string;
  customerSentiment: number;
  overallThreatLevel: number;
  productFeatureComparison?: {
    [key: string]: {
      competitor: number;
      our: number;
    };
  };
}

interface MarketFitAnalysis {
  productId: string;
  productName: string;
  overallFitScore: number;
  problemSolutionFit: number;
  productMarketFit: number;
  customerNeedAlignment: number;
  valuePropositionClarity: number;
  marketSizePotential: {
    total: number;
    addressable: number;
    serviceable: number;
  };
}

interface CustomerSegment {
  name: string;
  size: number;
  percentageOfCustomers: number;
  growthRate: number;
  dominantTraits: Array<{
    name: string;
    score: number;
  }>;
}

interface ProductFeaturePriority {
  featureName: string;
  importance: number;
  currentSatisfaction: number;
  developmentCost: number;
  timeToImplement: string;
  impactOnSales: number;
  competitiveNecessity: number;
  technicalFeasibility: number;
  strategicAlignment: number;
  overallPriority: number;
}

interface PricingStrategy {
  strategyName: string;
  appropriateness: number;
  potentialRevenue: number;
  customerAcceptance: number;
  competitiveSustainability: number;
  implementationComplexity: number;
  profitMargin: number;
  marketPenetration: number;
  overallScore: number;
  priceElasticity: number;
  pricingStructure: {
    base: number;
    tiers: Array<{
      name: string;
      tierName: string;
      price: number;
      features: string[];
    }>;
  };
}

interface MarketingStrategy {
  strategyName: string;
  effectiveness: number;
  costEfficiency: number;
  implementationTimeline: string;
  revenueImpact: number;
  brandAlignment: number;
  customerReach: number;
  competitiveAdvantage: number;
  channelBreakdown: {
    [key: string]: number;
  };
  messagingThemes: string[];
  targetedPersonas: string[];
  overallScore: number;
}

interface RevenueForecasting {
  scenario: string;
  probabilityOfOccurrence: number;
  timeframe: string;
  projectedRevenue: number;
  growthRate: number;
  marketShareProjection: number;
  customerAdoption: number;
  contributingFactors: string[];
  riskFactors: string[];
  confidenceLevel: number;
  monthlyBreakdown: {
    [month: string]: number;
  };
  revenueStreams: Array<{
    name: string;
    percentage: number;
    growth: number;
  }>;
  totalProjectedRevenue: number;
}

interface BusinessIntelligenceProps {
  surveyId?: string;
  companyId?: number;
}

const BusinessIntelligenceFix = ({ surveyId = 'all', companyId = 1 }: BusinessIntelligenceProps) => {
  const [currentScenario, setCurrentScenario] = useState<string>("standard");
  
  // API base endpoint
  const apiBaseEndpoint = `/api/company/${companyId}`;
  
  // Track component mount
  useEffect(() => {
    trackEvent(
      'view_business_intelligence',
      'dashboard',
      `company_${companyId}`
    );
  }, [companyId]);
  
  // Helper function for API requests
  const getQueryFn = (endpoint: string) => async () => {
    try {
      // apiRequest expects (url, config). It returns parsed JSON with { status, data }
      const data = await apiRequest(endpoint, { method: 'GET' });

      // Track successful data loading
      if (data && (data.data !== undefined || data.status === 'success')) {
        const section = endpoint.split('/').pop();
        trackEvent(
          'data_loaded',
          'business_intelligence',
          `${section}_data`
        );
      }

      return data;
    } catch (error) {
      console.error(`Error fetching from ${endpoint}:`, error);

      // Track data loading failure
      trackEvent(
        'data_error',
        'business_intelligence',
        endpoint
      );

      return { data: null };
    }
  };

  // Market Fit Analysis
  const { data: marketFitData, isLoading: isMarketFitLoading } = useQuery({
    queryKey: [`${apiBaseEndpoint}/market-fit/default`],
    queryFn: getQueryFn(`${apiBaseEndpoint}/market-fit/default`),
  });
  const marketFit = marketFitData?.data || null;

  // Competitors Analysis
  const { data: competitorsData, isLoading: isCompetitorsLoading } = useQuery({
    queryKey: [`${apiBaseEndpoint}/competitors`],
    queryFn: getQueryFn(`${apiBaseEndpoint}/competitors`),
  });
  const competitors = competitorsData?.data || [];

  // Customer Segments
  const { data: segmentsData, isLoading: isSegmentsLoading } = useQuery({
    queryKey: [`${apiBaseEndpoint}/segments`],
    queryFn: getQueryFn(`${apiBaseEndpoint}/segments`),
  });
  const segments = segmentsData?.data || [];

  // Feature Priorities
  const { data: featuresData, isLoading: isFeaturesLoading } = useQuery({
    queryKey: [`${apiBaseEndpoint}/feature-priorities`],
    queryFn: getQueryFn(`${apiBaseEndpoint}/feature-priorities`),
  });
  const features = featuresData?.data || [];

  // Pricing Strategies
  const { data: pricingData, isLoading: isPricingLoading } = useQuery({
    queryKey: [`${apiBaseEndpoint}/pricing-strategies`],
    queryFn: getQueryFn(`${apiBaseEndpoint}/pricing-strategies`),
  });
  const pricingStrategies = pricingData?.data || [];

  // Marketing Strategies
  const { data: marketingData, isLoading: isMarketingLoading } = useQuery({
    queryKey: [`${apiBaseEndpoint}/marketing-strategies`],
    queryFn: getQueryFn(`${apiBaseEndpoint}/marketing-strategies`),
  });
  const marketingStrategies = marketingData?.data || [];

  // Revenue Forecasts
  const { data: revenueData, isLoading: isRevenueLoading } = useQuery({
    queryKey: [`${apiBaseEndpoint}/revenue-forecasts`],
    queryFn: getQueryFn(`${apiBaseEndpoint}/revenue-forecasts`),
  });
  const forecasts = revenueData?.data || [];

  // Loading state
  const isLoading = isMarketFitLoading || isCompetitorsLoading || isSegmentsLoading || 
                   isFeaturesLoading || isPricingLoading || isMarketingLoading || isRevenueLoading;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Card className="mb-8">
        <CardHeader className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-display font-bold text-gray-900">
              Business Intelligence Platform
            </CardTitle>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">Enterprise Edition</span>
              <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">PRO</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs 
            defaultValue="market-fit" 
            className="w-full"
            onValueChange={(value) => {
              // Track tab change event
              trackEvent(
                'view_bi_section',  // action
                'business_intelligence', // category
                value, // label - the tab being viewed
              );
            }}
          >
            <TabsList className="w-full justify-start p-2 bg-gray-50 border-b border-gray-200 overflow-x-auto flex-nowrap">
              <TabsTrigger value="competitors">
                <BarChart className="h-4 w-4 mr-1" />
                Competitor Analysis
              </TabsTrigger>
              <TabsTrigger value="market-fit">
                <Target className="h-4 w-4 mr-1" />
                Market Fit
              </TabsTrigger>
              <TabsTrigger value="segments">
                <Users className="h-4 w-4 mr-1" />
                Customer Segments
              </TabsTrigger>
              <TabsTrigger value="features">
                <Lightbulb className="h-4 w-4 mr-1" />
                Feature Priorities
              </TabsTrigger>
              <TabsTrigger value="pricing">
                <DollarSign className="h-4 w-4 mr-1" />
                Pricing Strategies
              </TabsTrigger>
              <TabsTrigger value="marketing">
                <TrendingUp className="h-4 w-4 mr-1" />
                Marketing Strategies
              </TabsTrigger>
              <TabsTrigger value="revenue">
                <LineChart className="h-4 w-4 mr-1" />
                Revenue Forecasts
              </TabsTrigger>
            </TabsList>

            {/* Competitors Tab */}
            <TabsContent value="competitors" className="p-6">
              {competitors && competitors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {competitors.map((competitor: CompetitorAnalysis) => (
                    <Card key={competitor.name} className="overflow-hidden">
                      <CardHeader className="bg-gray-50 pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{competitor.name}</CardTitle>
                          <Badge 
                            variant={competitor.strengthScore > 75 ? "destructive" : 
                                    competitor.strengthScore > 50 ? "default" : "outline"}
                          >
                            {competitor.strengthScore}/100
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 mt-1 flex justify-between">
                          <span>Market Share: {competitor.marketShare}%</span>
                          <span>Price: {competitor.pricingPosition || "Unknown"}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-500 mb-2">STRENGTHS</h4>
                            <ul className="text-sm space-y-1">
                              {competitor.strengths && competitor.strengths.length > 0 ? (
                                competitor.strengths.map((strength, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="text-green-500 text-xs mr-1 mt-1">●</span>
                                    <span>{strength}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-gray-500">No data available</li>
                              )}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-500 mb-2">WEAKNESSES</h4>
                            <ul className="text-sm space-y-1">
                              {competitor.weaknesses && competitor.weaknesses.length > 0 ? (
                                competitor.weaknesses.map((weakness, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="text-red-500 text-xs mr-1 mt-1">●</span>
                                    <span>{weakness}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-gray-500">No data available</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center">
                  <p className="text-gray-500">No competitor data available</p>
                </div>
              )}
            </TabsContent>

            {/* Market Fit Tab */}
            <TabsContent value="market-fit" className="p-6">
              {marketFit ? (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <Card className="flex-1">
                      <CardHeader>
                        <CardTitle>{marketFit.productName || "Market Fit Analysis"}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-4xl font-bold text-blue-600">{marketFit.overallFitScore}/100</div>
                            <div className="text-sm text-gray-600">Overall Market Fit Score</div>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg text-center">
                            <div className="text-2xl font-bold">{marketFit.problemSolutionFit}/100</div>
                            <div className="text-sm text-gray-500">Problem-Solution Fit</div>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg text-center">
                            <div className="text-2xl font-bold">{marketFit.productMarketFit}/100</div>
                            <div className="text-sm text-gray-500">Product-Market Fit</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="flex-1">
                      <CardHeader>
                        <CardTitle>Target Market Size</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="p-4 bg-gray-50 rounded-lg text-center">
                            <div className="text-xl font-bold">
                              ${(marketFit?.marketSizePotential?.total ? (marketFit.marketSizePotential.total / 1_000_000_000).toFixed(1) : "0.0")}B
                            </div>
                            <div className="text-sm text-gray-500">Total Market Size</div>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg text-center">
                            <div className="text-xl font-bold">
                              ${(marketFit?.marketSizePotential?.addressable ? (marketFit.marketSizePotential.addressable / 1_000_000_000).toFixed(1) : "0.0")}B
                            </div>
                            <div className="text-sm text-gray-500">Total Addressable Market (TAM)</div>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg text-center">
                            <div className="text-xl font-bold">
                              ${(marketFit?.marketSizePotential?.serviceable ? (marketFit.marketSizePotential.serviceable / 1_000_000).toFixed(0) : "0")}M
                            </div>
                            <div className="text-sm text-gray-500">Serviceable Available Market (SAM)</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Key Fit Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-center mb-2">
                            <div className="text-2xl font-bold">{marketFit.customerNeedAlignment}%</div>
                            <div className="text-sm text-gray-500">Customer Need Alignment</div>
                          </div>
                          <div className="text-sm text-gray-600 text-center">
                            How well the product aligns with identified customer problems
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-center mb-2">
                            <div className="text-2xl font-bold">{marketFit.valuePropositionClarity}%</div>
                            <div className="text-sm text-gray-500">Value Proposition Clarity</div>
                          </div>
                          <div className="text-sm text-gray-600 text-center">
                            How clearly the unique value is communicated to users
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-center mb-2">
                            <div className="text-2xl font-bold">{marketFit.productDifferentiation || 80}%</div>
                            <div className="text-sm text-gray-500">Product Differentiation</div>
                          </div>
                          <div className="text-sm text-gray-600 text-center">
                            How clearly the product stands out from competitors
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center">
                  <p className="text-gray-500">No market fit data available</p>
                </div>
              )}
            </TabsContent>

            {/* Customer Segments Tab */}
            <TabsContent value="segments" className="p-6">
              {segments && segments.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {segments.map((segment: CustomerSegment, index: number) => (
                      <Card key={index} className="overflow-hidden">
                        <CardHeader className="bg-gray-50 pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg font-medium">{segment.name}</CardTitle>
                            <Badge variant="outline" className="bg-blue-50 text-blue-600">
                              {segment.percentageOfCustomers}%
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3 bg-gray-50 rounded-lg text-center">
                              <div className="text-lg font-bold">{segment.size.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">Estimated Size</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg text-center">
                              <div className="text-lg font-bold text-green-600">+{segment.growthRate}%</div>
                              <div className="text-xs text-gray-500">Annual Growth</div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Dominant Traits</h4>
                            <div className="space-y-2">
                              {segment.dominantTraits.map((trait, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                  <span>{trait.name}</span>
                                  <span className="font-medium">{trait.score}/100</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center">
                  <p className="text-gray-500">No customer segment data available</p>
                </div>
              )}
            </TabsContent>

            {/* Feature Priorities Tab */}
            <TabsContent value="features" className="p-6">
              {features && features.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {features.map((feature: ProductFeaturePriority) => (
                      <Card key={feature.featureName} className="overflow-hidden">
                        <CardHeader className="bg-gray-50 pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{feature.featureName}</CardTitle>
                            <Badge variant={feature.overallPriority > 80 ? "default" : "outline"}>
                              {feature?.overallPriority?.toFixed(1) || "0.0"}% Priority
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="py-4">
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="p-2 bg-gray-50 rounded-lg text-center">
                              <div className="text-sm font-bold">${feature.developmentCost.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">Development Cost</div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-lg text-center">
                              <div className="text-sm font-bold">{feature.timeToImplement}</div>
                              <div className="text-xs text-gray-500">Time to Implement</div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-lg text-center">
                              <div className="text-sm font-bold text-green-600">{feature?.impactOnSales?.toFixed(1) || "0.0"}x</div>
                              <div className="text-xs text-gray-500">Sales Impact</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-2">
                            <div className="p-2 bg-gray-50 rounded-lg text-center">
                              <div className="text-sm font-bold">{feature.importance}%</div>
                              <div className="text-xs text-gray-500">Importance</div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-lg text-center">
                              <div className="text-sm font-bold">{feature.currentSatisfaction}%</div>
                              <div className="text-xs text-gray-500">Current Satisfaction</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center">
                  <p className="text-gray-500">No feature priority data available</p>
                </div>
              )}
            </TabsContent>

            {/* Pricing Strategies Tab */}
            <TabsContent value="pricing" className="p-6">
              {pricingStrategies && pricingStrategies.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pricingStrategies.map((strategy: PricingStrategy) => (
                      <Card key={strategy.strategyName} className="overflow-hidden">
                        <CardHeader className="bg-gray-50 pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{strategy.strategyName}</CardTitle>
                            <Badge variant="outline" className="bg-green-50 text-green-600">
                              {strategy?.overallScore?.toFixed(1) || "0.0"}/100
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="py-4">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className="p-2 bg-gray-50 rounded-lg text-center">
                                <div className="text-sm font-bold">{strategy.profitMargin}%</div>
                                <div className="text-xs text-gray-500">Profit Margin</div>
                              </div>
                              <div className="p-2 bg-gray-50 rounded-lg text-center">
                                <div className="text-sm font-bold">{strategy.customerAcceptance}%</div>
                                <div className="text-xs text-gray-500">Customer Acceptance</div>
                              </div>
                            </div>
                              
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <h4 className="text-sm font-medium mb-1">Price Elasticity</h4>
                              <div className="flex items-center">
                                <span className="text-lg font-bold">{strategy?.priceElasticity?.toFixed(1) || "0.0"}</span>
                                <span className="text-sm text-gray-500 ml-2">
                                  {strategy?.priceElasticity ? 
                                   (strategy.priceElasticity < -1 ? "Elastic Demand" : 
                                   strategy.priceElasticity > -1 ? "Inelastic Demand" : 
                                   "Unit Elastic") : "Inelastic Demand"}
                                </span>
                              </div>
                            </div>

                            {strategy?.pricingStructure?.tiers && 
                             Array.isArray(strategy.pricingStructure.tiers) && 
                             strategy.pricingStructure.tiers.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium mb-2">Pricing Tiers</h4>
                                <div className="space-y-2">
                                  {Array.isArray(strategy.pricingStructure.tiers) ? (
                                    strategy.pricingStructure.tiers.map((tier: any, idx: number) => (
                                      <div key={idx} className="p-3 border rounded-lg">
                                        <div className="flex justify-between items-center">
                                          <span className="font-medium">{tier?.tierName || `Tier ${idx + 1}`}</span>
                                          <span className="text-green-600 font-bold">${typeof tier?.price === 'number' ? tier.price.toFixed(2) : "0.00"}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          Est. Adoption: {tier?.estimatedAdoption || 0}%
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="p-3 border rounded-lg">
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium">Standard Pricing</span>
                                        <span className="text-green-600 font-bold">${typeof strategy?.optimalPrice === 'number' ? strategy.optimalPrice.toFixed(2) : "0.00"}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center">
                  <p className="text-gray-500">No pricing strategy data available</p>
                </div>
              )}
            </TabsContent>

            {/* Marketing Strategies Tab */}
            <TabsContent value="marketing" className="p-6">
              {marketingStrategies && marketingStrategies.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {marketingStrategies.map((strategy: MarketingStrategy) => (
                      <Card key={strategy.strategyName} className="overflow-hidden">
                        <CardHeader className="bg-gray-50 pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{strategy.strategyName}</CardTitle>
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-600">
                              {strategy?.effectiveness?.toFixed(1) || "0.0"}% Effectiveness
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="py-4">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="p-2 bg-gray-50 rounded-lg text-center">
                                <div className="text-sm font-bold">{strategy.costEfficiency}%</div>
                                <div className="text-xs text-gray-500">Cost Efficiency</div>
                              </div>
                              <div className="p-2 bg-gray-50 rounded-lg text-center">
                                <div className="text-sm font-bold">{strategy.revenueImpact}%</div>
                                <div className="text-xs text-gray-500">Revenue Impact</div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Target Personas</h4>
                                <div className="flex flex-wrap gap-1">
                                  {strategy?.targetedPersonas && Array.isArray(strategy.targetedPersonas) && strategy.targetedPersonas.length > 0 ? (
                                    strategy.targetedPersonas.map((persona, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {persona}
                                      </Badge>
                                    ))
                                  ) : (
                                    <Badge variant="outline" className="text-xs">General Market</Badge>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Channels</h4>
                                <div className="flex flex-wrap gap-1">
                                  {strategy?.channels && Array.isArray(strategy.channels) && strategy.channels.length > 0 ? (
                                    strategy.channels.map((channel, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {channel}
                                      </Badge>
                                    ))
                                  ) : (
                                    <Badge variant="outline" className="text-xs">Multiple Channels</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Implementation Timeline</span>
                                <span className="font-medium">{strategy.implementationTimeline}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center">
                  <p className="text-gray-500">No marketing strategy data available</p>
                </div>
              )}
            </TabsContent>

            {/* Revenue Forecasts Tab */}
            <TabsContent value="revenue" className="p-6">
              {forecasts && forecasts.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {forecasts.map((forecast: RevenueForecasting) => (
                      <Card key={forecast.scenario} className="overflow-hidden">
                        <CardHeader className="bg-gray-50 pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{forecast?.scenario || "Forecast"}</CardTitle>
                            <Badge 
                              variant={
                                forecast?.scenario?.toLowerCase?.()?.includes('pessimistic') ? "destructive" : 
                                forecast?.scenario?.toLowerCase?.()?.includes('optimistic') ? "default" : 
                                "outline"
                              }
                            >
                              {forecast?.timeframe || "12 months"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="py-4">
                          <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg text-center">
                              <div className="text-2xl font-bold text-green-600">
                                ${forecast?.projectedRevenue?.toLocaleString() || "0"}
                              </div>
                              <div className="text-sm text-gray-500">Projected Revenue</div>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-2">Monthly Projections</h4>
                              <div className="h-24 flex items-end space-x-1">
                                {forecast?.monthlyBreakdown && typeof forecast.monthlyBreakdown === 'object' && Object.keys(forecast.monthlyBreakdown).length > 0 ? (
                                  Object.entries(forecast.monthlyBreakdown).map(([month, value], idx) => {
                                    const monthValues = Object.values(forecast.monthlyBreakdown);
                                    const maxValue = Math.max(...monthValues as number[]);
                                    const heightPercentage = maxValue > 0 ? ((value as number) / maxValue) * 100 : 0;
                                    return (
                                      <div 
                                        key={idx} 
                                        className="flex-1 bg-blue-500 rounded-t"
                                        style={{ height: `${heightPercentage}%` }}
                                        title={`${month}: $${(value as number)?.toLocaleString() || "0"}`}
                                      ></div>
                                    );
                                  })
                                ) : (
                                  <div className="w-full h-8 bg-gray-200 flex items-center justify-center rounded">
                                    <span className="text-xs text-gray-500">No monthly data available</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Start</span>
                                <span>End ({forecast?.timeframe || "12 mo."})</span>
                              </div>
                            </div>
                            
                            {forecast?.revenueStreams && Array.isArray(forecast.revenueStreams) && forecast.revenueStreams.length > 0 && (
                              <div className="mt-3">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Revenue Streams</h4>
                                <div className="space-y-2">
                                  {forecast.revenueStreams.map((stream, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                      <div className="flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                        <span>{stream.name}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span>{stream.percentage}%</span>
                                        <span className="text-xs text-green-600">+{stream.growth}%</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center">
                  <p className="text-gray-500">No revenue forecast data available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessIntelligenceFix;