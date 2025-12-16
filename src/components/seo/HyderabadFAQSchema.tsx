"use client";

type FAQ = {
  question: string;
  answer: string;
};

interface HyderabadFAQSchemaProps {
  faqData: FAQ[];
}

/**
 * Client-side helper to render a FAQPage JSON-LD script for Hyderabad city page.
 * This mirrors the old SPA behavior but is safe to use inside the Next.js App Router.
 */
export default function HyderabadFAQSchema({ faqData }: HyderabadFAQSchemaProps) {
  if (!faqData || faqData.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqData.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      // Use JSON.stringify to embed valid JSON-LD
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}


