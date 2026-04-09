"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FocusProject {
  project_name: string;
  project_slug: string;
  project_type: string | null;
  current_status: string | null;
  micro_market: string | null;
  city_slug: string | null;
  current_price_per_sqft_min: number | null;
  current_price_per_sqft_max: number | null;
  price_min_cr: number | null;
  price_max_cr: number | null;
  unit_configs: string[] | null;
  total_units: number | null;
  hero_image_url: string | null;
  primary_differentiator: string | null;
  is_focus_project: boolean;
}

// ─── Budget presets ───────────────────────────────────────────────────────────

const BUDGET_PRESETS = [
  { label: "Under ₹1 Cr",   min: 0,    max: 1    },
  { label: "₹1–3 Cr",       min: 1,    max: 3    },
  { label: "₹3–5 Cr",       min: 3,    max: 5    },
  { label: "₹5–10 Cr",      min: 5,    max: 10   },
  { label: "₹10 Cr+",       min: 10,   max: 999  },
] as const;

// All unique config values across the portfolio (order matters for display)
const ALL_CONFIGS = ["Studio", "1BHK", "2BHK", "3BHK", "4BHK", "Villa", "Penthouse"];

interface RecentBrochure {
  id: string;
  token: string;
  title: string | null;
  filters: Record<string, unknown>;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

interface Props {
  user: { name: string; role: string };
  recentBrochures: RecentBrochure[];
  focusProjects: FocusProject[];
}

// ─── Goa region mapping ───────────────────────────────────────────────────────
// Based on Goa talukas: Pernem, Bardez, Bicholim → North Goa
//                       Salcete, Mormugao, Ponda → South Goa

const NORTH_GOA_MARKETS = new Set([
  "Aldona", "Anjuna", "Assagao", "Ashwem", "Bicholim", "Calangute",
  "Candolim", "Mapusa", "Mandrem", "Morjim", "Parra", "Pernem",
  "Pilerne", "Porvorim", "Reis Magos", "Siolim", "Socorro", "Vagator",
]);

const SOUTH_GOA_MARKETS = new Set([
  "Benaulim", "Cavelossim", "Colva", "Dabolim", "Majorda",
  "Margao", "Palolem", "Varca", "Vasco",
]);

function getRegion(mm: string | null): "north" | "south" | null {
  if (!mm) return null;
  if (NORTH_GOA_MARKETS.has(mm)) return "north";
  if (SOUTH_GOA_MARKETS.has(mm)) return "south";
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function priceLabel(min: number | null, max: number | null) {
  if (!min) return null;
  const f = (v: number) => `₹${Math.round(v / 1000)}K`;
  return max && max !== min ? `${f(min)}–${f(max)}/sqft` : `${f(min)}/sqft`;
}

function statusLabel(s: string | null) {
  if (!s) return "";
  if (s === "ready_to_move") return "Ready to Move";
  if (s === "under_construction") return "Under Construction";
  return s.replace(/_/g, " ");
}

function relativeTime(dt: string) {
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const CITY_LABELS: Record<string, string> = { goa: "Goa", hyderabad: "Hyderabad" };

// ─── Multi-select location dropdown ──────────────────────────────────────────

interface LocationDropdownProps {
  markets: string[];           // all available micro-markets for current city
  selected: Set<string>;       // currently selected micro-markets
  onChange: (next: Set<string>) => void;
  cityFilter: string;
}

function LocationDropdown({ markets, selected, onChange, cityFilter }: LocationDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isGoa = cityFilter === "goa" || cityFilter === "all";

  // Group markets
  const northMarkets = isGoa ? markets.filter((m) => getRegion(m) === "north") : [];
  const southMarkets = isGoa ? markets.filter((m) => getRegion(m) === "south") : [];
  const otherMarkets = isGoa ? markets.filter((m) => getRegion(m) === null) : markets;

  const allNorthSelected = northMarkets.length > 0 && northMarkets.every((m) => selected.has(m));
  const allSouthSelected = southMarkets.length > 0 && southMarkets.every((m) => selected.has(m));

  const toggleRegion = (regionMarkets: string[], allSelected: boolean) => {
    const next = new Set(selected);
    if (allSelected) {
      regionMarkets.forEach((m) => next.delete(m));
    } else {
      regionMarkets.forEach((m) => next.add(m));
    }
    onChange(next);
  };

  const toggleOne = (m: string) => {
    const next = new Set(selected);
    next.has(m) ? next.delete(m) : next.add(m);
    onChange(next);
  };

  const clearAll = () => onChange(new Set());

  // Build label
  let label = "Any location";
  if (selected.size > 0) {
    // Check if whole region selected
    const northAll = northMarkets.length > 0 && northMarkets.every((m) => selected.has(m));
    const southAll = southMarkets.length > 0 && southMarkets.every((m) => selected.has(m));
    if (northAll && southAll) {
      label = "All Goa";
    } else if (northAll && selected.size === northMarkets.length) {
      label = "North Goa (all)";
    } else if (southAll && selected.size === southMarkets.length) {
      label = "South Goa (all)";
    } else if (selected.size === 1) {
      label = Array.from(selected)[0];
    } else {
      label = `${selected.size} locations selected`;
    }
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", padding: "9px 12px", borderRadius: 8,
          border: "1px solid #e5e7eb", fontSize: 13, background: "#fff",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ color: selected.size === 0 ? "#9ca3af" : "#111827" }}>{label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
          background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          maxHeight: 340, overflowY: "auto",
        }}>
          {/* Clear */}
          {selected.size > 0 && (
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6" }}>
              <button onClick={clearAll} style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Clear all ({selected.size})
              </button>
            </div>
          )}

          {/* North Goa region header */}
          {isGoa && northMarkets.length > 0 && (
            <>
              <RegionHeader
                label="North Goa"
                count={northMarkets.length}
                selectedCount={northMarkets.filter((m) => selected.has(m)).length}
                allSelected={allNorthSelected}
                onToggle={() => toggleRegion(northMarkets, allNorthSelected)}
              />
              {northMarkets.map((m) => (
                <MarketOption key={m} label={m} checked={selected.has(m)} onToggle={() => toggleOne(m)} />
              ))}
            </>
          )}

          {/* South Goa region header */}
          {isGoa && southMarkets.length > 0 && (
            <>
              <RegionHeader
                label="South Goa"
                count={southMarkets.length}
                selectedCount={southMarkets.filter((m) => selected.has(m)).length}
                allSelected={allSouthSelected}
                onToggle={() => toggleRegion(southMarkets, allSouthSelected)}
              />
              {southMarkets.map((m) => (
                <MarketOption key={m} label={m} checked={selected.has(m)} onToggle={() => toggleOne(m)} />
              ))}
            </>
          )}

          {/* Other / non-Goa markets */}
          {otherMarkets.length > 0 && (
            <>
              {(northMarkets.length > 0 || southMarkets.length > 0) && (
                <div style={{ padding: "6px 12px 4px", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", borderTop: "1px solid #f3f4f6" }}>
                  Other
                </div>
              )}
              {otherMarkets.map((m) => (
                <MarketOption key={m} label={m} checked={selected.has(m)} onToggle={() => toggleOne(m)} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function RegionHeader({ label, count, selectedCount, allSelected, onToggle }: {
  label: string; count: number; selectedCount: number;
  allSelected: boolean; onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      style={{
        padding: "8px 12px", display: "flex", alignItems: "center", gap: 8,
        cursor: "pointer", background: allSelected ? "#f0f9ff" : "#fafafa",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
        border: `1.5px solid ${allSelected ? "#111827" : "#d1d5db"}`,
        background: allSelected ? "#111827" : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {allSelected && <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><polyline points="2 6 5 9 10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>}
        {!allSelected && selectedCount > 0 && <div style={{ width: 6, height: 2, background: "#111827", borderRadius: 1 }} />}
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{label}</span>
      <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: "auto" }}>
        {selectedCount > 0 ? `${selectedCount}/${count}` : count}
      </span>
    </div>
  );
}

function MarketOption({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        padding: "7px 12px 7px 28px", display: "flex", alignItems: "center", gap: 8,
        cursor: "pointer", background: checked ? "#f9fafb" : "#fff",
        borderBottom: "1px solid #f9fafb",
      }}
    >
      <div style={{
        width: 14, height: 14, borderRadius: 3, flexShrink: 0,
        border: `1.5px solid ${checked ? "#111827" : "#d1d5db"}`,
        background: checked ? "#111827" : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {checked && <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><polyline points="2 6 5 9 10 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>}
      </div>
      <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BrochureGeneratorClient({ user, recentBrochures, focusProjects }: Props) {
  // Filter state
  const [title, setTitle] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMarkets, setSelectedMarkets] = useState<Set<string>>(new Set());
  const [budgetPreset, setBudgetPreset] = useState<number | null>(null); // index into BUDGET_PRESETS
  const [selectedConfigs, setSelectedConfigs] = useState<Set<string>>(new Set());
  const [manualSelection, setManualSelection] = useState<Set<string>>(new Set());
  const [useManual, setUseManual] = useState(false);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"generate" | "history">("generate");

  // Derive filter options
  const cities = useMemo(() => [...new Set(focusProjects.map((p) => p.city_slug).filter(Boolean) as string[])], [focusProjects]);
  const types = useMemo(() => [...new Set(focusProjects.map((p) => p.project_type).filter(Boolean) as string[])], [focusProjects]);
  const microMarkets = useMemo(() => {
    const mm = focusProjects
      .filter((p) => cityFilter === "all" || p.city_slug === cityFilter)
      .map((p) => p.micro_market)
      .filter(Boolean) as string[];
    return [...new Set(mm)].sort();
  }, [focusProjects, cityFilter]);

  // Reset market selection when city changes
  const handleCityChange = (c: string) => {
    setCityFilter(c);
    setSelectedMarkets(new Set());
  };

  // Auto-filtered projects
  const autoFiltered = useMemo(() => {
    const budget = budgetPreset !== null ? BUDGET_PRESETS[budgetPreset] : null;
    return focusProjects.filter((p) => {
      if (cityFilter !== "all" && p.city_slug !== cityFilter) return false;
      if (typeFilter !== "all" && p.project_type !== typeFilter) return false;
      if (statusFilter === "ready" && p.current_status !== "ready_to_move") return false;
      if (statusFilter === "construction" && p.current_status !== "under_construction") return false;
      if (selectedMarkets.size > 0 && p.micro_market && !selectedMarkets.has(p.micro_market)) return false;
      // Budget: project overlaps the preset range
      if (budget && p.price_min_cr != null && p.price_max_cr != null) {
        if (p.price_max_cr < budget.min || p.price_min_cr > budget.max) return false;
      }
      // Config: project has at least one of the selected configs
      if (selectedConfigs.size > 0) {
        const configs = p.unit_configs ?? [];
        if (!configs.some((c) => selectedConfigs.has(c))) return false;
      }
      return true;
    });
  }, [focusProjects, cityFilter, typeFilter, statusFilter, selectedMarkets, budgetPreset, selectedConfigs]);

  const previewProjects = useManual
    ? focusProjects.filter((p) => manualSelection.has(p.project_slug))
    : autoFiltered;

  const toggleManual = (slug: string) => {
    setManualSelection((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  };

  // Auto-generate brochure title from filters
  const autoTitle = useMemo(() => {
    const parts: string[] = [];
    if (cityFilter === "goa" || cityFilter === "all") {
      if (selectedMarkets.size > 0) {
        const northSelected = [...selectedMarkets].filter((m) => getRegion(m) === "north");
        const southSelected = [...selectedMarkets].filter((m) => getRegion(m) === "south");
        const northAll = microMarkets.filter((m) => getRegion(m) === "north");
        const southAll = microMarkets.filter((m) => getRegion(m) === "south");
        if (northSelected.length === northAll.length && southSelected.length === 0) parts.push("North Goa");
        else if (southSelected.length === southAll.length && northSelected.length === 0) parts.push("South Goa");
        else parts.push([...selectedMarkets].join(", "));
      } else {
        parts.push(CITY_LABELS[cityFilter] ?? "Goa");
      }
    } else {
      parts.push(CITY_LABELS[cityFilter] ?? "Properties");
    }
    if (typeFilter !== "all") parts.push(`${typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}s`);
    if (selectedConfigs.size > 0) parts.push([...selectedConfigs].join("/"));
    if (budgetPreset !== null) parts.push(BUDGET_PRESETS[budgetPreset].label);
    if (statusFilter === "ready") parts.push("Ready to Move");
    return parts.join(" · ");
  }, [cityFilter, typeFilter, statusFilter, selectedMarkets, microMarkets, selectedConfigs, budgetPreset]);

  const handleGenerate = async () => {
    if (previewProjects.length === 0) return;
    setGenerating(true);
    setGeneratedLink(null);
    try {
      const budget = budgetPreset !== null ? BUDGET_PRESETS[budgetPreset] : null;
      const filters = useManual
        ? {}
        : {
            city: cityFilter !== "all" ? cityFilter : undefined,
            type: typeFilter !== "all" ? typeFilter : undefined,
            status: statusFilter !== "all" ? statusFilter : undefined,
            microMarkets: selectedMarkets.size > 0 ? Array.from(selectedMarkets) : undefined,
            budgetMinCr: budget?.min,
            budgetMaxCr: budget?.max,
            configs: selectedConfigs.size > 0 ? Array.from(selectedConfigs) : undefined,
          };

      const res = await fetch("/api/brochure/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || autoTitle,
          filters,
          project_slugs: useManual ? Array.from(manualSelection) : null,
          created_by_name: user.name,
          expires_days: 30,
        }),
      });
      const data = await res.json();
      if (data.token) setGeneratedLink(`${window.location.origin}/brochure/${data.token}`);
    } catch { /* silent */ }
    finally { setGenerating(false); }
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!generatedLink) return;
    const msg = encodeURIComponent(`Hi! Here are the property options I mentioned — ${generatedLink}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 0 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#9ca3af", textTransform: "uppercase", margin: "0 0 4px" }}>Client Tools</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Brochure Generator</h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>Set filters, preview matching projects, and share a link with your client in seconds.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "1px solid #e5e7eb" }}>
        {(["generate", "history"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 18px", fontSize: 13, fontWeight: 600,
            background: "none", border: "none", cursor: "pointer",
            borderBottom: tab === t ? "2px solid #111827" : "2px solid transparent",
            color: tab === t ? "#111827" : "#6b7280", marginBottom: -1,
          }}>
            {t === "generate" ? "Generate New" : `History (${recentBrochures.length})`}
          </button>
        ))}
      </div>

      {tab === "generate" && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24, alignItems: "start" }}>

          {/* ── Filter panel ── */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 20px 24px", position: "sticky", top: 80 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>Filters</p>

            {/* Title */}
            <FilterField label="Brochure Title (optional)">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={autoTitle || "e.g. Goa Villas for Priya"}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, boxSizing: "border-box" }}
              />
            </FilterField>

            {/* City */}
            <FilterField label="City">
              <select value={cityFilter} onChange={(e) => handleCityChange(e.target.value)} style={selectStyle}>
                <option value="all">All Cities</option>
                {cities.map((c) => <option key={c} value={c}>{CITY_LABELS[c] ?? c}</option>)}
              </select>
            </FilterField>

            {/* Location (multi-select with North/South Goa) */}
            <FilterField label={`Location ${selectedMarkets.size > 0 ? `(${selectedMarkets.size} selected)` : ""}`}>
              <LocationDropdown
                markets={microMarkets}
                selected={selectedMarkets}
                onChange={setSelectedMarkets}
                cityFilter={cityFilter}
              />
            </FilterField>

            {/* Type */}
            <FilterField label="Property Type">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selectStyle}>
                <option value="all">All Types</option>
                {types.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </FilterField>

            {/* Status */}
            <FilterField label="Status">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
                <option value="all">Any Status</option>
                <option value="ready">Ready to Move</option>
                <option value="construction">Under Construction</option>
              </select>
            </FilterField>

            {/* Budget presets */}
            <FilterField label="Budget">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {BUDGET_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setBudgetPreset(budgetPreset === i ? null : i)}
                    style={{
                      padding: "5px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                      border: `1.5px solid ${budgetPreset === i ? "#111827" : "#e5e7eb"}`,
                      background: budgetPreset === i ? "#111827" : "#fff",
                      color: budgetPreset === i ? "#fff" : "#374151",
                      cursor: "pointer", transition: "all 0.12s",
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </FilterField>

            {/* BHK / Config multi-select */}
            <FilterField label={`Configuration${selectedConfigs.size > 0 ? ` (${selectedConfigs.size})` : ""}`}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ALL_CONFIGS.map((cfg) => {
                  // Only show configs that exist in currently visible projects
                  const exists = focusProjects.some((p) => p.unit_configs?.includes(cfg));
                  if (!exists) return null;
                  const active = selectedConfigs.has(cfg);
                  return (
                    <button
                      key={cfg}
                      type="button"
                      onClick={() => {
                        setSelectedConfigs((prev) => {
                          const next = new Set(prev);
                          next.has(cfg) ? next.delete(cfg) : next.add(cfg);
                          return next;
                        });
                      }}
                      style={{
                        padding: "5px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                        border: `1.5px solid ${active ? "#111827" : "#e5e7eb"}`,
                        background: active ? "#111827" : "#fff",
                        color: active ? "#fff" : "#374151",
                        cursor: "pointer", transition: "all 0.12s",
                      }}
                    >
                      {cfg}
                    </button>
                  );
                })}
              </div>
              {selectedConfigs.size > 0 && (
                <button onClick={() => setSelectedConfigs(new Set())} style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: "4px 0 0" }}>
                  Clear
                </button>
              )}
            </FilterField>

            <div style={{ borderTop: "1px solid #f3f4f6", margin: "16px 0" }} />

            {/* Manual selection */}
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#374151" }}>
              <input type="checkbox" checked={useManual} onChange={(e) => setUseManual(e.target.checked)} style={{ accentColor: "#111827" }} />
              <span>Manually pick projects</span>
            </label>
            {useManual && (
              <p style={{ fontSize: 11, color: "#9ca3af", margin: "6px 0 0" }}>Select projects from the list →</p>
            )}
          </div>

          {/* ── Preview + Generate ── */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                {useManual
                  ? `${manualSelection.size} project${manualSelection.size !== 1 ? "s" : ""} selected`
                  : `${autoFiltered.length} matching project${autoFiltered.length !== 1 ? "s" : ""}`}
              </p>
              {useManual && manualSelection.size > 0 && (
                <button onClick={() => setManualSelection(new Set())} style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
                  Clear selection
                </button>
              )}
            </div>

            {/* Project list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {(useManual ? focusProjects : autoFiltered).map((p) => {
                const selected = manualSelection.has(p.project_slug);
                const region = getRegion(p.micro_market);
                return (
                  <div
                    key={p.project_slug}
                    onClick={() => useManual && toggleManual(p.project_slug)}
                    style={{
                      background: "#fff",
                      border: `1.5px solid ${useManual ? (selected ? "#111827" : "#e5e7eb") : "#e5e7eb"}`,
                      borderRadius: 12, padding: "12px 14px",
                      display: "flex", gap: 12, alignItems: "center",
                      cursor: useManual ? "pointer" : "default",
                      opacity: useManual && !selected ? 0.5 : 1,
                      transition: "border-color 0.15s, opacity 0.15s",
                    }}
                  >
                    {useManual && (
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${selected ? "#111827" : "#d1d5db"}`, background: selected ? "#111827" : "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {selected && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2 6 5 9 10 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>}
                      </div>
                    )}

                    {/* Thumbnail */}
                    <div style={{ width: 52, height: 40, borderRadius: 8, overflow: "hidden", background: "#f3f4f6", flexShrink: 0 }}>
                      {p.hero_image_url && <Image src={p.hero_image_url} alt={p.project_name} width={52} height={40} style={{ objectFit: "cover", width: "100%", height: "100%" }} />}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.project_name}
                      </p>
                      <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                        {p.micro_market}
                        {region && (
                          <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 99, background: region === "north" ? "#f0f9ff" : "#f0fdf4", color: region === "north" ? "#0369a1" : "#15803d" }}>
                            {region === "north" ? "N.Goa" : "S.Goa"}
                          </span>
                        )}
                        {p.project_type ? ` · ${p.project_type}` : ""}
                      </p>
                    </div>

                    {/* Price + config */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {p.price_min_cr != null && (
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", margin: "0 0 2px" }}>
                          ₹{p.price_min_cr}
                          {p.price_max_cr && p.price_max_cr !== p.price_min_cr ? `–${p.price_max_cr}` : ""} Cr
                        </p>
                      )}
                      {p.unit_configs && p.unit_configs.length > 0 && (
                        <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 3px" }}>
                          {p.unit_configs.join(" · ")}
                        </p>
                      )}
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99, background: p.current_status === "ready_to_move" ? "#dcfce7" : "#dbeafe", color: p.current_status === "ready_to_move" ? "#15803d" : "#1d4ed8" }}>
                        {statusLabel(p.current_status)}
                      </span>
                    </div>
                  </div>
                );
              })}
              {autoFiltered.length === 0 && !useManual && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 14 }}>
                  No projects match these filters.
                </div>
              )}
            </div>

            {/* Generate */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 20px 24px" }}>
              <button
                onClick={handleGenerate}
                disabled={generating || previewProjects.length === 0}
                style={{
                  width: "100%", padding: "13px 0",
                  background: previewProjects.length === 0 ? "#e5e7eb" : "#111827",
                  color: previewProjects.length === 0 ? "#9ca3af" : "#fff",
                  border: "none", borderRadius: 10,
                  fontSize: 14, fontWeight: 700,
                  cursor: previewProjects.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                {generating ? "Generating…" : `Generate Link (${previewProjects.length} project${previewProjects.length !== 1 ? "s" : ""})`}
              </button>

              {generatedLink && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
                    Shareable link — valid 30 days
                  </p>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: "#374151", flex: 1, wordBreak: "break-all" }}>{generatedLink}</span>
                    <button onClick={handleCopy} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: copied ? "#111827" : "#fff", color: copied ? "#fff" : "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}>
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button onClick={handleWhatsApp} style={{ padding: "10px 0", background: "#25D366", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      Share on WhatsApp
                    </button>
                    <a href={generatedLink} target="_blank" rel="noopener noreferrer" style={{ padding: "10px 0", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", textAlign: "center", display: "block" }}>
                      Preview ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── History tab ── */}
      {tab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recentBrochures.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af", fontSize: 14 }}>No brochures generated yet.</div>
          ) : recentBrochures.map((b) => {
            const link = `${typeof window !== "undefined" ? window.location.origin : "https://www.westsiderealty.in"}/brochure/${b.token}`;
            const expired = new Date(b.expires_at) < new Date();
            return (
              <div key={b.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>{b.title || "Untitled Brochure"}</p>
                    {expired && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: "#fee2e2", color: "#b91c1c", fontWeight: 600 }}>Expired</span>}
                    {!expired && !b.is_active && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: "#f3f4f6", color: "#6b7280", fontWeight: 600 }}>Inactive</span>}
                  </div>
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                    Created {relativeTime(b.created_at)} · {b.view_count} view{b.view_count !== 1 ? "s" : ""}
                    {b.last_viewed_at ? ` · Last opened ${relativeTime(b.last_viewed_at)}` : " · Not opened yet"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => navigator.clipboard.writeText(link)} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Copy Link
                  </button>
                  <a href={link} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #e5e7eb", background: "#f9fafb", color: "#374151", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                    Preview ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── FilterField ──────────────────────────────────────────────────────────────

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1px solid #e5e7eb", fontSize: 13,
  background: "#fff", boxSizing: "border-box", appearance: "none",
};
