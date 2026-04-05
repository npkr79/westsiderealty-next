import HeroIntelligence from "@/components/intelligence-home/HeroIntelligence";
import SystemsGateway from "@/components/intelligence-home/SystemsGateway";
import CityIntelligenceSnapshot from "@/components/intelligence-home/CityIntelligenceSnapshot";
import WhyWestside from "@/components/intelligence-home/WhyWestside";
import WhoItsFor from "@/components/intelligence-home/WhoItsFor";
import WestsideAdvisory from "@/components/intelligence-home/WestsideAdvisory";
import IntelligenceFooter from "@/components/intelligence-home/IntelligenceFooter";

export const revalidate = 3600;

export default function IntelligenceHomePage() {
  return (
    <main className="bg-slate-50 text-slate-900">
      <HeroIntelligence />
      <SystemsGateway />
      <CityIntelligenceSnapshot />
      <WhyWestside />
      <WhoItsFor />
      <WestsideAdvisory />
      <section className="bg-slate-950">
        <div className="mx-auto max-w-6xl px-6 pb-10 text-xs uppercase tracking-[0.24em] text-slate-500">
          Residential Intelligence dashboards launching soon.
        </div>
      </section>
      <IntelligenceFooter />
    </main>
  );
}
