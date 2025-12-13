import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  Trash2,
  Filter,
  Code,
  X,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  useSystemErrors, 
  useClearSystemErrors, 
  useGenerateTestError,
  SystemErrorLog
} from "@/lib/useSystemErrors";

/**
 * Component for displaying and managing system error logs
 */
const ErrorLogViewer = () => {
  // State for managing filters
  const [activeTab, setActiveTab] = useState<string>("all");
  const [expandedErrors, setExpandedErrors] = useState<string[]>([]);
  const [countFilter, setCountFilter] = useState<number>(10);
  const [sourceFilter, setSourceFilter] = useState<string | undefined>(undefined);
  
  // Derive level filter from active tab
  const levelFilter = activeTab !== "all" ? activeTab as "error" | "warning" | "info" : undefined;
  
  // Fetch error logs with current filters
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useSystemErrors({
    count: countFilter,
    level: levelFilter,
    source: sourceFilter
  });
  
  // Mutation for clearing error logs
  const { 
    mutate: clearErrors, 
    isPending: isClearing 
  } = useClearSystemErrors();
  
  // Mutation for generating test errors
  const { 
    mutate: generateTestError, 
    isPending: isGeneratingError 
  } = useGenerateTestError();
  
  // Handle refreshing error logs
  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Error logs refreshed",
        description: "The latest error logs have been loaded",
      });
    } catch (err) {
      toast({
        title: "Refresh failed",
        description: "Could not refresh error logs",
        variant: "destructive",
      });
    }
  };
  
  // Handle clearing error logs
  const handleClearLogs = async () => {
    if (window.confirm("Are you sure you want to clear all error logs? This action cannot be undone.")) {
      try {
        await clearErrors();
        toast({
          title: "Error logs cleared",
          description: "All error logs have been cleared successfully",
        });
      } catch (err) {
        toast({
          title: "Clear failed",
          description: "Could not clear error logs",
          variant: "destructive",
        });
      }
    }
  };
  
  // Handle generating a test error
  const handleGenerateTestError = async (type: 'runtime' | 'api' | 'warning' | 'generic') => {
    try {
      await generateTestError(type);
      toast({
        title: "Test error generated",
        description: `A test ${type} error has been logged`,
      });
    } catch (err) {
      toast({
        title: "Error generation failed",
        description: "Could not generate test error",
        variant: "destructive",
      });
    }
  };
  
  // Toggle expanded state of an error log
  const toggleErrorExpanded = (timestamp: string) => {
    if (expandedErrors.includes(timestamp)) {
      setExpandedErrors(expandedErrors.filter(t => t !== timestamp));
    } else {
      setExpandedErrors([...expandedErrors, timestamp]);
    }
  };
  
  // Clear source filter
  const clearSourceFilter = () => {
    setSourceFilter(undefined);
  };
  
  // Set source filter from an error
  const filterBySource = (source: string) => {
    setSourceFilter(source);
  };
  
  // Get icon for error level
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertOctagon className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };
  
  // Display an error if the fetch failed
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">System Error Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 p-6 rounded-md text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
            <h3 className="text-lg font-medium mb-1">Failed to load error logs</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "An unknown error occurred"}
            </p>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-medium">System Error Logs</CardTitle>
          <CardDescription>
            View and manage system-generated error logs
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearLogs}
            disabled={isClearing || !data?.errors?.length}
            className="text-red-500"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear Logs
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Controls section */}
          <div className="flex flex-col sm:flex-row justify-between gap-2 bg-gray-50 p-2 rounded-md">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid grid-cols-4 w-full sm:w-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="error" className="text-red-500">
                  Errors
                </TabsTrigger>
                <TabsTrigger value="warning" className="text-amber-500">
                  Warnings
                </TabsTrigger>
                <TabsTrigger value="info" className="text-blue-500">
                  Info
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex flex-wrap gap-2 items-center">
              {sourceFilter && (
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-1"
                >
                  <Filter className="h-3 w-3" />
                  Source: {sourceFilter}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={clearSourceFilter}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              <Select 
                value={countFilter.toString()}
                onValueChange={(val) => setCountFilter(parseInt(val))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Last 5</SelectItem>
                  <SelectItem value="10">Last 10</SelectItem>
                  <SelectItem value="25">Last 25</SelectItem>
                  <SelectItem value="50">Last 50</SelectItem>
                  <SelectItem value="100">Last 100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Error Logs List */}
          <div className="space-y-2 overflow-auto max-h-[500px]">
            {isLoading ? (
              // Loading state
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : data?.errors && data.errors.length > 0 ? (
              // Error logs list
              <>
                {data.errors.map((log: SystemErrorLog) => {
                  const isExpanded = expandedErrors.includes(log.timestamp);
                  return (
                    <div
                      key={log.timestamp}
                      className="border rounded-md overflow-hidden"
                    >
                      <div 
                        className="flex items-center justify-between p-3 cursor-pointer bg-gray-50 hover:bg-gray-100"
                        onClick={() => toggleErrorExpanded(log.timestamp)}
                      >
                        <div className="flex items-center space-x-2">
                          {getLevelIcon(log.level)}
                          <span className="font-medium">{log.message}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge 
                            variant="outline"
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              filterBySource(log.source);
                            }}
                          >
                            {log.source}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDate(log.timestamp)}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="p-3 bg-gray-50 border-t">
                          {log.stack && (
                            <div className="mb-3">
                              <div className="flex items-center text-xs font-semibold text-gray-500 mb-1">
                                <Code className="h-3 w-3 mr-1" />
                                Stack Trace
                              </div>
                              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-[200px]">
                                {log.stack}
                              </pre>
                            </div>
                          )}
                          
                          {log.context && (
                            <div>
                              <div className="flex items-center text-xs font-semibold text-gray-500 mb-1">
                                <Info className="h-3 w-3 mr-1" />
                                Context
                              </div>
                              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-[200px]">
                                {JSON.stringify(log.context, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ) : (
              // No error logs
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-green-50 rounded-full p-3 mb-3">
                  <Info className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-base font-medium mb-1">No error logs found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {sourceFilter 
                    ? `No logs found for source "${sourceFilter}". Try a different filter.` 
                    : "The system is running smoothly with no recorded errors."}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleGenerateTestError('generic')}
                    disabled={isGeneratingError}
                  >
                    Generate Test Error
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleGenerateTestError('warning')}
                    disabled={isGeneratingError}
                  >
                    Generate Warning
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Debug controls - only shown when there are logs */}
          {data?.errors && data.errors.length > 0 && (
            <div className="border-t pt-3 mt-3">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Test Error Generation
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGenerateTestError('generic')}
                  disabled={isGeneratingError}
                >
                  <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
                  Generic Error
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGenerateTestError('runtime')}
                  disabled={isGeneratingError}
                >
                  <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
                  Runtime Error
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGenerateTestError('api')}
                  disabled={isGeneratingError}
                >
                  <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
                  API Error
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGenerateTestError('warning')}
                  disabled={isGeneratingError}
                >
                  <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                  Warning
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorLogViewer;