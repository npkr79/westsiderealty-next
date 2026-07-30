"use client";

import { Fragment, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Columns3,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  GripVertical,
  Printer,
  Search,
  Table2,
  X,
} from "lucide-react";
import { InlineLeadForm } from "@/components/common/InlineLeadForm";

export interface FocusProject {
  id: string | number;
  project_name: string;
  project_slug: string;
  project_type: string | null;
  current_status: string | null;
  developer_brand: string | null;
  developer_brand_slug?: string | null;
  micro_market: string | null;
  micro_market_slug: string | null;
  city: string | null;
  city_slug: string | null;
  locality?: string | null;
  current_price_per_sqft_min: number | null;
  current_price_per_sqft_max: number | null;
  total_units: number | null;
  primary_differentiator: string | null;
  investment_verdict: string | null;
  quality_score: number | null;
  needs_review: boolean;
  hero_image_url: string | null;
  listing_url_slug: string | null;
  unit_configs?: string[] | null;
  price_min_cr?: number | null;
  price_max_cr?: number | null;
  rera_id?: string | null;
  rera_verified?: boolean | null;
  possession_date?: string | null;
  land_area_acres?: number | null;
  total_towers?: number | null;
  total_floors_max?: number | null;
  official_website?: string | null;
  gallery_image_urls?: string[] | null;
  special_amenities?: string[] | null;
  sports_amenities?: string[] | null;
  clubhouse_sqft?: number | null;
  min_area_sqft?: number | null;
  max_area_sqft?: number | null;
  min_flat_price?: number | null;
  plot_size_min_sqyd?: number | null;
  plot_size_max_sqyd?: number | null;
  project_detail?: {
    project_overview_seo?: string | null;
    meta_description?: string | null;
    unit_size_range?: string | null;
    price_range_text?: string | null;
    completion_status?: string | null;
    total_land_area?: string | null;
    total_towers?: number | null;
    total_units?: number | null;
    brochure_url?: string | null;
    floor_plan_images?: unknown;
    gallery_images_json?: unknown;
    amenities_json?: unknown;
    google_maps_embed_url?: string | null;
    google_maps_url?: string | null;
    hero_image_url?: string | null;
  } | null;
}

type PortfolioView = "cards" | "table";
type SortDirection = "asc" | "desc";
type SortRule = { key: ColumnKey; direction: SortDirection };
type Filters = Record<string, string>;

type ColumnKey =
  | "project_name"
  | "developer_brand"
  | "locality"
  | "micro_market"
  | "project_type"
  | "configuration"
  | "starting_size"
  | "ending_size"
  | "starting_price"
  | "maximum_price"
  | "price_per_sqft"
  | "current_status"
  | "possession"
  | "rera"
  | "land_area"
  | "towers"
  | "units";

type Column = {
  key: ColumnKey;
  label: string;
  width: number;
  minWidth: number;
  align?: "left" | "right" | "center";
};

const C = {
  bg: "#FAFAF7",
  bgWarm: "#F5F3EE",
  bgCard: "#FFFFFF",
  bgDark: "#1A1A1F",
  gold: "#B08D57",
  goldLight: "#C9A96E",
  accent: "#2D6A4F",
  text: "#1A1A1F",
  textMuted: "#7A7A7E",
  border: "rgba(0,0,0,0.07)",
  line: "#E7E3DA",
} as const;

const CITY_LABELS: Record<string, string> = {
  goa: "Goa",
  hyderabad: "Hyderabad",
  bangalore: "Bangalore",
  sindhudurg: "Sindhudurg",
};

const DEFAULT_COLUMNS: Column[] = [
  { key: "project_name", label: "Project Name", width: 260, minWidth: 220 },
  { key: "developer_brand", label: "Builder", width: 180, minWidth: 140 },
  { key: "locality", label: "Location", width: 170, minWidth: 130 },
  { key: "micro_market", label: "Micro Market", width: 170, minWidth: 130 },
  { key: "project_type", label: "Project Type", width: 130, minWidth: 110 },
  { key: "configuration", label: "Configuration", width: 180, minWidth: 140 },
  { key: "starting_size", label: "Starting Size", width: 130, minWidth: 110, align: "right" },
  { key: "ending_size", label: "Ending Size", width: 130, minWidth: 110, align: "right" },
  { key: "starting_price", label: "Starting Price", width: 140, minWidth: 120, align: "right" },
  { key: "maximum_price", label: "Maximum Price", width: 140, minWidth: 120, align: "right" },
  { key: "price_per_sqft", label: "Price / sqft", width: 130, minWidth: 110, align: "right" },
  { key: "current_status", label: "Status", width: 150, minWidth: 120 },
  { key: "possession", label: "Possession", width: 130, minWidth: 110 },
  { key: "rera", label: "RERA", width: 150, minWidth: 120 },
  { key: "land_area", label: "Land Parcel", width: 120, minWidth: 110, align: "right" },
  { key: "towers", label: "Towers", width: 100, minWidth: 90, align: "right" },
  { key: "units", label: "Units", width: 100, minWidth: 90, align: "right" },
];

const FILTERS = [
  { key: "builder", label: "Builder" },
  { key: "location", label: "Location" },
  { key: "microMarket", label: "Micro Market" },
  { key: "projectType", label: "Project Type" },
  { key: "configuration", label: "Configuration" },
  { key: "budget", label: "Budget Range" },
  { key: "psf", label: "Price Per Sqft" },
  { key: "possessionYear", label: "Possession Year" },
  { key: "projectStatus", label: "Project Status" },
  { key: "reraStatus", label: "RERA Status" },
  { key: "sizeRange", label: "Size Range" },
] as const;

