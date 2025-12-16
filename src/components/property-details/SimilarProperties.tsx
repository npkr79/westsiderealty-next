"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

interface SimilarPropertiesProps {
  currentPropertyId: string;
  location: string;
  bedrooms?: string | number;
  price?: number;
}

/**
 * Lightweight placeholder that simply renders a static message.
 * In the original SPA this showed dynamic similar properties; here we keep the
 * layout hook but skip complex querying until a dedicated implementation is added.
 */
export default function SimilarProperties({
  location,
}: SimilarPropertiesProps) {
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-2xl font-semibold text-foreground">
        Similar properties in {location}
      </h2>
      <Card>
        <CardContent className="flex items-center gap-4 py-6">
          <div className="relative h-16 w-24 overflow-hidden rounded-md bg-muted">
            <Image
              src="/placeholder.svg"
              alt="Similar property placeholder"
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              A curated list of similar properties will appear here in a future enhancement.
            </p>
            <Link href="/hyderabad/buy" className="text-sm font-medium text-primary underline underline-offset-2">
              Browse more listings
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}


