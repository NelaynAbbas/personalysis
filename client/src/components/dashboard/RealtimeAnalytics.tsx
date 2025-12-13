import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useRealtime } from '@/hooks/useRealtime';
import { TrendingUp, TrendingDown, ActivityIcon, Users, BarChart2 } from 'lucide-react';

interface RealtimeAnalyticsProps {
  surveyId?: number | string;
  companyId?: number;
  showHeader?: boolean;
  className?: string;
}

type AnalyticsData = {
  totalResponses: number;
  completionRate: number;
  averageCompletionTime: number;
  responseRate: number;
  participationTrend: 'up' | 'down' | 'stable';
  activeRespondents: number;
  timestamp: string;
};

export default function RealtimeAnalytics({
  surveyId,
  companyId,
  showHeader = true,
  className = '',
}: RealtimeAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Connect to real-time analytics updates
  const { connected } = useRealtime('surveyAnalyticsUpdate', (data) => {
    // Only process updates for this survey or company
    if (
      (surveyId && data.surveyId !== undefined && data.surveyId.toString() !== surveyId.toString())
    ) {
      return;
    }
    
    console.log('Received real-time analytics update:', data);
    
    // Update analytics data from the metrics property
    if (data.metrics) {
      const newData: AnalyticsData = {
        totalResponses: data.metrics.totalResponses || 0,
        completionRate: data.metrics.completionRate || 0,
        averageCompletionTime: data.metrics.averageCompletionTime || analyticsData?.averageCompletionTime || 0,
        responseRate: data.responseRates?.daily ? 
          Object.values(data.responseRates.daily).reduce((sum, val) => sum + val, 0) / Object.keys(data.responseRates.daily).length : 0,
        participationTrend: 'stable', // Determine trend based on historical data
        activeRespondents: data.metrics.activeRespondents !== undefined ? data.metrics.activeRespondents : 0,
        timestamp: new Date().toISOString() // Always use current time when receiving updates
      };
      
      setAnalyticsData(newData);
      
      // No longer loading after first update
      setLoading(false);
    }
  });
  
  // Fetch initial analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        // Construct the API endpoint URL based on surveyId or companyId
        let endpoint;
        if (surveyId) {
          endpoint = `/api/surveys/${surveyId}/analytics/realtime`;
        } else if (companyId) {
          endpoint = `/api/company/${companyId}/analytics`;
        } else {
          throw new Error('Either surveyId or companyId must be provided');
        }
        
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch analytics data: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.status !== 'success' || !result.data) {
          throw new Error('Invalid response format');
        }
        
        const data = result.data;
        console.log('Fetched analytics data:', data);
        
        // Convert API data to AnalyticsData format
        const analyticsData: AnalyticsData = {
          totalResponses: data.totalResponses || 0,
          completionRate: data.completionRate || 0,
          averageCompletionTime: data.averageCompletionTime || 0,
          responseRate: data.responsesByDate ? 
            Object.values(data.responsesByDate).reduce((sum: number, val: number) => sum + val, 0) / 
            Math.max(1, Object.keys(data.responsesByDate).length) : 0,
          participationTrend: 'stable', // Determine trend based on historical data
          activeRespondents: data.activeRespondents !== undefined ? data.activeRespondents : 0,
          timestamp: new Date().toISOString(),
        };
        
        setAnalyticsData(analyticsData);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        // Fallback to empty data with zeros
        const emptyData: AnalyticsData = {
          totalResponses: 0,
          completionRate: 0,
          averageCompletionTime: 0,
          responseRate: 0,
          participationTrend: 'stable',
          activeRespondents: 0,
          timestamp: new Date().toISOString(),
        };
        setAnalyticsData(emptyData);
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch immediately
    fetchAnalyticsData();
    
    // Set up periodic refresh every 30 seconds to ensure data stays fresh
    // This works alongside WebSocket updates and ensures timestamp updates
    const refreshInterval = setInterval(() => {
      fetchAnalyticsData();
    }, 30000); // 30 seconds
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [surveyId, companyId]);
  
  if (loading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart2 className="h-4 w-4 mr-2" />
              Realtime Analytics
            </CardTitle>
            <CardDescription>
              Live survey performance metrics
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className="pt-2">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!analyticsData) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart2 className="h-4 w-4 mr-2" />
              Realtime Analytics
            </CardTitle>
            <CardDescription>
              Live survey performance metrics
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className="pt-2">
          <div className="text-center p-6">
            <p className="text-gray-500">No analytics data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg flex items-center">
                <BarChart2 className="h-4 w-4 mr-2" />
                Realtime Analytics
              </CardTitle>
              <CardDescription>
                Live survey performance metrics
              </CardDescription>
            </div>
            
            {connected && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <span className="h-2 w-2 rounded-full bg-green-400 mr-1 inline-block animate-pulse"></span>
                Live
              </Badge>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total Responses</span>
              <span className="font-semibold">{analyticsData.totalResponses}</span>
            </div>
            <Progress 
              value={Math.min(analyticsData.totalResponses, 100)} 
              className="h-1" 
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Completion Rate</span>
              <span className="font-semibold">
                {analyticsData.completionRate > 1 
                  ? Math.round(analyticsData.completionRate) 
                  : Math.round(analyticsData.completionRate * 100)}%
              </span>
            </div>
            <Progress 
              value={analyticsData.completionRate > 1 
                ? analyticsData.completionRate 
                : analyticsData.completionRate * 100} 
              className="h-1" 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Avg. Completion Time</span>
            <span className="font-semibold">
              {(() => {
                const totalSeconds = Math.round(analyticsData.averageCompletionTime);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                if (minutes > 0) {
                  return `${minutes}m ${seconds}s`;
                } else {
                  return `${seconds}s`;
                }
              })()}
            </span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Daily Response Rate</span>
            <div className="flex items-center">
              <span className="font-semibold mr-2">
                {analyticsData.responseRate > 0 
                  ? Math.round(analyticsData.responseRate) 
                  : 0}/day
              </span>
              {analyticsData.participationTrend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : analyticsData.participationTrend === 'down' ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <ActivityIcon className="h-4 w-4 text-yellow-500" />
              )}
            </div>
          </div>
        </div>
        
        <div className="pt-2 flex items-center">
          <Users className="h-4 w-4 text-primary mr-2" />
          <span className="text-sm">
            {analyticsData.activeRespondents} {analyticsData.activeRespondents === 1 ? 'person' : 'people'} currently taking this survey
          </span>
        </div>
        
        <div className="text-xs text-gray-400 pt-2">
          Last updated: {new Date(analyticsData.timestamp).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}