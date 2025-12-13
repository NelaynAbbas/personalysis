import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DashboardView from "@/components/dashboard/DashboardView";
import BusinessIntelligence from "@/components/dashboard/BusinessIntelligenceFix";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle, BarChart3 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SharedReport() {
  const [match, params] = useRoute("/shared-report/:token");
  const token = params?.token;

  const { data, isLoading, error } = useQuery({
    queryKey: ['sharedReport', token],
    queryFn: async () => {
      if (!token) throw new Error('Token is required');
      const response = await fetch(`/api/reports/shared/${token}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load shared report');
      }
      return response.json();
    },
    enabled: !!token,
    retry: false
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-gray-600">Loading shared report...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Report</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : 'Failed to load the shared report. The link may be invalid or expired.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || !data.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Report Not Found</AlertTitle>
              <AlertDescription>
                The shared report could not be found. Please check the link and try again.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const reportData = data.data;
  const analyticsData = reportData.analytics;
  const surveyId = reportData.surveyId === 'all' ? 'all' : reportData.surveyId.toString();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-primary" />
              {reportData.companyName} - Analytics Report
            </CardTitle>
            <CardDescription>
              Shared Analytics Report
              {reportData.surveyId !== 'all' && ` - Survey ID: ${reportData.surveyId}`}
              {reportData.expiresAt && (
                <span className="ml-2 text-xs text-gray-500">
                  (Expires: {new Date(reportData.expiresAt).toLocaleDateString()})
                </span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="analytics">Basic Analytics</TabsTrigger>
            <TabsTrigger value="business">Business Intelligence</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <DashboardView 
              stats={analyticsData} 
              surveyId={surveyId}
            />
          </TabsContent>

          <TabsContent value="business" className="space-y-6">
            <BusinessIntelligence 
              surveyId={surveyId}
              companyId={reportData.companyId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

