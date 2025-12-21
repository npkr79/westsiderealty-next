import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FAQItem {
  question: string;
  answer: string;
}

interface ProjectFAQSectionProps {
  faqs?: FAQItem[] | any[];
  projectName?: string;
}

export default function ProjectFAQSection({ faqs, projectName }: ProjectFAQSectionProps) {
  if (!faqs || faqs.length === 0) return null;

  // Normalize FAQ items to handle different formats (question/answer, q/a, etc.)
  const normalizedFaqs = faqs.map((faq: any) => ({
    question: faq.question || faq.q || faq.title || 'Question',
    answer: faq.answer || faq.a || faq.description || faq.content || 'Answer not available',
  }));

  return (
    <section className="mb-12">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-foreground">
            {projectName ? `Frequently Asked Questions about ${projectName}` : 'Frequently Asked Questions'}
          </h2>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {normalizedFaqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
}


