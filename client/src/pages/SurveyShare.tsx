import { useParams } from 'wouter';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Share2, Copy, Check, ArrowLeft, Mail, QrCode, Loader2, AlertCircle } from "lucide-react";
import { Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";

interface Survey {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  responseCount: number;
}

const SurveyShare = () => {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [activeTab, setActiveTab] = useState("link");
  const [customMessage, setCustomMessage] = useState("");
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // Create the shareable URL - use take-survey for anonymized routes
  const surveyUrl = `${window.location.origin}/take-survey/${params.id}`;
  
  // Define response type
  interface SurveyResponse {
    status: string;
    data: Survey;
  }
  
  // Get survey details
  const { data: surveyData, isLoading, error } = useQuery<SurveyResponse>({
    queryKey: [`/api/surveys/${params.id}`],
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
  
  // Extract the data
  const survey = surveyData?.data;
  
  // Description truncation logic
  const MAX_DESCRIPTION_LENGTH = 150;
  const description = survey?.description || '';
  const isDescriptionLong = description.length > MAX_DESCRIPTION_LENGTH;
  const truncatedDescription = isDescriptionLong 
    ? description.substring(0, MAX_DESCRIPTION_LENGTH) + '...'
    : description;
  const displayDescription = showFullDescription ? description : truncatedDescription;
  
  // Reset showFullDescription when survey changes
  useEffect(() => {
    setShowFullDescription(false);
  }, [survey?.id]);
  
  // Initialize custom message when survey data loads
  useEffect(() => {
    if (survey && !customMessage) {
      setCustomMessage(
        `Hello,\n\nI'd like to invite you to take this survey: "${survey.title}"\n\nYou can access it here: ${surveyUrl}\n\nThank you for your participation!`
      );
    }
  }, [survey, customMessage, surveyUrl]);
  
  // Show error toast if needed
  useEffect(() => {
    if (error) {
      console.error("Survey fetch error:", error);
      toast({
        title: "Error loading survey",
        description: "Failed to load survey details. Please try again.",
        variant: "destructive"
      });
    }
  }, [error, toast]);
  
  // Copy text to clipboard
  const copyToClipboard = (text: string, message: string = "Link copied to clipboard") => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        toast({
          title: "Copied!",
          description: message,
          variant: "default"
        });
        
        // Reset copy state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        toast({
          title: "Failed to copy",
          description: "Please try again or copy the text manually",
          variant: "destructive"
        });
      });
  };
  
  // Handle mouse enter/leave for tooltip
  const handleMouseEnter = () => setShowTooltip(true);
  const handleMouseLeave = () => setShowTooltip(false);
  
  // Create email link with custom message
  const getEmailLink = () => {
    return `mailto:?subject=${encodeURIComponent(`Survey Invitation: ${survey?.title || 'Personality Assessment'}`)}
      &body=${encodeURIComponent(customMessage)}`;
  };
  
  // Generate embed code
  const embedCode = `<iframe src="${surveyUrl}" width="100%" height="600" frameborder="0"></iframe>`;
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/dashboard" className="flex items-center text-primary hover:underline mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Dashboard
      </Link>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="shadow-lg">
          <CardHeader className="bg-primary/5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                Share Your Survey
              </CardTitle>
              <CardDescription>
                Share your survey with respondents through multiple channels
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center py-8 text-red-500">
                <AlertCircle className="h-12 w-12 mb-3" />
                <p>Failed to load survey details. Please try again.</p>
              </div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="mb-6"
                >
                  <h3 className="text-lg font-medium mb-2">Survey Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="font-medium text-gray-800">{survey?.title || 'Untitled Survey'}</p>
                    {description ? (
                      <div className="text-gray-600 text-sm mt-1">
                        <p className="whitespace-pre-wrap">{displayDescription}</p>
                        {isDescriptionLong && (
                          <button
                            onClick={() => setShowFullDescription(!showFullDescription)}
                            className="text-primary hover:underline mt-1 text-xs font-medium"
                          >
                            {showFullDescription ? 'Show Less' : 'Show More'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm mt-1 italic">No description provided</p>
                    )}
                    {survey?.responseCount !== undefined && (
                      <div className="flex items-center mt-3 text-sm text-gray-500">
                        <div className="flex-1">
                          <span className="font-medium">{survey.responseCount}</span> {survey.responseCount === 1 ? 'response' : 'responses'} collected
                        </div>
                        <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          Active
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="mb-6"
                >
                  <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                      <TabsTrigger value="link">Share Link</TabsTrigger>
                      <TabsTrigger value="email">Email</TabsTrigger>
                      <TabsTrigger value="embed">Embed</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="link" className="space-y-4">
                      <div className="flex space-x-2">
                        <Input 
                          value={surveyUrl}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          onClick={() => copyToClipboard(surveyUrl)}
                          className="relative"
                          onMouseEnter={handleMouseEnter}
                          onMouseLeave={handleMouseLeave}
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          
                          {/* Simple tooltip */}
                          {showTooltip && !copied && (
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-800 text-white rounded whitespace-nowrap">
                              Copy to clipboard
                            </span>
                          )}
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                        <Button 
                          variant="outline" 
                          className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(surveyUrl)}`, '_blank')}
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          Facebook
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="flex-1 text-sky-500 border-sky-200 hover:bg-sky-50"
                          onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(surveyUrl)}&text=${encodeURIComponent(`Take this survey: ${survey?.title || 'Personality Assessment'}`)}`, '_blank')}
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 14-7.496 14-13.986 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59l-.047-.02z"/>
                          </svg>
                          Twitter
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Take this survey: ${survey?.title || 'Personality Assessment'} ${surveyUrl}`)}`, '_blank')}
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          WhatsApp
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="email" className="space-y-4">
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">Customize your email invitation:</p>
                        <Textarea 
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          rows={7}
                          className="font-sans resize-none"
                        />
                        
                        <div className="flex space-x-3 mt-4">
                          <Button 
                            className="flex-1"
                            onClick={() => copyToClipboard(customMessage, "Email message copied to clipboard")}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Message
                          </Button>
                          
                          <a href={getEmailLink()} target="_blank" rel="noopener noreferrer" className="flex-1">
                            <Button variant="outline" className="w-full">
                              <Mail className="h-4 w-4 mr-2" />
                              Open Email Client
                            </Button>
                          </a>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="embed" className="space-y-4">
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">Use this code to embed the survey on your website:</p>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <code className="text-xs font-mono break-all">{embedCode}</code>
                        </div>
                        
                        <Button 
                          onClick={() => copyToClipboard(embedCode, "Embed code copied to clipboard")}
                          className="w-full mt-2"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Embed Code
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </motion.div>
                
              </>
            )}
          </CardContent>
          <CardFooter className="bg-gray-50 flex flex-col sm:flex-row justify-between gap-3">
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            
            <div className="flex gap-2">
              <Link href={`/dashboard/survey/${params.id}/edit`}>
                <Button variant="outline">
                  Edit Survey
                </Button>
              </Link>
              
              <Link href={`/dashboard/survey/${params.id}`}>
                <Button>
                  View Responses
                </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default SurveyShare;