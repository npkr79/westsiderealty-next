"use client";

import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

export default function NewsletterCtaSection() {
  const handleWhatsAppContact = () => {
    window.open('https://wa.me/919866085831', '_blank');
  };
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Get the latest market insights and investment opportunities delivered directly to you.
        </p>
        <Button 
          size="lg" 
          className="bg-remax-red hover:bg-remax-red/90"
          onClick={handleWhatsAppContact}
        >
          <Phone className="h-5 w-5 mr-2" />
          Contact Us for Updates
        </Button>
      </div>
    </section>
  );
}

