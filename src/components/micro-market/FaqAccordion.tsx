"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqAccordionProps {
  faqs: Array<{ question: string; answer: string }>;
}

export default function FaqAccordion({ faqs }: FaqAccordionProps) {
  return (
    <Accordion type="single" collapsible className="space-y-2">
      {faqs.map((faq, i) => (
        <AccordionItem
          key={i}
          value={`faq-${i}`}
          className="border border-slate-200 rounded-lg px-4"
        >
          <AccordionTrigger className="text-left font-medium text-slate-800 hover:no-underline py-4">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-slate-600 pb-4 leading-relaxed">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
