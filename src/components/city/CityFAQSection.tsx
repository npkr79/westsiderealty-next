"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface CityFAQSectionProps {
  faqs: any[];
  cityName: string;
}

export default function CityFAQSection({ faqs, cityName }: CityFAQSectionProps) {
  if (!Array.isArray(faqs) || faqs.length === 0) return null;

  // Parse FAQ structure: [{ category, faqs: [{ question, answer }] }]
  let faqCategories: Array<{ category: string; faqs: Array<{ question: string; answer: string }> }> = [];
  
  // Check if FAQs are in the structured format with category and faqs array
  if (faqs.length > 0 && faqs[0]?.category && Array.isArray(faqs[0]?.faqs)) {
    faqCategories = faqs;
  } else {
    // Fallback: treat each item as a single FAQ
    faqCategories = [{
      category: "General",
      faqs: faqs.map((faq: any) => ({
        question: faq.question || faq.q || "",
        answer: faq.answer || faq.a || ""
      }))
    }];
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-[hsl(var(--heading-blue))]">
          Frequently Asked Questions about {cityName}
        </h2>
        <Card className="bg-white/80 backdrop-blur-sm border shadow-lg">
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqCategories.map((categoryData, categoryIdx) => (
                <div key={categoryIdx} className="space-y-3">
                  {categoryData.category && (
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {categoryData.category}
                    </h3>
                  )}
                  {categoryData.faqs.map((faq, faqIdx) => {
                    const uniqueId = `faq-${categoryIdx}-${faqIdx}`;
                    return (
                      <AccordionItem key={uniqueId} value={uniqueId} className="border-b">
                        <AccordionTrigger className="text-left hover:no-underline">
                          <span className="font-medium">{faq.question}</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div 
                            className="text-sm text-muted-foreground prose prose-sm max-w-none pt-2"
                            dangerouslySetInnerHTML={{ 
                              __html: typeof faq.answer === 'string' ? faq.answer : JSON.stringify(faq.answer)
                            }}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </div>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}


