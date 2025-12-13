import os from 'os';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// Add types for survey analytics
export type SurveyAnalytics = {
  surveyId: number;
  totalResponses: number;
  completionRate: number;
  averageRating: number;
  uniqueRespondents: number;
  lastResponseTime: Date;
  responsesByDate: Record<string, number>;
  averageCompletionTime: number;  // in seconds
  demographics: {
    ageGroups: Record<string, number>;
    genders: Record<string, number>;
    regions: Record<string, number>;
  };
};

type PerformanceMetrics = {
  requestId: string;
  method: string;
  route: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
  userId?: number | string;
  userAgent?: string;
  referrer?: string;
  statusMessage?: string;
  cpuUsage?: number;
  memoryUsage?: number;
  threadCount?: number;
};

// In-memory store for API metrics
const apiMetrics: {
  endpoints: Record<string, {
    count: number;
    totalDuration: number;
    averageDuration: number;
    slowestRequest: number;
    lastRequestTime: number;
    errors: number;
  }>;
  overall: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
  };
  activeRequests: Map<string, PerformanceMetrics>;
  recentRequests: PerformanceMetrics[];
  systemLoad: {
    lastUpdate: number;
    cpuUsage: number;
    memoryUsage: {
      free: number;
      total: number;
      percentFree: number;
    };
    uptime: number;
    loadAverage: number[];
  };
  surveyAnalytics: {
    recentResponses: Map<number, any[]>; // Map of surveyId to recent responses
    aggregatedData: Map<number, SurveyAnalytics>; // Map of surveyId to aggregated data
    responseRates: {
      hourly: Record<string, number>;
      daily: Record<string, number>;
      weekly: Record<string, number>;
    };
    lastUpdate: number;
  };
} = {
  endpoints: {},
  overall: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
  },
  activeRequests: new Map(),
  recentRequests: [],
  systemLoad: {
    lastUpdate: Date.now(),
    cpuUsage: 0,
    memoryUsage: {
      free: 0,
      total: 0,
      percentFree: 0,
    },
    uptime: 0,
    loadAverage: [],
  },
  surveyAnalytics: {
    recentResponses: new Map(),
    aggregatedData: new Map(),
    responseRates: {
      hourly: {},
      daily: {},
      weekly: {},
    },
    lastUpdate: Date.now(),
  },
};

// Keep only the last 100 requests for analysis
const MAX_RECENT_REQUESTS = 100;

// Update CPU and memory metrics
function updateSystemMetrics() {
  const loadAvg = os.loadavg();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  
  // Calculate CPU load across all cores
  // loadavg()[0] gives 1 minute average load
  const numCPUs = os.cpus().length;
  const loadPercentage = (loadAvg[0] / numCPUs) * 100;
  
  apiMetrics.systemLoad = {
    lastUpdate: Date.now(),
    cpuUsage: Math.min(100, Math.max(0, loadPercentage / 100)),
    memoryUsage: {
      free: Math.round(freeMem / (1024 * 1024)), // MB
      total: Math.round(totalMem / (1024 * 1024)), // MB
      percentFree: (freeMem / totalMem) * 100
    },
    uptime: process.uptime(),
    loadAverage: loadAvg,
  };
}

// Start monitoring system metrics
let systemMetricsInterval: NodeJS.Timeout;
export function startSystemMetricsMonitoring(intervalMs = 30000) {
  // Update immediately
  updateSystemMetrics();
  
  // Then at regular intervals
  systemMetricsInterval = setInterval(updateSystemMetrics, intervalMs);
  
  return () => {
    if (systemMetricsInterval) {
      clearInterval(systemMetricsInterval);
    }
  };
}

// Track request start
export function trackRequestStart(req: any, requestId: string) {
  // Generate a unique ID if not provided
  if (!requestId) {
    requestId = Math.random().toString(36).substring(2, 10);
  }
  
  const url = req.originalUrl || req.url;
  const method = req.method;
  const metrics: PerformanceMetrics = {
    requestId,
    method,
    route: url,
    startTime: Date.now(),
    userId: req.session?.userId,
    userAgent: req.headers['user-agent'],
    referrer: req.headers['referer'],
  };
  
  // Track active request
  apiMetrics.activeRequests.set(requestId, metrics);
  
  return requestId;
}

