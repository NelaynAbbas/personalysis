import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DemographicShift {
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

interface DemographicShiftsCardProps {
  data: Array<DemographicShift>;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const DemographicShiftsCard: React.FC<DemographicShiftsCardProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Demographic Shifts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">No demographic data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demographic Shifts</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Changes in audience demographics over time
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.map((demographic, demIndex) => (
          <div key={demographic.demographic} className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">{demographic.demographic}</h4>
              <Badge variant="secondary">{demographic.periods.length} periods</Badge>
            </div>

            {/* Latest distribution pie chart */}
            {demographic.periods.length > 0 && (
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={Object.entries(demographic.periods[demographic.periods.length - 1].distribution).map(
                        ([name, value]) => ({
                          name,
                          value,
                        })
                      )}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(demographic.periods[demographic.periods.length - 1].distribution).map(
                        (_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        )
                      )}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Significant changes */}
            {demographic.significantChanges.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">Notable Changes:</p>
                <div className="space-y-1">
                  {demographic.significantChanges.map((change, changeIndex) => (
                    <div key={changeIndex} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <span>
                        <strong>{change.category}:</strong> {change.change}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DemographicShiftsCard;
