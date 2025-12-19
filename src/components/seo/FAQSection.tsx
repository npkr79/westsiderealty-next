import { JsonLd } from "./JsonLd";
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
  faqs: FAQ[];
  title?: string;
}

export function FAQSection({ faqs, title = "Frequently Asked Questions" }: FAQSectionProps) {
  if (!faqs || faqs.length === 0) return null;

  // Normalize FAQ format - handle both {question, answer} and {q, a} formats
  const normalizedFaqs = faqs.map((faq: any) => ({
    question: faq.question || faq.q || "",
    answer: typeof (faq.answer || faq.a) === "string" 
      ? (faq.answer || faq.a) 
      : JSON.stringify(faq.answer || faq.a),
  })).filter(faq => faq.question && faq.answer);

  if (normalizedFaqs.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: normalizedFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer.replace(/<[^>]*>/g, ""), // Strip HTML for schema
      },
    })),
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <JsonLd data={schema} />
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-[hsl(var(--heading-blue))]">
          {title}
        </h2>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {normalizedFaqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  <div
                    className="text-muted-foreground prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

