"use client";

import Link from "next/link";

interface CityHubBacklinkProps {
  citySlug?: string;
  cityName?: string;
}

/**
 * Simple SEO-friendly backlink component to the main city hub page.
 * Used at the bottom of property, project and micro-market pages.
 */
export default function CityHubBacklink({ citySlug = "hyderabad", cityName }: CityHubBacklinkProps) {
  const slug = citySlug || "hyderabad";
  const name = cityName || slug.charAt(0).toUpperCase() + slug.slice(1);

  return (
    <section className="py-10 bg-secondary/10 border-t border-border mt-10">
      <div className="container mx-auto px-4 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          Exploring {name}? View the full investment guide, micro-markets, and featured projects on the city hub.
        </p>
        <Link
          href={`/${slug}`}
          className="inline-flex items-center justify-center rounded-full border border-primary px-5 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
        >
          Go to {name} Real Estate Hub
        </Link>
      </div>
    </section>
  );
}


