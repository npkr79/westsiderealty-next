/**
 * Server-side component to render FAQPage JSON-LD schema for city pages.
 * Handles both flat and nested FAQ structures from city_faqs_json.
 */

type FAQ = {
  question?: string;
  answer?: string;
  q?: string;
  a?: string;
};

type FAQCategory = {
  category?: string;
  faqs?: FAQ[];
};

type FAQData = FAQ[] | FAQCategory[];

interface CityFAQSchemaProps {
  faqData: FAQData;
}

/**
 * Flatten FAQ data structure to extract all FAQs
 * Handles both formats:
 * 1. Flat: [{ question, answer }, ...]
 * 2. Nested: [{ category, faqs: [{ question, answer }] }, ...]
 */
function flattenFAQs(faqData: FAQData): Array<{ question: string; answer: string }> {
  if (!faqData || !Array.isArray(faqData) || faqData.length === 0) {
    return [];
  }

  const flattened: Array<{ question: string; answer: string }> = [];

  for (const item of faqData) {
    // Check if it's a category with nested FAQs
    if ('category' in item && Array.isArray(item.faqs)) {
      // Nested structure: { category, faqs: [...] }
      for (const faq of item.faqs) {
        const question = faq.question || faq.q || '';
        const answer = faq.answer || faq.a || '';
        
        // Only add if both question and answer exist
        if (question && answer) {
          flattened.push({
            question: question.trim(),
            answer: typeof answer === 'string' ? answer.trim() : JSON.stringify(answer),
          });
        }
      }
    } else {
      // Flat structure: { question, answer }
      const question = (item as FAQ).question || (item as FAQ).q || '';
      const answer = (item as FAQ).answer || (item as FAQ).a || '';
      
      // Only add if both question and answer exist
      if (question && answer) {
        flattened.push({
          question: question.trim(),
          answer: typeof answer === 'string' ? answer.trim() : JSON.stringify(answer),
        });
      }
    }
  }

  return flattened;
}

/**
 * Server-side component to render FAQPage JSON-LD schema.
 * Works for all cities (Hyderabad, Goa, Dubai).
 */
export default function CityFAQSchema({ faqData }: CityFAQSchemaProps) {
  // Flatten and normalize FAQ data
  const normalizedFAQs = flattenFAQs(faqData);

  if (normalizedFAQs.length === 0) {
    return null;
  }

  // Generate FAQPage schema
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: normalizedFAQs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer.replace(/<[^>]*>/g, ""), // Strip HTML tags for schema
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}