function formatStatus(status: string | null) {
  if (!status) return "";
  if (status === "ready_to_move" || status === "completed" || status === "Ready To Move") return "Ready to Move";
  if (status === "under_construction" || status === "Under Construction") return "Under Construction";
  if (status === "new_launch" || status === "New Launch") return "New Launch";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatType(type: string | null) {
  if (!type) return "";
  if (type === "mixed_use") return "Mixed Use";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function statusColor(status: string | null) {
  if (status === "ready_to_move" || status === "completed" || status === "Ready To Move")
    return { bg: "#dcfce7", color: "#15803d" };
  if (status === "under_construction" || status === "Under Construction")
    return { bg: "#dbeafe", color: "#1d4ed8" };
  if (status === "new_launch" || status === "New Launch")
    return { bg: "#fef9c3", color: "#854d0e" };
  return { bg: "#f3f4f6", color: "#4b5563" };
}

function typeColor(type: string | null) {
  if (type === "villa") return { bg: "#fdf4ff", color: "#7e22ce" };
  if (type === "apartment") return { bg: "#eff6ff", color: "#1d4ed8" };
  if (type === "plot") return { bg: "#fff7ed", color: "#9a3412" };
  if (type === "commercial") return { bg: "#ecfeff", color: "#0e7490" };
  return { bg: "#f9fafb", color: "#374151" };
}

function formatTotalPrice(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  if (amount >= 100_000) return `₹${Math.round(amount / 100_000)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatCr(value: number | null | undefined) {
  if (value == null) return "";
  if (value < 1) return `₹${Number((value * 100).toFixed(1))} L`;
  return `₹${Number(value.toFixed(2))} Cr`;
}

function formatPsf(value: number | null | undefined) {
  if (!value) return "";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function formatNumber(value: number | null | undefined) {
  if (value == null) return "";
  return Math.round(value).toLocaleString("en-IN");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function valueFromUnknown(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          return String(record.label ?? record.name ?? record.title ?? record.url ?? "");
        }
        return String(item ?? "");
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      return valueFromUnknown(JSON.parse(value));
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
}

function extractNumbers(text: string) {
  return [...text.replace(/,/g, "").matchAll(/(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
}

function getConfig(project: FocusProject) {
  if (project.unit_configs?.length) {
    return project.unit_configs
      .map((item) => item.split("|")[0]?.trim())
      .filter(Boolean)
      .join(", ");
  }
  return "";
}

function getSizeRange(project: FocusProject): { min: number | null; max: number | null; label: string } {
  const direct = project.project_detail?.unit_size_range ?? "";
  const source = direct || project.unit_configs?.join(" ") || "";
  const nums = extractNumbers(source).filter((n) => n >= 100 && n <= 20000);
  const min = nums.length ? Math.min(...nums) : null;
  const max = nums.length ? Math.max(...nums) : null;
  return { min, max, label: direct || (min ? `${min}${max && max !== min ? ` - ${max}` : ""} sq.ft.` : "") };
}

function getProjectHref(project: FocusProject) {
  return project.listing_url_slug && project.city_slug
    ? `/${project.city_slug}/projects/${project.listing_url_slug}`
    : `/portfolio/${project.project_slug}`;
}

function priceLabel(project: FocusProject): string {
  if (project.min_flat_price) return `From ${formatTotalPrice(project.min_flat_price)}`;
  if (project.price_min_cr) return `From ${formatCr(project.price_min_cr)}`;
  const min = project.current_price_per_sqft_min;
  const max = project.current_price_per_sqft_max;
  if (!min) return project.project_detail?.price_range_text ?? "";
  const fmt = (v: number) => `₹${Math.round(v / 1000)}K`;
  return max && max !== min ? `${fmt(min)}–${fmt(max)} /sqft` : `${fmt(min)} /sqft`;
}

function cityLabel(project: FocusProject) {
  return project.city_slug ? (CITY_LABELS[project.city_slug] ?? project.city ?? "") : (project.city ?? "");
}

function getLocation(project: FocusProject) {
  return project.locality || project.micro_market || project.city || "";
}

function getColumnValue(project: FocusProject, key: ColumnKey): string | number {
  const size = getSizeRange(project);
  switch (key) {
    case "project_name": return project.project_name;
    case "developer_brand": return project.developer_brand ?? "";
    case "locality": return getLocation(project);
    case "micro_market": return project.micro_market ?? "";
    case "project_type": return formatType(project.project_type);
    case "configuration": return getConfig(project);
    case "starting_size": return size.min ?? "";
    case "ending_size": return size.max ?? "";
    case "starting_price": return project.price_min_cr ?? "";
    case "maximum_price": return project.price_max_cr ?? "";
    case "price_per_sqft": return project.current_price_per_sqft_min ?? "";
    case "current_status": return formatStatus(project.current_status ?? project.project_detail?.completion_status ?? null);
    case "possession": return formatDate(project.possession_date);
    case "rera": return project.rera_id ?? "";
    case "land_area": return project.land_area_acres ?? project.project_detail?.total_land_area ?? "";
    case "towers": return project.total_towers ?? project.project_detail?.total_towers ?? "";
    case "units": return project.total_units ?? project.project_detail?.total_units ?? "";
    default: return "";
  }
}

function renderColumnValue(project: FocusProject, key: ColumnKey) {
  const raw = getColumnValue(project, key);
  if (raw === "" || raw == null) return "";
  if (key === "starting_price" || key === "maximum_price") return formatCr(Number(raw));
  if (key === "price_per_sqft") return `${formatPsf(Number(raw))}/sqft`;
  if (key === "starting_size" || key === "ending_size") return `${formatNumber(Number(raw))} sqft`;
  if (key === "land_area" && typeof raw === "number") return `${raw} ac`;
  if (key === "current_status") {
    const s = project.current_status ?? project.project_detail?.completion_status ?? null;
    const style = statusColor(s);
    return (
      <span style={{ display: "inline-flex", padding: "4px 9px", borderRadius: 999, background: style.bg, color: style.color, fontSize: 12, fontWeight: 700 }}>
        {String(raw)}
      </span>
    );
  }
  if (key === "project_type") {
    const style = typeColor(project.project_type);
    return (
      <span style={{ display: "inline-flex", padding: "4px 9px", borderRadius: 999, background: style.bg, color: style.color, fontSize: 12, fontWeight: 700 }}>
        {String(raw)}
      </span>
    );
  }
  return String(raw);
}

function asSearchText(project: FocusProject) {
  const values = DEFAULT_COLUMNS.map((column) => String(getColumnValue(project, column.key) ?? ""));
  values.push(
    project.project_detail?.price_range_text ?? "",
    project.primary_differentiator ?? "",
    project.investment_verdict ?? "",
    (project.special_amenities ?? []).join(" "),
    (project.sports_amenities ?? []).join(" "),
  );
  return values.join(" ").toLowerCase();
}

function getPossessionYear(project: FocusProject) {
  if (!project.possession_date) return "";
  const match = String(project.possession_date).match(/20\d{2}/);
  return match?.[0] ?? "";
}

function getBudgetBucket(project: FocusProject) {
  const min = project.price_min_cr;
  if (min == null) return "";
  if (min < 1) return "Under ₹1 Cr";
  if (min < 2) return "₹1 - 2 Cr";
  if (min < 3) return "₹2 - 3 Cr";
  if (min < 5) return "₹3 - 5 Cr";
  if (min < 10) return "₹5 - 10 Cr";
  return "₹10 Cr+";
}

function getPsfBucket(project: FocusProject) {
  const value = project.current_price_per_sqft_min;
  if (!value) return "";
  if (value < 6000) return "Under ₹6K";
  if (value < 8000) return "₹6K - 8K";
  if (value < 10000) return "₹8K - 10K";
  if (value < 12000) return "₹10K - 12K";
  return "₹12K+";
}

function getSizeBucket(project: FocusProject) {
  const size = getSizeRange(project).min;
  if (!size) return "";
  if (size < 1000) return "Under 1,000 sqft";
  if (size < 1500) return "1,000 - 1,500 sqft";
  if (size < 2500) return "1,500 - 2,500 sqft";
  if (size < 4000) return "2,500 - 4,000 sqft";
  return "4,000 sqft+";
}

function getReraStatus(project: FocusProject) {
  if (project.rera_verified || project.rera_id) return "RERA available";
  return "";
}

function uniqueOptions(projects: FocusProject[], getter: (project: FocusProject) => string) {
  return Array.from(new Set(projects.map(getter).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function getExportRows(projects: FocusProject[], columns: Column[]) {
  return projects.map((project) => {
    const row: Record<string, string | number> = {};
    for (const column of columns) {
      const raw = getColumnValue(project, column.key);
      row[column.label] = raw == null ? "" : raw;
    }
    return row;
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function PortfolioCard({ project }: { project: FocusProject }) {
  const href = getProjectHref(project);
  const statusStyle = statusColor(project.current_status);
  const projectTypeStyle = typeColor(project.project_type);
  const price = priceLabel(project);
  const label = cityLabel(project);

  return (
    <Link href={href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
      <div className="pf-card">
        <div className="pf-card-image">
          {project.hero_image_url && (
            <Image src={project.hero_image_url} alt={project.project_name} fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, 350px" />
          )}
          <span className="pf-city-chip">{label}</span>
        </div>
        <div className="pf-card-body">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {project.project_type && (
              <span className="pf-chip" style={{ background: projectTypeStyle.bg, color: projectTypeStyle.color }}>
                {formatType(project.project_type)}
              </span>
            )}
            {project.current_status && (
              <span className="pf-chip" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                {formatStatus(project.current_status)}
              </span>
            )}
          </div>
          <div>
            <h3 className="pf-card-title">{project.project_name}</h3>
            {project.developer_brand && <p className="pf-card-sub">by {project.developer_brand}</p>}
          </div>
          {(project.micro_market || label) && <p className="pf-card-location">{[project.micro_market, label].filter(Boolean).join(", ")}</p>}
          {project.primary_differentiator && <p className="pf-card-desc">{project.primary_differentiator}</p>}
          <div style={{ flex: 1 }} />
          <div className="pf-card-footer">
            <div>
              {price && <p className="pf-card-price">{price}</p>}
              {project.total_units ? <p className="pf-card-muted">{project.total_units} units</p> : null}
            </div>
            <span className="pf-view-button">View</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={active ? "pf-filter-pill active" : "pf-filter-pill"}>
      {label}
    </button>
  );
}

function PortfolioViewSwitcher({ view, onChange }: { view: PortfolioView; onChange: (view: PortfolioView) => void }) {
  return (
    <div className="pf-view-switch" role="tablist" aria-label="Portfolio view">
      <button className={view === "cards" ? "active" : ""} onClick={() => onChange("cards")} role="tab" aria-selected={view === "cards"}>
        <Eye size={15} /> Cards
      </button>
      <button className={view === "table" ? "active" : ""} onClick={() => onChange("table")} role="tab" aria-selected={view === "table"}>
        <Table2 size={15} /> Table
      </button>
    </div>
  );
}

function PortfolioStatsBar({ projects }: { projects: FocusProject[] }) {
  const stats = useMemo(() => {
    const builders = new Set(projects.map((p) => p.developer_brand).filter(Boolean));
    const locations = new Set(projects.map((p) => getLocation(p)).filter(Boolean));
    return [
      { label: "Total Projects", value: projects.length },
      { label: "Builders", value: builders.size },
      { label: "Locations", value: locations.size },
      { label: "Ready Projects", value: projects.filter((p) => ["ready_to_move", "completed", "Ready To Move"].includes(String(p.current_status))).length },
      { label: "Under Construction", value: projects.filter((p) => ["under_construction", "Under Construction"].includes(String(p.current_status))).length },
      { label: "Villa Projects", value: projects.filter((p) => p.project_type === "villa").length },
      { label: "Apartment Projects", value: projects.filter((p) => p.project_type === "apartment").length },
      { label: "Commercial Projects", value: projects.filter((p) => p.project_type === "commercial").length },
    ];
  }, [projects]);

  return (
    <div className="pf-stats">
      {stats.map((stat) => (
        <div className="pf-stat" key={stat.label}>
          <p>{stat.value}</p>
          <span>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}

function PortfolioFilterPanel({
  projects,
  filters,
  setFilter,
  clearFilters,
}: {
  projects: FocusProject[];
  filters: Filters;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
}) {
  const [open, setOpen] = useState(false);
  const options = useMemo(() => ({
    builder: uniqueOptions(projects, (p) => p.developer_brand ?? ""),
    location: uniqueOptions(projects, getLocation),
    microMarket: uniqueOptions(projects, (p) => p.micro_market ?? ""),
    projectType: uniqueOptions(projects, (p) => formatType(p.project_type)),
    configuration: uniqueOptions(projects, getConfig),
    budget: uniqueOptions(projects, getBudgetBucket),
    psf: uniqueOptions(projects, getPsfBucket),
    possessionYear: uniqueOptions(projects, getPossessionYear),
    projectStatus: uniqueOptions(projects, (p) => formatStatus(p.current_status)),
    reraStatus: uniqueOptions(projects, getReraStatus),
    sizeRange: uniqueOptions(projects, getSizeBucket),
  }), [projects]);
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="pf-panel">
      <button className="pf-panel-toggle" onClick={() => setOpen((v) => !v)}>
        <Filter size={16} /> Filters {activeCount > 0 && <span>{activeCount}</span>} <ChevronDown size={16} style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div className="pf-filter-panel">
          {FILTERS.map((filter) => {
            const values = options[filter.key] ?? [];
            if (values.length === 0) return null;
            return (
              <label key={filter.key}>
                <span>{filter.label}</span>
                <select value={filters[filter.key] ?? ""} onChange={(event) => setFilter(filter.key, event.target.value)}>
                  <option value="">All</option>
                  {values.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
            );
          })}
          <button className="pf-clear" onClick={clearFilters}><X size={14} /> Clear filters</button>
        </div>
      )}
    </div>
  );
}

function PortfolioRowDetails({ project }: { project: FocusProject }) {
  const amenities = [...valueFromUnknown(project.project_detail?.amenities_json), ...(project.special_amenities ?? []), ...(project.sports_amenities ?? [])].slice(0, 12);
  const floorPlans = valueFromUnknown(project.project_detail?.floor_plan_images);
  const gallery = [...(project.gallery_image_urls ?? []), ...valueFromUnknown(project.project_detail?.gallery_images_json)].filter(Boolean).slice(0, 6);
  const description = project.project_detail?.project_overview_seo ?? project.primary_differentiator ?? project.investment_verdict ?? "";
  const href = getProjectHref(project);
  const mapUrl = project.project_detail?.google_maps_embed_url ?? project.project_detail?.google_maps_url ?? "";
  const brochure = project.project_detail?.brochure_url ?? "";

  return (
    <div className="pf-row-details">
      <div className="pf-detail-media">
        {project.hero_image_url || project.project_detail?.hero_image_url ? (
          <Image src={(project.hero_image_url || project.project_detail?.hero_image_url) as string} alt={project.project_name} fill style={{ objectFit: "cover" }} sizes="320px" />
        ) : (
          <div className="pf-empty-media">No image</div>
        )}
      </div>
      <div className="pf-detail-content">
        <div>
          <h3>{project.project_name}</h3>
          <p>{description}</p>
        </div>
        <div className="pf-detail-grid">
          <InfoBlock title="Amenities" items={amenities} empty="No amenities listed" />
          <InfoBlock title="Floor Plans" items={floorPlans} empty="No floor plans listed" />
          <InfoBlock title="Gallery" items={gallery} empty="No gallery listed" />
          <InfoBlock title="Links" items={[brochure && "Brochure", mapUrl && "Google Maps", project.official_website && "Website"].filter(Boolean) as string[]} empty="No links listed" />
        </div>
        <div className="pf-detail-actions">
          <Link href={href}>View Project</Link>
          <Link href={`${href}?enquire=1`}>Enquire</Link>
          {brochure && <a href={brochure} target="_blank" rel="noreferrer">Brochure</a>}
          {project.official_website && <a href={project.official_website} target="_blank" rel="noreferrer">Website</a>}
        </div>
        <p className="pf-agent">Agent contact: Westside Realty advisory desk</p>
      </div>
    </div>
  );
}

function InfoBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <strong>{title}</strong>
      {items.length ? (
        <ul>{items.slice(0, 5).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
      ) : (
        <p>{empty}</p>
      )}
    </div>
  );
}

function PortfolioTableView({
  projects,
  search,
  setSearch,
  filters,
  setFilter,
  clearFilters,
  updateUrlParam,
  cityFilter,
}: {
  projects: FocusProject[];
  search: string;
  setSearch: (value: string) => void;
  filters: Filters;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  updateUrlParam: (key: string, value: string | null) => void;
  cityFilter: string;
}) {
  const [sortRules, setSortRules] = useState<SortRule[]>([]);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [hiddenColumns, setHiddenColumns] = useState<Set<ColumnKey>>(new Set());
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [expanded, setExpanded] = useState<string | number | null>(null);
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [dragColumn, setDragColumn] = useState<ColumnKey | null>(null);
  const resizingRef = useRef<{ key: ColumnKey; startX: number; startWidth: number } | null>(null);

  const visibleColumns = columns.filter((column) => !hiddenColumns.has(column.key));
  const cityScopedProjects = useMemo(
    () => projects.filter((project) => cityFilter === "all" || project.city_slug === cityFilter),
    [projects, cityFilter],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cityScopedProjects.filter((project) => {
      if (q && !asSearchText(project).includes(q)) return false;
      if (filters.builder && project.developer_brand !== filters.builder) return false;
      if (filters.location && getLocation(project) !== filters.location) return false;
      if (filters.microMarket && project.micro_market !== filters.microMarket) return false;
      if (filters.projectType && formatType(project.project_type) !== filters.projectType) return false;
      if (filters.configuration && getConfig(project) !== filters.configuration) return false;
      if (filters.budget && getBudgetBucket(project) !== filters.budget) return false;
      if (filters.psf && getPsfBucket(project) !== filters.psf) return false;
      if (filters.possessionYear && getPossessionYear(project) !== filters.possessionYear) return false;
      if (filters.projectStatus && formatStatus(project.current_status) !== filters.projectStatus) return false;
      if (filters.reraStatus && getReraStatus(project) !== filters.reraStatus) return false;
      if (filters.sizeRange && getSizeBucket(project) !== filters.sizeRange) return false;
      return true;
    });
  }, [cityScopedProjects, search, filters]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    rows.sort((a, b) => {
      for (const rule of sortRules) {
        const av = getColumnValue(a, rule.key);
        const bv = getColumnValue(b, rule.key);
        const an = typeof av === "number" ? av : Number(av);
        const bn = typeof bv === "number" ? bv : Number(bv);
        let result = 0;
        if (Number.isFinite(an) && Number.isFinite(bn) && av !== "" && bv !== "") result = an - bn;
        else result = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true, sensitivity: "base" });
        if (result !== 0) return rule.direction === "asc" ? result : -result;
      }
      return 0;
    });
    return rows;
  }, [filtered, sortRules]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = sorted.slice((Math.min(page, totalPages) - 1) * pageSize, Math.min(page, totalPages) * pageSize);

  useEffect(() => setPage(1), [search, filters, pageSize]);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      const state = resizingRef.current;
      if (!state) return;
      const delta = event.clientX - state.startX;
      setColumns((cols) => cols.map((col) => col.key === state.key ? { ...col, width: Math.max(col.minWidth, state.startWidth + delta) } : col));
    };
    const onUp = () => { resizingRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const toggleSort = (key: ColumnKey, multi: boolean) => {
    setSortRules((rules) => {
      const existing = rules.find((rule) => rule.key === key);
      const nextDirection: SortDirection = existing?.direction === "asc" ? "desc" : "asc";
      if (!multi) return [{ key, direction: nextDirection }];
      if (!existing) return [...rules, { key, direction: "asc" }];
      return rules.map((rule) => rule.key === key ? { ...rule, direction: nextDirection } : rule);
    });
  };

  const handleExportCsv = () => {
    const rows = getExportRows(sorted, visibleColumns);
    const header = visibleColumns.map((column) => csvEscape(column.label)).join(",");
    const body = rows.map((row) => visibleColumns.map((column) => csvEscape(row[column.label])).join(",")).join("\n");
    downloadBlob(new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8" }), "westside-portfolio.csv");
  };

  const handleExportExcel = async () => {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(getExportRows(sorted, visibleColumns));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Portfolio");
    XLSX.writeFile(workbook, "westside-portfolio.xlsx");
  };

  const handleExportPdf = () => {
    const rows = getExportRows(sorted, visibleColumns);
    const htmlRows = rows.map((row) => `<tr>${visibleColumns.map((column) => `<td>${String(row[column.label] ?? "")}</td>`).join("")}</tr>`).join("");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Westside Portfolio</title><style>
      body{font-family:Arial,sans-serif;padding:24px;color:#1A1A1F} table{border-collapse:collapse;width:100%;font-size:10px}
      th,td{border:1px solid #ddd;padding:6px;text-align:left} th{background:#f3f1ea}
      h1{font-size:20px;margin:0 0 16px}
      </style></head><body><h1>Westside Portfolio</h1><table><thead><tr>${visibleColumns.map((column) => `<th>${column.label}</th>`).join("")}</tr></thead><tbody>${htmlRows}</tbody></table></body></html>
    `);
    win.document.close();
    win.print();
  };

  const moveColumn = (target: ColumnKey) => {
    if (!dragColumn || dragColumn === target) return;
    setColumns((cols) => {
      const from = cols.findIndex((col) => col.key === dragColumn);
      const to = cols.findIndex((col) => col.key === target);
      const next = [...cols];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setDragColumn(null);
  };

  const tableWidth = visibleColumns.reduce((sum, column) => sum + column.width, 0);

  return (
    <div className="pf-table-shell">
      <div className="pf-table-toolbar">
        <div className="pf-search">
          <Search size={16} />
          <input value={search} onChange={(event) => { setSearch(event.target.value); updateUrlParam("q", event.target.value || null); }} placeholder="Search projects, builders, Kokapet, 4 BHK, Ready, ₹3 Cr..." />
        </div>
        <div className="pf-toolbar-actions">
          <button onClick={() => setColumnMenuOpen((v) => !v)}><Columns3 size={16} /> Columns</button>
          <button onClick={handleExportCsv}><FileText size={16} /> CSV</button>
          <button onClick={handleExportExcel}><FileSpreadsheet size={16} /> Excel</button>
          <button onClick={handleExportPdf}><Printer size={16} /> PDF</button>
        </div>
        {columnMenuOpen && (
          <div className="pf-column-menu">
            {columns.map((column) => (
              <label key={column.key}>
                <input
                  type="checkbox"
                  checked={!hiddenColumns.has(column.key)}
                  onChange={() => setHiddenColumns((prev) => {
                    const next = new Set(prev);
                    if (next.has(column.key)) next.delete(column.key);
                    else next.add(column.key);
                    return next;
                  })}
                />
                {column.label}
              </label>
            ))}
          </div>
        )}
      </div>

      <PortfolioFilterPanel projects={cityScopedProjects} filters={filters} setFilter={setFilter} clearFilters={clearFilters} />
      <PortfolioStatsBar projects={filtered} />

      <div className="pf-selection-row">
        <span>{sorted.length} rows · {selected.size} selected</span>
        {sortRules.length > 0 && <button onClick={() => setSortRules([])}>Clear sorting</button>}
      </div>

      <div className="pf-grid-wrap" tabIndex={0} onKeyDown={(event) => {
        if (event.key === "Escape") setExpanded(null);
        if (event.key === "ArrowRight") setPage((p) => Math.min(totalPages, p + 1));
        if (event.key === "ArrowLeft") setPage((p) => Math.max(1, p - 1));
      }}>
        <table className="pf-data-grid" style={{ minWidth: tableWidth }}>
          <thead>
            <tr>
              {visibleColumns.map((column, index) => {
                const sort = sortRules.find((rule) => rule.key === column.key);
                return (
                  <th
                    key={column.key}
                    style={{ width: column.width, minWidth: column.width, textAlign: column.align ?? "left" }}
                    className={index === 0 ? "sticky-col" : ""}
                    draggable
                    onDragStart={() => setDragColumn(column.key)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => moveColumn(column.key)}
                  >
                    <button onClick={(event) => toggleSort(column.key, event.shiftKey)}>
                      <GripVertical size={13} />
                      {column.label}
                      {sort ? (sort.direction === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ChevronsUpDown size={13} />}
                    </button>
                    <span
                      className="pf-resizer"
                      onMouseDown={(event) => { resizingRef.current = { key: column.key, startX: event.clientX, startWidth: column.width }; }}
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((project) => {
              const isExpanded = expanded === project.id;
              const isSelected = selected.has(project.id);
              return (
                <Fragment key={project.id}>
                  <tr key={project.id} className={isSelected ? "selected" : ""} onClick={() => setExpanded(isExpanded ? null : project.id)}>
                    {visibleColumns.map((column, index) => (
                      <td key={column.key} style={{ width: column.width, minWidth: column.width, textAlign: column.align ?? "left" }} className={index === 0 ? "sticky-col" : ""}>
                        {index === 0 && (
                          <input
                            type="checkbox"
                            aria-label={`Select ${project.project_name}`}
                            checked={isSelected}
                            onClick={(event) => event.stopPropagation()}
                            onChange={() => setSelected((prev) => {
                              const next = new Set(prev);
                              if (next.has(project.id)) next.delete(project.id);
                              else next.add(project.id);
                              return next;
                            })}
                          />
                        )}
                        <span>{renderColumnValue(project, column.key)}</span>
                      </td>
                    ))}
                  </tr>
                  {isExpanded && (
                    <tr key={`${project.id}-details`}>
                      <td colSpan={visibleColumns.length} className="pf-details-cell">
                        <PortfolioRowDetails project={project} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {pageRows.length === 0 && (
              <tr><td colSpan={visibleColumns.length} className="pf-empty-table">No projects match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pf-pagination">
        <span>Page {Math.min(page, totalPages)} of {totalPages}</span>
        <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
          {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size} / page</option>)}
        </select>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft size={16} /> Previous</button>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next <ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

function PortfolioCardView({
  projects,
  cityFilter,
  typeFilter,
  statusFilter,
  setFilter,
}: {
  projects: FocusProject[];
  cityFilter: string;
  typeFilter: string;
  statusFilter: string;
  setFilter: (key: string, value: string) => void;
}) {
  const cities = useMemo(() => uniqueOptions(projects, (p) => p.city_slug ?? ""), [projects]);
  const types = useMemo(() => uniqueOptions(projects, (p) => p.project_type ?? ""), [projects]);
  const filtered = useMemo(() => projects.filter((p) => {
    if (cityFilter !== "all" && p.city_slug !== cityFilter) return false;
    if (typeFilter !== "all" && p.project_type !== typeFilter) return false;
    if (statusFilter === "ready" && p.current_status !== "ready_to_move" && p.current_status !== "completed") return false;
    if (statusFilter === "construction" && p.current_status !== "under_construction") return false;
    return true;
  }), [projects, cityFilter, typeFilter, statusFilter]);

  return (
    <>
      <div className="pf-filter-bar">
        <div className="pf-filter-desktop">
          <FilterPill label="All Cities" active={cityFilter === "all"} onClick={() => setFilter("city", "all")} />
          {cities.map((c) => <FilterPill key={c} label={CITY_LABELS[c] ?? c} active={cityFilter === c} onClick={() => setFilter("city", c)} />)}
          <div className="pf-divider" />
          <FilterPill label="All Types" active={typeFilter === "all"} onClick={() => setFilter("type", "all")} />
          {types.map((t) => <FilterPill key={t} label={formatType(t)} active={typeFilter === t} onClick={() => setFilter("type", t)} />)}
          <div className="pf-divider" />
          <FilterPill label="All Status" active={statusFilter === "all"} onClick={() => setFilter("status", "all")} />
          <FilterPill label="Ready to Move" active={statusFilter === "ready"} onClick={() => setFilter("status", "ready")} />
          <FilterPill label="Under Construction" active={statusFilter === "construction"} onClick={() => setFilter("status", "construction")} />
        </div>
      </div>
      <div className="pf-content">
        <p className="pf-result-count">Showing <strong>{filtered.length}</strong> project{filtered.length !== 1 ? "s" : ""}</p>
        {filtered.length === 0 ? <div className="pf-empty">No projects match these filters.</div> : (
          <div className="pf-grid">
            {filtered.map((project) => <PortfolioCard key={project.id} project={project} />)}
          </div>
        )}
        <BottomCta />
      </div>
    </>
  );
}

function BottomCta() {
  return (
    <div className="pf-bottom-cta">
      <p>Not seeing what you need?</p>
      <h2>Talk to an advisor - we source off-market too</h2>
      <span>Our team has access to pre-launch allocations and developer-direct deals not listed publicly.</span>
      <InlineLeadForm sourcePage="/portfolio" leadType="BUYER_REQUIREMENT" ctaLabel="Request a Callback" details={{ interest: "off_market_projects" }} />
    </div>
  );
}

function PortfolioClientInner({ projects }: { projects: FocusProject[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [view, setViewState] = useState<PortfolioView>(() => {
    if (typeof window === "undefined") return "cards";
    const stored = window.localStorage.getItem("portfolio:view");
    return stored === "table" ? "table" : "cards";
  });
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [filters, setFilters] = useState<Filters>(() => ({
    builder: searchParams.get("builder") ?? "",
    location: searchParams.get("location") ?? "",
    microMarket: searchParams.get("market") ?? "",
    projectType: searchParams.get("projectType") ?? "",
    configuration: searchParams.get("config") ?? "",
    budget: searchParams.get("budget") ?? "",
    psf: searchParams.get("psf") ?? "",
    possessionYear: searchParams.get("possession") ?? "",
    projectStatus: searchParams.get("projectStatus") ?? "",
    reraStatus: searchParams.get("rera") ?? "",
    sizeRange: searchParams.get("size") ?? "",
  }));

  const cityFilter = searchParams.get("city") ?? "all";
  const typeFilter = searchParams.get("type") ?? "all";
  const statusFilter = searchParams.get("status") ?? "all";

  const urlView = searchParams.get("view");
  const activeView: PortfolioView = urlView === "table" || urlView === "cards" ? urlView : view;

  const updateUrlParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.replace(`/portfolio${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [router, searchParams]);

  const setView = (next: PortfolioView) => {
    setViewState(next);
    window.localStorage.setItem("portfolio:view", next);
    updateUrlParam("view", next === "cards" ? null : next);
  };

  const setCardFilter = (key: string, value: string) => updateUrlParam(key, value);

  const setFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    const urlKey: Record<string, string> = {
      builder: "builder",
      location: "location",
      microMarket: "market",
      projectType: "projectType",
      configuration: "config",
      budget: "budget",
      psf: "psf",
      possessionYear: "possession",
      projectStatus: "projectStatus",
      reraStatus: "rera",
      sizeRange: "size",
    };
    updateUrlParam(urlKey[key] ?? key, value || null);
  };

  const clearFilters = () => {
    setFilters({});
    for (const key of ["builder", "location", "market", "projectType", "config", "budget", "psf", "possession", "projectStatus", "rera", "size"]) {
      updateUrlParam(key, null);
    }
  };

  const cities = useMemo(() => uniqueOptions(projects, (p) => p.city_slug ?? ""), [projects]);
  const readyCount = projects.filter((p) => p.current_status === "ready_to_move" || p.current_status === "completed").length;

  return (
    <div className="pf-page">
      <PortfolioStyles />
      <div className="pf-hero">
        <div className="pf-hero-inner">
          <div className="pf-hero-copy">
            <p>Westside Realty · Active Portfolio</p>
            <h1>Projects We Actively Market</h1>
            <span>Developer partnerships, live inventory, and dedicated advisors on each project.</span>
          </div>
          <PortfolioViewSwitcher view={activeView} onChange={setView} />
          <div className="pf-hero-stats">
            {[{ label: "Active Projects", value: projects.length }, { label: "Cities", value: cities.length }, { label: "Ready to Move", value: readyCount }].map((stat) => (
              <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>
            ))}
          </div>
        </div>
      </div>
      {activeView === "cards" ? (
        <PortfolioCardView projects={projects} cityFilter={cityFilter} typeFilter={typeFilter} statusFilter={statusFilter} setFilter={setCardFilter} />
      ) : (
        <div className="pf-content pf-table-content">
          <PortfolioTableView projects={projects} search={search} setSearch={setSearch} filters={filters} setFilter={setFilter} clearFilters={clearFilters} updateUrlParam={updateUrlParam} cityFilter={cityFilter} />
        </div>
      )}
    </div>
  );
}

function PortfolioStyles() {
  return (
    <style>{`
      .pf-page { background: ${C.bg}; min-height: 100vh; color: ${C.text}; }
      .pf-hero { background: ${C.bgDark}; padding: 54px 24px 34px; }
      .pf-hero-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr auto; gap: 28px; align-items: start; }
      .pf-hero-copy p { font-size: 11px; font-weight: 800; letter-spacing: .12em; color: ${C.gold}; text-transform: uppercase; margin: 0 0 12px; }
      .pf-hero-copy h1 { font-size: clamp(28px, 5vw, 48px); line-height: 1.08; color: #fff; margin: 0 0 12px; font-weight: 850; letter-spacing: 0; }
      .pf-hero-copy span { display: block; max-width: 560px; color: rgba(255,255,255,.62); font-size: 15px; line-height: 1.65; }
      .pf-hero-stats { grid-column: 1 / -1; display: flex; gap: 28px; flex-wrap: wrap; }
      .pf-hero-stats strong { display: block; color: #fff; font-size: 28px; line-height: 1; }
      .pf-hero-stats span { color: rgba(255,255,255,.45); font-size: 12px; margin-top: 5px; display: block; }
      .pf-view-switch { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); border-radius: 10px; padding: 4px; display: flex; gap: 4px; }
      .pf-view-switch button { border: 0; background: transparent; color: rgba(255,255,255,.68); border-radius: 8px; padding: 9px 14px; display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; cursor: pointer; }
      .pf-view-switch button.active { background: #fff; color: ${C.bgDark}; }
      .pf-filter-bar { background: #fff; border-bottom: 1px solid ${C.border}; position: sticky; top: 64px; z-index: 40; }
      .pf-filter-desktop { display: flex; gap: 8px; align-items: center; overflow-x: auto; padding: 14px 24px; scrollbar-width: none; max-width: 1200px; margin: 0 auto; }
      .pf-filter-pill { font-size: 13px; font-weight: 500; padding: 7px 16px; border-radius: 999px; border: 1.5px solid ${C.border}; background: #fff; color: ${C.text}; cursor: pointer; transition: all .15s; white-space: nowrap; }
      .pf-filter-pill.active { background: ${C.bgDark}; border-color: ${C.bgDark}; color: #fff; font-weight: 700; }
      .pf-divider { width: 1px; height: 20px; background: ${C.border}; flex: 0 0 auto; margin: 0 2px; }
      .pf-content { max-width: 1200px; margin: 0 auto; padding: 32px 16px 80px; }
      .pf-result-count { font-size: 13px; color: ${C.textMuted}; margin: 0 0 20px; }
      .pf-result-count strong { color: ${C.text}; }
      .pf-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
      .pf-card { background: #fff; border: 1px solid ${C.border}; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; height: 100%; transition: box-shadow .2s, transform .2s; }
      .pf-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,.10); transform: translateY(-2px); }
      .pf-card-image { position: relative; height: 190px; background: linear-gradient(135deg, #1A1A1F, #B08D57); overflow: hidden; }
      .pf-city-chip { position: absolute; bottom: 8px; left: 10px; font-size: 10px; font-weight: 800; letter-spacing: .08em; padding: 3px 8px; border-radius: 99px; background: rgba(0,0,0,.55); color: #fff; text-transform: uppercase; }
      .pf-card-body { padding: 18px 18px 16px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
      .pf-chip { font-size: 10px; font-weight: 800; letter-spacing: .04em; padding: 2px 8px; border-radius: 99px; text-transform: uppercase; }
      .pf-card-title { font-size: 15px; line-height: 1.3; margin: 0; font-weight: 800; color: ${C.text}; letter-spacing: 0; }
      .pf-card-sub, .pf-card-location, .pf-card-desc, .pf-card-muted { font-size: 12px; color: ${C.textMuted}; margin: 3px 0 0; line-height: 1.45; }
      .pf-card-desc { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0; line-height: 1.5; }
      .pf-card-footer { border-top: 1px solid ${C.border}; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; gap: 14px; }
      .pf-card-price { font-size: 13px; font-weight: 800; color: ${C.text}; margin: 0; }
      .pf-view-button { font-size: 12px; font-weight: 800; color: #fff; background: ${C.bgDark}; padding: 7px 14px; border-radius: 8px; white-space: nowrap; }
      .pf-bottom-cta { margin-top: 56px; padding: 36px 28px; background: ${C.bgDark}; border-radius: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; }
      .pf-bottom-cta p { font-size: 11px; font-weight: 800; letter-spacing: .1em; color: ${C.gold}; text-transform: uppercase; margin: 0; }
      .pf-bottom-cta h2 { font-size: 20px; font-weight: 800; color: #fff; margin: 0; letter-spacing: 0; }
      .pf-bottom-cta span { font-size: 14px; color: rgba(255,255,255,.55); max-width: 440px; line-height: 1.5; }
      .pf-table-content { max-width: 1440px; }
      .pf-table-shell { display: flex; flex-direction: column; gap: 14px; }
      .pf-table-toolbar { position: relative; display: flex; gap: 12px; justify-content: space-between; align-items: center; flex-wrap: wrap; }
      .pf-search { flex: 1; min-width: 260px; height: 44px; border: 1px solid ${C.line}; background: #fff; border-radius: 10px; display: flex; align-items: center; gap: 10px; padding: 0 14px; color: ${C.textMuted}; }
      .pf-search input { border: 0; outline: 0; width: 100%; height: 100%; font-size: 14px; background: transparent; }
      .pf-toolbar-actions { display: flex; gap: 8px; flex-wrap: wrap; }
      .pf-toolbar-actions button, .pf-panel-toggle, .pf-selection-row button, .pf-pagination button, .pf-clear { height: 38px; border: 1px solid ${C.line}; background: #fff; border-radius: 9px; padding: 0 12px; display: inline-flex; align-items: center; gap: 7px; font-weight: 700; font-size: 12px; color: ${C.text}; cursor: pointer; }
      .pf-toolbar-actions button:hover, .pf-panel-toggle:hover, .pf-pagination button:hover:not(:disabled) { background: ${C.bgWarm}; }
      .pf-pagination button:disabled { opacity: .45; cursor: not-allowed; }
      .pf-column-menu { position: absolute; right: 0; top: 48px; background: #fff; border: 1px solid ${C.line}; box-shadow: 0 16px 40px rgba(0,0,0,.12); border-radius: 10px; padding: 10px; z-index: 60; display: grid; grid-template-columns: repeat(2, minmax(150px, 1fr)); gap: 6px; }
      .pf-column-menu label { font-size: 12px; display: flex; gap: 8px; align-items: center; padding: 6px; }
      .pf-panel { background: #fff; border: 1px solid ${C.line}; border-radius: 12px; padding: 10px; }
      .pf-panel-toggle span { background: ${C.bgDark}; color: #fff; border-radius: 999px; padding: 2px 7px; font-size: 11px; }
      .pf-filter-panel { display: grid; grid-template-columns: repeat(4, minmax(170px, 1fr)); gap: 12px; padding-top: 12px; }
      .pf-filter-panel label { display: flex; flex-direction: column; gap: 6px; }
      .pf-filter-panel label span { font-size: 11px; font-weight: 800; color: ${C.textMuted}; text-transform: uppercase; letter-spacing: .06em; }
      .pf-filter-panel select, .pf-pagination select { border: 1px solid ${C.line}; border-radius: 8px; height: 36px; padding: 0 10px; background: #fff; font-size: 13px; }
      .pf-clear { justify-content: center; align-self: end; }
      .pf-stats { display: grid; grid-template-columns: repeat(8, minmax(120px, 1fr)); gap: 10px; }
      .pf-stat { background: #fff; border: 1px solid ${C.line}; border-radius: 12px; padding: 14px; min-height: 78px; }
      .pf-stat p { margin: 0; font-size: 22px; line-height: 1; font-weight: 850; }
      .pf-stat span { margin-top: 8px; display: block; font-size: 11px; color: ${C.textMuted}; font-weight: 700; line-height: 1.3; }
      .pf-selection-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: ${C.textMuted}; font-size: 13px; }
      .pf-grid-wrap { overflow: auto; max-height: 68vh; border: 1px solid ${C.line}; border-radius: 12px; background: #fff; outline: none; }
      .pf-data-grid { border-collapse: separate; border-spacing: 0; width: 100%; table-layout: fixed; font-size: 13px; }
      .pf-data-grid th { position: sticky; top: 0; z-index: 20; background: #F7F5EF; border-bottom: 1px solid ${C.line}; border-right: 1px solid ${C.line}; height: 42px; color: #555; }
      .pf-data-grid th button { width: 100%; height: 100%; border: 0; background: transparent; display: flex; align-items: center; gap: 6px; padding: 0 10px; font-size: 11px; font-weight: 850; text-transform: uppercase; color: #555; cursor: pointer; letter-spacing: .04em; }
      .pf-data-grid td { border-bottom: 1px solid #EFECE5; border-right: 1px solid #EFECE5; height: 45px; padding: 0 10px; background: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: middle; }
      .pf-data-grid tr:hover td { background: #FCFBF7; }
      .pf-data-grid tr.selected td { background: #F2F6FF; }
      .pf-data-grid td input { margin-right: 8px; vertical-align: middle; }
      .pf-data-grid .sticky-col { position: sticky; left: 0; z-index: 15; box-shadow: 1px 0 0 ${C.line}; }
      .pf-data-grid th.sticky-col { z-index: 30; }
      .pf-resizer { position: absolute; top: 0; right: -3px; width: 7px; height: 100%; cursor: col-resize; }
      .pf-details-cell { padding: 0 !important; white-space: normal !important; background: #FBFAF6 !important; }
      .pf-row-details { display: grid; grid-template-columns: 260px 1fr; gap: 18px; padding: 18px; }
      .pf-detail-media { position: relative; min-height: 180px; border-radius: 10px; overflow: hidden; background: ${C.bgWarm}; }
      .pf-empty-media { height: 100%; display: flex; align-items: center; justify-content: center; color: ${C.textMuted}; }
      .pf-detail-content h3 { margin: 0 0 8px; font-size: 18px; letter-spacing: 0; }
      .pf-detail-content p { margin: 0; color: ${C.textMuted}; line-height: 1.55; font-size: 13px; }
      .pf-detail-grid { display: grid; grid-template-columns: repeat(4, minmax(130px, 1fr)); gap: 12px; margin-top: 14px; }
      .pf-detail-grid div { background: #fff; border: 1px solid ${C.line}; border-radius: 10px; padding: 12px; }
      .pf-detail-grid strong { font-size: 12px; display: block; margin-bottom: 8px; }
      .pf-detail-grid ul { margin: 0; padding-left: 16px; color: ${C.textMuted}; font-size: 12px; line-height: 1.5; }
      .pf-detail-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
      .pf-detail-actions a { text-decoration: none; height: 34px; display: inline-flex; align-items: center; padding: 0 12px; border-radius: 8px; background: ${C.bgDark}; color: #fff; font-size: 12px; font-weight: 800; }
      .pf-agent { margin-top: 10px !important; font-size: 12px !important; color: ${C.textMuted}; }
      .pf-empty-table, .pf-empty { text-align: center; padding: 70px 0; color: ${C.textMuted}; }
      .pf-pagination { display: flex; justify-content: flex-end; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 13px; color: ${C.textMuted}; }
      @media (max-width: 980px) {
        .pf-hero-inner { grid-template-columns: 1fr; }
        .pf-view-switch { justify-self: start; }
        .pf-filter-panel { grid-template-columns: repeat(2, minmax(150px, 1fr)); }
        .pf-stats { grid-template-columns: repeat(4, minmax(120px, 1fr)); }
        .pf-row-details { grid-template-columns: 1fr; }
        .pf-detail-grid { grid-template-columns: repeat(2, minmax(130px, 1fr)); }
      }
      @media (max-width: 640px) {
        .pf-hero { padding: 40px 16px 28px; }
        .pf-content { padding: 22px 12px 64px; }
        .pf-grid { grid-template-columns: 1fr; gap: 14px; }
        .pf-filter-desktop { padding: 12px 12px; }
        .pf-table-toolbar { align-items: stretch; }
        .pf-toolbar-actions { width: 100%; overflow-x: auto; flex-wrap: nowrap; }
        .pf-filter-panel { grid-template-columns: 1fr; }
        .pf-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .pf-column-menu { left: 0; right: auto; grid-template-columns: 1fr; }
        .pf-detail-grid { grid-template-columns: 1fr; }
        .pf-grid-wrap { max-height: 70vh; }
      }
    `}</style>
  );
}

export function PortfolioClient({ projects }: { projects: FocusProject[] }) {
  return (
    <Suspense fallback={
      <div style={{ background: C.bgDark, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Loading...</p>
      </div>
    }>
      <PortfolioClientInner projects={projects} />
    </Suspense>
  );
}
