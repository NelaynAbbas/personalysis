import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { SurveyResponse } from '../../shared/schema';
import { Logger } from '../utils/Logger';

const logger = new Logger('TrendAnalysisService');

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  logger.warn('GEMINI_API_KEY not set. Trend analysis will use fallback statistics only.');
}

let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (error) {
    logger.error('Failed to initialize Gemini:', error);
  }
}

// Type definitions
export interface TrendDataPoint {
  date: string;
  count: number;
}

export interface VolumeTrend {
  dataPoints: TrendDataPoint[];
  trend: 'increasing' | 'decreasing' | 'stable';
  growthRate: number;
  peakDate: string;
  peakCount: number;
}

export interface TraitEvolutionData {
  traitName: string;
  dataPoints: Array<{ date: string; score: number }>;
  trend: 'rising' | 'falling' | 'stable';
  changePercent: number;
}

export interface DemographicShiftData {
  demographic: string;
  periods: Array<{
    date: string;
    distribution: Record<string, number>;
  }>;
  significantChanges: Array<{
    category: string;
    change: string;
  }>;
}

export interface QualityMetrics {
  completionRate: Array<{ date: string; rate: number }>;
  avgResponseTime: Array<{ date: string; seconds: number }>;
}

export interface AIInsight {
  title: string;
  description: string;
  type: 'opportunity' | 'warning' | 'neutral';
  confidence: 'high' | 'medium' | 'low';
}

