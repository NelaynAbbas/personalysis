// Admin console type definitions
export interface SystemMetrics {
  cpu: { usage: number };
  memory: { usage: number; heapUsed?: number; heapTotal?: number };
  activeConnections: { total: number; websocket?: number; http?: number };
  status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  timestamp?: string;
}

export interface AnalyticsKeyMetric {
  id: string;
  metric: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
}

export interface AnalyticsClientGrowth {
  month: string;
  clients: number;
  growth: number;
}

export interface AnalyticsRevenue {
  month: string;
  revenue: number;
  target: number;
}

export interface AnalyticsIndustryBreakdown {
  name: string;
  revenue: number;
  percentage: number;
}

export interface AnalyticsData {
  keyMetrics?: AnalyticsKeyMetric[];
  clientGrowth?: AnalyticsClientGrowth[];
  revenue?: AnalyticsRevenue[];
  industryBreakdown?: AnalyticsIndustryBreakdown[];
  totalClients?: number;
  totalRevenue?: number;
  averageResponseTime?: number;
  systemUptime?: number;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  isAuthenticated: boolean;
  permissions?: string[];
}

export interface WebSocketConnectionState {
  isConnected: boolean;
  connectionId?: string;
  lastActivity?: Date;
  reconnectAttempts?: number;
}