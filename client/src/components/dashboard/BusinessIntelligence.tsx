import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Define interfaces based on the API responses
interface CompetitorAnalysis {
  id: number;
  name: string;
  marketShare: number;
  strengthScore: number;
  keyStrengths: string[];
  keyWeaknesses: string[];
  pricePoint: string;
  targetMarkets: string[];
  recentDevelopments: string;
}

interface MarketFitAnalysis {
  productId: string;
  productName: string;
  overallFitScore: number;
  segmentFitScores: Array<{
    segmentName: string;
    score: number;
    potential: number;
  }>;
  traitAlignments: Array<{
    trait: string;
    alignment: number;
  }>;
  marketSizePotential: {
    total: number;
    addressable: number;
    serviceable: number;
  };
}

interface CustomerSegment {
  id: string;
  name: string;
  size: number;
  percentOfTotal: number;
  dominantTraits: Array<{
    trait: string;
    score: number;
  }>;
  demographicSummary: {
    averageAge?: number;
    dominantGender?: string;
    averageIncome?: string;
    topLocations?: string[];
    topInterests?: string[];
  };
  purchaseBehavior?: {
    averageOrderValue?: number;
    purchaseFrequency?: number;
    loyaltyScore?: number;
  };
}

interface ProductFeaturePriority {
  featureId: string;
  featureName: string;
  description: string;
  overallAppeal: number;
  segmentAppeal: Record<string, number>;
  developmentCost: number;
  timeToImplement: number;
  roi: number;
  alignedTraits: Array<{
    trait: string;
    strength: number;
  }>;
}

interface PricingStrategy {
  strategyId: string;
  name: string;
  tiers: Array<{
    tierName: string;
    price: number;
    features: string[];
    targetSegments: string[];
    estimatedAdoption: number;
    estimatedRevenue: number;
  }>;
  optimalPrice: number;
  priceElasticity: number;
  willingness: Array<{
    segment: string;
    price: number;
  }>;
}

interface MarketingStrategy {
  strategyId: string;
  name: string;
  targetSegments: string[];
  channels: Array<{
    channelName: string;
    effectiveness: number;
    costPerAcquisition: number;
    recommendedBudget: number;
  }>;
  messaging: {
    keyMessages: string[];
    toneOfVoice: string;
    valuePropositions: string[];
  };
  campaignIdeas: Array<{
    name: string;
    description: string;
    targetTrait: string;
    estimatedResponse: number;
  }>;
}

interface RevenueForecasting {
  scenarioId: string;
  scenarioName: string;
  timeframe: number;
  customerAcquisition: {
    monthly: number[];
    cumulative: number[];
  };
  revenue: {
    monthly: number[];
    cumulative: number[];
  };
  costs: {
    acquisition: number;
    retention: number;
    overhead: number;
  };
  profitability: {
    breakevenPoint: number;
    roi: number;
    margin: number;
  };
}

interface SimulatedFocusGroup {
  id: string;
  productConcept: string;
  segments: string[];
  feedback: Array<{
    segmentName: string;
    positivePoints: string[];
    negativePoints: string[];
    adoptionLikelihood: number;
    suggestedImprovements: string[];
  }>;
  overallSentiment: number;
  keyInsights: string[];
}

interface BusinessIntelligenceProps {
  surveyId?: string;
  companyId?: number;
}

