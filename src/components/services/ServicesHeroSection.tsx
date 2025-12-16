"use client";

import { Building2, Palmtree, Landmark } from "lucide-react";

export default function ServicesHeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-primary/80 py-20 text-primary-foreground">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,#ffffff_0,transparent_40%),radial-gradient(circle_at_bottom_right,#ffffff_0,transparent_40%)]" />
      <div className="container relative z-10 mx-auto px-4">
        <div className="grid gap-10 md:grid-cols-[1.8fr,1.2fr] items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
              End-to-End Real Estate Advisory
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              One Team for Hyderabad Resale, Goa Holiday Homes & Dubai Investments.
            </h1>
            <p className="text-sm md:text-base text-primary-foreground/90 max-w-2xl">
              Work with specialists who understand premium resale, second homes, and global investments.
              We curate inventory, negotiate on your behalf, and manage the transaction till registration.
            </p>
            <div className="grid gap-4 sm:grid-cols-3 text-sm">
              <div className="rounded-lg bg-primary-foreground/5 p-4">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/15">
                  <Building2 className="h-4 w-4" />
                </div>
                <p className="font-semibold">Hyderabad Resale</p>
                <p className="text-xs text-primary-foreground/80">
                  Kokapet, Neopolis, Financial District, Gandipet & gated communities.
                </p>
              </div>
              <div className="rounded-lg bg-primary-foreground/5 p-4">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/15">
                  <Palmtree className="h-4 w-4" />
                </div>
                <p className="font-semibold">Goa Holiday Homes</p>
                <p className="text-xs text-primary-foreground/80">
                  Villas & apartments curated for rental yield and appreciation.
                </p>
              </div>
              <div className="rounded-lg bg-primary-foreground/5 p-4">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/15">
                  <Landmark className="h-4 w-4" />
                </div>
                <p className="font-semibold">Dubai Investments</p>
                <p className="text-xs text-primary-foreground/80">
                  Off-plan & rental-assured projects in marquee communities.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-primary-foreground/5 p-6 shadow-xl backdrop-blur">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em]">
              How We Help
            </p>
            <ul className="space-y-3 text-sm text-primary-foreground/90">
              <li>• Curated shortlists instead of endless online browsing.</li>
              <li>• Property comparisons with on-ground pros & cons.</li>
              <li>• Negotiation support with sellers and developers.</li>
              <li>• Coordination with banks, lawyers, and registration offices.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}


