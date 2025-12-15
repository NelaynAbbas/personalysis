import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface QualityTrendsData {
  completionRate: Array<{ date: string; rate: number }>;
  avgResponseTime: Array<{ date: string; seconds: number }>;
}

interface QualityTrendsCardProps {
  data: QualityTrendsData;
}

const QualityTrendsCard: React.FC<QualityTrendsCardProps> = ({ data }) => {
  // Merge completion rate and response time data
  const mergedData = data.completionRate.map((item, index) => ({
    date: item.date,
    completionRate: item.rate,
    avgResponseTime: data.avgResponseTime[index]?.seconds || 0,
  }));

  // Calculate averages
  const avgCompletionRate =
    data.completionRate.length > 0
      ? (data.completionRate.reduce((sum, item) => sum + item.rate, 0) / data.completionRate.length) * 100
      : 0;

  const avgResponseTime =
    data.avgResponseTime.length > 0
      ? data.avgResponseTime.reduce((sum, item) => sum + item.seconds, 0) / data.avgResponseTime.length
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Quality Trends</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Survey completion rates and average response times
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Avg Completion Rate</p>
            <p className="text-2xl font-semibold">{avgCompletionRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Avg Response Time</p>
            <p className="text-2xl font-semibold">{Math.round(avgResponseTime)}s</p>
          </div>
        </div>

        {/* Dual-axis chart */}
        {mergedData.length > 0 && (
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mergedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Completion Rate (%)', angle: -90, position: 'insideLeft' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Response Time (seconds)', angle: 90, position: 'insideRight' }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'completionRate') {
                      return [`${(value as number * 100).toFixed(1)}%`, 'Completion Rate'];
                    } else if (name === 'avgResponseTime') {
                      return [`${Math.round(value as number)}s`, 'Response Time'];
                    }
                    return [value, name];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="completionRate"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  name="Completion Rate"
                  formatter={(value) => `${(value as number * 100).toFixed(1)}%`}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgResponseTime"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 4 }}
                  name="Response Time (seconds)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QualityTrendsCard;
