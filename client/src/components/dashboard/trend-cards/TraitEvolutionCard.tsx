import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TraitData {
  traitName: string;
  dataPoints: Array<{ date: string; score: number }>;
  trend: 'rising' | 'falling' | 'stable';
  changePercent: number;
}

interface TraitEvolutionCardProps {
  data: Array<TraitData>;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const TraitEvolutionCard: React.FC<TraitEvolutionCardProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trait Evolution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">No trait data available</p>
        </CardContent>
      </Card>
    );
  }

  // Merge all trait data points by date for the chart
  const mergedData = data.reduce<Record<string, any>>((acc, trait) => {
    trait.dataPoints.forEach(point => {
      if (!acc[point.date]) {
        acc[point.date] = { date: point.date };
      }
      acc[point.date][trait.traitName] = point.score;
    });
    return acc;
  }, {});

  const chartData = Object.values(mergedData).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trait Evolution</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          How personality traits change over time
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trait list with badges */}
        <div className="flex flex-wrap gap-2">
          {data.map((trait, index) => (
            <Badge
              key={trait.traitName}
              variant="outline"
              className="gap-2"
              style={{
                borderColor: COLORS[index % COLORS.length],
                color: COLORS[index % COLORS.length],
              }}
            >
              {trait.traitName}
              <span
                className={`font-semibold ${
                  trait.trend === 'rising'
                    ? 'text-green-600'
                    : trait.trend === 'falling'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {trait.changePercent > 0 ? '+' : ''}{trait.changePercent.toFixed(1)}%
              </span>
            </Badge>
          ))}
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => value.toFixed(2)} />
                <Legend />
                {data.map((trait, index) => (
                  <Line
                    key={trait.traitName}
                    type="monotone"
                    dataKey={trait.traitName}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ fill: COLORS[index % COLORS.length], r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TraitEvolutionCard;
