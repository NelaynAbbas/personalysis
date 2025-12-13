import React, { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, Share2 } from "lucide-react";
import { SurveyShareModal } from "@/components/survey/SurveyShareModal";

// Define simple interfaces for the data we expect
interface Trait {
  name: string;
  score: number;
  category: string;
}

interface Product {
  name: string;
  confidence: number;
  description: string;
  attributes: string[];
}

interface ProductRecommendation {
  category: string;
  products: Product[];
  reason: string;
}

const ResultsPage: React.FC = () => {
  // Basic state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  // Parse the response ID from the URL
  const [match, params] = useRoute("/results/:responseId");
  const responseId = match ? params.responseId : null;
  
  // Load the results data
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/survey/results/${responseId}`],
    enabled: !!responseId,
    retry: 3
  });
  
  // Log the data for debugging
  useEffect(() => {
    if (data) {
      console.log("Results data loaded:", data);
    }
  }, [data]);
  
  // Handle loading state
  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-10">
        <Card className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-8">
          <CardContent>
            <div className="text-center mb-8">
              <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
            
            <div className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }
  
  // Handle error state
  if (error || !data) {
    return (
      <main className="container mx-auto px-4 py-10">
        <Card className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl p-8">
          <CardContent className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="text-red-500 h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Results</h2>
            <p className="text-gray-600 mb-6">
              We couldn't load your personality results. Please try again.
            </p>
            <Button onClick={() => setLocation('/dashboard')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }
  
  // Extract and validate the traits with enhanced defensive programming
  let traits: Trait[] = [];
  try {
    if (data && data.traits && Array.isArray(data.traits)) {
      traits = data.traits
        .filter(trait => trait !== null && trait !== undefined) // Filter out null/undefined items
        .map(trait => {
          try {
            return {
              name: trait && trait.name ? String(trait.name) : "Unknown Trait",
              score: trait && trait.score !== undefined && trait.score !== null ? 
                     Number(trait.score) : 50,
              category: trait && trait.category ? String(trait.category) : "general"
            };
          } catch (itemError) {
            console.error("Error parsing individual trait item:", itemError);
            // Return a default trait object for this item
            return { name: "Unknown Trait", score: 50, category: "general" };
          }
        });
    }
    // Add a log to see what traits were successfully parsed
    console.log("Parsed traits:", traits);
  } catch (e) {
    console.error("Error parsing traits:", e, "Original data:", data?.traits);
    traits = [];
  }
  
  // Extract and validate the recommendations with enhanced defensive programming
  let recommendations: ProductRecommendation[] = [];
  try {
    if (data && data.productRecommendations && Array.isArray(data.productRecommendations)) {
      recommendations = data.productRecommendations
        .filter(rec => rec !== null && rec !== undefined) // Filter out null/undefined items
        .map(rec => {
          try {
            return {
              category: rec && rec.category ? String(rec.category) : "General",
              products: rec && rec.products && Array.isArray(rec.products) 
                ? rec.products
                  .filter(prod => prod !== null && prod !== undefined) // Filter out null/undefined products
                  .map(prod => {
                    try {
                      return {
                        name: prod && prod.name ? String(prod.name) : "Unknown Product",
                        confidence: prod && prod.confidence !== undefined && prod.confidence !== null ? 
                                   Number(prod.confidence) : 50,
                        description: prod && prod.description ? String(prod.description) : "No description available",
                        attributes: prod && prod.attributes && Array.isArray(prod.attributes) 
                                    ? prod.attributes
                                      .filter(attr => attr !== null && attr !== undefined)
                                      .map(attr => String(attr)) 
                                    : []
                      };
                    } catch (prodError) {
                      console.error("Error parsing individual product:", prodError);
                      // Return a default product object
                      return { 
                        name: "Unknown Product", 
                        confidence: 50, 
                        description: "No description available", 
                        attributes: [] 
                      };
                    }
                  })
                : [],
              reason: rec && rec.reason ? String(rec.reason) : "Based on your personality profile"
            };
          } catch (recError) {
            console.error("Error parsing individual recommendation:", recError);
            // Return a default recommendation object
            return { 
              category: "General", 
              products: [], 
              reason: "Based on your personality profile" 
            };
          }
        });
      // Add a log to see what recommendations were successfully parsed
      console.log("Parsed recommendations:", recommendations);
    }
  } catch (e) {
    console.error("Error parsing recommendations:", e, "Original data:", data?.productRecommendations);
    recommendations = [];
  }
  
  // Extract market segment with enhanced defensive programming
  let marketSegment: string | null = null;
  try {
    if (data && data.marketSegment !== undefined && data.marketSegment !== null) {
      marketSegment = String(data.marketSegment);
    }
  } catch (e) {
    console.error("Error parsing market segment:", e, "Original data:", data?.marketSegment);
    marketSegment = null;
  }
  
  // Render the results
  return (
    <main className="container mx-auto px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <CardContent className="p-0">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mr-4"
                  onClick={() => setLocation('/dashboard')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">Your Personality Results</h1>
              </div>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShareModalOpen(true)}
                className="text-primary border-primary hover:bg-primary/10"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Results
              </Button>
            </div>
            
            {/* Share Modal */}
            <SurveyShareModal
              open={shareModalOpen}
              onOpenChange={setShareModalOpen}
              sessionId={responseId}
              defaultTitle="My Personality Assessment Results"
              defaultType="personality"
            />
            
            {/* Traits Section */}
            {traits.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-medium text-gray-900 mb-4">Personality Traits</h2>
                <div className="space-y-4">
                  {traits
                    .sort((a, b) => b.score - a.score)
                    .map((trait, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-base font-medium text-gray-700">{trait.name}</span>
                          <span className="text-sm font-medium text-gray-700">{trait.score}%</span>
                        </div>
                        <Progress 
                          value={trait.score} 
                          className="w-full h-3 mt-1"
                        />
                        <p className="mt-3 text-sm text-gray-500">
                          Category: {trait.category.charAt(0).toUpperCase() + trait.category.slice(1)}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Market Segment Section */}
            {marketSegment && (
              <div className="border rounded-lg p-4 mb-8 bg-primary/5">
                <h2 className="text-xl font-medium text-gray-900 mb-2">Your Market Segment</h2>
                <p className="text-lg font-medium text-primary">{marketSegment}</p>
              </div>
            )}
            
            {/* Recommendations Section */}
            {recommendations.length > 0 && (
              <div>
                <h2 className="text-xl font-medium text-gray-900 mb-4">Product Recommendations</h2>
                <div className="space-y-4">
                  {recommendations.map((recommendation, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{recommendation.category}</h3>
                      <div className="space-y-3">
                        {recommendation.products.map((product, pIndex) => (
                          <div key={pIndex} className="bg-gray-50 p-3 rounded">
                            <div className="flex justify-between">
                              <span className="font-medium">{product.name}</span>
                              <span className="text-sm text-gray-600">Match: {product.confidence}%</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                            {product.attributes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {product.attributes.map((attr, aIndex) => (
                                  <span key={aIndex} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                    {attr}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-3">{recommendation.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default ResultsPage;