export interface Recommendation {
  action: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

export interface TrendAnalysisResult {
  hasEnoughData: boolean;
  dataPoints: number;
  volumeTrend: VolumeTrend;
  traitEvolution: TraitEvolutionData[];
  demographicShifts: DemographicShiftData[];
  qualityTrends: QualityMetrics;
  insights: AIInsight[];
  recommendations: Recommendation[];
  message?: string;
}

// Helper: Filter responses by timeframe
function filterByTimeframe(
  responses: SurveyResponse[],
  timeframe: '30d' | '90d' | 'all'
): SurveyResponse[] {
  logger.info(`[FILTER_TIMEFRAME] Input: ${responses.length} responses, timeframe=${timeframe}`);

  if (timeframe === 'all') {
    logger.info(`[FILTER_TIMEFRAME] timeframe='all', returning all ${responses.length} responses`);
    return responses;
  }

  const now = new Date();
  const days = timeframe === '30d' ? 30 : 90;
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  logger.info(`[FILTER_TIMEFRAME] Filtering with cutoff date: ${cutoffDate.toISOString()}`);

  const filtered = responses.filter(r => {
    const responseDate = new Date(r.createdAt);
    const isValid = responseDate >= cutoffDate;
    if (!isValid && responses.length <= 5) {
      logger.info(`[FILTER_TIMEFRAME] Response filtered out: ${responseDate.toISOString()} < ${cutoffDate.toISOString()}`);
    }
    return isValid;
  });

  logger.info(`[FILTER_TIMEFRAME] Output: ${filtered.length} responses (filtered out ${responses.length - filtered.length})`);
  return filtered;
}

// Helper: Group responses by date
function groupByDate(responses: SurveyResponse[]): Map<string, SurveyResponse[]> {
  const groups = new Map<string, SurveyResponse[]>();

  responses.forEach(response => {
    const date = new Date(response.createdAt).toISOString().split('T')[0];
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(response);
  });

  return groups;
}

// Helper: Calculate volume trend
function calculateVolumeTrend(responses: SurveyResponse[]): VolumeTrend {
  const grouped = groupByDate(responses);
  const sortedDates = Array.from(grouped.keys()).sort();

  const dataPoints: TrendDataPoint[] = sortedDates.map(date => ({
    date,
    count: grouped.get(date)!.length,
  }));

  // Calculate trend
  const counts = dataPoints.map(p => p.count);
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';

  if (counts.length > 1) {
    const firstHalf = counts.slice(0, Math.ceil(counts.length / 2));
    const secondHalf = counts.slice(Math.ceil(counts.length / 2));
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (avgSecond > avgFirst * 1.1) trend = 'increasing';
    else if (avgSecond < avgFirst * 0.9) trend = 'decreasing';
  }

  // Calculate growth rate
  const growthRate = counts.length > 1
    ? ((counts[counts.length - 1] - counts[0]) / counts[0]) * 100
    : 0;

  // Find peak - handle empty dataPoints
  let peakDate = new Date().toISOString().split('T')[0];
  let peakCount = 0;

  if (dataPoints.length > 0) {
    const peakIdx = counts.indexOf(Math.max(...counts));
    peakDate = dataPoints[peakIdx].date;
    peakCount = dataPoints[peakIdx].count;
  }

  return {
    dataPoints,
    trend,
    growthRate: Math.round(growthRate * 100) / 100,
    peakDate,
    peakCount,
  };
}

// Helper: Calculate trait evolution
function calculateTraitEvolution(responses: SurveyResponse[]): TraitEvolutionData[] {
  const grouped = groupByDate(responses);
  const sortedDates = Array.from(grouped.keys()).sort();

  // Collect all traits
  const traitMap = new Map<string, Map<string, number[]>>();

  grouped.forEach((dayResponses, date) => {
    dayResponses.forEach(response => {
      if (response.traits && Array.isArray(response.traits)) {
        (response.traits as Array<{ name: string; score: number }>).forEach(trait => {
          if (!traitMap.has(trait.name)) {
            traitMap.set(trait.name, new Map());
          }
          if (!traitMap.get(trait.name)!.has(date)) {
            traitMap.get(trait.name)!.set(date, []);
          }
          traitMap.get(trait.name)!.get(date)!.push(trait.score);
        });
      }
    });
  });

  // Calculate averages and trends
  const results: TraitEvolutionData[] = [];

  traitMap.forEach((dateMap, traitName) => {
    const dataPoints = sortedDates
      .filter(date => dateMap.has(date))
      .map(date => {
        const scores = dateMap.get(date)!;
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return { date, score: Math.round(avg * 10) / 10 };
      });

    if (dataPoints.length > 0) {
      // Determine trend
      let trend: 'rising' | 'falling' | 'stable' = 'stable';
      if (dataPoints.length > 1) {
        const firstScore = dataPoints[0].score;
        const lastScore = dataPoints[dataPoints.length - 1].score;

        if (lastScore > firstScore * 1.05) trend = 'rising';
        else if (lastScore < firstScore * 0.95) trend = 'falling';
      }

      // Calculate percent change
      const changePercent = dataPoints.length > 1
        ? ((dataPoints[dataPoints.length - 1].score - dataPoints[0].score) / dataPoints[0].score) * 100
        : 0;

      results.push({
        traitName,
        dataPoints,
        trend,
        changePercent: Math.round(changePercent * 100) / 100,
      });
    }
  });

  // Return top 5 traits
  return results.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 5);
}

