import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, AlertCircle, Info, CheckCircle, TrendingUp } from 'lucide-react';

interface Insight {
  title: string;
  description: string;
  type: 'opportunity' | 'warning' | 'neutral';
  confidence: 'high' | 'medium' | 'low';
}

interface Recommendation {
  action: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

interface AIInsightsCardProps {
  insights: Array<Insight>;
  recommendations: Array<Recommendation>;
}

const getInsightIcon = (type: string) => {
  switch (type) {
    case 'opportunity':
      return <TrendingUp className="h-5 w-5 text-green-600" />;
    case 'warning':
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Info className="h-5 w-5 text-blue-600" />;
  }
};

const getInsightColor = (type: string) => {
  switch (type) {
    case 'opportunity':
      return 'bg-green-50 border-green-200';
    case 'warning':
      return 'bg-red-50 border-red-200';
    default:
      return 'bg-blue-50 border-blue-200';
  }
};

const getConfidenceBadgeVariant = (confidence: string) => {
  switch (confidence) {
    case 'high':
      return 'default';
    case 'medium':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-50 border-red-200';
    case 'medium':
      return 'bg-yellow-50 border-yellow-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

const getPriorityBadgeVariant = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    default:
      return 'outline';
  }
};

const AIInsightsCard: React.FC<AIInsightsCardProps> = ({ insights, recommendations }) => {
  return (
    <div className="space-y-6">
      {/* AI Insights */}
      {insights && insights.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              <CardTitle>AI Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`border p-4 rounded-lg ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm">{insight.title}</h4>
                        <Badge
                          variant={getConfidenceBadgeVariant(insight.confidence)}
                          className="text-xs"
                        >
                          {insight.confidence} confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <CardTitle>Recommended Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`border p-4 rounded-lg ${getPriorityColor(rec.priority)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{rec.action}</h4>
                        <Badge
                          variant={getPriorityBadgeVariant(rec.priority)}
                          className="text-xs"
                        >
                          {rec.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">
                        {rec.rationale}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {(!insights || insights.length === 0) && (!recommendations || recommendations.length === 0) && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500 text-sm">
              No insights or recommendations available yet
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIInsightsCard;
