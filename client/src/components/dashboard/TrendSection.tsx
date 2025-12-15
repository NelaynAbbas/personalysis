import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  RefreshCw,
  AlertCircle,
  Lightbulb,
  Target,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

// Sub-component imports
import TrendHeader from "./trend-cards/TrendHeader";
import ResponseVolumeTrendCard from "./trend-cards/ResponseVolumeTrendCard";
import TraitEvolutionCard from "./trend-cards/TraitEvolutionCard";
import DemographicShiftsCard from "./trend-cards/DemographicShiftsCard";
import QualityTrendsCard from "./trend-cards/QualityTrendsCard";
import AIInsightsCard from "./trend-cards/AIInsightsCard";

export interface TrendAnalysisResult {
  hasEnoughData: boolean;
  dataPoints: number;
  volumeTrend: {
    dataPoints: Array<{ date: string; count: number }>;
    trend: 'increasing' | 'decreasing' | 'stable';
    growthRate: number;
    peakDate: string;
    peakCount: number;
  };
  traitEvolution: Array<{
    traitName: string;
    dataPoints: Array<{ date: string; score: number }>;
    trend: 'rising' | 'falling' | 'stable';
    changePercent: number;
  }>;
  demographicShifts: Array<{
    demographic: string;
    periods: Array<{
      date: string;
      distribution: Record<string, number>;
    }>;
    significantChanges: Array<{
      category: string;
      change: string;
    }>;
  }>;
  qualityTrends: {
    completionRate: Array<{ date: string; rate: number }>;
    avgResponseTime: Array<{ date: string; seconds: number }>;
  };
  insights: Array<{
    title: string;
    description: string;
    type: 'opportunity' | 'warning' | 'neutral';
    confidence: 'high' | 'medium' | 'low';
  }>;
  recommendations: Array<{
    action: string;
    rationale: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  message?: string;
}

interface TrendSectionProps {
  surveyId: string; // 'all' or specific survey ID
  companyId: number;
}

const TrendSection: React.FC<TrendSectionProps> = ({ surveyId, companyId }) => {
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | 'all'>('all');

  // Build endpoint based on surveyId
  const endpoint = surveyId === 'all'
    ? `/api/company/${companyId}/trends?timeframe=${timeframe}`
    : `/api/surveys/${surveyId}/trends?timeframe=${timeframe}`;

  // Fetch trend data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [endpoint],
    queryFn: () => apiRequest(endpoint),
    staleTime: 1000 * 60 * 5, // 5 minute cache
    gcTime: 1000 * 60 * 10, // 10 minute garbage collection
  });

  // Refetch when surveyId or timeframe changes
  useEffect(() => {
    refetch();
  }, [surveyId, timeframe, refetch]);

  // The apiRequest function returns data.data directly (not wrapped in envelope)
  // So 'data' is already the TrendAnalysisResult
  const trendData = data as TrendAnalysisResult | undefined;

  // Debug logging
  useEffect(() => {
    console.log('[TrendSection] Raw API response:', data);
    console.log('[TrendSection] trendData:', trendData);
    console.log('[TrendSection] hasEnoughData:', trendData?.hasEnoughData);
    console.log('[TrendSection] dataPoints:', trendData?.dataPoints);
  }, [data]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-gray-600">Analyzing trends with AI...</p>
          </div>
        </Card>

        {/* Skeleton loaders */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="h-[300px] bg-gray-100 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="h-[300px] bg-gray-100 animate-pulse" />
            <Card className="h-[300px] bg-gray-100 animate-pulse" />
          </div>
          <Card className="h-[250px] bg-gray-100 animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 mb-2">
              Unable to Load Trend Analysis
            </h3>
            <p className="text-red-700 text-sm mb-4">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <Button variant="outline" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry Analysis
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Insufficient data state
  if (!trendData?.hasEnoughData) {
    const responseCount = trendData?.dataPoints || 0;
    const needed = 10 - responseCount;

    return (
      <div className="space-y-6">
        {/* Header with time range selector - shown even with insufficient data */}
        <TrendHeader timeframe={timeframe} onTimeframeChange={setTimeframe} />

        {/* Insufficient data message */}
        <Card className="p-12 text-center border-amber-200 bg-amber-50">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-amber-200 flex items-center justify-center">
              <Lightbulb className="h-8 w-8 text-amber-700" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Not Enough Data for Trend Analysis
            </h3>
            <p className="text-gray-600 max-w-md">
              {responseCount > 0
                ? `You have ${responseCount} response${responseCount !== 1 ? 's' : ''}. Collect at least 10 responses over multiple days to see AI-powered trend insights.`
                : 'Responses will appear here once users submit your survey.'}
            </p>

            {responseCount > 0 && (
              <>
                <Progress
                  value={(responseCount / 10) * 100}
                  className="mt-2 max-w-xs"
                />
                <p className="text-sm text-amber-700 font-medium">
                  {needed} more response{needed !== 1 ? 's' : ''} needed
                </p>
              </>
            )}

            <p className="text-sm text-gray-500 mt-4">
              {trendData?.message}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Main content
  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <TrendHeader timeframe={timeframe} onTimeframeChange={setTimeframe} />

      {/* Response Volume Trend */}
      <ResponseVolumeTrendCard data={trendData.volumeTrend} />

      {/* Trait Evolution and Demographic Shifts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TraitEvolutionCard data={trendData.traitEvolution} />
        <DemographicShiftsCard data={trendData.demographicShifts} />
      </div>

      {/* Quality Trends */}
      <QualityTrendsCard data={trendData.qualityTrends} />

      {/* AI Insights and Recommendations */}
      <AIInsightsCard
        insights={trendData.insights}
        recommendations={trendData.recommendations}
      />
    </div>
  );
};

export default TrendSection;
