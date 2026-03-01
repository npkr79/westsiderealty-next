import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Westside Realty | Listings Platform",
  description: "Explore verified real estate listings across micro-markets and projects.",
};

export const revalidate = 120;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Westside Realty Listings</h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Discover project listings, developer profiles, and micro-market pages with canonical SEO-safe routes.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/hyderabad" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium">
            Hyderabad
          </Link>
          <Link href="/developers" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium">
            Developers
          </Link>
          <Link href="/hyderabad/micro-markets" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium">
            Micro-markets
          </Link>
        </div>
      </section>
    </main>
  );
}
