"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ServicesCTASection() {
  return (
    <section className="py-16 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--heading-blue))]">
            Ready to Start Shortlisting the Right Properties?
          </h2>
          <p className="text-muted-foreground text-lg">
            Share your requirements and get a curated shortlist for Hyderabad resale, Goa holiday homes, or Dubai
            investments within 24–48 hours.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="px-8" asChild>
              <Link href="/contact">Talk to an Advisor</Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8" asChild>
              <Link href="/hyderabad/buy">Browse Hyderabad Listings</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}