// Helper: Calculate demographic shifts
function calculateDemographicShifts(responses: SurveyResponse[]): DemographicShiftData[] {
  const grouped = groupByDate(responses);
  const sortedDates = Array.from(grouped.keys()).sort();

  const demographicMap = new Map<string, Map<string, Record<string, number>>>();

  grouped.forEach((dayResponses, date) => {
    dayResponses.forEach(response => {
      if (response.demographics && typeof response.demographics === 'object') {
        const demData = response.demographics as Record<string, any>;
        Object.entries(demData).forEach(([key, value]) => {
          if (!demographicMap.has(key)) {
            demographicMap.set(key, new Map());
          }
          if (!demographicMap.get(key)!.has(date)) {
            demographicMap.get(key)!.set(date, {});
          }

          const strValue = String(value);
          const dateDistrib = demographicMap.get(key)!.get(date)!;
          dateDistrib[strValue] = (dateDistrib[strValue] || 0) + 1;
        });
      }
    });
  });

  const results: DemographicShiftData[] = [];

  demographicMap.forEach((dateMap, demographic) => {
    const periods = sortedDates
      .filter(date => dateMap.has(date))
      .map(date => ({
        date,
        distribution: dateMap.get(date)!,
      }));

    if (periods.length > 0) {
      // Detect significant changes
      const significantChanges: Array<{ category: string; change: string }> = [];

      if (periods.length > 1) {
        const firstPeriod = periods[0].distribution;
        const lastPeriod = periods[periods.length - 1].distribution;

        Object.keys(firstPeriod).forEach(category => {
          const firstCount = firstPeriod[category] || 0;
          const lastCount = lastPeriod[category] || 0;
          const change = ((lastCount - firstCount) / (firstCount || 1)) * 100;

          if (Math.abs(change) > 20) {
            significantChanges.push({
              category,
              change: change > 0
                ? `+${Math.round(change)}% increase`
                : `${Math.round(change)}% decrease`,
            });
          }
        });
      }

      results.push({
        demographic,
        periods,
        significantChanges,
      });
    }
  });

  return results;
}

// Helper: Calculate quality trends
function calculateQualityTrends(responses: SurveyResponse[]): QualityMetrics {
  const grouped = groupByDate(responses);
  const sortedDates = Array.from(grouped.keys()).sort();

  const completionRate = sortedDates.map(date => {
    const dayResponses = grouped.get(date)!;
    const completed = dayResponses.filter(r => r.completed).length;
    const rate = (completed / dayResponses.length) * 100;
    return {
      date,
      rate: Math.round(rate * 10) / 10,
    };
  });

  const avgResponseTime = sortedDates.map(date => {
    const dayResponses = grouped.get(date)!;
    const times = dayResponses
      .map(r => r.completionTimeSeconds || 0)
      .filter(t => t > 0);

    const avgTime = times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : 0;

    return {
      date,
      seconds: avgTime,
    };
  });

  return { completionRate, avgResponseTime };
}

// Helper: Generate basic statistics fallback
function generateBasicStatistics(responses: SurveyResponse[]): Omit<TrendAnalysisResult, 'hasEnoughData'> {
  return {
    dataPoints: responses.length,
    volumeTrend: calculateVolumeTrend(responses),
    traitEvolution: calculateTraitEvolution(responses),
    demographicShifts: calculateDemographicShifts(responses),
    qualityTrends: calculateQualityTrends(responses),
    insights: [
      {
        title: 'Data Analysis Started',
        description: 'We\'re analyzing your survey responses. More detailed AI insights will be available as you collect more data.',
        type: 'neutral',
        confidence: 'medium',
      },
    ],
    recommendations: [],
  };
}

// Main trend analysis function
export async function analyzeTrends(
  responses: SurveyResponse[],
  timeframe: '30d' | '90d' | 'all',
  context?: { productName?: string; industry?: string }
): Promise<TrendAnalysisResult> {
  try {
    logger.info(`[ANALYZE_TRENDS] Input: ${responses.length} responses, timeframe=${timeframe}`);

    // Check response structure
    if (responses.length > 0) {
      const firstResponse = responses[0] as any;
      logger.info(`[ANALYZE_TRENDS] Sample response keys: ${Object.keys(firstResponse).join(', ')}`);
      logger.info(`[ANALYZE_TRENDS] createdAt value: ${firstResponse.createdAt}, type: ${typeof firstResponse.createdAt}`);
    }

    // Filter by timeframe
    const filteredResponses = filterByTimeframe(responses, timeframe);
    logger.info(`[ANALYZE_TRENDS] After filterByTimeframe: ${filteredResponses.length} responses`);

    // Check if we have enough data
    const hasEnoughData = filteredResponses.length >= 10;
    logger.info(`[ANALYZE_TRENDS] hasEnoughData=${hasEnoughData} (${filteredResponses.length} >= 10)`);

    // Get basic statistics
    const stats = generateBasicStatistics(filteredResponses);
    logger.info(`[ANALYZE_TRENDS] Stats generated: dataPoints=${stats.dataPoints}`);

    // If not enough data, return with basic stats
    if (!hasEnoughData) {
      return {
        hasEnoughData: false,
        ...stats,
        message: `You have ${filteredResponses.length} responses. Collect at least 10 responses to see AI-powered insights.`,
      };
    }

    // Get AI insights if we have Gemini
    let insights: AIInsight[] = [];
    let recommendations: Recommendation[] = [];

    if (genAI && filteredResponses.length >= 10) {
      try {
        insights = await generateAIInsights(filteredResponses, stats, context);
        recommendations = await generateRecommendations(filteredResponses, stats, context);
      } catch (error) {
        logger.warn('Failed to generate AI insights, using fallback:', error);
        insights = stats.insights;
      }
    }

    return {
      hasEnoughData: true,
      ...stats,
      insights,
      recommendations,
    };
  } catch (error) {
    logger.error('Error analyzing trends:', error);
    throw new Error('Failed to analyze trends');
  }
}

