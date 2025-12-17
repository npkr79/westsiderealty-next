"use client";

import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AboutPreviewSectionProps {
  aboutImage?: string | any;
}

export default function AboutPreviewSection({ aboutImage }: AboutPreviewSectionProps = {}) {
  return (
    <section className="py-10">
      <div className="container mx-auto max-w-4xl px-4">
        <Card className="overflow-hidden md:flex">
          {aboutImage && (
            <div className="relative h-48 w-full md:h-auto md:w-1/2">
              <Image
                src={aboutImage}
                alt="About Us"
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="transition-transform duration-300 hover:scale-105"
              />
            </div>
          )}
          <CardContent className="py-6 md:w-1/2 md:p-8 space-y-4">
            <h2 className="text-2xl font-bold">Why Choose RE/MAX Westside Realty?</h2>
            <p className="text-muted-foreground">
              We are a trusted real estate advisory with deep expertise in Hyderabad, Goa, and
              Dubai. Our team combines local market knowledge with global best practices to help
              you make confident property decisions.
            </p>
            <Button asChild>
              <Link href="/about">Learn More</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}


