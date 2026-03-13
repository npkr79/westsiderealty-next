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

function formatPossession(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function formatSizeRange(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  // Normalize "1200-2400" → "1,200 – 2,400 sq ft"
  const parts = raw.split(/[-–]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 2) {
    const [a, b] = parts.map((p) => {
      const n = parseInt(p.replace(/,/g, ""), 10);
      return isNaN(n) ? p : n.toLocaleString("en-IN");
    });
    if (a === b) return `${a} sq ft`;
    return `${a} – ${b} sq ft`;
  }
  return `${raw.trim()} sq ft`;
}

interface PropTypeBadge { label: string; cls: string; }
function getPropTypeBadge(types: string[]): PropTypeBadge {
  const first = (types[0] ?? "").toLowerCase();
  if (first.includes("villa"))
    return { label: "Villa", cls: "bg-green-50 text-green-700 border-green-200" };
  if (first.includes("plot") || first.includes("land"))
    return { label: "Plot", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  if (first.includes("apartment") || first.includes("flat"))
    return { label: "Apartment", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  if (first)
    return {
      label: first.charAt(0).toUpperCase() + first.slice(1),
      cls: "bg-gray-50 text-gray-700 border-gray-200",
    };
  return { label: "Property", cls: "bg-gray-50 text-gray-700 border-gray-200" };
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

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200"
    >
      {/* Type badge */}
      <span
        className={`self-start text-[11px] font-semibold px-2.5 py-0.5 rounded-full border mb-3 ${badge.cls}`}
      >
        {badge.label}
      </span>

      {/* Project name */}
      <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 mb-2 group-hover:text-indigo-700 transition-colors">
        {project.project_name}
      </h3>

      {/* BHK + size */}
      {(bhk || size) && (
        <p className="text-xs text-gray-500 mb-1">
          {[bhk, size].filter(Boolean).join("  ·  ")}
        </p>
      )}

      {/* Price */}
      <p className="text-sm font-semibold text-indigo-700 mt-auto pt-3">
        {price ?? "Contact for details"}
      </p>

      {/* Possession */}
      {possession && (
        <p className="text-xs text-gray-400 mt-1">Possession {possession}</p>
      )}

      {/* CTA */}
      <span className="text-xs font-semibold text-indigo-600 mt-3 flex items-center gap-1 group-hover:gap-2 transition-all">
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
      {/* Heading + count badge */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Projects in This Market</h2>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
          {visible.length} Project{visible.length !== 1 ? "s" : ""}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-8">
        RERA-registered residential projects in {marketName}.
      </p>

      {/* Grid: 1 col mobile → 2 tablet → 3 desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((p) => (
          <GoaProjectCard key={p.id} project={p} citySlug={citySlug} />
        ))}
      </div>
    </section>
  );
}
