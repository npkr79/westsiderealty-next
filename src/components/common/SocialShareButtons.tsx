import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Share2, 
  MessageCircle,
  Linkedin,
  Twitter,
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";

interface SocialShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  className?: string;
}

const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({
  url,
  title,
  description = "",
  hashtags = [],
  className = ""
}) => {
  const [copied, setCopied] = useState(false);
  
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const hashtagString = hashtags.map(tag => `#${tag}`).join(' ');

  const handleWhatsAppShare = () => {
    const text = `${title}\n\n${description}\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
  };

  const handleTwitterShare = () => {
    const text = hashtags.length > 0 
      ? `${title} ${hashtagString}`
      : title;
    window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleLinkedInShare = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied! Share on Instagram");
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* WhatsApp */}
      <Button
        variant="outline"
        size="icon"
        className="h-11 w-11 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-colors"
        onClick={handleWhatsAppShare}
        title="Share on WhatsApp"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>

      {/* Facebook */}
      <Button
        variant="outline"
        size="icon"
        className="h-11 w-11 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-colors"
        onClick={handleFacebookShare}
        title="Share on Facebook"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </Button>

      {/* X (Twitter) */}
      <Button
        variant="outline"
        size="icon"
        className="h-11 w-11 hover:bg-black hover:text-white hover:border-black transition-colors"
        onClick={handleTwitterShare}
        title="Share on X (Twitter)"
      >
        <Twitter className="h-5 w-5" />
      </Button>

      {/* LinkedIn */}
      <Button
        variant="outline"
        size="icon"
        className="h-11 w-11 hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-colors"
        onClick={handleLinkedInShare}
        title="Share on LinkedIn"
      >
        <Linkedin className="h-5 w-5" />
      </Button>

      {/* Copy Link (Instagram-style) */}
      <Button
        variant="outline"
        size="icon"
        className={`h-11 w-11 transition-colors ${
          copied 
            ? 'bg-green-500 text-white border-green-500' 
            : 'hover:bg-gradient-to-br hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF] hover:text-white hover:border-[#DD2A7B]'
        }`}
        onClick={handleCopyLink}
        title="Copy link for Instagram"
      >
        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
      </Button>
    </div>
  );
};

export default SocialShareButtons;
