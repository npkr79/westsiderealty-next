"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title: string;
  subtitle?: string | null;
  faqs: FAQ[];
}

export function FAQSection({ title, subtitle, faqs }: FAQSectionProps) {
  if (faqs.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16 md:py-24 bg-slate-50/50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg md:text-xl text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        <Card>
          <CardContent className="p-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs && Array.isArray(faqs) && faqs.length > 0 ? (
                faqs.map((faq, index) => {
                  if (!faq || typeof faq !== 'object') {
                    return null;
                  }
                  
                  const question = typeof faq.question === 'string' ? faq.question : '';
                  const answer = typeof faq.answer === 'string' ? faq.answer : '';
                  
                  return (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left font-semibold">
                        {question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {answer}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No FAQs available.
                </div>
              )}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
