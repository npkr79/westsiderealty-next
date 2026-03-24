"use client";

import { useState } from "react";
import SectionShell from "./SectionShell";

interface Props {
  marketName: string;
  intelligence: Array<{
    intelligence_type: string;
    ai_verdict: string | null;
    vs_fd_rate: number | null;
    highlight_stat: string | null;
    data_period: string | null;
  }>;
  rentalRows: Array<{
    property_type: string;
    furnishing_type: string | null;
    rent_min: number | null;
    rent_max: number | null;
    rent_median: number | null;
    rent_psf_min: number | null;
    rent_psf_max: number | null;
  }>;
}

type ActiveTab = "residential" | "commercial";

const BHK_LABELS: Record<string, string> = {
  "2bhk": "2 BHK",
  "3bhk": "3 BHK",
  "4bhk": "4 BHK",
};

const COMMERCIAL_LABELS: Record<string, string> = {
  office_grade_a: "Grade A",
  office_standard: "Standard",
  office_bare_shell: "Bare Shell",
};

function fmtRent(v: number): string {
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
  return `${(v / 1000).toFixed(0)}K`;
}

function formatRentRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return "—";
  if (min != null && max != null) return `₹${fmtRent(min)}–${fmtRent(max)}/mo`;
  if (min != null) return `₹${fmtRent(min)}+/mo`;
  return `Up to ₹${fmtRent(max!)}/mo`;
}

function formatMedian(v: number | null): string {
  if (v == null) return "—";
  return `₹${fmtRent(v)}/mo`;
}

function formatPsfRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return "—";
  if (min != null && max != null) return `₹${min}–${max}/sqft`;
  if (min != null) return `₹${min}+/sqft`;
  return `Up to ₹${max!}/sqft`;
}

export default function RentalYieldIntelligence({ marketName, intelligence, rentalRows }: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("residential");

  const residentialIntel = intelligence.find((i) => i.intelligence_type === "residential") ?? null;
  const commercialIntel = intelligence.find((i) => i.intelligence_type === "commercial") ?? null;
  const dataPeriod = residentialIntel?.data_period ?? commercialIntel?.data_period ?? "";

  // Build residential lookup: { bhk: row } (furnishing_type = 'all')
  const residentialMap: Record<string, (typeof rentalRows)[0]> = {};
  for (const row of rentalRows) {
    if (!row.property_type.startsWith("office_") && row.furnishing_type === "all") {
      residentialMap[row.property_type] = row;
    }
  }

  // Commercial rows
  const commercialRows = rentalRows.filter((r) => r.property_type.startsWith("office_"));
  const hasCommercial = commercialRows.some((r) => r.rent_psf_min != null || r.rent_psf_max != null);

  const vs_fd = residentialIntel?.vs_fd_rate ?? null;
  // vs_fd = grossYield - 7; totalReturnVsFd = (grossYield + 11) - 7 = vs_fd + 11
  const totalReturnVsFd = vs_fd != null ? vs_fd + 11.0 : null;

  // Commercial yield badges
  const gradeARow = rentalRows.find((r) => r.property_type === "office_grade_a") ?? null;
  const gradePsfMedian = gradeARow
    ? ((gradeARow.rent_psf_min ?? 0) + (gradeARow.rent_psf_max ?? 0)) / 2
    : null;
  const purchasePsfCommercial = 13500;
  const commercialGrossYield = gradePsfMedian && gradePsfMedian > 0
    ? (gradePsfMedian * 12) / purchasePsfCommercial * 100
    : null;
  const commercialTotalReturn = commercialGrossYield != null ? commercialGrossYield + 8.0 : null;
  const commercialVsFd = commercialTotalReturn != null ? commercialTotalReturn - 7.0 : null;
  const commercialHighlightStat = commercialGrossYield != null && commercialTotalReturn != null
    ? `${commercialGrossYield.toFixed(1)}% rental yield + 8% appreciation = ~${commercialTotalReturn.toFixed(1)}% total return`
    : null;

  const cleanVerdict = (text: string | null | undefined): string =>
    text?.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").trim() ?? "";

  const activeVerdict = activeTab === "residential"
    ? (residentialIntel?.ai_verdict ?? null)
    : (commercialIntel?.ai_verdict ?? null);

  return (
    <SectionShell
      id="rental-yield"
      eyebrow="Investment Intelligence"
      title="Rental Yield Intelligence"
      description={`Based on live listings · Updated ${dataPeriod}`}
    >
      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("residential")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "residential"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Residential
        </button>
        {hasCommercial && (
          <button
            onClick={() => setActiveTab("commercial")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "commercial"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Commercial
          </button>
        )}
      </div>

      {/* Residential table */}
      {activeTab === "residential" && (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 pr-4 text-slate-500 font-medium">Config</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Rent Range</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Median</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(BHK_LABELS).map(([bhk, label]) => {
                  const row = residentialMap[bhk];
                  return (
                    <tr key={bhk} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-medium text-slate-900">{label}</td>
                      <td className="py-3 px-2 text-slate-700">
                        {formatRentRange(row?.rent_min ?? null, row?.rent_max ?? null)}
                      </td>
                      <td className="py-3 px-2 text-slate-700">
                        {formatMedian(row?.rent_median ?? null)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Highlight stat + total return vs FD badge */}
          {residentialIntel?.highlight_stat && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                {residentialIntel.highlight_stat}
              </span>
              {totalReturnVsFd != null && (
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    totalReturnVsFd > 7
                      ? "bg-green-100 text-green-800"
                      : totalReturnVsFd >= 5
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {totalReturnVsFd >= 0 ? "+" : ""}
                  {totalReturnVsFd.toFixed(1)}% above FD
                </span>
              )}
            </div>
          )}
          <p className="mt-3 text-xs text-slate-400">
            Rates shown are for fully gated communities. Standalone/non-gated properties typically 20–30% lower.
          </p>
        </div>
      )}

      {/* Commercial table */}
      {activeTab === "commercial" && (
        <div>
          {hasCommercial ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 pr-4 text-slate-500 font-medium">Grade</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Rate (psf/mo)</th>
                  </tr>
                </thead>
                <tbody>
                  {commercialRows.map((row) => (
                    <tr key={row.property_type} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {COMMERCIAL_LABELS[row.property_type] ?? row.property_type}
                      </td>
                      <td className="py-3 px-2 text-slate-700">
                        {formatPsfRange(row.rent_psf_min, row.rent_psf_max)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No commercial data for this market</p>
          )}
          {hasCommercial && commercialHighlightStat && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                {commercialHighlightStat}
              </span>
              {commercialVsFd != null && (
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    commercialVsFd > 7
                      ? "bg-green-100 text-green-800"
                      : commercialVsFd >= 5
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {commercialVsFd >= 0 ? "+" : ""}
                  {commercialVsFd.toFixed(1)}% above FD
                </span>
              )}
            </div>
          )}
          {hasCommercial && (
            <p className="mt-3 text-xs text-slate-400">
              Yields calculated on Grade A space at ₹13,500/sqft purchase price. Minimum investment typically ₹2.4Cr+ (2000 sqft).
            </p>
          )}
        </div>
      )}

      {/* AI Verdict — switches with active tab */}
      {activeVerdict && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Westside Analyst View
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">{cleanVerdict(activeVerdict)}</p>
        </div>
      )}

      {/* Source note */}
      <p className="mt-4 text-xs text-slate-400">
        Rental data sourced from MagicBricks, 99acres, NoBroker, and Housing.com listings · {marketName}, Hyderabad
      </p>
    </SectionShell>
  );
}
