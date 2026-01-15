"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, MessageSquare } from "lucide-react";

interface FinalCTASectionProps {
  title: string;
  description?: string | null;
  buttonText: string;
  contactAddress?: string | null;
}

export function FinalCTASection({
  title,
  description,
  buttonText,
  contactAddress,
}: FinalCTASectionProps) {
  const scrollToForm = () => {
    const formElement = document.getElementById("application-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {title}
            </h2>
            {description && (
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                {description}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                onClick={scrollToForm}
                className="text-lg px-8 py-6"
              >
                {buttonText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={scrollToForm}
                className="text-lg px-8 py-6"
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Contact Us
              </Button>
            </div>

            {contactAddress && (
              <div className="border-t pt-8 mt-8">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  <span>{contactAddress}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
