"use client";

import { Card, CardContent } from "@/components/ui/card";

interface AboutPreviewSectionProps {
  aboutImage?: string | any;
}

export default function AboutPreviewSection({ aboutImage }: AboutPreviewSectionProps = {}) {
  return (
    <section className="py-10">
      <div className="container mx-auto max-w-4xl px-4">
        <Card>
          <CardContent className="py-6">
            <h2 className="text-2xl font-bold mb-3">Why Choose RE/MAX Westside Realty?</h2>
            <p className="text-muted-foreground">
              We are a trusted real estate advisory with deep expertise in Hyderabad, Goa, and
              Dubai. Our team combines local market knowledge with global best practices to help
              you make confident property decisions.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}


