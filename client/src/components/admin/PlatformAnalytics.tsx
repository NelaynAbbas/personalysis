import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, TrendingUp, Users, DollarSign, BarChart3, Calendar, MonitorSmartphone, Cpu } from "lucide-react";
import SystemPerformance from './SystemPerformance';
import { 
  LineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

// Types 
interface ClientGrowthData {
  month: string;
  newClients: number;
  activeClients: number;
  churnedClients: number;
}

interface RevenueData {
  month: string;
  totalRevenue: number;
  subscriptionRevenue: number;
  oneTimeRevenue: number;
}

interface MetricData {
  id: string;
  metric: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'flat';
}

interface Industry {
  name: string;
  clients: number;
  revenue: number;
}

type AnalyticsResponse = {
  keyMetrics: MetricData[];
  clientGrowth: ClientGrowthData[];
  revenue: RevenueData[];
  industryBreakdown: Industry[];
};

// Fetch the analytics data
const useAnalyticsData = (timePeriod: string = '12months') => {
  return useQuery<AnalyticsResponse>({
    queryKey: [`/api/admin/analytics?period=${timePeriod}`],
    queryFn: getQueryFn({
      on401: "throw"
    }),
    refetchOnWindowFocus: false,
  });
};

// No more demo data generators - using real API data only

// Custom colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

// Component for the key metrics cards
const MetricCard = ({ data, isLoading }: { data: MetricData, isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="bg-card rounded-lg p-4 shadow-sm">
        <Skeleton className="h-4 w-1/3 mb-2" />
        <Skeleton className="h-8 w-1/2 mb-3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }
  
  // Format value based on metrics type
  let formattedValue = data.metric.includes('Revenue') 
    ? `$${data.value.toLocaleString()}`
    : data.metric.includes('Rate')
    ? `${data.value}%`
    : data.value.toLocaleString();
    
  // Color for trend
  const trendColor = data.trend === 'up' 
    ? data.metric.includes('Churn') ? 'text-red-500' : 'text-green-500'
    : data.trend === 'down'
    ? data.metric.includes('Churn') ? 'text-green-500' : 'text-red-500'
    : 'text-gray-500';
    
  const TrendIcon = data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingUp : TrendingUp;
  
  return (
    <div className="bg-card rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground">{data.metric}</h3>
      <p className="text-2xl font-bold mt-1">{formattedValue}</p>
      <div className={`flex items-center mt-1 ${trendColor}`}>
        <TrendIcon className={`h-4 w-4 mr-1 ${data.trend === 'down' ? 'rotate-180' : ''}`} />
        <span className="text-sm font-medium">{Math.abs(data.change)}% {data.trend}</span>
      </div>
    </div>
  );
};

export type PlatformAnalyticsProps = { 
  timePeriod?: '1week' | '1month' | '3months' | '6months' | '12months';
  onTimePeriodChange?: (value: '1week' | '1month' | '3months' | '6months' | '12months') => void;
};

const PlatformAnalytics = ({ timePeriod: externalTimePeriod, onTimePeriodChange }: PlatformAnalyticsProps) => {
  const [internalTimePeriod, setInternalTimePeriod] = useState<string>(externalTimePeriod || '12months');
  const effectivePeriod = externalTimePeriod || internalTimePeriod;
  const { data, isLoading, error } = useAnalyticsData(effectivePeriod);
  
  const handleTimePeriodChange = (value: string) => {
    if (onTimePeriodChange) {
      onTimePeriodChange(value as any);
    } else {
      setInternalTimePeriod(value);
    }
  };
  
  const handleExportReport = () => {
    // In a real implementation, this would trigger a download of a PDF or CSV report
    alert('Report export functionality would be implemented here.');
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle className="text-xl font-bold">Platform Analytics</CardTitle>
              <CardDescription>
                View platform usage and performance metrics
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 mt-2 md:mt-0">
              <Select value={effectivePeriod} onValueChange={handleTimePeriodChange}>
                <SelectTrigger className="w-[200px]">
                  <Calendar className="h-4 w-4 mr-1" />
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1week">Last Week</SelectItem>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="12months">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExportReport}>
                <Download className="h-4 w-4 mr-1" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-8 text-center text-red-500">
              <p className="font-medium">Error loading analytics data</p>
              <p className="text-sm mt-1">Please try again later</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                  Array(4).fill(0).map((_, index) => (
                    <div key={index} className="bg-card rounded-lg p-4 shadow-sm">
                      <Skeleton className="h-4 w-1/3 mb-2" />
                      <Skeleton className="h-8 w-1/2 mb-3" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ))
                ) : (
                  (data?.keyMetrics ?? []).map((metric) => (
                    <MetricCard key={metric.id} data={metric} isLoading={isLoading} />
                  ))
                )}
              </div>
              
              {/* Charts */}
              <Tabs defaultValue="growth" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="growth">
                    <Users className="h-4 w-4 mr-1" />
                    Client Growth
                  </TabsTrigger>
                  <TabsTrigger value="revenue">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Revenue Trends
                  </TabsTrigger>
                  <TabsTrigger value="industry">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Industry Breakdown
                  </TabsTrigger>
                  <TabsTrigger value="system">
                    <Cpu className="h-4 w-4 mr-1" />
                    System Performance
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="growth" className="space-y-4">
                  <div className="bg-card p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium mb-4">Client Growth Over Time</h3>
                    {isLoading ? (
                      <Skeleton className="h-[300px] w-full" />
                    ) : (
                      // Line chart for growth
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={data?.clientGrowth || []}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="newClients" name="New Clients" stroke="#0088FE" activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="activeClients" name="Active Clients" stroke="#00C49F" />
                          <Line type="monotone" dataKey="churnedClients" name="Churned Clients" stroke="#FF8042" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">New Clients</CardTitle>
                          <Badge variant="outline" className="text-xs px-2 py-0.5">Today</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <Skeleton className="h-[100px] w-full" />
                        ) : (
                          <div>
                            <p className="text-3xl font-bold">
                              {data && data.clientGrowth.length > 0 ? data.clientGrowth[data.clientGrowth.length - 1].newClients : 0}
                            </p>
                            <ResponsiveContainer width="100%" height={100}>
                              <LineChart data={data?.clientGrowth || []}>
                                <Line type="monotone" dataKey="newClients" stroke="#0088FE" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">Active Clients</CardTitle>
                          <Badge variant="outline" className="text-xs px-2 py-0.5">Today</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <Skeleton className="h-[100px] w-full" />
                        ) : (
                          <div>
                            <p className="text-3xl font-bold">
                              {data && data.clientGrowth.length > 0 ? data.clientGrowth[data.clientGrowth.length - 1].activeClients : 0}
                            </p>
                            <ResponsiveContainer width="100%" height={100}>
                              <LineChart data={data?.clientGrowth || []}>
                                <Line type="monotone" dataKey="activeClients" stroke="#00C49F" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Churn Rate (Selected Period)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <Skeleton className="h-[100px] w-full" />
                        ) : (
                          <div>
                            <p className="text-3xl font-bold">
                              {(() => {
                                const rate = (data?.keyMetrics || []).find(m => m.id === 'churn-rate')?.value ?? 0;
                                return Number(rate).toFixed(1);
                              })()}%
                            </p>
                            <ResponsiveContainer width="100%" height={100}>
                              <LineChart data={data?.clientGrowth || []}>
                                <Line type="monotone" dataKey="churnedClients" stroke="#FF8042" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="revenue" className="space-y-4">
                  <div className="bg-card p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium mb-4">Revenue Trends</h3>
                    {isLoading ? (
                      <Skeleton className="h-[300px] w-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={data?.revenue || []}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [`$${value.toLocaleString()}`, ""]}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="totalRevenue" name="Total Revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="subscriptionRevenue" name="Subscription Revenue" stroke="#82ca9d" />
                          <Line type="monotone" dataKey="oneTimeRevenue" name="One-time Revenue" stroke="#ffc658" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Total Revenue (Selected Period)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <Skeleton className="h-[100px] w-full" />
                        ) : (
                          <div>
                            <p className="text-3xl font-bold">
                              ${(() => {
                                const rev = data?.revenue || [];
                                const sum = rev.reduce((s, r) => s + (r.totalRevenue || 0), 0);
                                return sum.toLocaleString();
                              })()}
                            </p>
                            <div className="mt-2 text-sm text-muted-foreground">
                              <span className="text-muted-foreground">Sum across selected period</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Subscription Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <Skeleton className="h-[100px] w-full" />
                        ) : (
                          <div>
                            <p className="text-3xl font-bold">
                              ${(() => {
                                const rev = data?.revenue || [];
                                const sum = rev.reduce((s, r) => s + (r.subscriptionRevenue || 0), 0);
                                return sum.toLocaleString();
                              })()}
                            </p>
                            <div className="mt-2 text-xs text-muted-foreground">
                              <span className="font-medium">
                                {(() => {
                                  const rev = data?.revenue || [];
                                  const sub = rev.reduce((s, r) => s + (r.subscriptionRevenue || 0), 0);
                                  const total = rev.reduce((s, r) => s + (r.totalRevenue || 0), 0);
                                  const pct = (sub / Math.max(total, 1)) * 100;
                                  return pct.toFixed(1);
                                })()}%
                              </span> of total revenue
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">One-time Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <Skeleton className="h-[100px] w-full" />
                        ) : (
                          <div>
                            <p className="text-3xl font-bold">
                              ${(() => {
                                const rev = data?.revenue || [];
                                const sum = rev.reduce((s, r) => s + (r.oneTimeRevenue || 0), 0);
                                return sum.toLocaleString();
                              })()}
                            </p>
                            <div className="mt-2 text-xs text-muted-foreground">
                              <span className="font-medium">
                                {(() => {
                                  const rev = data?.revenue || [];
                                  const one = rev.reduce((s, r) => s + (r.oneTimeRevenue || 0), 0);
                                  const total = rev.reduce((s, r) => s + (r.totalRevenue || 0), 0);
                                  const pct = (one / Math.max(total, 1)) * 100;
                                  return pct.toFixed(1);
                                })()}%
                              </span> of total revenue
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="industry" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-card p-4 rounded-lg shadow-sm">
                      <h3 className="text-lg font-medium mb-4">Clients by Industry</h3>
                      {isLoading ? (
                        <Skeleton className="h-[300px] w-full" />
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={data?.industryBreakdown || []}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="clients"
                            >
                              {(data?.industryBreakdown || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [value, "Clients"]} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    
                    <div className="bg-card p-4 rounded-lg shadow-sm">
                      <h3 className="text-lg font-medium mb-4">Revenue by Industry</h3>
                      {isLoading ? (
                        <Skeleton className="h-[300px] w-full" />
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsBarChart
                            data={data?.industryBreakdown || []}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]} />
                            <Bar dataKey="revenue" fill="#8884d8">
                              {(data?.industryBreakdown || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-card p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium mb-4">Industry Breakdown</h3>
                    {isLoading ? (
                      <Skeleton className="h-[200px] w-full" />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">Industry</th>
                              <th className="text-right py-2 font-medium">Clients</th>
                              <th className="text-right py-2 font-medium">% of Total</th>
                              <th className="text-right py-2 font-medium">Revenue</th>
                              <th className="text-right py-2 font-medium">Avg. Revenue/Client</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(data?.industryBreakdown || []).map((industry, index) => {
                              const totalClients = (data?.industryBreakdown || []).reduce((sum, curr) => sum + curr.clients, 0);
                              const percentOfTotal = totalClients > 0 ? ((industry.clients / totalClients) * 100).toFixed(1) : '0';
                              const avgRevenue = industry.clients > 0 ? industry.revenue / industry.clients : 0;
                              
                              return (
                                <tr key={industry.name} className="border-b border-gray-100">
                                  <td className="py-2 text-left">
                                    <div className="flex items-center">
                                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                      {industry.name}
                                    </div>
                                  </td>
                                  <td className="py-2 text-right">{industry.clients}</td>
                                  <td className="py-2 text-right">{percentOfTotal}%</td>
                                  <td className="py-2 text-right">${industry.revenue.toLocaleString()}</td>
                                  <td className="py-2 text-right">${Math.round(avgRevenue).toLocaleString()}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="system" className="space-y-4">
                  <SystemPerformance />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformAnalytics;