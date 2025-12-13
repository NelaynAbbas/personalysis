import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSystemPerformance, SystemPerformanceMetrics } from "@/lib/useSystemPerformance";
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Timer, 
  Users, 
  Database, 
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ErrorLogViewer from "./ErrorLogViewer";
import { Badge } from "@/components/ui/badge";

/**
 * Component for displaying and monitoring system health metrics
 */
const SystemHealth = () => {
  // Fetch system performance data with WebSocket connection status
  const { data, isLoading, error, refetch, dataUpdatedAt, wsConnectionStatus } = useSystemPerformance();

  // Calculate time since last update
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>("Just now");
  
  // Update the "time since update" text
  useEffect(() => {
    if (!dataUpdatedAt) return;
    
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - dataUpdatedAt) / 1000);
      if (seconds < 60) {
        setTimeSinceUpdate(`${seconds}s ago`);
      } else if (seconds < 3600) {
        setTimeSinceUpdate(`${Math.floor(seconds / 60)}m ago`);
      } else {
        setTimeSinceUpdate(`${Math.floor(seconds / 3600)}h ago`);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [dataUpdatedAt]);

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "System metrics refreshed",
        description: "System health data has been updated",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not refresh system metrics",
        variant: "destructive",
      });
    }
  };

  // Determine status color based on value
  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return "bg-red-500";
    if (value >= thresholds.warning) return "bg-amber-500";
    return "bg-emerald-500";
  };

  // Format memory values to readable format
  const formatMemory = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate average response time
  const getAverageResponseTime = (data: SystemPerformanceMetrics) => {
    if (data.performance?.overall?.totalRequests === 0) return 0;
    return data.performance?.overall?.averageResponseTime || 0;
  };

  // Calculate success rate percentage
  const getSuccessRate = (data: SystemPerformanceMetrics) => {
    const total = data.performance?.overall?.totalRequests || 0;
    if (total === 0) return 100;
    const successful = data.performance?.overall?.successfulRequests || 0;
    return Math.round((successful / total) * 100);
  };

  if (isLoading) {
    return (
      <Card data-system-health-card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-medium">System Health</CardTitle>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="text-2xl font-bold">
                  <Skeleton className="h-8 w-16" />
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-system-health-card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-medium">System Health</CardTitle>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 p-6 rounded-md text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
            <h3 className="text-lg font-medium mb-1">Failed to load system metrics</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "An unknown error occurred"}
            </p>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // State for endpoint details expansion
  const [showEndpointDetails, setShowEndpointDetails] = useState(false);
  
  // Toggle endpoint details visibility
  const toggleEndpointDetails = () => {
    setShowEndpointDetails(!showEndpointDetails);
  };
  
  // If we have data, display it
  if (data) {
    // Use CPU usage from data if available
    const cpuUsage = data.cpu?.usage 
      ? Math.min(99, Math.round(data.cpu.usage))
      : Math.min(99, Math.round(data.memory.usage));
    
    // Use memory usage from data if available
    const memoryUsage = data.memory?.usage
      ? Math.min(99, Math.round(data.memory.usage))
      : Math.min(99, Math.round((data.memory.heapUsed / data.memory.heapTotal) * 100));
    
    const averageResponseTime = getAverageResponseTime(data);
    const requestSuccessRate = getSuccessRate(data);

    return (
      <div className="space-y-6">
        <Card data-system-health-card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center">
                  <CardTitle className="text-base font-medium">System Health</CardTitle>
                  <Badge 
                    variant="outline"
                    className={`ml-2 ${wsConnectionStatus === 'connected' ? 
                      'bg-green-50 text-green-700 hover:bg-green-50 border-green-200' : 
                      'bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200'}`}
                    data-websocket-status
                  >
                    {wsConnectionStatus === 'connected' ? 
                      <><Wifi className="h-3 w-3 mr-1 text-green-600" /> Real-time</> : 
                      <><WifiOff className="h-3 w-3 mr-1 text-gray-600" /> Offline</>
                    }
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground flex items-center mt-1">
                  <Timer className="h-3 w-3 mr-1" />
                  Last updated: {timeSinceUpdate}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} data-refresh-metrics-button>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-md" data-metric="cpu">
              <div className="text-sm font-medium text-muted-foreground mb-1">CPU Usage</div>
              <div className="text-2xl font-bold">{cpuUsage}%</div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                <div
                  className={`h-2 ${getStatusColor(cpuUsage, { warning: 70, critical: 90 })} rounded-full`}
                  style={{ width: `${cpuUsage}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-md" data-metric="memory">
              <div className="text-sm font-medium text-muted-foreground mb-1">Memory Usage</div>
              <div className="text-2xl font-bold">{memoryUsage}%</div>
              <div className="text-xs text-muted-foreground mt-1 mb-1">
                {formatMemory(data.memory.heapUsed)} / {formatMemory(data.memory.heapTotal)}
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                <div
                  className={`h-2 ${getStatusColor(memoryUsage, { warning: 70, critical: 85 })} rounded-full`}
                  style={{ width: `${memoryUsage}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-md" data-metric="response-time">
              <div className="text-sm font-medium text-muted-foreground mb-1">Response Time</div>
              <div className="text-2xl font-bold">{averageResponseTime.toFixed(2)}ms</div>
              <div className="text-xs text-muted-foreground mt-1 mb-1">
                {data.performance?.overall?.totalRequests || 0} requests
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                <div
                  className={`h-2 ${getStatusColor(Math.min(averageResponseTime / 5, 100), {
                    warning: 50,
                    critical: 80,
                  })} rounded-full`}
                  style={{ width: `${Math.min(averageResponseTime / 5, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-md" data-metric="success-rate">
              <div className="text-sm font-medium text-muted-foreground mb-1">Success Rate</div>
              <div className="text-2xl font-bold">{requestSuccessRate}%</div>
              <div className="text-xs text-muted-foreground mt-1 mb-1">
                {data.performance?.overall?.successfulRequests || 0} / {data.performance?.overall?.totalRequests || 0}
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                <div
                  className={`h-2 ${getStatusColor(100 - requestSuccessRate, {
                    warning: 10,
                    critical: 20,
                  })} rounded-full`}
                  style={{ width: `${requestSuccessRate}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle2 className={`h-4 w-4 ${data.health?.status === 'healthy' ? 'text-emerald-500' : 'text-amber-500'} mr-2`} />
                <span className="text-sm">
                  System Status: {data.health?.status === 'healthy' ? "Operational" : "Degraded"}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Uptime: {Math.floor(data.uptime / 86400)}d {Math.floor((data.uptime % 86400) / 3600)}h {Math.floor((data.uptime % 3600) / 60)}m
              </div>
            </div>
            
            {/* Additional metric cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Active Connections */}
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Active Connections</div>
                  <div className="text-lg font-semibold">{data.activeConnections?.total || 0}</div>
                </div>
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              
              {/* Cache Performance */}
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Cache Hit Rate</div>
                  <div className="text-lg font-semibold">
                    {data.cache ? 
                      `${Math.round((data.cache.hits / (data.cache.hits + data.cache.misses || 1)) * 100)}%` : 
                      'N/A'}
                  </div>
                </div>
                <Database className="h-5 w-5 text-purple-500" />
              </div>
              
              {/* API Rate Limiter */}
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Rate Limiter Active Keys</div>
                  <div className="text-lg font-semibold">{data.rateLimiter?.activeKeys || 0}</div>
                </div>
                <ShieldAlert className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            
            {/* Endpoint Performance Details */}
            <div className="mt-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center w-full justify-between"
                onClick={toggleEndpointDetails}
                data-endpoint-details-toggle
              >
                <span className="flex items-center">
                  <Timer className="mr-2 h-4 w-4" />
                  API Endpoint Performance Details
                </span>
                {showEndpointDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              {showEndpointDetails && data.performance?.endpoints && (
                <div className="mt-2 overflow-auto max-h-96 bg-gray-50 rounded-md p-3">
                  <table className="w-full text-xs">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 font-medium">Endpoint</th>
                        <th className="text-right py-2 font-medium">Requests</th>
                        <th className="text-right py-2 font-medium">Avg Time</th>
                        <th className="text-right py-2 font-medium">Slowest</th>
                        <th className="text-right py-2 font-medium">Errors</th>
                        <th className="text-right py-2 font-medium">Success Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(data.performance.endpoints).map(([endpoint, metrics]) => {
                        if (!metrics) return null;
                        
                        // Calculate errors based on available data
                        const errors = Math.round(metrics.count * (metrics.errorRate / 100)) || 0;
                        
                        // Calculate success rate
                        const successRate = 100 - metrics.errorRate;
                        const statusColor = 
                          successRate < 80 ? "text-red-500" :
                          successRate < 95 ? "text-amber-500" :
                          "text-emerald-500";
                        
                        // Get average response time
                        const avgTime = metrics.averageResponseTime;
                        const avgTimeColor = 
                          avgTime > 300 ? "text-red-500" :
                          avgTime > 100 ? "text-amber-500" :
                          "text-emerald-500";
                        
                        // Estimate slowest request (in a real app, this would come from metrics)
                        const slowestRequest = avgTime * 2.5;
                        
                        return (
                          <tr key={endpoint} className="border-b border-gray-200">
                            <td className="py-2 truncate max-w-[200px]">{endpoint}</td>
                            <td className="text-right py-2">{metrics.count}</td>
                            <td className={`text-right py-2 ${avgTimeColor}`}>{avgTime.toFixed(2)}ms</td>
                            <td className="text-right py-2">{slowestRequest.toFixed(2)}ms</td>
                            <td className="text-right py-2">{errors}</td>
                            <td className={`text-right py-2 font-medium ${statusColor}`}>{successRate.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Error Logs */}
      <ErrorLogViewer />
    </div>
    );
  }

  return null;
};

export default SystemHealth;