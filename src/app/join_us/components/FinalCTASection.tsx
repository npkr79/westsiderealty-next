"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";

interface FinalCTASectionProps {
  title: string;
  description?: string | null;
  buttonText: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactAddress?: string | null;
}

export function FinalCTASection({
  title,
  description,
  buttonText,
  contactEmail,
  contactPhone,
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

            <Button
              size="lg"
              onClick={scrollToForm}
              className="mb-8 text-lg px-8 py-6"
            >
              {buttonText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            {(contactEmail || contactPhone || contactAddress) && (
              <div className="border-t pt-8 mt-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Contact Us
                </h3>
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-start sm:items-center">
                  {contactPhone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-5 w-5" />
                      <Link
                        href={`tel:${contactPhone.replace(/\D/g, "")}`}
                        className="hover:text-primary"
                      >
                        {contactPhone}
                      </Link>
                    </div>
                  )}
                  {contactEmail && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-5 w-5" />
                      <Link
                        href={`mailto:${contactEmail}`}
                        className="hover:text-primary"
                      >
                        {contactEmail}
                      </Link>
                    </div>
                  )}
                  {contactAddress && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-5 w-5" />
                      <span>{contactAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