// Track request end
export function trackRequestEnd(requestId: string, statusCode: number, statusMessage?: string) {
  const request = apiMetrics.activeRequests.get(requestId);
  if (!request) return;
  
  const endTime = Date.now();
  const duration = endTime - request.startTime;
  
  // Update metrics for this request
  request.endTime = endTime;
  request.duration = duration;
  request.statusCode = statusCode;
  request.statusMessage = statusMessage;
  
  // Update endpoint stats
  const endpointKey = `${request.method} ${request.route}`;
  if (!apiMetrics.endpoints[endpointKey]) {
    apiMetrics.endpoints[endpointKey] = {
      count: 0,
      totalDuration: 0,
      averageDuration: 0,
      slowestRequest: 0,
      lastRequestTime: 0,
      errors: 0,
    };
  }
  
  const endpoint = apiMetrics.endpoints[endpointKey];
  endpoint.count++;
  endpoint.totalDuration += duration;
  endpoint.averageDuration = endpoint.totalDuration / endpoint.count;
  endpoint.lastRequestTime = endTime;
  
  if (duration > endpoint.slowestRequest) {
    endpoint.slowestRequest = duration;
  }
  
  if (statusCode >= 400) {
    endpoint.errors++;
  }
  
  // Update overall stats
  apiMetrics.overall.totalRequests++;
  if (statusCode >= 200 && statusCode < 400) {
    apiMetrics.overall.successfulRequests++;
  } else {
    apiMetrics.overall.failedRequests++;
  }
  
  // Update average response time
  const totalDuration = apiMetrics.overall.averageResponseTime * (apiMetrics.overall.totalRequests - 1) + duration;
  apiMetrics.overall.averageResponseTime = totalDuration / apiMetrics.overall.totalRequests;
  
  // Add to recent requests
  apiMetrics.recentRequests.push({ ...request });
  if (apiMetrics.recentRequests.length > MAX_RECENT_REQUESTS) {
    apiMetrics.recentRequests.shift();
  }
  
  // Remove from active requests
  apiMetrics.activeRequests.delete(requestId);
}

// Get current performance metrics
export function getPerformanceMetrics() {
  return {
    endpoints: apiMetrics.endpoints,
    overall: apiMetrics.overall,
    activeRequests: Array.from(apiMetrics.activeRequests.values()),
    recentRequests: apiMetrics.recentRequests,
    systemLoad: apiMetrics.systemLoad,
  };
}

// Get metrics for a specific endpoint
export function getEndpointMetrics(method: string, route: string) {
  return apiMetrics.endpoints[`${method} ${route}`] || null;
}

// Reset all metrics
export function resetMetrics() {
  apiMetrics.endpoints = {};
  apiMetrics.overall = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
  };
  apiMetrics.activeRequests.clear();
  apiMetrics.recentRequests = [];

  // Only update system load
  updateSystemMetrics();
}

