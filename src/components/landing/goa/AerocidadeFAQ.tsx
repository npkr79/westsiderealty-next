"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { LandingPageFAQ } from "@/services/admin/supabaseLandingPagesService";

interface AerocidadeFAQProps {
  faqs: LandingPageFAQ[];
}

export default function AerocidadeFAQ({ faqs }: AerocidadeFAQProps) {
  if (faqs.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-teal-50/30">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600">
            Everything you need to know about Aerocidade
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.id}
              value={`item-${index}`}
              className="border-2 border-teal-100 rounded-lg px-4 bg-white hover:border-teal-300 transition-colors"
            >
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-teal-600">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 leading-relaxed pt-2">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

