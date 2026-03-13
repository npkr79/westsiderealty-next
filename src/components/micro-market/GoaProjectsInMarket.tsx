import Link from "next/link";
import { buildProjectUrl } from "@/lib/routes";

export interface GoaMarketProject {
  id: string;
  project_name: string;
  url_slug: string | null;
  city_slug: string;
  property_types: unknown;        // JSONB — may arrive as array or JSON string
  price_display_string: string | null;
  unit_size_range: string | null;
  configurations: unknown;        // JSONB — may arrive as array or JSON string
  proposed_completion_date: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string" && v.trim()) {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p.map(String).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function extractBhk(configs: string[]): string {
  const nums = [
    ...new Set(
      configs
        .map((c) => { const m = c.match(/^(\d+)\s*BHK/i); return m ? parseInt(m[1]) : null; })
        .filter((n): n is number => n !== null)
    ),
  ].sort((a, b) => a - b);
  return nums.length ? `${nums.join(", ")} BHK` : "";
}

function formatPossession(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  if (d <= now) return "Ready to Move";
  return "Possession " + d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function formatSizeRange(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  // Strip any trailing "sq ft" / "sqft" already in the string, then reformat cleanly
  const cleaned = raw.replace(/\s*sq\.?\s*ft\.?/gi, "").trim();
  const parts = cleaned.split(/[-–]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 2) {
    const [a, b] = parts.map((p) => {
      const n = parseInt(p.replace(/,/g, ""), 10);
      return isNaN(n) ? p : n.toLocaleString("en-IN");
    });
    if (a === b) return `${a} sqft`;
    return `${a} – ${b} sqft`;
  }
  const n = parseInt(cleaned.replace(/,/g, ""), 10);
  return `${isNaN(n) ? cleaned : n.toLocaleString("en-IN")} sqft`;
}

/** Title-case: "CASA SOLARIS" → "Casa Solaris" */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface PropTypeBadge { label: string; cls: string; }
function getPropTypeBadge(types: string[]): PropTypeBadge | null {
  const first = (types[0] ?? "").toLowerCase();
  if (first.includes("villa"))
    return { label: "Villa", cls: "bg-amber-500/20 text-amber-300 border border-amber-500/40" };
  if (first.includes("plot") || first.includes("land"))
    return { label: "Plot", cls: "bg-amber-500/10 text-amber-400 border border-amber-500/30" };
  if (first.includes("apartment") || first.includes("flat"))
    return { label: "Apartment", cls: "bg-slate-600/60 text-slate-200 border border-slate-500/50" };
  if (first)
    return {
      label: first.charAt(0).toUpperCase() + first.slice(1),
      cls: "bg-slate-600/60 text-slate-200 border border-slate-500/50",
    };
  return null; // no fallback "Property" badge
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function GoaProjectCard({ project, citySlug }: { project: GoaMarketProject; citySlug: string }) {
  if (!project.url_slug) return null;

  const href = buildProjectUrl(citySlug, project.url_slug);
  const types = parseArr(project.property_types);
  const configs = parseArr(project.configurations);
  const badge = getPropTypeBadge(types);
  const bhk = extractBhk(configs);
  const size = formatSizeRange(project.unit_size_range);
  const possession = formatPossession(project.proposed_completion_date);
  const price = project.price_display_string?.trim() || null;
  const name = toTitleCase(project.project_name);

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-amber-500/20 hover:border-amber-500/50 p-5 shadow-lg hover:shadow-xl transition-all duration-200 border-t-2 border-t-amber-500"
      style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)" }}
    >
      {/* Type badge */}
      {badge && (
        <span className={`self-start text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-3 ${badge.cls}`}>
          {badge.label}
        </span>
      )}

      {/* Project name */}
      <h3 className="text-xl font-bold text-white leading-snug line-clamp-2 mb-2 group-hover:text-amber-300 transition-colors">
        {name}
      </h3>

      {/* BHK + size */}
      {(bhk || size) && (
        <p className="text-sm text-slate-400 mb-1">
          {[bhk, size].filter(Boolean).join("  ·  ")}
        </p>
      )}

      {/* Price */}
      <p className={`mt-auto pt-3 font-semibold ${price ? "text-lg text-amber-400" : "text-sm text-slate-500"}`}>
        {price ?? "Contact for details"}
      </p>

      {/* Possession */}
      {possession && (
        <p className="text-xs text-slate-500 mt-1">{possession}</p>
      )}

      {/* CTA */}
      <span className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-sm font-semibold text-amber-400 group-hover:bg-amber-500/10 group-hover:border-amber-500/30 transition-all">
        View Project <span aria-hidden>→</span>
      </span>
    </Link>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

interface GoaProjectsInMarketProps {
  projects: GoaMarketProject[];
  citySlug: string;
  marketName: string;
}

export default function GoaProjectsInMarket({
  projects,
  citySlug,
  marketName,
}: GoaProjectsInMarketProps) {
  // Only render for Goa and when there's at least one project with a url_slug
  if (citySlug !== "goa" || projects.length === 0) return null;
  const visible = projects.filter((p) => p.url_slug);
  if (visible.length === 0) return null;

  return (
    <section className="py-10 border-t border-gray-100">
      {/* Heading + count badge — unchanged */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Projects in This Market</h2>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
          {visible.length} Project{visible.length !== 1 ? "s" : ""}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-8">
        RERA-registered residential projects in {marketName}.
      </p>

      {/* Grid: 1 col mobile → 2 tablet → 3 desktop — unchanged */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((p) => (
          <GoaProjectCard key={p.id} project={p} citySlug={citySlug} />
        ))}
      </div>
    </section>
  );
}
