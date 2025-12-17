import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface CityFAQSectionProps {
  faqs: any[];
  cityName: string;
}

export default function CityFAQSection({ faqs, cityName }: CityFAQSectionProps) {
  if (!Array.isArray(faqs) || faqs.length === 0) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>FAQs about buying in {cityName}</CardTitle>
          </CardHeader>
          <CardContent>
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
                      <p className="text-sm text-muted-foreground">{answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}


