import Image from "next/image";
import type { Metadata } from "next";
import { Playfair_Display, Inter, Montserrat } from "next/font/google";
import LuxuryLeadForm from "@/components/landing/LuxuryLeadForm";

export const revalidate = 3600;

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
});
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Kokapet & Gandipet Villa Market Intelligence Brief",
  description:
    "Private market intelligence report on villa supply, pricing, and investment outlook in Kokapet and Gandipet.",
};

const buyerProfiles = [
  "Startup founders",
  "CXOs",
  "NRIs",
  "Doctors",
  "Developers",
  "Film professionals",
];


export default function KokapetGandipetVillasMarketIntelligenceBrief() {
  return (
    <main
      className={`${playfair.variable} ${inter.variable} ${montserrat.variable} bg-[#0B0F1A] text-white`}
    >
      <div className="scroll-smooth">
        {/* HERO SECTION */}
        <section className="relative min-h-screen overflow-hidden">
          <Image
            src="/images/gandipet-aerial.jpg"
            alt="Gandipet aerial landscape"
            fill
            priority={false}
            loading="lazy"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F1A]/90 via-[#0B0F1A]/70 to-[#0B0F1A]" />
          <div className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
            <div className="max-w-3xl space-y-6 luxury-fade">
              <h1 className="font-[var(--font-playfair)] text-4xl leading-tight sm:text-5xl lg:text-6xl">
                Kokapet &amp; Gandipet
                <br />
                Villa Market Intelligence Brief
              </h1>
              <p className="font-[var(--font-inter)] text-base text-white/80 sm:text-lg">
                Supply is shrinking. Land is rising.
              </p>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <a
                  href="#private-access"
                  className="rounded-full bg-[#C9A646] px-8 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#0B0F1A] transition hover:brightness-105"
                >
                  Request Private Access
                </a>
              </div>
              <div className="mt-10 flex flex-col items-center gap-2 text-xs uppercase tracking-[0.4em] text-white/70">
                <span>Scroll</span>
                <span className="luxury-arrow" aria-hidden="true" />
              </div>
            </div>
          </div>
        </section>

        {/* INSIGHT STATEMENT SECTION */}
        <section className="px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl luxury-fade">
            <div className="rounded-3xl bg-white/[0.04] px-8 py-12 text-center sm:px-12">
              <h2 className="font-[var(--font-playfair)] text-4xl leading-snug text-[#F5F1E8] sm:text-5xl">
                Land prices have crossed the point where new villa communities
                are no longer viable.
              </h2>
              <p className="mt-6 font-[var(--font-inter)] text-sm text-white/70 sm:text-base">
                This brief maps the structural shift reshaping Hyderabad’s last
                private villa markets.
              </p>
            </div>
          </div>
        </section>

        {/* LAND ECONOMICS SECTION */}
        <section className="px-6 py-16 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8 luxury-fade">
              <h3 className="font-[var(--font-playfair)] text-2xl sm:text-3xl">
                Land Cost vs Villa Viability
              </h3>
              <div className="rounded-3xl bg-white/[0.03] px-6 py-6">
                <div className="space-y-6 font-[var(--font-montserrat)] text-xs uppercase tracking-[0.32em] text-white/60">
                  <div className="space-y-3">
                    <div className="text-white">Kokapet</div>
                    <div className="flex flex-col gap-3 text-white sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-lg">2019 → ₹25 Cr</span>
                      <span className="text-lg">2026 → ₹140 Cr</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-white">Gandipet</div>
                    <div className="flex flex-col gap-3 text-white sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-lg">2019 → ₹12 Cr</span>
                      <span className="text-lg">2026 → ₹70 Cr</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="font-[var(--font-inter)] text-sm text-white/70 sm:text-base">
                Developers now prioritize high-rise projects due to land cost
                pressure.
              </p>
            </div>
            <div className="luxury-fade">
              <div className="rounded-3xl bg-white/[0.03] px-6 py-6">
                <div className="space-y-6">
                  <div className="text-xs uppercase tracking-[0.3em] text-white/60">
                    Land cost escalation
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
                        <span>Kokapet</span>
                        <span>+460%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/10">
                        <div className="h-full w-[92%] rounded-full bg-[#C9A646]" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
                        <span>Gandipet</span>
                        <span>+483%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/10">
                        <div className="h-full w-[88%] rounded-full bg-[#C9A646]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SUPPLY SCARCITY SECTION */}
        <section className="relative px-6 py-20 sm:py-28">
          <div className="absolute inset-0">
            <Image
              src="/images/villa-layout-blur.jpg"
              alt="Blurred villa layout"
              fill
              loading="lazy"
              className="object-cover opacity-30 blur-md"
            />
          </div>
          <div className="relative z-10 mx-auto max-w-5xl text-center luxury-fade">
            <div className="rounded-3xl bg-white/[0.04] px-8 py-12 sm:px-12">
              <h3 className="font-[var(--font-playfair)] text-3xl sm:text-4xl">
                Supply Scarcity
              </h3>
              <div className="mt-12 grid gap-8 sm:grid-cols-3">
                <div className="space-y-2">
                  <div className="font-[var(--font-montserrat)] text-4xl text-[#C9A646] sm:text-5xl">
                    75
                  </div>
                  <div className="text-xs uppercase tracking-[0.3em] text-white/70">
                    Communities
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-[var(--font-montserrat)] text-4xl text-[#C9A646] sm:text-5xl">
                    12
                  </div>
                  <div className="text-xs uppercase tracking-[0.3em] text-white/70">
                    Projects
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-[var(--font-montserrat)] text-4xl text-[#C9A646] sm:text-5xl">
                    80%
                  </div>
                  <div className="text-xs uppercase tracking-[0.3em] text-white/70">
                    Resale Supply
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICE TREND SECTION */}
        <section className="px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-5xl luxury-fade">
            <div className="rounded-3xl bg-white/[0.03] px-8 py-10 sm:px-12">
              <h3 className="font-[var(--font-playfair)] text-2xl sm:text-3xl">
                Price Trend
              </h3>
              <div className="mt-10">
                <svg
                  viewBox="0 0 600 180"
                  className="h-40 w-full text-[#C9A646]"
                  aria-label="Price trend line graph"
                >
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    points="20,150 220,120 420,70 580,20"
                  />
                  <circle cx="20" cy="150" r="3" fill="currentColor" />
                  <circle cx="220" cy="120" r="3" fill="currentColor" />
                  <circle cx="420" cy="70" r="3" fill="currentColor" />
                  <circle cx="580" cy="20" r="3" fill="currentColor" />
                </svg>
                <div className="mt-6 flex flex-wrap gap-4 text-xs uppercase tracking-[0.3em] text-white/60">
                  <span>2020 → ₹7 Cr</span>
                  <span>2022 → ₹12 Cr</span>
                  <span>2026 → ₹22 Cr</span>
                </div>
                <p className="mt-6 font-[var(--font-inter)] text-sm text-white/70 sm:text-base">
                  Appreciation driven primarily by land value, not construction
                  cost.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BUYER PROFILE SECTION */}
        <section className="px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-5xl luxury-fade">
            <div className="rounded-3xl bg-white/[0.03] px-8 py-10 sm:px-12">
              <h3 className="font-[var(--font-playfair)] text-2xl sm:text-3xl">
                Buyer Profile
              </h3>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {buyerProfiles.map((profile) => (
                  <div
                    key={profile}
                    className="flex items-center gap-4 text-sm uppercase tracking-[0.3em] text-white/70"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#C9A646]" />
                    {profile}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AUTHORITY SECTION */}
        <section className="px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-4xl luxury-fade">
            <div className="rounded-3xl bg-white/[0.04] px-8 py-12 text-center sm:px-12">
              <h3 className="font-[var(--font-playfair)] text-3xl sm:text-4xl">
                Resale villas are becoming a supply-locked asset class.
              </h3>
              <p className="mt-4 font-[var(--font-inter)] text-sm text-white/70 sm:text-base">
                Limited land + rising demand = structural scarcity.
              </p>
            </div>
          </div>
        </section>

        {/* FINAL ACCESS SECTION */}
        <section className="px-6 pb-24 pt-12 sm:pb-32" id="private-access">
          <div className="mx-auto max-w-3xl luxury-fade">
            <div className="rounded-3xl bg-white/[0.04] px-8 py-12 sm:px-12">
              <h3 className="font-[var(--font-playfair)] text-2xl sm:text-3xl">
                Request Confidential Access
              </h3>
              <LuxuryLeadForm sourceLabel="kokapet-gandipet-villas-brief" />
              <p className="mt-6 text-xs uppercase tracking-[0.3em] text-white/60">
                Inventory shared only after qualification.
              </p>
            </div>
          </div>
        </section>
      </div>

    </main>
  );
}