const BusinessIntelligence = ({ surveyId = 'all', companyId = 1 }: BusinessIntelligenceProps) => {
  const [productConcept, setProductConcept] = useState("");
  const [isFocusGroupLoading, setIsFocusGroupLoading] = useState(false);
  const [focusGroupData, setFocusGroupData] = useState<SimulatedFocusGroup | null>(null);
  const { toast } = useToast();
  
  // Define API base endpoint based on whether looking at all surveys or a specific one
  // Set API endpoint based on viewing all company data or specific survey
  const apiBaseEndpoint = surveyId === 'all' 
    ? `/api/company/${companyId}`
    : `/api/surveys/${surveyId}`;

  // Helper function to create a proper queryFn for API requests
  const getQueryFn = (endpoint: string) => async () => {
    const response = await apiRequest('GET', endpoint, null);
    return response.json();
  };

  // Fetch competitor analysis
  const { data: competitorsResponse, isLoading: isCompetitorsLoading } = useQuery({
    queryKey: [`${apiBaseEndpoint}/competitors`, surveyId],
    queryFn: getQueryFn(`${apiBaseEndpoint}/competitors`),
    staleTime: 60000 // Cache for 1 minute
  });
  
  // Extract the competitors array from the API response
  const competitors = Array.isArray(competitorsResponse?.data) 
    ? competitorsResponse?.data 
    : [];

  // Fetch market fit analysis
  const { data: marketFitResponse, isLoading: isMarketFitLoading } = useQuery({
    queryKey: [`${apiBaseEndpoint}/market-fit/prod-1`, surveyId],
    queryFn: getQueryFn(`${apiBaseEndpoint}/market-fit/prod-1`),
    staleTime: 60000
  });
  // Extract market fit data from the API response
  const marketFit = marketFitResponse?.data || null;

  // Fetch customer segments
  const { data: segmentsResponse, isLoading: isSegmentsLoading } = useQuery({
    queryKey: [`${apiBaseEndpoint}/segments`, surveyId],
    queryFn: getQueryFn(`${apiBaseEndpoint}/segments`),
    staleTime: 60000
  });
  // Extract segments data from the API response
  const segments = Array.isArray(segmentsResponse?.data) ? segmentsResponse.data : [];

  // Fetch product feature priorities
  const { data: featuresResponse, isLoading: isFeaturesLoading } = useQuery({
    queryKey: [`${apiBaseEndpoint}/feature-priorities`, surveyId],
    queryFn: getQueryFn(`${apiBaseEndpoint}/feature-priorities`),
    staleTime: 60000
  });
  // Extract features data from the API response
  const features = Array.isArray(featuresResponse?.data) ? featuresResponse.data : [];

  // Fetch pricing strategies
  const { data: pricingResponse, isLoading: isPricingLoading } = useQuery({
    queryKey: [`${apiBaseEndpoint}/pricing-strategies`, surveyId],
    queryFn: getQueryFn(`${apiBaseEndpoint}/pricing-strategies`),
    staleTime: 60000
  });
  // Extract pricing strategies data from the API response
  const pricingStrategies = Array.isArray(pricingResponse?.data) ? pricingResponse.data : [];

  // Fetch marketing strategies
  const { data: marketingResponse, isLoading: isMarketingLoading } = useQuery({
    queryKey: [`${apiBaseEndpoint}/marketing-strategies`, surveyId],
    queryFn: getQueryFn(`${apiBaseEndpoint}/marketing-strategies`),
    staleTime: 60000
  });
  // Extract marketing strategies data from the API response
  const marketingStrategies = Array.isArray(marketingResponse?.data) ? marketingResponse.data : [];

  // Fetch revenue forecasts
  const { data: revenueResponse, isLoading: isRevenueLoading } = useQuery({
    queryKey: [`${apiBaseEndpoint}/revenue-forecasts`, surveyId],
    queryFn: getQueryFn(`${apiBaseEndpoint}/revenue-forecasts`),
    staleTime: 60000
  });
  // Extract revenue forecasts data from the API response
  const revenueForecasts = revenueResponse?.data || null;

  // Run focus group simulation
  const runFocusGroupSimulation = async () => {
    if (!productConcept.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product concept description",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsFocusGroupLoading(true);
      
      // Use the apiRequest function for consistent headers and authentication
      const response = await apiRequest('POST', `${apiBaseEndpoint}/focus-group`, { 
        productConcept 
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setFocusGroupData(data.data);
        toast({
          title: "Success",
          description: "Focus group simulation completed",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "An error occurred while running the simulation",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Focus group simulation error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsFocusGroupLoading(false);
    }
  };

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
          <Tabs defaultValue="competitors" className="w-full">
            <TabsList className="w-full justify-start p-2 bg-gray-50 border-b border-gray-200 overflow-x-auto flex-nowrap">
              <TabsTrigger value="competitors">Competitor Analysis</TabsTrigger>
              <TabsTrigger value="market-fit">Market Fit</TabsTrigger>
              <TabsTrigger value="segments">Customer Segments</TabsTrigger>
              <TabsTrigger value="features">Feature Priorities</TabsTrigger>
              <TabsTrigger value="pricing">Pricing Strategies</TabsTrigger>
              <TabsTrigger value="marketing">Marketing Strategies</TabsTrigger>
              <TabsTrigger value="revenue">Revenue Forecasts</TabsTrigger>
              <TabsTrigger value="focus-group">Focus Group Simulation</TabsTrigger>
            </TabsList>
            
            {/* Competitor Analysis Tab */}
            <TabsContent value="competitors" className="p-6">
              <h2 className="text-2xl font-bold mb-6">Competitor Analysis</h2>
              
              {isCompetitorsLoading ? (
                <div className="h-60 flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : competitors ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {competitors.map((competitor) => (
                    <Card key={competitor.id} className="overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-sky-50 to-indigo-50 p-4">
                        <CardTitle className="flex items-center justify-between">
                          <span>{competitor.name}</span>
                          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {competitor.marketShare}% Market Share
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-500 mb-2">STRENGTH SCORE</h4>
                          <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
                            <div 
                              className="h-2 bg-primary rounded-full" 
                              style={{ width: `${competitor.strengthScore}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>0</span>
                            <span className="font-medium">{competitor.strengthScore}/100</span>
                            <span>100</span>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-500 mb-2">TARGET MARKETS</h4>
                          <div className="flex flex-wrap gap-1">
                            {competitor.targetMarkets && competitor.targetMarkets.length > 0 ? (
                              competitor.targetMarkets.map((market, idx) => (
                                <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                                  {market}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                No target markets data available
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-500 mb-2">STRENGTHS</h4>
                            <ul className="text-sm space-y-1">
                              {competitor.keyStrengths && competitor.keyStrengths.length > 0 ? (
                                competitor.keyStrengths.map((strength, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="text-green-500 text-xs mr-1 mt-1">●</span>
                                    <span>{strength}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-gray-500">No strength data available</li>
                              )}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-500 mb-2">WEAKNESSES</h4>
                            <ul className="text-sm space-y-1">
                              {competitor.keyWeaknesses && competitor.keyWeaknesses.length > 0 ? (
                                competitor.keyWeaknesses.map((weakness, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="text-red-500 text-xs mr-1 mt-1">●</span>
                                    <span>{weakness}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-gray-500">No weakness data available</li>
                              )}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold text-gray-500 mb-2">RECENT DEVELOPMENTS</h4>
                          <p className="text-sm text-gray-700">
                            {competitor.recentDevelopments || "No recent developments data available"}
                          </p>
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
              <h2 className="text-2xl font-bold mb-6">Market Fit Analysis</h2>
              
              {isMarketFitLoading ? (
                <div className="h-60 flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : marketFit ? (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <Card className="flex-1">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center">
                          <span>{(marketFit && 'productName' in marketFit) ? marketFit.productName : "Product Analysis"}</span>
                        </CardTitle>
                        <p className="text-gray-500 text-sm">Market fit analysis summary</p>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-center p-4">
                          <div className="relative h-48 w-48 flex items-center justify-center">
                            <div 
                              className="absolute inset-0 rounded-full border-16 border-gray-100"
                              style={{ borderWidth: '16px' }}
                            ></div>
                            <div 
                              className="absolute inset-0 rounded-full border-16 border-primary border-t-transparent"
                              style={{ 
                                borderWidth: '16px', 
                                transform: `rotate(${45 + (((marketFit && 'overallFitScore' in marketFit) ? marketFit.overallFitScore : 0) * 2.7)}deg)`,
                                transition: 'transform 1s ease-in-out'
                              }}
                            ></div>
                            <div className="text-center">
                              <div className="text-4xl font-bold text-gray-800">
                                {((marketFit && 'overallFitScore' in marketFit) ? marketFit.overallFitScore : 0).toFixed(1)}
                              </div>
                              <div className="text-sm text-gray-500">Overall Fit Score</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <h3 className="text-sm font-semibold text-gray-500 mb-2">MARKET SIZE POTENTIAL</h3>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-gray-50 p-3 rounded-lg text-center">
                              <div className="text-lg font-bold">
                                ${((marketFit && 'marketSizePotential' in marketFit && marketFit.marketSizePotential && 'total' in marketFit.marketSizePotential) ? marketFit.marketSizePotential.total / 1_000_000_000 : 0).toFixed(1)}B
                              </div>
                              <div className="text-xs text-gray-500">Total</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg text-center">
                              <div className="text-lg font-bold">
                                ${((marketFit && 'marketSizePotential' in marketFit && marketFit.marketSizePotential && 'addressable' in marketFit.marketSizePotential) ? marketFit.marketSizePotential.addressable / 1_000_000 : 0).toFixed(0)}M
                              </div>
                              <div className="text-xs text-gray-500">Addressable</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg text-center">
                              <div className="text-lg font-bold">
                                ${((marketFit && 'marketSizePotential' in marketFit && marketFit.marketSizePotential && 'serviceable' in marketFit.marketSizePotential) ? marketFit.marketSizePotential.serviceable / 1_000_000 : 0).toFixed(0)}M
                              </div>
                              <div className="text-xs text-gray-500">Serviceable</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="flex-1">
                      <CardHeader className="pb-2">
                        <CardTitle>Segment Fit Scores</CardTitle>
                        <p className="text-gray-500 text-sm">How well the product fits with each segment</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-5">
                          {(marketFit?.segmentFitScores || []).map((segment, idx) => (
                            <div key={idx}>
                              <div className="flex justify-between mb-1">
                                <div className="flex items-center">
                                  <span className="w-3 h-3 rounded-full bg-primary opacity-75 mr-2"></span>
                                  <span className="text-sm font-medium">{segment.segmentName}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium">{typeof segment.score === 'number' ? segment.score.toFixed(1) : '0.0'}</span>
                                  <span className="text-xs bg-green-100 text-green-800 px-1 rounded">
                                    {typeof segment.potential === 'number' ? segment.potential.toFixed(1) : '0.0'}x potential
                                  </span>
                                </div>
                              </div>
                              <Progress value={typeof segment.score === 'number' ? segment.score : 0} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Trait Alignments</CardTitle>
                      <p className="text-gray-500 text-sm">How well the product aligns with key personality traits</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(marketFit?.traitAlignments || []).map((trait, idx) => (
                          <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between mb-2">
                              <span className="font-medium">{trait?.trait || "Unknown"}</span>
                              <span className="font-medium">{(trait?.alignment || 0).toFixed(1)}%</span>
                            </div>
                            <Progress 
                              value={trait?.alignment || 0} 
                              className="h-2"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                              {(trait?.alignment || 0) > 90 
                                ? "Excellent alignment" 
                                : (trait?.alignment || 0) > 75 
                                ? "Strong alignment" 
                                : (trait?.alignment || 0) > 60
                                ? "Moderate alignment"
                                : "Weak alignment"
                              }
                            </p>
                          </div>
                        ))}
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
              <h2 className="text-2xl font-bold mb-6">Advanced Customer Segmentation</h2>
              
              {isSegmentsLoading ? (
                <div className="h-60 flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : segments && segments.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {segments.map((segment) => (
                      <Card key={segment.id} className="overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle>{segment.name}</CardTitle>
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              {typeof segment.percentOfTotal === 'number' ? segment.percentOfTotal.toFixed(1) : '0.0'}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{segment.size} consumers</p>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="mb-4">
                            <h4 className="text-xs font-semibold text-gray-500 mb-2">DOMINANT TRAITS</h4>
                            <div className="space-y-1">
                              {(() => {
                                if (!Array.isArray(segment.dominantTraits)) return null;
                                const traitsToShow = [];
                                const maxTraits = Math.min(3, segment.dominantTraits.length);
                                
                                for (let i = 0; i < maxTraits; i++) {
                                  const trait = segment.dominantTraits[i];
                                  if (!trait) continue;
                                  
                                  traitsToShow.push(
                                    <div key={`trait-${i}`} className="flex items-center justify-between">
                                      <span className="text-sm">{trait.trait}</span>
                                      <span className="text-xs font-semibold">{typeof trait.score === 'number' ? trait.score.toFixed(1) : '0.0'}</span>
                                    </div>
                                  );
                                }
                                
                                return traitsToShow.length > 0 ? traitsToShow : <div>No trait data available</div>;
                              })()}
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <h4 className="text-xs font-semibold text-gray-500 mb-2">DEMOGRAPHICS</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-xs text-gray-500 block">Age</span>
                                <span className="font-medium">
                                  {segment.demographicSummary && typeof segment.demographicSummary.averageAge === 'number' 
                                    ? segment.demographicSummary.averageAge.toFixed(0) 
                                    : "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500 block">Gender</span>
                                <span className="font-medium">
                                  {segment.demographicSummary && segment.demographicSummary.dominantGender 
                                    ? segment.demographicSummary.dominantGender 
                                    : "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500 block">Income</span>
                                <span className="font-medium">
                                  {segment.demographicSummary && segment.demographicSummary.averageIncome 
                                    ? segment.demographicSummary.averageIncome 
                                    : "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500 block">Locations</span>
                                <span className="font-medium">
                                  {segment.demographicSummary && 
                                   segment.demographicSummary.topLocations && 
                                   Array.isArray(segment.demographicSummary.topLocations) &&
                                   segment.demographicSummary.topLocations.length > 0
                                    ? segment.demographicSummary.topLocations[0]
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 mb-2">PURCHASE BEHAVIOR</h4>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="bg-gray-50 p-2 rounded">
                                <span className="text-xs text-gray-500 block">AOV</span>
                                <span className="font-medium">
                                  {segment.purchaseBehavior && typeof segment.purchaseBehavior.averageOrderValue === 'number'
                                    ? `$${segment.purchaseBehavior.averageOrderValue.toFixed(0)}`
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <span className="text-xs text-gray-500 block">Frequency</span>
                                <span className="font-medium">
                                  {segment.purchaseBehavior && typeof segment.purchaseBehavior.purchaseFrequency === 'number'
                                    ? `${segment.purchaseBehavior.purchaseFrequency.toFixed(1)}/mo`
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <span className="text-xs text-gray-500 block">Loyalty</span>
                                <span className="font-medium">
                                  {segment.purchaseBehavior && typeof segment.purchaseBehavior.loyaltyScore === 'number'
                                    ? segment.purchaseBehavior.loyaltyScore.toFixed(0)
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Segment Interests & Behaviors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Segment</th>
                              <th className="text-left p-2">Top Interests</th>
                              <th className="text-left p-2">Top Traits</th>
                              <th className="text-left p-2">Dominant Gender</th>
                              <th className="text-left p-2">Avg. Income</th>
                              <th className="text-right p-2">Loyalty Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {segments.map((segment) => (
                              <tr key={segment.id} className="border-b">
                                <td className="p-2 font-medium">{segment.name}</td>
                                <td className="p-2">
                                  {(() => {
                                    if (!segment.demographicSummary || !Array.isArray(segment.demographicSummary.topInterests) || segment.demographicSummary.topInterests.length === 0) {
                                      return "N/A";
                                    }
                                    
                                    const interests = [];
                                    const maxInterests = Math.min(2, segment.demographicSummary.topInterests.length);
                                    
                                    for (let i = 0; i < maxInterests; i++) {
                                      const interest = segment.demographicSummary.topInterests[i];
                                      if (interest) interests.push(interest);
                                    }
                                    
                                    return interests.length > 0 ? interests.join(", ") : "N/A";
                                  })()}
                                </td>
                                <td className="p-2">
                                  {(() => {
                                    if (!segment.dominantTraits || !Array.isArray(segment.dominantTraits) || segment.dominantTraits.length === 0) {
                                      return "N/A";
                                    }
                                    
                                    const traits = [];
                                    const maxTraits = Math.min(2, segment.dominantTraits.length);
                                    
                                    for (let i = 0; i < maxTraits; i++) {
                                      const trait = segment.dominantTraits[i];
                                      if (trait && trait.trait) traits.push(trait.trait);
                                    }
                                    
                                    return traits.length > 0 ? traits.join(", ") : "N/A";
                                  })()}
                                </td>
                                <td className="p-2">
                                  {segment.demographicSummary && segment.demographicSummary.dominantGender
                                    ? segment.demographicSummary.dominantGender 
                                    : "N/A"}
                                </td>
                                <td className="p-2">
                                  {segment.demographicSummary && segment.demographicSummary.averageIncome
                                    ? segment.demographicSummary.averageIncome 
                                    : "N/A"}
                                </td>
                                <td className="p-2 text-right">
                                  {segment.purchaseBehavior && typeof segment.purchaseBehavior.loyaltyScore === 'number' 
                                    ? segment.purchaseBehavior.loyaltyScore.toFixed(1) 
                                    : "N/A"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center">
                  <p className="text-gray-500">No segment data available</p>
                </div>
              )}
            </TabsContent>
            
            {/* Feature Priorities Tab */}
            <TabsContent value="features" className="p-6">
              <h2 className="text-2xl font-bold mb-6">Product Feature Priorities</h2>
              
              {isFeaturesLoading ? (
                <div className="h-60 flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : features && features.length > 0 ? (
                <div className="space-y-6">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left p-3 border-b">Feature</th>
                          <th className="text-center p-3 border-b">Appeal</th>
                          <th className="text-center p-3 border-b">Cost</th>
                          <th className="text-center p-3 border-b">Time (mo)</th>
                          <th className="text-center p-3 border-b">ROI</th>
                          <th className="text-right p-3 border-b">Priority Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {features
                          .sort((a, b) => b.overallAppeal * b.roi - a.overallAppeal * a.roi)
                          .map((feature, idx) => (
                            <tr key={feature.featureId} className={`border-b ${idx === 0 ? "bg-blue-50" : ""}`}>
                              <td className="p-3">
                                <div className="font-medium">{feature.featureName}</div>
                                <div className="text-xs text-gray-500 mt-1">{feature.description}</div>
                              </td>
                              <td className="p-3 text-center">
                                <div className="font-medium">{typeof feature.overallAppeal === 'number' ? feature.overallAppeal.toFixed(1) : '0.0'}</div>
                              </td>
                              <td className="p-3 text-center">
                                <div className="font-medium">${typeof feature.developmentCost === 'number' ? (feature.developmentCost / 1000).toFixed(0) : '0'}k</div>
                              </td>
                              <td className="p-3 text-center">
                                <div className="font-medium">{feature.timeToImplement}</div>
                              </td>
                              <td className="p-3 text-center">
                                <div className="font-medium">{typeof feature.roi === 'number' ? feature.roi.toFixed(1) : '0.0'}x</div>
                              </td>
                              <td className="p-3 text-right">
                                <div className="inline-block bg-blue-100 text-blue-800 font-medium px-2 py-1 rounded-full">
                                  {typeof feature.overallAppeal === 'number' && typeof feature.roi === 'number' ? ((feature.overallAppeal * feature.roi) / 10).toFixed(1) : '0.0'}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(() => {
                      if (!features || !Array.isArray(features) || features.length === 0) {
                        return <div>No feature data available</div>;
                      }
                      
                      const featureCards = [];
                      const maxFeatures = Math.min(2, features.length);
                      
                      for (let i = 0; i < maxFeatures; i++) {
                        const feature = features[i];
                        if (!feature) continue;
                        
                        featureCards.push(
                          <Card key={feature.featureId || `feature-${i}`}>
                            <CardHeader className="pb-2">
                              <CardTitle>{feature.featureName || 'Unnamed Feature'}</CardTitle>
                              <p className="text-sm text-gray-500">{feature.description || 'No description available'}</p>
                            </CardHeader>
                            <CardContent>
                              <div className="mb-6">
                                <h4 className="text-sm font-semibold text-gray-500 mb-2">SEGMENT APPEAL</h4>
                                <div className="space-y-2">
                                  {feature.segmentAppeal && typeof feature.segmentAppeal === 'object' ? 
                                    Object.entries(feature.segmentAppeal).map(([segment, score], idx) => (
                                      <div key={idx}>
                                        <div className="flex justify-between mb-1">
                                          <span className="text-sm">{segment}</span>
                                          <span className="text-sm">{typeof score === 'number' ? score.toFixed(1) : '0.0'}</span>
                                        </div>
                                        <Progress 
                                          value={score} 
                                          className="h-2"
                                        />
                                      </div>
                                    )) 
                                    : <div>No segment appeal data available</div>
                                  }
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-semibold text-gray-500 mb-2">ALIGNED TRAITS</h4>
                                <div className="grid grid-cols-3 gap-2">
                                  {Array.isArray(feature.alignedTraits) && feature.alignedTraits.length > 0 ? 
                                    feature.alignedTraits.map((trait, idx) => (
                                      <div key={idx} className="bg-gray-50 p-2 rounded-lg text-center">
                                        <div className="text-xs text-gray-500">{trait?.trait || 'Unknown trait'}</div>
                                        <div className="font-medium">{trait?.strength || 0}</div>
                                      </div>
                                    )) 
                                    : <div className="col-span-3">No trait data available</div>
                                  }
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }
                      
                      return featureCards.length > 0 ? featureCards : <div>No feature data available</div>;
                    })()}
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
              <h2 className="text-2xl font-bold mb-6">Pricing Strategy Optimization</h2>
              
              {isPricingLoading ? (
                <div className="h-60 flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : pricingStrategies && pricingStrategies.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {(() => {
                      // Safety check to ensure pricingStrategies is an array
                      if (!Array.isArray(pricingStrategies) || pricingStrategies.length === 0) {
                        return <div className="col-span-3 p-4 text-center text-gray-500">No pricing strategies available</div>;
                      }
                      
                      // Safe rendering with defensive programming
                      const strategyCards = [];
                      
                      for (let i = 0; i < pricingStrategies.length; i++) {
                        const strategy = pricingStrategies[i];
                        if (!strategy) continue;
                        
                        strategyCards.push(
                          <Card key={strategy.strategyId || `strategy-${i}`} className="overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 pb-3">
                              <CardTitle>{strategy.name || 'Unnamed Strategy'}</CardTitle>
                              <div className="text-sm text-gray-600 mt-1">
                                <div className="flex items-center justify-between">
                                  <span>Optimal Price:</span>
                                  <span className="font-semibold">
                                    {strategy.strategyId === 'price-2' 
                                      ? `$${typeof strategy.optimalPrice === 'number' ? strategy.optimalPrice.toFixed(2) : '0.00'}/response` 
                                      : `$${typeof strategy.optimalPrice === 'number' ? strategy.optimalPrice.toFixed(2) : '0.00'}`
                                    }
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span>Price Elasticity:</span>
                                  <span className="font-semibold">{typeof strategy.priceElasticity === 'number' ? strategy.priceElasticity.toFixed(1) : '0.0'}</span>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-0">
                              {/* Pricing Tiers */}
                              <div className="divide-y">
                                {(() => {
                                  if (!Array.isArray(strategy.tiers) || strategy.tiers.length === 0) {
                                    return <div className="p-4 text-gray-500">No pricing tiers available</div>;
                                  }
                                  
                                  const tierElements = [];
                                  
                                  for (let j = 0; j < strategy.tiers.length; j++) {
                                    const tier = strategy.tiers[j];
                                    if (!tier) continue;
                                    
                                    tierElements.push(
                                      <div key={`tier-${j}`} className="p-4">
                                        <div className="flex justify-between items-center mb-2">
                                          <h3 className="font-semibold">{tier.tierName || 'Untitled Tier'}</h3>
                                          <div className="text-lg font-bold">${typeof tier.price === 'number' ? tier.price.toFixed(2) : '0.00'}</div>
                                        </div>
                                        
                                        <div className="text-sm space-y-2 mb-3">
                                          <div className="flex items-center text-gray-500">
                                            <span className="w-4">●</span>
                                            <span>
                                              Est. Adoption: <span className="font-medium">{typeof tier.estimatedAdoption === 'number' ? tier.estimatedAdoption.toFixed(1) : '0.0'}%</span>
                                            </span>
                                          </div>
                                          <div className="flex items-center text-gray-500">
                                            <span className="w-4">●</span>
                                            <span>
                                              Est. Revenue: <span className="font-medium">${typeof tier.estimatedRevenue === 'number' ? tier.estimatedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}</span>
                                            </span>
                                          </div>
                                          <div className="flex items-center text-gray-500">
                                            <span className="w-4">●</span>
                                            <span>Target: {Array.isArray(tier.targetSegments) ? tier.targetSegments.join(", ") : 'N/A'}</span>
                                          </div>
                                        </div>
                                        
                                        <div className="mt-2">
                                          <h4 className="text-xs font-semibold text-gray-500 mb-1">FEATURES</h4>
                                          <ul className="text-xs space-y-1">
                                            {(() => {
                                              if (!Array.isArray(tier.features) || tier.features.length === 0) {
                                                return <li>No features available</li>;
                                              }
                                              
                                              const featureElements = [];
                                              
                                              for (let k = 0; k < tier.features.length; k++) {
                                                const feature = tier.features[k];
                                                if (!feature) continue;
                                                
                                                featureElements.push(
                                                  <li key={`feature-${k}`} className="flex items-center">
                                                    <span className="text-green-500 mr-1">✓</span>
                                                    <span>{feature}</span>
                                                  </li>
                                                );
                                              }
                                              
                                              return featureElements.length > 0 ? featureElements : <li>No features available</li>;
                                            })()}
                                          </ul>
                                        </div>
                                      </div>
                                    );
                                  }
                                  
                                  return tierElements.length > 0 ? tierElements : <div className="p-4 text-gray-500">No pricing tiers available</div>;
                                })()}
                              </div>
                              
                              {/* Price Willingness */}
                              <div className="p-4 bg-gray-50">
                                <h4 className="text-xs font-semibold text-gray-500 mb-2">PRICE WILLINGNESS BY SEGMENT</h4>
                                <div className="space-y-2">
                                  {(() => {
                                    if (!Array.isArray(strategy.willingness) || strategy.willingness.length === 0) {
                                      return <div>No price data available</div>;
                                    }
                                    
                                    const willingnessElements = [];
                                    
                                    for (let m = 0; m < strategy.willingness.length; m++) {
                                      const item = strategy.willingness[m];
                                      if (!item) continue;
                                      
                                      willingnessElements.push(
                                        <div key={`willingness-${m}`} className="flex justify-between items-center">
                                          <span className="text-sm">{item.segment || 'Unknown'}</span>
                                          <span className="text-sm font-medium">${typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}</span>
                                        </div>
                                      );
                                    }
                                    
                                    return willingnessElements.length > 0 ? willingnessElements : <div>No price data available</div>;
                                  })()}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }
                      
                      return strategyCards.length > 0 ? strategyCards : <div className="col-span-3 p-4 text-center text-gray-500">No pricing strategies available</div>;
                    })()}
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Strategy Comparison</CardTitle>
                      <p className="text-sm text-gray-500">Revenue and adoption comparison across strategies</p>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Strategy</th>
                              <th className="text-left p-2">Top Tier</th>
                              <th className="text-center p-2">Price</th>
                              <th className="text-center p-2">Est. Adoption</th>
                              <th className="text-right p-2">Est. Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              if (!Array.isArray(pricingStrategies) || pricingStrategies.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={5} className="p-4 text-center text-gray-500">
                                      No pricing strategies available
                                    </td>
                                  </tr>
                                );
                              }
                              
                              const strategyRows = [];
                              
                              for (let i = 0; i < pricingStrategies.length; i++) {
                                const strategy = pricingStrategies[i];
                                if (!strategy) continue;
                                
                                // Get the top tier safely
                                const tierExists = Array.isArray(strategy.tiers) && strategy.tiers.length > 0;
                                const topTier = tierExists ? strategy.tiers[strategy.tiers.length-1] : null;
                                
                                strategyRows.push(
                                  <tr key={strategy.strategyId || `table-strategy-${i}`} className="border-b">
                                    <td className="p-2 font-medium">{strategy.name || 'Unnamed Strategy'}</td>
                                    <td className="p-2">
                                      {tierExists && topTier ? topTier.tierName || 'Unnamed Tier' : 'N/A'}
                                    </td>
                                    <td className="p-2 text-center">
                                      {tierExists && topTier && typeof topTier.price === 'number'
                                        ? `$${topTier.price.toFixed(2)}`
                                        : '$0.00'}
                                      {strategy.strategyId === 'price-2' ? '/response' : ''}
                                    </td>
                                    <td className="p-2 text-center">
                                      {tierExists && topTier && typeof topTier.estimatedAdoption === 'number'
                                        ? `${topTier.estimatedAdoption.toFixed(1)}%`
                                        : '0.0%'}
                                    </td>
                                    <td className="p-2 text-right">
                                      {tierExists && topTier && typeof topTier.estimatedRevenue === 'number'
                                        ? `$${topTier.estimatedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                        : '$0'}
                                    </td>
                                  </tr>
                                );
                              }
                              
                              return strategyRows.length > 0 ? strategyRows : (
                                <tr>
                                  <td colSpan={5} className="p-4 text-center text-gray-500">
                                    No pricing strategies available
                                  </td>
                                </tr>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center">
                  <p className="text-gray-500">No pricing strategy data available</p>
                </div>
              )}
            </TabsContent>
            
            {/* Marketing Strategies Tab */}
            <TabsContent value="marketing" className="p-6">
              <h2 className="text-2xl font-bold mb-6">Marketing Strategy Builder</h2>
              
              {isMarketingLoading ? (
                <div className="h-60 flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : marketingStrategies && marketingStrategies.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {marketingStrategies.map((strategy) => (
                      <Card key={strategy.strategyId} className="flex flex-col">
                        <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 pb-2">
                          <CardTitle>{strategy.name}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            Target: {Array.isArray(strategy.targetSegments) ? strategy.targetSegments.join(", ") : 'All segments'}
                          </p>
                        </CardHeader>
                        <CardContent className="flex-1 p-0">
                          {/* Channels */}
                          <div className="p-4 border-b">
                            <h4 className="text-xs font-semibold text-gray-500 mb-2">RECOMMENDED CHANNELS</h4>
                            <div className="space-y-3">
                              {Array.isArray(strategy.channels) ? strategy.channels.map((channel, idx) => (
                                <div key={idx}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium">{channel?.channelName || 'Unnamed Channel'}</span>
                                    <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                                      {typeof channel?.effectiveness === 'number' ? channel.effectiveness.toFixed(1) : '0.0'}% effective
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>CPA: ${typeof channel?.costPerAcquisition === 'number' ? channel.costPerAcquisition.toFixed(2) : '0.00'}</span>
                                    <span>Budget: ${typeof channel?.recommendedBudget === 'number' ? channel.recommendedBudget.toLocaleString() : '0'}</span>
                                  </div>
                                </div>
                              )) : <div>No channel data available</div>}
                            </div>
                          </div>
                          
                          {/* Messaging */}
                          <div className="p-4 border-b">
                            <h4 className="text-xs font-semibold text-gray-500 mb-2">KEY MESSAGES</h4>
                            <ul className="text-sm space-y-1 mb-3">
                              {strategy.messaging && Array.isArray(strategy.messaging.keyMessages) ? 
                                strategy.messaging.keyMessages.map((message, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="text-purple-500 mr-1">●</span>
                                    <span>{message}</span>
                                  </li>
                                )) : 
                                <li>No key messages available</li>
                              }
                            </ul>
                            
                            <div className="text-xs text-gray-500 mt-3">
                              <span className="font-medium block mb-1">Tone of Voice:</span>
                              <span>{strategy.messaging && strategy.messaging.toneOfVoice ? strategy.messaging.toneOfVoice : 'Not specified'}</span>
                            </div>
                          </div>
                          
                          {/* Campaign Ideas */}
                          <div className="p-4 bg-gray-50 flex-1">
                            <h4 className="text-xs font-semibold text-gray-500 mb-2">CAMPAIGN IDEAS</h4>
                            <div className="space-y-3">
                              {(() => {
                                // Safe way to access campaign ideas without using slice
                                if (!Array.isArray(strategy.campaignIdeas) || strategy.campaignIdeas.length === 0) {
                                  return <div>No campaign ideas available</div>;
                                }
                                
                                // Get up to 2 campaign ideas safely
                                const displayCampaigns = [];
                                const maxToShow = Math.min(2, strategy.campaignIdeas.length);
                                
                                for (let i = 0; i < maxToShow; i++) {
                                  const campaign = strategy.campaignIdeas[i];
                                  if (!campaign) continue;
                                  
                                  displayCampaigns.push(
                                    <div key={i} className="bg-white p-2 rounded border">
                                      <div className="font-medium text-sm">{campaign?.name || 'Unnamed Campaign'}</div>
                                      <p className="text-xs text-gray-500 mt-1">{campaign?.description || 'No description available'}</p>
                                      <div className="flex justify-between text-xs mt-2">
                                        <span className="text-gray-500">
                                          Targets <span className="font-medium">{campaign?.targetTrait || 'All traits'}</span>
                                        </span>
                                        <span className="text-green-600">
                                          {typeof campaign?.estimatedResponse === 'number' ? campaign.estimatedResponse.toFixed(1) : '0.0'}% response
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }
                                
                                return displayCampaigns.length > 0 ? displayCampaigns : <div>No campaign ideas available</div>;
                              })()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Value Propositions</CardTitle>
                      <p className="text-sm text-gray-500">Key value propositions by strategy</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {marketingStrategies.map((strategy) => (
                          <div key={strategy.strategyId}>
                            <h3 className="font-medium text-lg mb-2">{strategy.name}</h3>
                            <ul className="space-y-2">
                              {(() => {
                                if (!strategy.messaging || !Array.isArray(strategy.messaging.valuePropositions) || strategy.messaging.valuePropositions.length === 0) {
                                  return <li>No value propositions available</li>;
                                }
                                
                                // Safely render each proposition
                                const valueProps = [];
                                for (let i = 0; i < strategy.messaging.valuePropositions.length; i++) {
                                  const prop = strategy.messaging.valuePropositions[i];
                                  if (prop === undefined || prop === null) continue;
                                  
                                  valueProps.push(
                                    <li key={i} className="flex items-start text-sm">
                                      <span className="text-green-500 font-bold mr-2">✓</span>
                                      <span>{prop}</span>
                                    </li>
                                  );
                                }
                                
                                return valueProps.length > 0 ? valueProps : <li>No value propositions available</li>;
                              })()}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center">
                  <p className="text-gray-500">No marketing strategy data available</p>
                </div>
              )}
            </TabsContent>
            
            {/* Revenue Forecasts Tab */}
            <TabsContent value="revenue" className="p-6">
              <h2 className="text-2xl font-bold mb-6">Revenue Forecasting</h2>
              
              {isRevenueLoading ? (
                <div className="h-60 flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : revenueForecasts ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Create a simplified forecast card */}
                    {(() => {
                      // Create a "forecast" object to match our existing rendering code format
                      const forecast = {
                        scenarioId: '1',
                        scenarioName: `${revenueForecasts.currentYear}-${revenueForecasts.forecastPeriod?.split('-')[1] || (revenueForecasts.currentYear + 2)} Forecast`,
                        timeframe: revenueForecasts.monthlyProjections?.length || 12,
                        profitability: {
                          breakevenPoint: 4, // Estimated
                          roi: revenueForecasts.growthRate || 0,
                          margin: 20 // Estimated
                        }
                      };
                      
                      return (
                        <Card key={forecast.scenarioId}>
                          <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 pb-2">
                            <CardTitle>{forecast.scenarioName}</CardTitle>
                            <p className="text-sm text-gray-500">{forecast.timeframe} month projection</p>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-xs font-semibold text-gray-500 mb-2">KEY METRICS</h4>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                  <div className="bg-gray-50 p-2 rounded">
                                    <div className="text-xs text-gray-500">Breakeven</div>
                                    <div className="font-medium">
                                      {forecast.profitability && typeof forecast.profitability.breakevenPoint === 'number' 
                                        ? `${forecast.profitability.breakevenPoint} months` 
                                        : 'N/A'}
                                    </div>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded">
                                    <div className="text-xs text-gray-500">ROI</div>
                                    <div className="font-medium">
                                      {forecast.profitability && typeof forecast.profitability.roi === 'number' 
                                        ? `${forecast.profitability.roi.toFixed(1)}%` 
                                        : 'N/A'}
                                    </div>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded">
                                    <div className="text-xs text-gray-500">Margin</div>
                                    <div className="font-medium">
                                      {forecast.profitability && typeof forecast.profitability.margin === 'number' 
                                        ? `${forecast.profitability.margin.toFixed(1)}%` 
                                        : 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-xs font-semibold text-gray-500 mb-2">TOTAL PROJECTED REVENUE</h4>
                                <div className="h-24 bg-gray-50 rounded-lg p-2 relative">
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                      <div className="text-xl font-bold">
                                        ${typeof revenueForecasts.totalProjectedRevenue === 'number' 
                                          ? revenueForecasts.totalProjectedRevenue.toLocaleString()
                                          : '0'}
                                      </div>
                                      <div className="text-xs text-gray-500">Total revenue</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-xs font-semibold text-gray-500 mb-2">MONTHLY REVENUE TREND</h4>
                                <div className="h-24 bg-gray-50 rounded-lg p-2 relative">
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                      <div className="flex items-center justify-center">
                                        <TrendingUp className="h-6 w-6 text-green-500 mr-2" />
                                        <span className="text-xl font-bold text-green-500">
                                          {typeof revenueForecasts.growthRate === 'number' 
                                            ? `+${revenueForecasts.growthRate}%`
                                            : '+0%'}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-500">Growth rate</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-xs font-semibold text-gray-500 mb-2">ASSUMPTIONS</h4>
                                <div className="text-sm">
                                  {revenueForecasts.assumptions && Array.isArray(revenueForecasts.assumptions) ? (
                                    <ul className="list-disc pl-5 space-y-1">
                                      {revenueForecasts.assumptions.slice(0, 3).map((assumption, idx) => (
                                        <li key={idx}>{assumption}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-gray-500">No assumptions provided</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })()}
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Revenue Streams</CardTitle>
                      <p className="text-sm text-gray-500">Breakdown of projected revenue by stream</p>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Revenue Stream</th>
                              <th className="text-center p-2">Percentage</th>
                              <th className="text-center p-2">Growth Rate</th>
                              <th className="text-right p-2">Projected Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {revenueForecasts && revenueForecasts.revenueStreams ? 
                              revenueForecasts.revenueStreams.map((stream, index) => (
                                <tr key={index} className="border-b">
                                  <td className="p-2 font-medium">{stream.name}</td>
                                  <td className="p-2 text-center">
                                    {typeof stream.percentage === 'number' ? `${stream.percentage}%` : '0%'}
                                  </td>
                                  <td className="p-2 text-center">
                                    {typeof stream.growth === 'number' ? `${stream.growth}%` : '0%'}
                                  </td>
                                  <td className="p-2 text-right">
                                    ${typeof revenueForecasts.totalProjectedRevenue === 'number' && typeof stream.percentage === 'number' 
                                      ? ((revenueForecasts.totalProjectedRevenue * stream.percentage) / 100).toLocaleString()
                                      : '0'}
                                  </td>
                                </tr>
                              ))
                              : (
                                <tr>
                                  <td colSpan={4} className="p-3 text-center text-gray-500">No revenue stream data available</td>
                                </tr>
                              )
                            }
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center">
                  <p className="text-gray-500">No revenue forecast data available</p>
                </div>
              )}
            </TabsContent>
            
            {/* Focus Group Simulation Tab */}
            <TabsContent value="focus-group" className="p-6">
              <h2 className="text-2xl font-bold mb-4">AI-Powered Focus Group Simulation</h2>
              <p className="text-gray-500 mb-6">
                Test new product concepts with simulated focus groups based on your customer segments
              </p>
              
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Concept Description
                    </label>
                    <textarea
                      placeholder="Describe your product concept in detail..."
                      className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                      rows={3}
                      value={productConcept}
                      onChange={(e) => setProductConcept(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The more detailed your description, the more accurate the simulation will be
                    </p>
                  </div>
                  
                  <Button
                    onClick={runFocusGroupSimulation}
                    disabled={isFocusGroupLoading || !productConcept.trim()}
                    className="w-full"
                  >
                    {isFocusGroupLoading ? (
                      <>
                        <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Running Simulation...
                      </>
                    ) : (
                      'Run Focus Group Simulation'
                    )}
                  </Button>
                </CardContent>
              </Card>
              
              {focusGroupData && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>{focusGroupData.productConcept}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Overall Sentiment: {typeof focusGroupData.overallSentiment === 'number' ? focusGroupData.overallSentiment.toFixed(1) : '0.0'}%
                        </div>
                        <div className={`text-sm px-2 py-0.5 rounded-full ${
                          typeof focusGroupData.overallSentiment === 'number' && focusGroupData.overallSentiment > 80 
                            ? 'bg-green-100 text-green-800' 
                            : typeof focusGroupData.overallSentiment === 'number' && focusGroupData.overallSentiment > 60
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {typeof focusGroupData.overallSentiment === 'number' && focusGroupData.overallSentiment > 80 
                            ? 'Very Positive' 
                            : typeof focusGroupData.overallSentiment === 'number' && focusGroupData.overallSentiment > 60
                            ? 'Positive'
                            : 'Mixed'
                          }
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">KEY INSIGHTS</h4>
                      <ul className="space-y-2 mb-6">
                        {Array.isArray(focusGroupData.keyInsights) 
                          ? focusGroupData.keyInsights.map((insight, idx) => (
                              <li key={idx} className="flex items-start text-sm">
                                <span className="text-blue-500 mr-2">●</span>
                                <span>{insight}</span>
                              </li>
                            ))
                          : <li className="text-gray-500">No insights available</li>
                        }
                      </ul>
                      
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">SEGMENT FEEDBACK</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.isArray(focusGroupData.feedback) 
                          ? focusGroupData.feedback.map((feedback, idx) => (
                          <Card key={idx} className="overflow-hidden">
                            <CardHeader className="py-3 px-4 bg-gray-50 flex flex-row items-center justify-between">
                              <div>
                                <CardTitle className="text-base">{feedback.segmentName}</CardTitle>
                                <p className="text-xs text-gray-500">Segment feedback</p>
                              </div>
                              <div className={`text-sm px-2 py-1 rounded-full ${
                                typeof feedback.adoptionLikelihood === 'number' && feedback.adoptionLikelihood > 80 
                                  ? 'bg-green-100 text-green-800' 
                                  : typeof feedback.adoptionLikelihood === 'number' && feedback.adoptionLikelihood > 60
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {typeof feedback.adoptionLikelihood === 'number' 
                                  ? `${feedback.adoptionLikelihood.toFixed(1)}% Adoption`
                                  : '0.0% Adoption'
                                }
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 text-sm">
                              <div className="mb-4">
                                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">POSITIVE FEEDBACK</h5>
                                <ul className="space-y-1">
                                  {Array.isArray(feedback.positivePoints) 
                                    ? feedback.positivePoints.map((point, pidx) => (
                                      <li key={pidx} className="flex items-start">
                                        <span className="text-green-500 mr-1">✓</span>
                                        <span>{point}</span>
                                      </li>
                                    ))
                                    : <li className="text-gray-500">No positive feedback available</li>
                                  }
                                </ul>
                              </div>
                              
                              <div className="mb-4">
                                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">CONCERNS</h5>
                                <ul className="space-y-1">
                                  {Array.isArray(feedback.negativePoints)
                                    ? feedback.negativePoints.map((point, pidx) => (
                                      <li key={pidx} className="flex items-start">
                                        <span className="text-red-500 mr-1">✗</span>
                                        <span>{point}</span>
                                      </li>
                                    ))
                                    : <li className="text-gray-500">No concerns reported</li>
                                  }
                                </ul>
                              </div>
                              
                              <div>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">SUGGESTED IMPROVEMENTS</h5>
                                <ul className="space-y-1">
                                  {Array.isArray(feedback.suggestedImprovements)
                                    ? feedback.suggestedImprovements.map((suggestion, pidx) => (
                                      <li key={pidx} className="flex items-start">
                                        <span className="text-blue-500 mr-1">→</span>
                                        <span>{suggestion}</span>
                                      </li>
                                    ))
                                    : <li className="text-gray-500">No suggestions available</li>
                                  }
                                </ul>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                        : <p className="text-gray-500 col-span-2 py-4 text-center">No feedback available</p>
                        }
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessIntelligence;