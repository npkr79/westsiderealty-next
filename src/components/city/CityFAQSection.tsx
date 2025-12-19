"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CityFAQSectionProps {
  faqs: any[];
  cityName: string;
}

export default function CityFAQSection({ faqs, cityName }: CityFAQSectionProps) {
  if (!Array.isArray(faqs) || faqs.length === 0) return null;

  // Group FAQs by category if they have a category field
  const categorized = faqs.some((faq: any) => faq.category || faq.section);
  
  let categories: Record<string, any[]> = {};
  
  if (categorized) {
    faqs.forEach((faq: any) => {
      const category = faq.category || faq.section || "General";
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(faq);
    });
  } else {
    // Default categories for Hyderabad
    const defaultCategories = {
      "Market Trends & Investment Outlook 2026": faqs.slice(0, 5),
      "Top Locations & Micro-Markets": faqs.slice(5, 9),
      "Legal, RERA & Buying Process": faqs.slice(9, 13),
      "Infrastructure & Future Growth": faqs.slice(13)
    };
    
    // Only use default categories if we have enough FAQs
    if (faqs.length >= 4) {
      categories = defaultCategories;
    } else {
      categories = { "General": faqs };
    }
  }

  const categoryNames = Object.keys(categories);
  const [activeCategory, setActiveCategory] = useState(categoryNames[0] || "General");

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-[hsl(var(--heading-blue))]">
          Frequently Asked Questions about {cityName}
        </h2>
        <Card>
          <CardContent className="p-6">
            {categoryNames.length > 1 ? (
              <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
                  {categoryNames.map((category) => (
                    <TabsTrigger key={category} value={category} className="text-xs md:text-sm">
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {categoryNames.map((category) => (
                  <TabsContent key={category} value={category}>
                    <Accordion type="single" collapsible className="w-full">
                      {categories[category].map((faq: any, idx: number) => {
                        const question = faq.question || faq.q;
                        const answer = faq.answer || faq.a;
                        return (
                          <AccordionItem key={idx} value={`faq-${category}-${idx}`}>
                            <AccordionTrigger className="text-left">
                              {question}
                            </AccordionTrigger>
                            <AccordionContent>
                              <div 
                                className="text-sm text-muted-foreground prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ 
                                  __html: typeof answer === 'string' ? answer : JSON.stringify(answer)
                                }}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq: any, idx: number) => {
                  const question = faq.question || faq.q;
                  const answer = faq.answer || faq.a;
                  return (
                    <AccordionItem key={idx} value={`faq-${idx}`}>
                      <AccordionTrigger className="text-left">
                        {question}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div 
                          className="text-sm text-muted-foreground prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ 
                            __html: typeof answer === 'string' ? answer : JSON.stringify(answer)
                          }}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}


