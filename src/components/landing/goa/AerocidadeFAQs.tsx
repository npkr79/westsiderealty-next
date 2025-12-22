"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { JsonLd } from "@/components/common/SEO";

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: "What is Aerocidade Goa?",
    answer: "Aerocidade Goa is a premium studio apartment project located just 5 minutes from Goa's Manohar International Airport in Dabolim. It offers fully-furnished 582 sq.ft studio units designed for investment with guaranteed 12% rental yields from day one."
  },
  {
    question: "What is the unit size and configuration?",
    answer: "Each unit is a fully-furnished studio apartment measuring 582 sq.ft, designed for optimal space utilization with modern amenities and premium finishes."
  },
  {
    question: "What is the price of a studio apartment at Aerocidade?",
    answer: "Studios are priced at ₹51.5 Lakhs (all-inclusive). This includes full furnishing, clubhouse access, and property management setup."
  },
  {
    question: "What is the expected rental yield?",
    answer: "Aerocidade offers 12% rental yield starting from Day 1 of possession, managed professionally by The Clarks Hotels & Resorts."
  },
  {
    question: "Who manages the property?",
    answer: "The property is managed by The Clarks Hotels & Resorts, a renowned hospitality brand with 50+ years of experience in hotel management across India."
  },
  {
    question: "Is this a hassle-free investment?",
    answer: "Yes, absolutely. The Clarks Hotels handles all aspects including guest bookings, housekeeping, maintenance, and rental collection. You receive passive income without any operational involvement."
  },
  {
    question: "What is the payment plan?",
    answer: "The payment plan is structured as: 50% on booking, 25% after 1 year, and 25% on possession."
  },
  {
    question: "When is the expected possession?",
    answer: "The project is expected to be ready for possession soon. Contact us for the latest timeline and site visit arrangements."
  },
  {
    question: "What amenities are included?",
    answer: "Premium amenities include swimming pool, fitness center, restaurant, 24/7 security, landscaped gardens, covered parking, and clubhouse facilities."
  },
  {
    question: "Is this RERA registered?",
    answer: "Yes, Aerocidade is fully RERA registered ensuring complete transparency and legal compliance."
  },
  {
    question: "What makes Dabolim location strategic?",
    answer: "Dabolim offers proximity to both North and Goa beaches, the international airport, major highways, and is an emerging tourism hub with year-round demand."
  },
  {
    question: "Can I use the apartment for personal stays?",
    answer: "Yes, owners can use their apartment for personal stays. The rental management agreement typically allows owner usage with advance booking."
  },
  {
    question: "What are the maintenance charges?",
    answer: "Maintenance is included in the management fee. The Clarks Hotels handles all upkeep, ensuring your property remains in premium condition."
  },
  {
    question: "Is financing available?",
    answer: "Yes, bank financing is available from leading banks. We can assist with loan processing and documentation."
  },
  {
    question: "Why invest in Goa real estate?",
    answer: "Goa offers year-round tourism, limited land availability, growing infrastructure, and consistent rental demand. Property values have appreciated 8-12% annually over the past decade."
  },
  {
    question: "What documents are required for booking?",
    answer: "You'll need PAN card, Aadhaar card, passport-size photos, and address proof. NRIs can also invest with additional KYC documentation."
  },
  {
    question: "Is there a lock-in period for the rental program?",
    answer: "Typically, there's a 3-year lock-in for the rental management program to ensure consistent returns and operational efficiency."
  }
];

// Generate FAQPage Schema for SEO
function generateFAQPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

export default function AerocidadeFAQs() {
  const faqSchema = generateFAQPageSchema();

  return (
    <>
      {/* FAQPage Schema for SEO */}
      <JsonLd jsonLd={faqSchema} />

      <section className="py-16 px-4 bg-gradient-to-b from-white to-teal-50/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about Aerocidade Goa
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-2 border-teal-100 rounded-lg px-4 bg-white hover:border-teal-300 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-teal-600 py-4 transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed pt-2 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}

