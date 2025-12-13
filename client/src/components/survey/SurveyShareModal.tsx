import { useState, useEffect } from "react";
import { X, Copy, Share2, Send, Mail, Info, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import confetti from "canvas-confetti";

interface SocialShareButton {
  platform: string;
  color: string;
  icon: React.ReactNode;
  shareUrl: (url: string, title: string) => string;
}

interface SurveyShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId?: number | string;
  surveyId?: number | string;
  defaultTitle?: string;
  defaultType?: string;
}

export function SurveyShareModal({
  open,
  onOpenChange,
  sessionId,
  surveyId,
  defaultTitle = "Personality Assessment Survey",
  defaultType = "personality"
}: SurveyShareModalProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [surveyType] = useState(defaultType);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [emailList, setEmailList] = useState("");
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [customTitle, setCustomTitle] = useState(defaultTitle);
  const [customDescription, setCustomDescription] = useState(
    "I've just completed this personality assessment survey and thought you might find it interesting. Take a few minutes to discover insights about your personality traits!"
  );
  
  // Social sharing buttons
  const socialButtons: SocialShareButton[] = [
    {
      platform: "Facebook",
      color: "bg-blue-600 hover:bg-blue-700",
      icon: <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
      shareUrl: (url, title) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`
    },
    {
      platform: "Twitter",
      color: "bg-sky-500 hover:bg-sky-600",
      icon: <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21.543 7.104c.015.211.015.423.015.636 0 6.507-4.954 14.01-14.01 14.01v-.003A13.94 13.94 0 0 1 0 19.539a9.88 9.88 0 0 0 7.287-2.041 4.93 4.93 0 0 1-4.6-3.42 4.916 4.916 0 0 0 2.223-.084A4.926 4.926 0 0 1 .96 9.167v-.062a4.887 4.887 0 0 0 2.235.616A4.928 4.928 0 0 1 1.67 3.148a13.98 13.98 0 0 0 10.15 5.144 4.929 4.929 0 0 1 8.39-4.49 9.868 9.868 0 0 0 3.128-1.196 4.941 4.941 0 0 1-2.165 2.724A9.828 9.828 0 0 0 24 4.555a10.019 10.019 0 0 1-2.457 2.549z"/></svg>,
      shareUrl: (url, title) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    },
    {
      platform: "LinkedIn",
      color: "bg-blue-700 hover:bg-blue-800",
      icon: <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
      shareUrl: (url, title) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
    },
    {
      platform: "WhatsApp",
      color: "bg-green-600 hover:bg-green-700",
      icon: <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
      shareUrl: (url, title) => `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`
    }
  ];

  useEffect(() => {
    if (open) {
      generateShareLink();
    }
  }, [open]);

  const generateShareLink = async () => {
    if (shareUrl && isGenerated) return;
    
    setIsGenerating(true);
    
    try {
      const targetId = surveyId || sessionId;
      if (!targetId) {
        toast({
          title: "Cannot generate link",
          description: "No session or survey ID provided",
          variant: "destructive"
        });
        setIsGenerating(false);
        return;
      }
      
      // Call API to generate share link
      const response = await apiRequest("/api/survey/share", {
        method: "POST",
        body: JSON.stringify({
          surveyId: targetId,
          surveyType,
          customTitle,
          customDescription
        }),
      });
      
      if (response.success) {
        // Generate a demo link based on the returned data
        const baseUrl = window.location.origin;
        const generatedUrl = response.links?.direct || `${baseUrl}/survey?id=${response.surveyId}&ref=share`;
        
        setShareUrl(generatedUrl);
        setCustomUrl(generatedUrl);
        setIsGenerated(true);
        
        // Launch confetti for a fun touch
        setTimeout(() => {
          confetti({
            particleCount: 75,
            spread: 50,
            origin: { y: 0.5 }
          });
        }, 300);
      } else {
        toast({
          title: "Error creating link",
          description: "There was a problem generating your share link.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error creating link",
        description: "There was a problem generating your share link.",
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
    
    // Split email list by commas or line breaks
    const emails = emailList.split(/[\n,]+/).map(email => email.trim()).filter(Boolean);
    if (!emails.length) return;
    
    setIsSendingEmails(true);
    
    try {
      // Call API endpoint to send emails
      const response = await apiRequest('/api/survey/share', {
        method: 'POST',
        body: JSON.stringify({
          surveyId: surveyId || sessionId,
          emails,
          message: customDescription,
          title: customTitle
        })
      });
      
      if (response.success) {
        toast({
          title: "Invitations sent!",
          description: `Successfully sent to ${emails.length} recipients.`,
        });
        
        setEmailSent(true);
        setEmailList("");
        
        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        toast({
          title: "Failed to send invitations",
          description: response.message || "There was a problem sending invitations.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error sending invitations",
        description: "There was a problem sending your email invitations.",
        variant: "destructive"
      });
    } finally {
      setIsSendingEmails(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(customUrl || shareUrl);
    toast({
      title: "Link copied!",
      description: "Survey link copied to clipboard"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[750px]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-2xl">Share Your Results</DialogTitle>
            <DialogDescription>
              Invite others to take the same survey or share your results
            </DialogDescription>
          </div>
          {isGenerated && (
            <Badge variant="outline" className="text-green-600 border-green-400 bg-green-50 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Link Ready
            </Badge>
          )}
        </DialogHeader>
        
        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Copy Link</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="share-url">Custom Link Title (optional)</Label>
              <Input
                id="custom-title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Personality Assessment Survey"
                className="mb-4"
              />
              
              <Label htmlFor="share-url">Your Personalized Link</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="share-url"
                  readOnly
                  value={customUrl || shareUrl}
                  placeholder={isGenerating ? "Generating link..." : "Your share link will appear here"}
                  className={isGenerating ? "animate-pulse" : ""}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="icon" 
                        onClick={copyToClipboard}
                        disabled={!shareUrl || isGenerating}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy to clipboard</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg mt-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">How it works</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Anyone with this link can take the same survey. Results are kept private for each respondent.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={copyToClipboard}
                disabled={!shareUrl || isGenerating}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="social" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="social-title">Share Title</Label>
                <Input
                  id="social-title"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Take this personality assessment!"
                  className="mb-4"
                />
              </div>
              
              <div>
                <Label htmlFor="social-message">Share Message</Label>
                <Textarea
                  id="social-message"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Check out this personality survey I just took!"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="mt-6">
              <Label className="mb-2 block">Share on</Label>
              <div className="flex flex-wrap gap-3">
                {socialButtons.map((btn) => (
                  <Button
                    key={btn.platform}
                    className={`${btn.color} text-white flex items-center gap-2`}
                    disabled={!shareUrl || isGenerating}
                    onClick={() => {
                      const shareLink = btn.shareUrl(customUrl || shareUrl, customTitle);
                      window.open(shareLink, '_blank');
                    }}
                  >
                    {btn.icon}
                    {btn.platform}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-subject">Email Subject</Label>
                <Input
                  id="email-subject"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Take this personality assessment!"
                  className="mb-4"
                />
              </div>
              
              <div>
                <Label htmlFor="email-message">Email Message</Label>
                <Textarea
                  id="email-message"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="I thought you might be interested in taking this personality survey."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="email-recipients">Recipient Email Addresses</Label>
                <Textarea
                  id="email-recipients"
                  value={emailList}
                  onChange={(e) => setEmailList(e.target.value)}
                  placeholder="Enter email addresses separated by commas or new lines"
                  rows={3}
                  className={emailSent ? "border-green-500" : ""}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter multiple emails separated by commas or new lines
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={sendEmailInvitations}
                disabled={isSendingEmails || !shareUrl || !emailList.trim()}
                className="gap-2"
              >
                {isSendingEmails ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Send Invitations
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <div className="flex items-center text-xs text-gray-500 gap-1">
            <Info className="h-3 w-3" />
            {isGenerated ? "Link generated successfully!" : "Generating secure link..."}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}