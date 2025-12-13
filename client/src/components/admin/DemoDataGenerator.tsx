import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api } from '@/lib/api';


const DemoDataGenerator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetType, setResetType] = useState<'dashboard' | 'all' | null>(null);
  const { toast } = useToast();

  const handleGenerateSingleResponse = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/generate-single-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Generated a demo survey response successfully',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to generate demo data',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error generating demo data:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });

      toast({
        title: 'Error',
        description: 'Failed to connect to the server',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnhanceDemoAccount = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test/enhance-demo-account', {
        method: 'GET'
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Demo data generation started in the background',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to initiate demo data generation',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error enhancing demo account:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });

      toast({
        title: 'Error',
        description: 'Failed to connect to the server',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetData = async (type: 'dashboard' | 'all') => {
    setIsLoading(true);
    setResult(null);
    setShowResetConfirm(false);

    try {
      const response = await fetch(`/api/admin/reset-data?type=${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast({
          title: 'Success',
          description: `Demo data has been reset (${type === 'all' ? 'Complete reset' : 'Dashboard data only'})`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to reset demo data',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error resetting demo data:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });

      toast({
        title: 'Error',
        description: 'Failed to connect to the server',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openResetConfirm = (type: 'dashboard' | 'all') => {
    setResetType(type);
    setShowResetConfirm(true);
  };

  const handleGenerateData = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/admin/generate-demo-data');
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Demo data generation started successfully",
        });
      } else {
        throw new Error(response.data.message || 'Failed to generate demo data');
      }
    } catch (error) {
      console.error('Error generating demo data:', error);
      toast({
        title: "Error",
        description: "Failed to generate demo data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Demo Data Generator</CardTitle>
        <CardDescription>
          Generate demo data for testing purposes. Use these tools carefully to avoid database overload.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            <div className="flex items-center gap-2">
              {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
            </div>
            <AlertDescription className="mt-2">
              {result.message}
              {result.data && (
                <div className="mt-2 text-sm">
                  <p>Surveys: {result.data.surveys}</p>
                  <p>Responses: {result.data.responses}</p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-medium mb-2">Generate Single Response</h3>
            <p className="text-sm text-gray-500 mb-4">
              Generates a single survey response. This is the safest option that won't overload the server.
            </p>
            <Button
              onClick={handleGenerateSingleResponse}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate Single Response
            </Button>
          </div>

          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-medium mb-2">Generate Demo Data</h3>
            <p className="text-sm text-gray-500 mb-4">
              Generates a batch of demo data.  Use sparingly to avoid server overload.
            </p>
            <Button
              onClick={handleGenerateData}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate Demo Data
            </Button>
          </div>
        </div>

        <div className="p-4 border rounded-md">
            <h3 className="text-lg font-medium mb-2">Enhance Demo Account</h3>
            <p className="text-sm text-gray-500 mb-4">
              Generates a small batch of data in the background. Use sparingly to avoid server timeouts.
            </p>
            <Button
              onClick={handleEnhanceDemoAccount}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enhance Demo Account
            </Button>
          </div>


        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-medium mb-2">Reset Demo Data</h3>
          <p className="text-sm text-gray-500 mb-4">
            These options will reset various parts of the demo data. Use with caution as these actions cannot be undone.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => openResetConfirm('dashboard')}
              disabled={isLoading}
              variant="outline"
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset Dashboard Data
            </Button>

            <Button
              onClick={() => openResetConfirm('all')}
              disabled={isLoading}
              variant="destructive"
              className="flex items-center"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Reset ALL Demo Data
            </Button>
          </div>
        </div>

        <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {resetType === 'all'
                  ? 'This will permanently delete ALL demo data and reset the system to its initial state. This action cannot be undone.'
                  : 'This will reset only the dashboard analytics data while preserving user accounts and configurations. This action cannot be undone.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => resetType && handleResetData(resetType)}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> : null}
                Yes, Reset Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
      <CardFooter className="flex flex-col items-start">
        <div className="text-xs text-gray-500">
          <p className="mb-1">
            <strong>Note:</strong> Generating large amounts of demo data can put significant load on the server.
          </p>
          <p>
            Use these tools sparingly and allow time between operations for the server to process each request.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default DemoDataGenerator;