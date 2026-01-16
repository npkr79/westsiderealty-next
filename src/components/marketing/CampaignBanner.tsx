import Link from "next/link";
import { Briefcase, Globe, TrendingUp } from "lucide-react";

const CAMPAIGN_END_DATE = new Date("2026-03-01T00:00:00.000Z");
const CTA_URL =
  "https://www.westsiderealty.in/landing/godrej-regal-pavilion-rajendra-nagar-hyderabad?utm_source=network_banner&utm_campaign=feb_offer";

export default function CampaignBanner() {
  if (new Date() > CAMPAIGN_END_DATE) return null;

  return (
    <section className="mb-8 rounded-2xl border border-[#D4AF37]/30 bg-[#0A192F] p-4 text-white shadow-xl md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="lg:max-w-xl">
          <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
            Featured Opportunity
          </p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">
            Own a Home in Godrej Rajendra Nagar with just{" "}
            <span className="text-[#D4AF37] font-bold">5% Down</span>
          </h2>
          <p className="mt-3 text-sm text-white/80 sm:text-base">
            Use your home loan eligibility wisely to double your investment.
          </p>

          <div className="mt-5 hidden lg:block">
            <Link
              href={CTA_URL}
              className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#0A192F] transition hover:opacity-90"
            >
              Check My Eligibility
            </Link>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0 lg:w-2/3">
          <div className="min-w-[240px] snap-start rounded-xl border border-white/10 bg-white/5 p-3 md:min-w-0 md:p-4">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <Briefcase className="h-5 w-5" />
              <span className="text-sm font-semibold">Salaried Professionals</span>
            </div>
            <p className="mt-3 text-lg font-semibold">Pay Just 0.1% Monthly</p>
            <p className="mt-1 text-sm text-white/75">
              5% Now + 5% after 1 Year. Minimal burden till possession.
            </p>
          </div>

          <div className="min-w-[240px] snap-start rounded-xl border border-white/10 bg-white/5 p-3 md:min-w-0 md:p-4">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <Globe className="h-5 w-5" />
              <span className="text-sm font-semibold">
                NRI Investors (Towers 5, 6, 9)
              </span>
            </div>
            <p className="mt-3 text-lg font-semibold">20:80 Subvention Plan</p>
            <p className="mt-1 text-sm text-white/75">
              Pay 20% Now, Zero Pre-EMI till Possession.
            </p>
          </div>

          <div className="min-w-[240px] snap-start rounded-xl border border-white/10 bg-white/5 p-3 md:min-w-0 md:p-4">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-semibold">Self-Employed</span>
            </div>
            <p className="mt-3 text-lg font-semibold">12-Month EMI Holiday</p>
            <p className="mt-1 text-sm text-white/75">
              0% EMI for Year 1. Reduced rates (0.2%) for Year 2.
            </p>
          </div>
        </div>

        <div className="lg:hidden" />
      </div>

      <div className="md:hidden h-16" />

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:hidden">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-2">
          <span className="text-sm font-semibold text-gray-900">
            Godrej 5% Down Offer
          </span>
          <Link
            href={CTA_URL}
            className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0A192F] transition hover:opacity-90"
          >
            Check Eligibility
          </Link>
        </div>
      </div>
    </section>
  );
}