// Generate AI insights using Gemini
async function generateAIInsights(
  responses: SurveyResponse[],
  stats: ReturnType<typeof generateBasicStatistics>,
  context?: { productName?: string; industry?: string }
): Promise<AIInsight[]> {
  if (!genAI) return stats.insights;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Prepare prompt data
    const volumeText = `Volume trend: ${stats.volumeTrend.trend}, Growth: ${stats.volumeTrend.growthRate}%, Peak: ${stats.volumeTrend.peakCount} on ${stats.volumeTrend.peakDate}`;
    const traitsText = stats.traitEvolution
      .slice(0, 3)
      .map(t => `${t.traitName}: ${t.trend} (${t.changePercent}%)`)
      .join(', ');
    const demographicsText = stats.demographicShifts
      .slice(0, 2)
      .map(d => `${d.demographic}: ${d.significantChanges.length} changes`)
      .join(', ');

    const prompt = `You are a data analyst expert. Analyze these survey trends and identify 3-4 key insights.

SURVEY DATA:
- Total Responses: ${responses.length}
- Product: ${context?.productName || 'Unknown'}
- Industry: ${context?.industry || 'Unknown'}

TRENDS:
- ${volumeText}
- Top Traits: ${traitsText || 'No significant trait changes'}
- Demographics: ${demographicsText || 'No major shifts'}

Provide insights in JSON format:
{
  "insights": [
    {
      "title": "Brief title",
      "description": "1-2 sentence explanation",
      "type": "opportunity|warning|neutral",
      "confidence": "high|medium|low"
    }
  ]
}

Focus on actionable, statistically significant patterns only.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.insights || stats.insights;
    }

    return stats.insights;
  } catch (error) {
    logger.warn('Failed to generate AI insights:', error);
    return stats.insights;
  }
}

// Generate recommendations using Gemini
async function generateRecommendations(
  responses: SurveyResponse[],
  stats: ReturnType<typeof generateBasicStatistics>,
  context?: { productName?: string; industry?: string }
): Promise<Recommendation[]> {
  if (!genAI) return [];

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Prepare prompt data
    const topTrait = stats.traitEvolution[0];
    const prompt = `Based on these survey trends, provide 2-3 actionable recommendations.

CONTEXT:
- Product: ${context?.productName || 'Unknown'}
- Industry: ${context?.industry || 'Unknown'}
- Response Trend: ${stats.volumeTrend.trend}
- Key Trait: ${topTrait?.traitName} (${topTrait?.trend})

Return JSON format:
{
  "recommendations": [
    {
      "action": "Specific action to take",
      "rationale": "Why this matters",
      "priority": "high|medium|low"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.recommendations || [];
    }

    return [];
  } catch (error) {
    logger.warn('Failed to generate recommendations:', error);
    return [];
  }
}
