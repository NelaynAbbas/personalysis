import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ChevronRight, Coffee, Brain, Briefcase, ShoppingBag } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';

interface AIInsightsProps {
  sessionId: number;
}

export function AIInsights({ sessionId }: AIInsightsProps) {
  const [insights, setInsights] = useState<{
    personalityInsight: string;
    productRecommendations: string;
    careerInsights: string;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiRequest<{
        success: boolean;
        message?: string;
        personalityInsight?: string;
        productRecommendations?: string;
        careerInsights?: string;
      }>(`/api/survey/ai-insights/${sessionId}`);
      
      if (data && data.success) {
        setInsights({
          personalityInsight: data.personalityInsight || 'No personality insight available.',
          productRecommendations: data.productRecommendations || 'No product recommendations available.',
          careerInsights: data.careerInsights || 'No career insights available.'
        });
      } else {
        setError((data && data.message) || 'Failed to generate AI insights');
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setError('Failed to connect to the AI analysis service. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Render markdown content
  const renderMarkdown = (content: string) => {
    // This is a simple markdown renderer for basic formatting
    // For a production app, use a library like react-markdown
    return (
      <div 
        className="prose prose-sm max-w-none dark:prose-invert" 
        dangerouslySetInnerHTML={{ 
          __html: content
            .replace(/# (.*)/g, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
            .replace(/## (.*)/g, '<h2 class="text-xl font-semibold mt-3 mb-2">$1</h2>')
            .replace(/### (.*)/g, '<h3 class="text-lg font-medium mt-3 mb-1">$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/- (.*)/g, '<li>$1</li>')
            .replace(/<li>(.*)<\/li>/g, '<ul class="list-disc ml-6 my-2"><li>$1</li></ul>')
            .replace(/\n\n/g, '<p class="my-2"></p>')
        }} 
      />
    );
  };

  return (
    <Card className="mt-6 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Brain className="h-5 w-5" /> 
              AI-Powered Personality Analysis
            </CardTitle>
            <CardDescription className="text-slate-100 mt-1">
              Get deep insights into your personality using advanced AI
            </CardDescription>
          </div>
          {!insights && !loading && (
            <Button onClick={fetchInsights} variant="secondary" className="px-4 py-2">
              Generate Insights
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading && (
          <div className="p-6 space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <div className="mt-6">
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          </div>
        )}

        {error && (
          <div className="p-6 flex items-start gap-3 text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-300 rounded-md m-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium">AI Analysis Unavailable</h4>
              <p className="text-sm mt-1">{error}</p>
              <Button 
                variant="outline" 
                onClick={fetchInsights} 
                className="mt-3 text-sm"
                size="sm"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {insights && (
          <Tabs defaultValue="personality" className="p-0">
            <div className="border-b px-6 pt-2">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger value="personality" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-900 dark:data-[state=active]:bg-indigo-950 dark:data-[state=active]:text-indigo-300">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    <span className="hidden sm:inline">Personality</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="career" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-900 dark:data-[state=active]:bg-indigo-950 dark:data-[state=active]:text-indigo-300">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span className="hidden sm:inline">Career</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="products" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-900 dark:data-[state=active]:bg-indigo-950 dark:data-[state=active]:text-indigo-300">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    <span className="hidden sm:inline">Products</span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="personality" className="p-6 focus-visible:outline-none focus-visible:ring-0">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1">
                  <Coffee className="h-3 w-3" />
                  AI Generated
                </Badge>
                <span className="text-sm text-muted-foreground">Powered by Google Gemini</span>
              </div>

              {renderMarkdown(insights.personalityInsight)}
            </TabsContent>

            <TabsContent value="career" className="p-6 focus-visible:outline-none focus-visible:ring-0">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1">
                  <Coffee className="h-3 w-3" />
                  AI Generated
                </Badge>
                <span className="text-sm text-muted-foreground">Powered by Google Gemini</span>
              </div>

              {renderMarkdown(insights.careerInsights)}
            </TabsContent>

            <TabsContent value="products" className="p-6 focus-visible:outline-none focus-visible:ring-0">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1">
                  <Coffee className="h-3 w-3" />
                  AI Generated
                </Badge>
                <span className="text-sm text-muted-foreground">Powered by Google Gemini</span>
              </div>

              {renderMarkdown(insights.productRecommendations)}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}