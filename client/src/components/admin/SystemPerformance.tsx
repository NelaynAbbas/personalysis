import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useSystemPerformance } from "@/lib/useSystemPerformance";
import { Cpu, HardDrive, Activity, Clock, Database, Shield, Users } from "lucide-react";

// Helper function to format bytes into human-readable format
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Helper function to format milliseconds into human-readable format
const formatTime = (ms: number) => {
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
};

// Format uptime into human-readable format
const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
};

const SystemPerformance: React.FC = () => {
  const { data, isLoading, error } = useSystemPerformance();

  if (error) {
    return (
      <div className="p-6 bg-card rounded-lg shadow-sm text-center text-red-500">
        <h3 className="text-lg font-medium mb-2">Error Loading System Metrics</h3>
        <p>Unable to fetch system performance data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Server Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Memory Usage Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <HardDrive className="h-4 w-4 mr-1" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[100px] w-full" />
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Heap Used</span>
                    <span className="text-sm">
                      {formatBytes(data?.memory.heapUsed || 0)} / {formatBytes(data?.memory.heapTotal || 0)}
                    </span>
                  </div>
                  <Progress 
                    value={data ? (data.memory.heapUsed / data.memory.heapTotal) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">RSS Memory</span>
                    <span className="text-sm">{formatBytes(data?.memory.rss || 0)}</span>
                  </div>
                  <Progress 
                    value={data ? (data.memory.rss / (data.memory.heapTotal * 1.5)) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">External Memory</span>
                    <span className="text-sm">{formatBytes(data?.memory.external || 0)}</span>
                  </div>
                  <Progress 
                    value={data ? (data.memory.external / (data.memory.heapTotal)) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Uptime & Health Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Uptime & Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[100px] w-full" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Server Uptime</span>
                  <span className="text-sm font-bold">
                    {data ? formatUptime(data.uptime) : 'Loading...'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Connections</span>
                  <span className="text-sm font-bold">
                    {data ? data.activeConnections.total : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cache Hit Rate</span>
                  <span className="text-sm font-bold">
                    {data ? 
                      `${((data.cache.hits / (data.cache.hits + data.cache.misses || 1)) * 100).toFixed(1)}%` : 
                      '0%'
                    }
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Stats Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Activity className="h-4 w-4 mr-1" />
              Request Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[100px] w-full" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Requests</span>
                  <span className="text-sm font-bold">
                    {data?.performance.overall.totalRequests.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span className="text-sm font-bold text-green-500">
                    {data ? 
                      `${((data.performance.overall.successfulRequests / (data.performance.overall.totalRequests || 1)) * 100).toFixed(1)}%` : 
                      '0%'
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg Response Time</span>
                  <span className="text-sm font-bold">
                    {data ? formatTime(data.performance.overall.averageResponseTime) : '0ms'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* API Endpoints Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Database className="h-5 w-5 mr-2" />
            API Endpoints Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Endpoint</th>
                    <th className="text-right py-3 px-4 font-medium">Requests</th>
                    <th className="text-right py-3 px-4 font-medium">Avg Time</th>
                    <th className="text-right py-3 px-4 font-medium">Slowest</th>
                    <th className="text-right py-3 px-4 font-medium">Errors</th>
                    <th className="text-right py-3 px-4 font-medium">Last Called</th>
                  </tr>
                </thead>
                <tbody>
                  {data && Object.entries(data.performance.endpoints).map(([endpoint, stats], i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{endpoint}</td>
                      <td className="text-right py-3 px-4">{stats.count.toLocaleString()}</td>
                      <td className="text-right py-3 px-4">{formatTime(stats.averageDuration)}</td>
                      <td className="text-right py-3 px-4">{formatTime(stats.slowestRequest)}</td>
                      <td className="text-right py-3 px-4 text-red-500">{stats.errors}</td>
                      <td className="text-right py-3 px-4 text-muted-foreground">
                        {new Date(stats.lastRequestTime).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                  {!data || Object.keys(data.performance.endpoints).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-muted-foreground">
                        No endpoint data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rate Limiter Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Rate Limiting Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[100px] w-full" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Active Rate Limited Keys</span>
                <span className="font-bold">
                  {data?.rateLimiter.activeKeys || 0}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Rate Limits By Endpoint</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {data && Object.entries(data.rateLimiter.limitsByEndpoint).map(([endpoint, limit], index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-xs truncate max-w-[70%]">{endpoint}</span>
                      <span className="text-xs font-medium">{limit}/min</span>
                    </div>
                  ))}
                  {!data || Object.keys(data.rateLimiter.limitsByEndpoint).length === 0 && (
                    <div className="col-span-3 p-2 text-center text-muted-foreground text-sm">
                      No rate limits configured
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cache Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Cache Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[150px] w-full" />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">{data?.cache.hits.toLocaleString() || 0}</div>
                  <div className="text-sm text-muted-foreground">Cache Hits</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">{data?.cache.misses.toLocaleString() || 0}</div>
                  <div className="text-sm text-muted-foreground">Cache Misses</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">{formatBytes(data?.cache.size || 0)}</div>
                  <div className="text-sm text-muted-foreground">Cache Size</div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Cache Groups</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  {data && Object.entries(data.cache.groups).map(([group, count], index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-xs">{group}</span>
                      <span className="text-xs font-medium">{count}</span>
                    </div>
                  ))}
                  {!data || Object.keys(data.cache.groups).length === 0 && (
                    <div className="col-span-4 p-2 text-center text-muted-foreground text-sm">
                      No cache groups available
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemPerformance;