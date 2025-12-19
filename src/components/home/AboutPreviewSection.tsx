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
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <Card className="overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-0 items-stretch">
            {aboutImage && (
              <div className="relative h-64 w-full lg:h-auto lg:min-h-[400px]">
                <Image
                  src={aboutImage}
                  alt="About RE/MAX Westside Realty"
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="transition-transform duration-300 hover:scale-105"
                />
              </div>
            )}
            <CardContent className="flex flex-col justify-center py-8 px-6 lg:py-12 lg:px-12 space-y-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                Why Choose RE/MAX Westside Realty?
              </h2>
              <p className="text-muted-foreground text-base lg:text-lg leading-relaxed max-w-2xl">
                We are a trusted real estate advisory with deep expertise in Hyderabad, Goa, and
                Dubai. Our team combines local market knowledge with global best practices to help
                you make confident property decisions.
              </p>
              <div>
                <Button asChild size="lg">
                  <Link href="/about">Learn More</Link>
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </section>
  );
}


