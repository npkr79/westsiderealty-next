import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Market Insights | Westside Realty Intelligence",
  description: "Market analysis, price trends, and buyer guides for Hyderabad real estate.",
};

const SECTIONS = [
  {
    href: "/insights/price-tracker",
    label: "Price Tracker",
    desc: "Live price movements across Hyderabad micro-markets",
    badge: "LIVE",
    badgeColor: { bg: "rgba(34,197,94,0.15)", text: "#86efac", border: "rgba(34,197,94,0.3)" },
  },
  {
    href: "/insights/reports",
    label: "Market Reports",
    desc: "Quarterly reports and corridor analysis",
  },
  {
    href: "/insights/outlook",
    label: "5-Year Outlook",
    desc: "AI-powered appreciation forecasts by micro-market",
    badge: "AI",
    badgeColor: { bg: "rgba(139,92,246,0.15)", text: "#c4b5fd", border: "rgba(139,92,246,0.3)" },
  },
  {
    href: "/insights/buyers-guide",
    label: "Buyer's Guide",
    desc: "End-to-end guide for Hyderabad home buyers",
  },
  {
    href: "/insights/rera",
    label: "RERA Updates",
    desc: "Latest regulatory changes and project registrations",
  },
];

export default function InsightsPage() {
  return (
    <main style={{ background: "#080808", minHeight: "100vh" }}>
      <section
        className="pt-20 pb-16 px-4"
        style={{ background: "linear-gradient(to bottom, #0d0d0d, #080808)" }}
      >
        <div className="container mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#c8a96e" }}>
            Market Intelligence
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Insights</h1>
          <p className="text-slate-400 text-lg mb-12 max-w-xl">
            Market analysis, price trends, and buyer guides — updated weekly.
          </p>

          <div className="space-y-3">
            {SECTIONS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="flex items-center justify-between rounded-2xl border border-white/8 p-5 transition-all duration-200 hover:border-white/20 hover:bg-white/4 group"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold">{s.label}</span>
                    {s.badge && s.badgeColor && (
                      <span
                        className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase"
                        style={{
                          background: s.badgeColor.bg,
                          color: s.badgeColor.text,
                          borderColor: s.badgeColor.border,
                        }}
                      >
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm">{s.desc}</p>
                </div>
                <span className="text-slate-600 group-hover:text-slate-300 transition-colors text-lg">→</span>
              </Link>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-white/8 p-6" style={{ background: "rgba(200,169,110,0.05)", borderColor: "rgba(200,169,110,0.2)" }}>
            <p className="text-white font-semibold mb-2">Get personalised analysis</p>
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
