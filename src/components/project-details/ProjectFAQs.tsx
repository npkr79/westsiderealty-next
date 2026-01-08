import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface FAQItem {
  question: string;
  answer: string;
}

interface ProjectFAQsProps {
  faqs?: any;
  projectName?: string;
}

export default function ProjectFAQs({ faqs, projectName }: ProjectFAQsProps) {
  if (!faqs) return null;

  let faqItems: FAQItem[] = [];

  if (Array.isArray(faqs)) {
    faqItems = faqs.map((faq: any) => ({
      question: faq.question || faq.q || faq.title || '',
      answer: faq.answer || faq.a || faq.description || faq.content || '',
    })).filter((faq: FAQItem) => faq.question && faq.answer);
  }

  if (faqItems.length === 0) return null;

  // Generate JSON-LD schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer.replace(/<[^>]*>/g, ''), // Strip HTML for schema
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Card>
        <CardHeader>
          <CardTitle>
            {projectName ? `Frequently Asked Questions about ${projectName}` : "Frequently Asked Questions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  <div
                    className="text-sm text-muted-foreground prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
}
