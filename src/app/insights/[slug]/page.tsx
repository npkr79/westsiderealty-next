import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/common/SEO";

const PAGE_META: Record<string, { title: string; desc: string; badge?: string }> = {
  "price-tracker": {
    title: "Price Tracker",
    desc: "Live price movements across Hyderabad micro-markets — updated daily from RERA filings.",
    badge: "LIVE",
  },
  reports: {
    title: "Market Reports",
    desc: "Quarterly corridor analysis and deep-dive market reports for serious buyers.",
  },
  outlook: {
    title: "5-Year Outlook",
    desc: "AI-powered appreciation forecasts and investment scenarios by micro-market.",
    badge: "AI",
  },
  "buyers-guide": {
    title: "Buyer's Guide",
    desc: "End-to-end guide for Hyderabad home buyers — from RERA checks to registration.",
  },
  rera: {
    title: "RERA Updates",
    desc: "Latest regulatory changes, new project registrations, and compliance notices.",
  },
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const meta = PAGE_META[params.slug];
  const title = meta ? `${meta.title} | Westside Realty Intelligence` : "Insights | Westside Realty";
  return { title };
}

export default function InsightsSubPage({ params }: { params: { slug: string } }) {
  const meta = PAGE_META[params.slug];
  const title = meta?.title ?? params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const desc = meta?.desc ?? "This section is being updated with fresh data and analysis.";
  const badge = meta?.badge;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: desc,
    author: { "@type": "Organization", name: "Westside Realty" },
    publisher: {
      "@type": "Organization",
      name: "Westside Realty",
      logo: { "@type": "ImageObject", url: "https://www.westsiderealty.in/logo.png" },
    },
    url: `https://www.westsiderealty.in/insights/${params.slug}`,
  };

  return (
    <main style={{ background: "#080808", minHeight: "100vh" }}>
      <JsonLd jsonLd={articleSchema} />
      <section
        className="pt-20 pb-16 px-4"
        style={{ background: "linear-gradient(to bottom, #0d0d0d, #080808)" }}
      >
        <div className="container mx-auto max-w-3xl">
          <Link
            href="/insights"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors mb-6 inline-block"
          >
            ← Back to Insights
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#c8a96e" }}>
              Market Intelligence
            </p>
            {badge && (
              <span
                className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase"
                style={
                  badge === "LIVE"
                    ? { background: "rgba(34,197,94,0.15)", color: "#86efac", borderColor: "rgba(34,197,94,0.3)" }
                    : { background: "rgba(139,92,246,0.15)", color: "#c4b5fd", borderColor: "rgba(139,92,246,0.3)" }
                }
              >
                {badge}
              </span>
            )}
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">{title}</h1>
          <p className="text-slate-400 text-lg mb-12 max-w-xl">{desc}</p>

          {/* Coming soon state */}
          <div
            className="rounded-2xl border border-white/8 p-10 text-center"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <p className="text-slate-500 text-sm mb-2">Publishing soon</p>
            <p className="text-slate-600 text-xs">
              Our analysts are compiling this section. Check back shortly or talk to an expert now.
            </p>
          </div>

          <div
            className="mt-8 rounded-2xl border border-white/8 p-6"
            style={{ background: "rgba(200,169,110,0.05)", borderColor: "rgba(200,169,110,0.2)" }}
          >
            <p className="text-white font-semibold mb-2">Get this analysis now — from a human</p>
            <p className="text-slate-400 text-sm mb-4">
              Our advisors can walk you through the data for any project or corridor. Free, no obligation.
            </p>
            <Link
              href="/contact"
              className="inline-block rounded-full px-5 py-2 text-sm font-bold uppercase tracking-[0.1em]"
              style={{ background: "linear-gradient(135deg, #c8a96e, #a8843e)", color: "#0a0a0a" }}
            >
              Talk to an Expert
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