// Track a new survey response
export async function trackSurveyResponse(surveyId: number, responseData: any) {
  const MAX_RECENT_RESPONSES = 50; // Maximum number of recent responses to keep per survey
  
  // Get or initialize recent responses array for this survey
  if (!apiMetrics.surveyAnalytics.recentResponses.has(surveyId)) {
    apiMetrics.surveyAnalytics.recentResponses.set(surveyId, []);
  }
  
  const responsesList = apiMetrics.surveyAnalytics.recentResponses.get(surveyId);
  
  // Ensure responsesList is defined before using it
  if (responsesList) {
    // Add to recent responses
    responsesList.push({
      ...responseData,
      timestamp: new Date()
    });
    
    // Trim if exceeds maximum
    if (responsesList.length > MAX_RECENT_RESPONSES) {
      responsesList.shift();
    }
    
    // Update last update time
    apiMetrics.surveyAnalytics.lastUpdate = Date.now();
    
    // Update response rates
    const now = new Date();
    const hour = now.getHours().toString();
    const day = now.toISOString().split('T')[0];
    const week = getWeekIdentifier(now);
    
    // Update hourly rate
    if (!apiMetrics.surveyAnalytics.responseRates.hourly[hour]) {
      apiMetrics.surveyAnalytics.responseRates.hourly[hour] = 0;
    }
    apiMetrics.surveyAnalytics.responseRates.hourly[hour]++;
    
    // Update daily rate
    if (!apiMetrics.surveyAnalytics.responseRates.daily[day]) {
      apiMetrics.surveyAnalytics.responseRates.daily[day] = 0;
    }
    apiMetrics.surveyAnalytics.responseRates.daily[day]++;
    
    // Update weekly rate
    if (!apiMetrics.surveyAnalytics.responseRates.weekly[week]) {
      apiMetrics.surveyAnalytics.responseRates.weekly[week] = 0;
    }
    apiMetrics.surveyAnalytics.responseRates.weekly[week]++;
    
    // Trigger aggregation every 5 responses
    if (responsesList.length % 5 === 0) {
      await aggregateSurveyData(surveyId);
    }
  } else {
    console.error(`Failed to initialize responses list for survey ID: ${surveyId}`);
  }
  
  return responseData;
}

// Helper to get week identifier (YYYY-WW format)
function getWeekIdentifier(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 4).getTime()) / 86400000 / 7) + 1;
  return `${d.getFullYear()}-${week.toString().padStart(2, '0')}`;
}

// Aggregate survey response data
export async function aggregateSurveyData(surveyId: number): Promise<SurveyAnalytics | null> {
  try {
    // First, get the response_count from surveys table (more accurate and faster)
    const surveyResult = await db.execute(sql`
      SELECT response_count, company_id
      FROM surveys
      WHERE id = ${surveyId}
    `);
    
    const surveyData = surveyResult.rows[0] as Record<string, any> | undefined;
    const surveyResponseCount = surveyData?.response_count ? Number(surveyData.response_count) : 0;
    
    // Query the database for all responses for this survey
    const query = sql`
      SELECT 
        COUNT(*) as total_responses,
        COUNT(DISTINCT respondent_id) as unique_respondents,
        AVG(CASE WHEN completed = true THEN 1 ELSE 0 END) as completion_rate,
        AVG(CAST(satisfaction_score AS FLOAT)) as avg_rating,
        AVG(CAST(response_time_seconds AS FLOAT)) as avg_completion_time,
        MAX(created_at) as last_response_time
      FROM survey_responses
      WHERE survey_id = ${surveyId}
    `;
    
    const result = await db.execute(query);
    
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    
    const data = result.rows[0] as Record<string, any>;
    
    // Debug: Log the actual counts from the query
    console.log(`[Analytics] Survey ${surveyId} - Query results:`, {
      total_responses_from_query: data.total_responses,
      survey_response_count: surveyResponseCount,
      unique_respondents: data.unique_respondents,
      completion_rate: data.completion_rate
    });
    
    // Query demographic data
    const demographicsQuery = sql`
      SELECT 
        demographics->>'age' as age_group,
        demographics->>'gender' as gender,
        demographics->>'region' as region,
        COUNT(*) as count
      FROM survey_responses
      WHERE survey_id = ${surveyId}
      GROUP BY demographics->>'age', demographics->>'gender', demographics->>'region'
    `;
    
    const demographicsResult = await db.execute(demographicsQuery);
    const demographicRows = (demographicsResult.rows || []) as Array<Record<string, any>>;
    
    // Get response data by date
    const responsesByDateQuery = sql`
      SELECT 
        DATE(created_at) as response_date,
        COUNT(*) as count
      FROM survey_responses 
      WHERE survey_id = ${surveyId}
      GROUP BY DATE(created_at)
      ORDER BY response_date
    `;
    
    const dateResult = await db.execute(responsesByDateQuery);
    const dateRows = (dateResult.rows || []) as Array<Record<string, any>>;
    
    // Process demographics
    const ageGroups: Record<string, number> = {};
    const genders: Record<string, number> = {};
    const regions: Record<string, number> = {};
    
    demographicRows.forEach(row => {
      const ageGroup = row.age_group as string;
      const gender = row.gender as string;
      const region = row.region as string;
      const count = Number(row.count) || 0;
      
      if (ageGroup) {
        ageGroups[ageGroup] = (ageGroups[ageGroup] || 0) + count;
      }
      if (gender) {
        genders[gender] = (genders[gender] || 0) + count;
      }
      if (region) {
        regions[region] = (regions[region] || 0) + count;
      }
    });
    
    // Process responses by date
    const responsesByDate: Record<string, number> = {};
    dateRows.forEach(row => {
      const responseDate = row.response_date as Date | string;
      const count = Number(row.count) || 0;
      
      if (responseDate) {
        const dateStr = new Date(responseDate).toISOString().split('T')[0];
        responsesByDate[dateStr] = count;
      }
    });
    
    // Use response_count from surveys table if available (more accurate), otherwise use count from query
    const totalResponses = surveyResponseCount > 0 ? surveyResponseCount : (Number(data.total_responses) || 0);
    
    // Calculate active respondents (currently taking the survey)
    // This should count active sessions - responses that started but haven't been completed
    // Count sessions that started within the last 30 minutes and are not completed
    const activeSessionsQuery = sql`
      SELECT COUNT(DISTINCT respondent_id) as active_count
      FROM survey_responses
      WHERE survey_id = ${surveyId}
        AND completed = false
        AND start_time > NOW() - INTERVAL '30 minutes'
    `;
    
    const activeSessionsResult = await db.execute(activeSessionsQuery);
    const activeRespondents = Number(activeSessionsResult.rows[0]?.active_count || 0);
    
    // Create analytics object
    const analytics: SurveyAnalytics = {
      surveyId,
      totalResponses: totalResponses,
      completionRate: Number(data.completion_rate) || 0,
      averageRating: Number(data.avg_rating) || 0,
      uniqueRespondents: Number(data.unique_respondents) || 0,
      activeRespondents: activeRespondents, // Add active respondents count
      lastResponseTime: data.last_response_time ? new Date(data.last_response_time) : new Date(),
      responsesByDate,
      averageCompletionTime: Number(data.avg_completion_time) || 0,
      demographics: {
        ageGroups,
        genders,
        regions
      }
    };
    
    // Store in cache
    apiMetrics.surveyAnalytics.aggregatedData.set(surveyId, analytics);
    
    return analytics;
  } catch (error) {
    console.error(`Error aggregating survey data for surveyId ${surveyId}:`, error);
    return null;
  }
}

