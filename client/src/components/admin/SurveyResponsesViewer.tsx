import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  CustomPagination,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, DownloadIcon, FilterIcon, ChevronDownIcon, ChevronUpIcon, SearchIcon, XIcon } from 'lucide-react';
import { format } from 'date-fns';

interface SurveyResponse {
  id: number;
  surveyId: number;
  surveyTitle: string;
  companyId: number;
  clientName: string;
  respondentId: string;
  respondentEmail?: string;
  anonymousId: string;
  submissionDate: string;
  completionTime: string;
  completed: boolean;
  status: string;
  responses: any;
  demographics?: any;
  traits?: any;
  createdAt: string;
  updatedAt: string;
  questions?: {
    id: number;
    text: string;
    type: string;
    order: number;
    options?: any;
    sliderConfig?: any;
    scenarioText?: string;
    answer: any;
    scale?: {
      min: number;
      max: number;
      minLabel?: string;
      maxLabel?: string;
    };
  }[];
}

interface SurveyResponsesViewerProps {
  clientId?: number;
  surveyId?: number;
  isAdminView?: boolean;
}

export function SurveyResponsesViewer({ clientId, surveyId, isAdminView = false }: SurveyResponsesViewerProps) {
  const [page, setPage] = useState(1);
  const [selectedResponseId, setSelectedResponseId] = useState<number | null>(null);
  const [filterSurveyId, setFilterSurveyId] = useState<number | undefined>(surveyId);
  const [filterClientId, setFilterClientId] = useState<number | undefined>(clientId);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Build API endpoint based on props and filters
  const getEndpoint = () => {
    if (surveyId) {
      return `/api/survey-responses?surveyId=${surveyId}&page=${page}`;
    } else if (clientId) {
      return `/api/survey-responses?companyId=${clientId}&page=${page}`;
    } else {
      let endpoint = `/api/survey-responses?page=${page}`;

      if (filterSurveyId) {
        endpoint += `&surveyId=${filterSurveyId}`;
      }

      if (filterClientId) {
        endpoint += `&companyId=${filterClientId}`;
      }

      if (startDate) {
        endpoint += `&startDate=${startDate}`;
      }

      if (endDate) {
        endpoint += `&endDate=${endDate}`;
      }

      return endpoint;
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterSurveyId, filterClientId, startDate, endDate]);

  // Fetch survey responses
  const {
    data: responsesData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['survey-responses', page, filterSurveyId, filterClientId, startDate, endDate],
    queryFn: () => fetch(getEndpoint()).then(res => {
      if (!res.ok) throw new Error('Failed to fetch survey responses');
      return res.json();
    }),
    placeholderData: (previousData) => previousData
  });

  // Fetch single response for detailed view
  const {
    data: singleResponseData,
    isLoading: isLoadingSingleResponse
  } = useQuery({
    queryKey: ['survey-response', selectedResponseId],
    queryFn: () => {
      if (!selectedResponseId) return null;
      return fetch(`/api/survey-responses/${selectedResponseId}`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch survey response');
        return res.json();
      });
    },
    enabled: !!selectedResponseId
  });

  // Fetch surveys for filter dropdown (admin sees all, others see company-specific)
  const { data: surveysData } = useQuery({
    queryKey: [isAdminView ? 'admin-surveys' : 'surveys'],
    queryFn: () => fetch(isAdminView ? '/api/admin/surveys' : '/api/surveys').then(res => {
      if (!res.ok) throw new Error('Failed to fetch surveys');
      return res.json();
    })
  });

  // Fetch clients for filter dropdown
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => fetch('/api/clients').then(res => {
      if (!res.ok) throw new Error('Failed to fetch clients');
      return res.json();
    })
  });

  // Function to handle CSV export
  const handleExportCSV = () => {
    let exportUrl = '/api/survey-responses/export/csv';

    if (filterSurveyId) {
      exportUrl += `?surveyId=${filterSurveyId}`;
    }

    if (filterClientId) {
      exportUrl += `${exportUrl.includes('?') ? '&' : '?'}clientId=${filterClientId}`;
    }

    window.open(exportUrl, '_blank');
  };

  // Helper function to find option text by ID
  const getOptionText = (optionId: string, options: any[]) => {
    const option = options?.find(opt => opt.id === optionId || opt.value === optionId);
    return option?.text || optionId;
  };

  // Render answer based on question type
  const renderAnswer = (question: NonNullable<SurveyResponse['questions']>[0]) => {
    // Handle case where answer might be an object or complex string
    let answerValue = question.answer;

    if (typeof question.answer === 'object' && question.answer !== null) {
      // If it's an object with an 'answer' property, use that
      if ('answer' in question.answer) {
        answerValue = question.answer.answer;
      } else {
        // Otherwise, stringify the object
        answerValue = JSON.stringify(question.answer);
      }
    }

    switch (question.type) {
      case 'text':
        return (
          <div className="p-3 bg-gray-50 rounded-md border">
            <p className="text-sm">{answerValue}</p>
          </div>
        );

      case 'multiple-choice':
      case 'single-select':
        return (
          <div className="space-y-2">
            {question.options?.map((option: any) => {
              const isSelected = option.id === answerValue || option.value === answerValue;
              return (
                <div
                  key={option.id}
                  className={`p-2 rounded-md border flex items-center gap-2 ${isSelected
                      ? 'bg-green-50 border-green-300 text-green-800'
                      : 'bg-gray-50 border-gray-200'
                    }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-green-500 bg-green-500' : 'border-gray-300'
                    }`}>
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <span className="text-sm">{option.text}</span>
                  {isSelected && <Badge variant="secondary" className="ml-auto">Selected</Badge>}
                </div>
              );
            })}
          </div>
        );

      case 'slider':
        // The value is always a percentage from 0-100, regardless of labels
        const currentValue = Number(answerValue);

        // Clamp the value between 0-100 for valid percentage
        const clampedValue = Math.max(0, Math.min(100, currentValue));
        const displayPercentage = clampedValue;

        // Debug logging
        console.log('Slider debug:', {
          questionId: question.id,
          answerValue,
          currentValue,
          clampedValue,
          displayPercentage,
          scale: question.scale
        });

        return (
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-gray-600">
              <span>{question.scale?.minLabel || '0'}</span>
              <span>{question.scale?.maxLabel || '100'}</span>
            </div>
            <div className="relative px-2">
              <div className="w-full bg-gray-200 rounded-full h-3 relative">
                {/* Background bar */}
                <div className="absolute inset-0 bg-gray-200 rounded-full"></div>

                {/* Selected value indicator positioned at correct percentage */}
                <div
                  className="absolute top-1/2 transform -translate-y-1/2 w-6 h-6 bg-red-600 rounded-full border-3 border-white shadow-lg z-10"
                  style={{
                    left: `${displayPercentage}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  title={`Value: ${answerValue}%`}
                ></div>
              </div>
              <div className="text-center font-medium mt-2 text-blue-600">
                {answerValue}%
                {currentValue !== clampedValue && (
                  <span className="text-xs text-orange-600 ml-1">
                    (clamped from {currentValue}%)
                  </span>
                )}
              </div>
            </div>
          </div>
        );

      case 'ranking':
        // Handle ranking questions specially
        if (typeof answerValue === 'string' && answerValue.startsWith('[')) {
          try {
            const parsed = JSON.parse(answerValue);
            if (Array.isArray(parsed)) {
              return (
                <div className="space-y-2">
                  {parsed
                    .sort((a, b) => a.rank - b.rank)
                    .map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md border">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          #{item.rank}
                        </Badge>
                        <span className="text-sm">{item.option}</span>
                      </div>
                    ))}
                </div>
              );
            }
          } catch (e) {
            // Fall through to default
          }
        }
        return <Badge>{answerValue}</Badge>;

      case 'scenario':
        return (
          <div className="space-y-3">
            {question.scenarioText && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800 font-medium">Scenario:</p>
                <p className="text-sm text-blue-700 mt-1">{question.scenarioText}</p>
              </div>
            )}
            <div className="space-y-2">
              {question.options?.map((option: any) => {
                const isSelected = option.id === answerValue || option.value === answerValue;
                return (
                  <div
                    key={option.id}
                    className={`p-2 rounded-md border flex items-center gap-2 ${isSelected
                        ? 'bg-green-50 border-green-300 text-green-800'
                        : 'bg-gray-50 border-gray-200'
                      }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-green-500 bg-green-500' : 'border-gray-300'
                      }`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className="text-sm">{option.text}</span>
                    {isSelected && <Badge variant="secondary" className="ml-auto">Selected</Badge>}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'mood-board':
        return (
          <div className="space-y-2">
            {question.options?.map((option: any) => {
              const isSelected = option.id === answerValue || option.value === answerValue;
              return (
                <div
                  key={option.id}
                  className={`p-2 rounded-md border flex items-center gap-2 ${isSelected
                      ? 'bg-green-50 border-green-300 text-green-800'
                      : 'bg-gray-50 border-gray-200'
                    }`}
                >
                  {option.image && (
                    <img
                      src={option.image}
                      alt={option.text}
                      className="w-8 h-8 object-cover rounded"
                    />
                  )}
                  <span className="text-sm">{option.text}</span>
                  {isSelected && <Badge variant="secondary" className="ml-auto">Selected</Badge>}
                </div>
              );
            })}
          </div>
        );

      case 'personality-matrix':
        return (
          <div className="space-y-2">
            {question.options?.map((option: any) => {
              const isSelected = option.id === answerValue || option.value === answerValue;
              return (
                <div
                  key={option.id}
                  className={`p-2 rounded-md border flex items-center gap-2 ${isSelected
                      ? 'bg-green-50 border-green-300 text-green-800'
                      : 'bg-gray-50 border-gray-200'
                    }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-green-500 bg-green-500' : 'border-gray-300'
                    }`}>
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <span className="text-sm">{option.text}</span>
                  {isSelected && <Badge variant="secondary" className="ml-auto">Selected</Badge>}
                </div>
              );
            })}
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2">
            {question.options?.map((option: any) => {
              const isSelected = option.id === answerValue || option.value === answerValue;
              return (
                <div
                  key={option.id}
                  className={`p-2 rounded-md border flex items-center gap-2 ${isSelected
                      ? 'bg-green-50 border-green-300 text-green-800'
                      : 'bg-gray-50 border-gray-200'
                    }`}
                >
                  {option.image && (
                    <img
                      src={option.image}
                      alt={option.text}
                      className="w-8 h-8 object-cover rounded"
                    />
                  )}
                  <span className="text-sm">{option.text}</span>
                  {isSelected && <Badge variant="secondary" className="ml-auto">Selected</Badge>}
                </div>
              );
            })}
          </div>
        );

      case 'nps':
        let npsColor = "bg-red-500";
        if (Number(answerValue) >= 7 && Number(answerValue) <= 8) {
          npsColor = "bg-yellow-500";
        } else if (Number(answerValue) >= 9) {
          npsColor = "bg-green-500";
        }
        return (
          <div className="flex flex-col">
            <div className="flex justify-between text-xs mb-1">
              <span>Detractor</span>
              <span>Promoter</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
              <div
                className={`${npsColor} h-2.5 rounded-full`}
                style={{
                  width: `${Number(answerValue) * 10}%`
                }}
              />
            </div>
            <div className="text-center font-medium mt-1">{answerValue}</div>
          </div>
        );

      default:
        return (
          <div className="p-3 bg-gray-50 rounded-md border">
            <p className="text-sm">{answerValue}</p>
          </div>
        );
    }
  };

  // For loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // For error state
  if (isError) {
    return (
      <Card className="border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-700 dark:text-red-300">Error Loading Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error instanceof Error ? error.message : 'Failed to load survey responses'}</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
        </CardFooter>
      </Card>
    );
  }

  // Note: Do not early-return on empty; show filters and an inline empty state below instead

  // If a response is selected, show the full-page response detail view
  if (selectedResponseId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setSelectedResponseId(null)}
              className="flex items-center gap-2"
            >
              ← Back to Responses
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Response Details</h1>
              <p className="text-muted-foreground">
                {singleResponseData?.data?.anonymousId && `Response ID: ${singleResponseData.data.anonymousId}`}
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Survey Response</CardTitle>
            <CardDescription>
              Submitted on {singleResponseData?.data?.submissionDate && new Date(singleResponseData.data.submissionDate).toLocaleString()}
              {singleResponseData?.data?.demographics && ' • '}
              {singleResponseData?.data?.demographics?.ageRange && `Age: ${singleResponseData.data.demographics.ageRange}`}
              {singleResponseData?.data?.demographics?.gender && ` • Gender: ${singleResponseData.data.demographics.gender}`}
              {singleResponseData?.data?.demographics?.region && ` • Region: ${singleResponseData.data.demographics.region}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSingleResponse ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Survey: {singleResponseData?.data?.surveyTitle}</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">ID: {singleResponseData?.data?.id}</Badge>
                    <Badge variant="outline">Completion Time: {singleResponseData?.data?.completionTime}</Badge>
                  </div>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {singleResponseData?.data?.questions?.map((question: any, index: number) => (
                    <AccordionItem key={index} value={`question-${index}`}>
                      <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                        <div className="flex items-start text-left">
                          <span className="mr-2">{index + 1}.</span>
                          <span>{question.text}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pt-2">
                        <div className="mb-2">
                          <Badge variant="outline" className="mb-2">{question.type}</Badge>
                        </div>
                        <div className="pl-6">
                          {renderAnswer(question)}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters - Only shown in admin view */}
      {isAdminView && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Survey Responses</CardTitle>
              <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-1">
                <DownloadIcon className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
            <CardDescription>View and filter individual survey responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="survey-filter">Filter by Survey</Label>
                <Select
                  value={filterSurveyId?.toString() || 'all'}
                  onValueChange={(value) => setFilterSurveyId(value !== 'all' ? parseInt(value) : undefined)}
                >
                  <SelectTrigger id="survey-filter">
                    <SelectValue placeholder="All Surveys" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Surveys</SelectItem>
                    {surveysData?.data?.map((survey: any) => (
                      <SelectItem key={survey.id} value={survey.id.toString()}>
                        {survey.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="client-filter">Filter by Client</Label>
                <Select
                  value={filterClientId?.toString() || 'all'}
                  onValueChange={(value) => setFilterClientId(value !== 'all' ? parseInt(value) : undefined)}
                >
                  <SelectTrigger id="client-filter">
                    <SelectValue placeholder="All Clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clientsData?.data?.map((client: any) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date-filter">Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    id="date-filter-start"
                    type="date"
                    value={startDate || ''}
                    onChange={(e) => setStartDate(e.target.value || null)}
                    className="w-1/2"
                  />
                  <Input
                    id="date-filter-end"
                    type="date"
                    value={endDate || ''}
                    onChange={(e) => setEndDate(e.target.value || null)}
                    className="w-1/2"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {responsesData.total} responses found
                </span>
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  setFilterSurveyId(undefined);
                  setFilterClientId(undefined);
                  setStartDate(null);
                  setEndDate(null);
                }}
                className="text-sm"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Responses Table or Empty State */}
      <Card>
        {!isAdminView && (
          <CardHeader>
            <CardTitle>Survey Responses</CardTitle>
            <CardDescription>
              Individual responses submitted for {surveyId ? 'this survey' : 'your surveys'}
            </CardDescription>
          </CardHeader>
        )}
        {responsesData?.data && responsesData.data.length > 0 ? (
          <>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Respondent</TableHead>
                    {!surveyId && <TableHead>Survey</TableHead>}
                    {isAdminView && !clientId && <TableHead>Client</TableHead>}
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Time (min)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responsesData.data.map((response: SurveyResponse) => (
                    <TableRow key={response.id}>
                      <TableCell className="font-medium">{response.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{response.anonymousId}</Badge>
                      </TableCell>
                      {!surveyId && (
                        <TableCell>{response.surveyTitle}</TableCell>
                      )}
                      {isAdminView && !clientId && (
                        <TableCell>{response.clientName}</TableCell>
                      )}
                      <TableCell>
                        {new Date(response.submissionDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{response.completionTime}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedResponseId(response.id)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {responsesData.data.length} of {responsesData.total} responses
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(5, responsesData.totalPages) }, (_, i) => {
                    const pageNumber = i + 1;
                    const isCurrentPage = pageNumber === page;

                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          isActive={isCurrentPage}
                          onClick={() => setPage(pageNumber)}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  {responsesData.totalPages > 5 && (
                    <>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          isActive={responsesData.totalPages === page}
                          onClick={() => setPage(responsesData.totalPages)}
                        >
                          {responsesData.totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage(p => Math.min(responsesData.totalPages, p + 1))}
                      className={page === responsesData.totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>No Survey Responses</CardTitle>
              <CardDescription>No responses match your current filter criteria.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="rounded-full bg-muted p-6 mb-4">
                <ChevronDownIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-center text-muted-foreground">Try adjusting your filters or check back later</p>
            </CardContent>
            {isAdminView && (
              <CardFooter className="flex justify-end">
                <Button onClick={() => {
                  setFilterSurveyId(undefined);
                  setFilterClientId(undefined);
                  setStartDate(null);
                  setEndDate(null);
                  setPage(1);
                }}>Clear Filters</Button>
              </CardFooter>
            )}
          </>
        )}
      </Card>
    </div>
  );
}