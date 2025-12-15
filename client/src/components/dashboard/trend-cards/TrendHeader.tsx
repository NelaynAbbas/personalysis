import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';

interface TrendHeaderProps {
  timeframe: '30d' | '90d' | 'all';
  onTimeframeChange: (timeframe: '30d' | '90d' | 'all') => void;
}

const TrendHeader: React.FC<TrendHeaderProps> = ({ timeframe, onTimeframeChange }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Trend Analysis</CardTitle>
          </div>

          {/* Timeframe selector */}
          <div className="flex gap-2">
            {(['30d', '90d', 'all'] as const).map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? 'default' : 'outline'}
                size="sm"
                onClick={() => onTimeframeChange(tf)}
                className="text-xs"
              >
                {tf === '30d' ? 'Last 30 Days' : tf === '90d' ? 'Last 90 Days' : 'All Time'}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Analyze survey response trends and discover patterns in your data over time.
        </p>
      </CardContent>
    </Card>
  );
};

export default TrendHeader;
