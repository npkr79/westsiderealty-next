"use client";
import { CorporateOfficeLeasingForm, type LeasingCorridorContext } from "../CorporateOfficeLeasingClient";
import { trackCorporateLeasingEvent } from "@/lib/analytics/corporateLeasingTracking";
type CorridorContext = LeasingCorridorContext;
function analyticsContext(corridor: CorridorContext) {
  return { page_path: new URL(corridor.canonicalUrl).pathname, page_type: "office_leasing_corridor" as const, commercial_intent: "office_lease" as const, location_scope: corridor.locationScope };
}
export function CorridorPrimaryCta({ corridor, label }: { corridor: CorridorContext; label: string }) {
  return (
    <a
      href="#office-requirement"
      onClick={() => trackCorporateLeasingEvent("corporate_leasing_primary_cta", { cta_location: "hero", ...analyticsContext(corridor) })}
      className="inline-flex min-h-12 items-center justify-center rounded-sm bg-[#c8a96e] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#101010] transition hover:bg-[#d9bd82]"
    >
      {label}
    </a>
  );
}

export function OfficeLeasingCorridorForm({ corridor }: { corridor: CorridorContext }) {
  return <CorporateOfficeLeasingForm corridor={corridor} />;
}
