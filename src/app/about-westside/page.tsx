import AboutWestsideClosing from "@/components/about-westside/Closing";
import AboutWestsideDefinition from "@/components/about-westside/Definition";
import AboutWestsideEnables from "@/components/about-westside/Enables";
import AboutWestsideHero from "@/components/about-westside/Hero";
import AboutWestsidePipeline from "@/components/about-westside/Pipeline";
import AboutWestsideProblem from "@/components/about-westside/Problem";
import AboutWestsideRealtyLayer from "@/components/about-westside/RealtyLayer";
import AboutWestsideSystems from "@/components/about-westside/Systems";

export const revalidate = 3600;

export default function AboutWestsidePage() {
  return (
    <main className="bg-slate-50 text-slate-900">
      <AboutWestsideHero />
      <AboutWestsideProblem />
      <AboutWestsideDefinition />
      <AboutWestsideSystems />
      <AboutWestsidePipeline />
      <AboutWestsideEnables />
      <AboutWestsideRealtyLayer />
      <AboutWestsideClosing />
    </main>
  );
}
