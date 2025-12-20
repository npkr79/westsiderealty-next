"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface PropertyFAQsProps {
  faqs: FAQ[];
  propertyName?: string;
}

export function PropertyFAQs({ faqs, propertyName }: PropertyFAQsProps) {
  if (!faqs || faqs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          Frequently Asked Questions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqs.slice(0, 10).map((faq, index) => (
            <AccordionItem key={faq.id || index} value={`faq-${index}`}>
              <AccordionTrigger className="text-left hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

