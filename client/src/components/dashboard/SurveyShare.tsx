import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { surveyTypes } from "@/lib/surveyQuestions";
import confetti from "canvas-confetti";
import { 
  RefreshCw, 
  Link, 
  Copy, 
  Share2, 
  Mail, 
  Info, 
  Users, 
  Clock, 
  Lightbulb,
  Brain
} from "lucide-react";

export default function SurveyShare() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [surveyType, setSurveyType] = useState("personality");
  const [emailList, setEmailList] = useState("");
  const [shareOption, setShareOption] = useState("link");
  const [embedCode, setEmbedCode] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  
  const generateShareableLink = async () => {
    setIsGenerating(true);
    
    try {
      // Make a real API call to create a shareable survey link
      const response = await fetch("/api/survey/share", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'X-Mock-Admin': 'true',
          'X-User-ID': '1',
          'X-User-Role': 'platform_admin'
        },
        body: JSON.stringify({
          surveyType,
          customTitle: customTitle || undefined,
          customDescription: customDescription || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data) {
        // Use the generated URL from the API or fall back to constructing one
        const baseUrl = window.location.origin;
        const generatedUrl = data.shareUrl || `${baseUrl}/survey/take/${data.surveyId || 'demo'}`;
        
        setShareUrl(generatedUrl);
        
        // Generate embed code
        const embedHtml = `<iframe src="${generatedUrl}&embed=true" width="100%" height="600" frameborder="0"></iframe>`;
        setEmbedCode(embedHtml);
        
        // Show success
        toast({
          title: "Survey link generated!",
          description: "Your shareable survey is ready to distribute.",
        });
        
        // Launch confetti for a fun touch
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        throw new Error(data?.message || 'Failed to generate survey link');
      }
    } catch (error) {
      console.error('Error generating survey link:', error);
      toast({
        title: "Error creating link",
        description: "There was a problem generating your survey link.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const sendEmailInvitations = async () => {
    if (!emailList.trim()) {
      toast({
        title: "No email addresses",
        description: "Please enter at least one email address to send invitations.",
        variant: "destructive"
      });
      return;
    }
    
    if (!shareUrl) {
      toast({
        title: "No survey link",
        description: "Please generate a survey link first before sending invitations.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    // Split email list by commas or line breaks
    const emails = emailList.split(/[\n,]+/).map(email => email.trim()).filter(Boolean);
    
    try {
      // Call the API to send email invitations
      const response = await fetch("/api/survey/share/email", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'X-Mock-Admin': 'true',
          'X-User-ID': '1',
          'X-User-Role': 'platform_admin'
        },
        body: JSON.stringify({
          surveyUrl: shareUrl,
          emails,
          surveyType,
          customTitle: customTitle || "Personality Assessment Survey",
          customMessage: customDescription || "I'd like to invite you to take this survey."
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data) {
        toast({
          title: "Invitations sent!",
          description: `Successfully sent to ${emails.length} recipients.`,
        });
        setEmailList("");
      } else {
        throw new Error(data?.message || 'Failed to send email invitations');
      }
    } catch (error) {
      console.error('Error sending email invitations:', error);
      toast({
        title: "Error sending invitations",
        description: "There was a problem sending your email invitations.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
      description: "You can now paste it anywhere you need.",
    });
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Share Your Survey</h1>
        <p className="text-lg text-gray-600 mt-2">
          Distribute your personality assessment surveys to collect valuable customer data
        </p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Survey Configuration</CardTitle>
          <CardDescription>
            Customize how your survey appears to respondents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="survey-type">Survey Type</Label>
              <Select
                value={surveyType}
                onValueChange={setSurveyType}
              >
                <SelectTrigger id="survey-type">
                  <SelectValue placeholder="Select survey type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(surveyTypes).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="survey-title">Custom Title (Optional)</Label>
              <Input
                id="survey-title"
                placeholder="Enter a custom survey title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="survey-description">Custom Description (Optional)</Label>
            <Input
              id="survey-description"
              placeholder="Enter a custom description for your survey"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
            />
          </div>
          
          <Button 
            className="w-full"
            onClick={generateShareableLink}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Link className="h-4 w-4 mr-2" />
                Generate Shareable Survey
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      {shareUrl && (
        <Card className="mb-8 border-green-100 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-700">Survey Ready to Share!</CardTitle>
            <CardDescription className="text-green-600">
              Your survey has been created successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={shareOption} onValueChange={setShareOption} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="link">Share Link</TabsTrigger>
                <TabsTrigger value="email">Email Invitations</TabsTrigger>
                <TabsTrigger value="embed">Embed Code</TabsTrigger>
              </TabsList>
              
              <TabsContent value="link" className="space-y-4">
                <div className="flex space-x-2">
                  <Input 
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(shareUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Take this personality assessment!')}`, '_blank')}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Twitter
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 text-blue-800 border-blue-200 hover:bg-blue-50"
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Facebook
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 text-blue-500 border-blue-200 hover:bg-blue-50"
                    onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="email" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-list">Email Addresses</Label>
                  <textarea
                    id="email-list"
                    className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md"
                    placeholder="Enter email addresses separated by commas or new lines"
                    value={emailList}
                    onChange={(e) => setEmailList(e.target.value)}
                  ></textarea>
                </div>
                
                <Button 
                  className="w-full"
                  onClick={sendEmailInvitations}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email Invitations
                    </>
                  )}
                </Button>
              </TabsContent>
              
              <TabsContent value="embed" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="embed-code">Embed Code</Label>
                  <textarea
                    id="embed-code"
                    className="w-full min-h-[120px] p-3 font-mono text-sm border border-gray-300 rounded-md"
                    readOnly
                    value={embedCode}
                  ></textarea>
                </div>
                
                <Button 
                  variant="outline"
                  onClick={() => copyToClipboard(embedCode)}
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Embed Code
                </Button>
                
                <div className="p-4 bg-gray-100 rounded-lg mt-4">
                  <h3 className="font-medium mb-2">Embedding Instructions</h3>
                  <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
                    <li>Copy the code above</li>
                    <li>Paste it into your website's HTML where you want the survey to appear</li>
                    <li>The survey will automatically resize to fit its container</li>
                  </ol>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="bg-green-100/50 text-green-700 text-sm">
            <div className="flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Survey responses will be collected in your dashboard automatically
            </div>
          </CardFooter>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Distribution Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-100 rounded-lg">
              <div className="text-blue-500 mb-2">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-medium mb-1">Diverse Audience</h3>
              <p className="text-sm text-gray-600">
                Share with a diverse demographic to get representative insights.
              </p>
            </div>
            
            <div className="p-4 border border-gray-100 rounded-lg">
              <div className="text-purple-500 mb-2">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-medium mb-1">Timing Matters</h3>
              <p className="text-sm text-gray-600">
                Send invitations when your audience is most likely to engage.
              </p>
            </div>
            
            <div className="p-4 border border-gray-100 rounded-lg">
              <div className="text-amber-500 mb-2">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="font-medium mb-1">Clear Context</h3>
              <p className="text-sm text-gray-600">
                Explain the purpose and benefits of taking your personality assessment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}