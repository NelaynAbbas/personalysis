import { Button } from "@/components/ui/button";
import { Share2, Twitter as TwitterIcon, Facebook as FacebookIcon, Linkedin as LinkedinIcon, Mail, Link as LinkIcon, QrCode } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

interface ShareButtonsProps {
  title: string;
  description?: string;
  url: string;
  hashtags?: string[];
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCopyLink?: boolean;
  showQrCode?: boolean;
  className?: string;
}

export function ShareButtons({
  title,
  description = "",
  url,
  hashtags = ["personalysispro", "survey"],
  showLabel = true,
  size = "md",
  showCopyLink = true,
  showQrCode = false,
  className = "",
}: ShareButtonsProps) {
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);

  const hashtag = hashtags.map(tag => `#${tag}`).join(" ");
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const encodedHashtags = encodeURIComponent(hashtags.join(","));

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&hashtags=${encodedHashtags}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`;
  const emailUrl = `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}%0A%0A${hashtag}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Survey link copied to clipboard",
      duration: 3000,
    });
  };

  const iconSize = size === "sm" ? 16 : size === "md" ? 20 : 24;
  const buttonSize = size === "sm" ? "sm" : size === "md" ? "default" : "lg";

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size={buttonSize}
              onClick={() => window.open(twitterUrl, "_blank")}
            >
              <TwitterIcon size={iconSize} className="text-sky-500" />
              {showLabel && <span className="ml-2">Twitter</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share on Twitter</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size={buttonSize}
              onClick={() => window.open(facebookUrl, "_blank")}
            >
              <FacebookIcon size={iconSize} className="text-blue-600" />
              {showLabel && <span className="ml-2">Facebook</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share on Facebook</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size={buttonSize}
              onClick={() => window.open(linkedinUrl, "_blank")}
            >
              <LinkedinIcon size={iconSize} className="text-blue-700" />
              {showLabel && <span className="ml-2">LinkedIn</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share on LinkedIn</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size={buttonSize}
              onClick={() => window.open(emailUrl, "_blank")}
            >
              <Mail size={iconSize} className="text-gray-700" />
              {showLabel && <span className="ml-2">Email</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share via Email</p>
          </TooltipContent>
        </Tooltip>

        {showCopyLink && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size={buttonSize}
                onClick={copyToClipboard}
              >
                <LinkIcon size={iconSize} className="text-gray-700" />
                {showLabel && <span className="ml-2">Copy Link</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy Link</p>
            </TooltipContent>
          </Tooltip>
        )}

        {showQrCode && (
          <Popover open={isQRCodeOpen} onOpenChange={setIsQRCodeOpen}>
            <PopoverTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size={buttonSize}>
                    <QrCode size={iconSize} className="text-gray-700" />
                    {showLabel && <span className="ml-2">QR Code</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show QR Code</p>
                </TooltipContent>
              </Tooltip>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="center">
              <div className="flex flex-col items-center">
                <h3 className="text-center font-semibold mb-2">Scan QR Code</h3>
                <div className="bg-white p-2 rounded-md">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodedUrl}`}
                    alt="QR Code"
                    width={150}
                    height={150}
                  />
                </div>
                <p className="text-xs text-center text-gray-500 mt-2">
                  Scan this code with a mobile device to open the survey
                </p>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </TooltipProvider>
    </div>
  );
}