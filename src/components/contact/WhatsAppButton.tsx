"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";

export default function WhatsAppButton() {
  const handleWhatsAppContact = () => {
    const message =
      "Hi, I'm interested in your real estate services. Could you please provide more information?";
    const whatsappUrl = `https://wa.me/919866085831?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
          onClick={handleWhatsAppContact}
        >
          <span className="mr-2">Chat on WhatsApp</span>
          <Send className="h-5 w-5" />
        </button>
      </CardContent>
    </Card>
  );
}