// Get cached analytics for a survey
export function getCachedSurveyAnalytics(surveyId: number): SurveyAnalytics | null {
  return apiMetrics.surveyAnalytics.aggregatedData.get(surveyId) || null;
}

// Get real-time survey analytics (forces a refresh)
export async function getRealTimeSurveyAnalytics(surveyId: number): Promise<SurveyAnalytics | null> {
  return await aggregateSurveyData(surveyId);
}

// Get survey response rates
export function getSurveyResponseRates() {
  return {
    hourly: { ...apiMetrics.surveyAnalytics.responseRates.hourly },
    daily: { ...apiMetrics.surveyAnalytics.responseRates.daily },
    weekly: { ...apiMetrics.surveyAnalytics.responseRates.weekly }
  };
}

// Get current system health status
export function getSystemHealth() {
  const { cpuUsage, memoryUsage, loadAverage } = apiMetrics.systemLoad;

  // Determine health status based on metrics
  const isCpuHealthy = cpuUsage < 0.8; // CPU usage below 80%
  const isMemoryHealthy = memoryUsage.percentFree > 10; // At least 10% memory free

  const status = isCpuHealthy && isMemoryHealthy ? 'healthy' : 'degraded';

  return {
    status,
    cpuUsage,
    memoryUsage,
    loadAverage,
    timestamp: new Date().toISOString(),
  };
}

// For simplicity in getting stats
export function getPerformanceStats() {
  updateSystemMetrics(); // Update system metrics before returning
  return getPerformanceMetrics();
}