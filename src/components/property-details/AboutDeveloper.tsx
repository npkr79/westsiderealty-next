"use client";

import Link from "next/link";

interface AboutDeveloperProps {
  developerName: string;
}

export default function AboutDeveloper({ developerName }: AboutDeveloperProps) {
  if (!developerName) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-2xl font-semibold text-foreground">About {developerName}</h2>
      <p className="text-sm text-muted-foreground">
        {developerName} is a reputed developer associated with premium projects in this micro-market.
        For more detailed developer-wise listings and profiles, explore our{" "}
        <Link href="/developers" className="underline underline-offset-2 text-primary">
          developers hub
        </Link>
        .
      </p>
    </section>
  );
}


