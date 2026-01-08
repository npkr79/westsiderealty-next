"use client";

import { useState, useEffect } from "react";
import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectMobileActionsProps {
  projectName: string;
  whatsappNumber?: string;
  phoneNumber?: string;
  onEnquire?: () => void;
}

export default function ProjectMobileActions({ 
  projectName, 
  whatsappNumber = "919866085831",
  phoneNumber = "919866085831",
  onEnquire
}: ProjectMobileActionsProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 300px
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  const handleWhatsApp = () => {
    const message = `Hi, I'm interested in ${projectName}`;
    window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCall = () => {
    window.location.href = `tel:+${phoneNumber.replace(/\D/g, '')}`;
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          size="lg"
          onClick={handleCall}
        >
          <Phone className="mr-2 h-4 w-4" />
          Call Now
        </Button>
        <Button
          type="button"
          className="flex-1"
          size="lg"
          onClick={handleWhatsApp}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          WhatsApp
        </Button>
      </div>
    </div>
  );
}
