import type { Metadata } from "next";

type FAQItem = {
  question: string;
  answer: string;
};

type PrimaryEntityType = "Product" | "RealEstateListing" | "Place" | "CollectionPage" | "Article" | "ItemList";

interface UnifiedSchemaInput {
  pageUrl: string;
  title: string;
  description: string;
  heroImageUrl?: string | null;
  primaryEntityType?: PrimaryEntityType;
  primaryEntity?: Record<string, any> | null;
  faqItems?: FAQItem[];
  breadcrumbs?: { name: string; item?: string }[];
}

// Safe toLowerCase helper - guards against undefined/null values
const safeLower = (v: unknown): string => (typeof v === "string" ? v : "").toLowerCase();

/**
 * Central helper to build a unified @graph JSON-LD schema.
 *
 * Entities:
 * - #organization  (RE/MAX Westside)
 * - #website      (root site)
 * - #webpage      (current page)
 * - #primary      (Product or RealEstateListing)
 * - #faq          (optional FAQPage)
 *
 * This function is defensive: it will omit entities whose required data is missing
 * rather than throwing, so it is safe to call from any page.
 */
export function generateUnifiedSchema(input: UnifiedSchemaInput) {
  const {
    pageUrl,
    title,
    description,
    heroImageUrl,
    primaryEntityType,
    primaryEntity,
    faqItems = [],
  } = input;

  // Guard against undefined/null inputs
  const safePageUrl = pageUrl ?? "";
  const safeTitle = title ?? "";
  const safeDescription = description ?? "";

  const baseUrl = "https://www.westsiderealty.in";

  const graph: any[] = [];

  // Organization (#organization)
  const organization = {
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "RE/MAX Westside Realty",
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo.jpg",
    },
    image:
      "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo.jpg",
    telephone: "+919866085831",
    email: "info@westsiderealty.in",
    address: {
      "@type": "PostalAddress",
      streetAddress: "415, 4th Floor, Kokapet Terminal, Kokapet",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      postalCode: "500075",
      addressCountry: "IN",
    },
    openingHours: "Mo-Sa 09:00-18:00",
    priceRange: "₹₹₹",
  };
  graph.push(organization);

  // WebSite (#website)
  const website = {
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "RE/MAX Westside Realty",
    publisher: {
      "@id": `${baseUrl}/#organization`,
    },
  };
  graph.push(website);

  // WebPage (#webpage)
  const webPageId = `${safePageUrl}#webpage`;
  const webPage: any = {
    "@type": "WebPage",
    "@id": webPageId,
    url: safePageUrl,
    name: safeTitle,
    description: safeDescription,
    isPartOf: {
      "@id": `${baseUrl}/#website`,
    },
    publisher: {
      "@id": `${baseUrl}/#organization`,
    },
  };

  if (heroImageUrl) {
    webPage.image = {
      "@type": "ImageObject",
      url: heroImageUrl,
    };
  }

  graph.push(webPage);

  // Primary entity (#primary)
  if (primaryEntity && Object.keys(primaryEntity).length > 0) {
    const primaryId = `${safePageUrl}#primary`;

    const basePrimary: any = {
      "@id": primaryId,
      ...primaryEntity,
    };

    // Ensure @type is set correctly
    if (!basePrimary["@type"] && primaryEntityType) {
      basePrimary["@type"] = primaryEntityType;
    }

    graph.push(basePrimary);

    // Link WebPage -> primary entity
    webPage.mainEntity = { "@id": primaryId };
  }

  // Breadcrumbs (if provided) - guard all property access
  if (input.breadcrumbs && Array.isArray(input.breadcrumbs) && input.breadcrumbs.length > 0) {
    webPage.breadcrumb = {
      "@type": "BreadcrumbList",
      itemListElement: (input.breadcrumbs ?? []).map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb?.name ?? "",
        item: crumb?.item ?? baseUrl,
      })),
    };
  }

  // FAQPage (#faq) if we have FAQs - guard all property access
  const cleanedFaqs = Array.isArray(faqItems)
    ? (faqItems ?? []).filter((f) => f && f?.question && f?.answer)
    : [];

  if (cleanedFaqs.length > 0) {
    const faqId = `${safePageUrl}#faq`;
    const faqPage = {
      "@type": "FAQPage",
      "@id": faqId,
      isPartOf: {
        "@id": webPageId,
      },
      mainEntity: (cleanedFaqs ?? []).map((faq) => ({
        "@type": "Question",
        name: faq?.question ?? "",
        acceptedAnswer: {
          "@type": "Answer",
          text: faq?.answer ?? "",
        },
      })),
    };

    graph.push(faqPage);

    // Link WebPage -> FAQ via hasPart
    if (!Array.isArray(webPage.hasPart)) {
      webPage.hasPart = [];
    }
    webPage.hasPart.push({ "@id": faqId });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

/**
 * Optional helper to derive a basic Metadata object for simple pages.
 * Not required everywhere, but useful if you want to standardize title/description.
 */
export function buildBasicMetadata(params: {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl?: string;
}): Metadata {
  const { title, description, canonicalUrl, imageUrl } = params;

  const ogImage = imageUrl || "https://www.westsiderealty.in/placeholder.svg";

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "RE/MAX Westside Realty",
      type: "website",
      locale: "en_IN",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}


