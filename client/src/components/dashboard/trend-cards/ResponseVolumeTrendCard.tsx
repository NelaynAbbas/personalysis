import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface VolumeTrendData {
  dataPoints: Array<{ date: string; count: number }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  growthRate: number;
  peakDate: string;
  peakCount: number;
}

interface ResponseVolumeTrendCardProps {
  data: VolumeTrendData;
}

const ResponseVolumeTrendCard: React.FC<ResponseVolumeTrendCardProps> = ({ data }) => {
  const getTrendIcon = () => {
    switch (data.trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (data.trend) {
      case 'increasing':
        return 'bg-green-50 border-green-200';
      case 'decreasing':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTrendBadgeVariant = () => {
    switch (data.trend) {
      case 'increasing':
        return 'default';
      case 'decreasing':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className={getTrendColor()}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Response Volume Trend</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Survey response submissions over time
            </p>
          </div>
          <Badge variant={getTrendBadgeVariant()} className="gap-1">
            {getTrendIcon()}
            {data.trend.charAt(0).toUpperCase() + data.trend.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Growth Rate</p>
            <p className="text-lg font-semibold">{data.growthRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Peak Date</p>
            <p className="text-lg font-semibold">{data.peakDate}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Peak Count</p>
            <p className="text-lg font-semibold">{data.peakCount}</p>
          </div>
        </div>

        {/* Chart */}
        {data.dataPoints.length > 0 && (
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.dataPoints}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `${value} responses`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  name="Responses"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResponseVolumeTrendCard;
