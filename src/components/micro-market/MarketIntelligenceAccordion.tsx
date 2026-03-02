"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  WhyThisMarket,
  SupplyDevelopment,
  DemandLiquidity,
  DeveloperCapital,
  InfrastructureFuture,
  RiskOutlook,
} from "./index";
import type { MicroMarketViewModel } from "@/services/microMarketViewModel";

interface MarketIntelligenceAccordionProps {
  whyThisMarket: MicroMarketViewModel["whyThisMarket"];
  supplyDevelopment: MicroMarketViewModel["supplyDevelopment"];
  demandLiquidity: MicroMarketViewModel["demandLiquidity"];
  developerCapital: MicroMarketViewModel["developerCapital"];
  infrastructureFuture: MicroMarketViewModel["infrastructureFuture"];
  riskOutlook: MicroMarketViewModel["riskOutlook"];
  whyInvestSummary: string;
  supplyDemandSummary: string;
  developerSummary: string;
  riskSummary: string;
}

export default function MarketIntelligenceAccordion({
  whyThisMarket,
  supplyDevelopment,
  demandLiquidity,
  developerCapital,
  infrastructureFuture,
  riskOutlook,
  whyInvestSummary,
  supplyDemandSummary,
  developerSummary,
  riskSummary,
}: MarketIntelligenceAccordionProps) {
  return (
    <Accordion type="single" collapsible className="space-y-3">
      <AccordionItem
        value="why-invest"
        className="rounded-xl border border-gray-200 bg-white px-4"
      >
        <AccordionTrigger className="text-left hover:no-underline">
          <span className="flex flex-col items-start">
            <span className="font-semibold text-slate-900">Why invest here?</span>
            <span className="text-xs text-gray-400 font-normal mt-0.5">
              {whyInvestSummary}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <WhyThisMarket data={whyThisMarket} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem
        value="supply-demand"
        className="rounded-xl border border-gray-200 bg-white px-4"
      >
        <AccordionTrigger className="text-left hover:no-underline">
          <span className="flex flex-col items-start">
            <span className="font-semibold text-slate-900">Supply &amp; Demand</span>
            <span className="text-xs text-gray-400 font-normal mt-0.5">
              {supplyDemandSummary}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-8">
            <SupplyDevelopment data={supplyDevelopment} />
            <DemandLiquidity data={demandLiquidity} />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem
        value="developer-activity"
        className="rounded-xl border border-gray-200 bg-white px-4"
      >
        <AccordionTrigger className="text-left hover:no-underline">
          <span className="flex flex-col items-start">
            <span className="font-semibold text-slate-900">Developer Activity</span>
            <span className="text-xs text-gray-400 font-normal mt-0.5">
              {developerSummary}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <DeveloperCapital data={developerCapital} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem
        value="risk-outlook"
        className="rounded-xl border border-gray-200 bg-white px-4"
      >
        <AccordionTrigger className="text-left hover:no-underline">
          <span className="flex flex-col items-start">
            <span className="font-semibold text-slate-900">Risk &amp; Outlook</span>
            <span className="text-xs text-gray-400 font-normal mt-0.5">{riskSummary}</span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-8">
            <InfrastructureFuture data={infrastructureFuture} />
            <RiskOutlook data={riskOutlook} />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
