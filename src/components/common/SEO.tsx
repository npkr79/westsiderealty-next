import React from "react";
import { Metadata } from "next";

export interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  imageUrl?: string;
  type?: string; // e.g., "website", "article"
  siteName?: string;
  // JSON-LD structured data - can be single object or array of objects
  jsonLd?: object | object[];
  keywords?: string;
}

const DEFAULT_TITLE = "RE/MAX Westside Realty - Premium Real Estate Advisory";
const DEFAULT_DESCRIPTION =
  "RE/MAX Westside Realty, Hyderabad & Goa: Leading real estate agents offering expert advisory & exclusive listings for resale, investment & holiday homes. Buy, sell, or invest with confidence.";
const DEFAULT_IMAGE = "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets//remax-favicon.png";
const DEFAULT_SITE_NAME = "RE/MAX Westside Realty";
const BASE_URL = "https://www.westsiderealty.in";

export function buildMetadata({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  canonicalUrl,
  imageUrl = DEFAULT_IMAGE,
  type = "website",
  siteName = DEFAULT_SITE_NAME,
  keywords,
}: SEOProps): Metadata {
  return {
    title,
    description,
    keywords,
    alternates: canonicalUrl
      ? {
          canonical: canonicalUrl,
        }
      : undefined,
    openGraph: {
      title,
      description,
      type,
      siteName,
      url: canonicalUrl ?? BASE_URL,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
    metadataBase: new URL(BASE_URL),
  };
}

export function JsonLd({ jsonLd }: { jsonLd?: object | object[] }) {
  if (!jsonLd) return null;

  const payload = Array.isArray(jsonLd) ? jsonLd : [jsonLd];

  return (
    <>
      {payload.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          // Prevent React/Next hydration warnings when embedding JSON-LD
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

export const defaultSeo = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  imageUrl: DEFAULT_IMAGE,
  siteName: DEFAULT_SITE_NAME,
  baseUrl: BASE_URL,
};

// Simple default SEO component for client routes that expect a default export.
// For App Router pages, prefer using the buildMetadata helper instead.
export default function SEO(props: SEOProps) {
  const {
    title = DEFAULT_TITLE,
    description = DEFAULT_DESCRIPTION,
    canonicalUrl,
    imageUrl = DEFAULT_IMAGE,
    type = "website",
    siteName = DEFAULT_SITE_NAME,
    jsonLd,
    keywords,
  } = props;

  const meta: Metadata = buildMetadata({
    title,
    description,
    canonicalUrl,
    imageUrl,
    type,
    siteName,
    keywords,
  });

  return (
    <>
      {/* Basic meta tags for client-rendered pages – Next will also use metadata in app routes */}
      <title>{meta.title as string}</title>
      {meta.description && <meta name="description" content={meta.description} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      {jsonLd && <JsonLd jsonLd={jsonLd} />}
    </>
  );
}
