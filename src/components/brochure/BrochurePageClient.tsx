"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { submitLead } from "@/app/actions/submit-lead";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  project_name: string;
  project_slug: string;
  project_type: string | null;
  current_status: string | null;
  developer_brand: string | null;
  micro_market: string | null;
  city: string | null;
  city_slug: string | null;
  current_price_per_sqft_min: number | null;
  current_price_per_sqft_max: number | null;
  total_units: number | null;
  hero_image_url: string | null;
  primary_differentiator: string | null;
  investment_verdict: string | null;
  possession_date: string | null;
  rera_id: string | null;
  pool_details: string | null;
  special_amenities: string[] | null;
  dist_airport_km: number | null;
}

interface Brochure {
  token: string;
  title: string | null;
  created_by_name: string | null;
  expires_at: string;
}

interface Props {
  brochure: Brochure;
  projects: Project[];
  token: string;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg: "#FAFAF7",
  bgCard: "#FFFFFF",
  bgDark: "#1A1A1F",
  gold: "#B08D57",
  goldLight: "#C9A96E",
  text: "#1A1A1F",
  muted: "#6B7280",
  border: "rgba(0,0,0,0.08)",
  green: "#15803d",
  greenBg: "#dcfce7",
  blue: "#1d4ed8",
  blueBg: "#dbeafe",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function priceLabel(min: number | null, max: number | null) {
  if (!min) return null;
  const f = (v: number) => `₹${Math.round(v / 1000)}K`;
  return max && max !== min ? `${f(min)}–${f(max)}/sqft` : `${f(min)}/sqft`;
}

function statusLabel(s: string | null) {
  if (s === "ready_to_move" || s === "completed") return { label: "Ready to Move", bg: C.greenBg, color: C.green };
  if (s === "under_construction") return { label: "Under Construction", bg: C.blueBg, color: C.blue };
  return { label: s?.replace(/_/g, " ") ?? "", bg: "#f3f4f6", color: "#4b5563" };
}

function formatDate(d: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

// ─── Enquire form (per-project) ───────────────────────────────────────────────

function EnquireModal({ project, token, onClose }: { project: Project; token: string; onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setSubmitting(true);
    try {
      const res = await submitLead({
        name, phone,
        type: "GOA_PROPERTY",
        source_page: typeof window !== "undefined" ? window.location.href : `/brochure/${token}`,
        property_type: project.project_type ?? null,
        attribution_metadata: {
          project_name: project.project_name,
          project_slug: project.project_slug,
          micro_market: project.micro_market,
          city: project.city_slug,
          is_focus_project: true,
          brochure_token: token,
        },
        details: {
          project_name: project.project_name,
          developer_name: project.developer_brand,
          source_type: "website",
          source_name: "goa-focus-project",
        },
      });
      if (!res.success) { setErr(res.error ?? "Something went wrong."); return; }
      setDone(true);
    } catch { setErr("Something went wrong."); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: C.bgCard, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.greenBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>We'll be in touch!</h3>
            <p style={{ fontSize: 13, color: C.muted }}>Our Goa advisor will reach out to you about {project.project_name}.</p>
            <button onClick={onClose} style={{ marginTop: 20, width: "100%", padding: "11px 0", background: C.bgDark, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Close</button>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Enquire about {project.project_name}</h3>
            <p style={{ fontSize: 13, color: C.muted, margin: "0 0 20px" }}>Free · No obligation · Response within 2 hours</p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                style={{ padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, outline: "none" }} />
              <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number"
                style={{ padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, outline: "none" }} />
              {err && <p style={{ fontSize: 12, color: "#b91c1c", margin: 0 }}>{err}</p>}
              <button type="submit" disabled={submitting} style={{ padding: "13px 0", background: C.bgDark, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: submitting ? 0.6 : 1 }}>
                {submitting ? "Submitting…" : "Request Details"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({ project, index, token }: { project: Project; index: number; token: string }) {
  const [enquireOpen, setEnquireOpen] = useState(false);
  const st = statusLabel(project.current_status);
  const price = priceLabel(project.current_price_per_sqft_min, project.current_price_per_sqft_max);

  return (
    <>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        {/* Image */}
        <div style={{ position: "relative", height: 200, background: "linear-gradient(135deg, #0c4a6e, #0e7490)", overflow: "hidden" }}>
          {project.hero_image_url && (
            <Image src={project.hero_image_url} alt={project.project_name} fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, 600px" />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)" }} />
          {/* Number badge */}
          <div style={{ position: "absolute", top: 12, left: 12, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {index + 1}
          </div>
          {/* Status badge */}
          <div style={{ position: "absolute", bottom: 12, left: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: st.bg, color: st.color }}>
              {st.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "18px 20px 20px" }}>
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>{project.project_name}</h3>
            <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
              {project.developer_brand && <span style={{ fontWeight: 500 }}>by {project.developer_brand}</span>}
              {project.micro_market && ` · ${project.micro_market}`}
              {project.city && `, ${project.city.charAt(0).toUpperCase() + project.city.slice(1)}`}
            </p>
          </div>

          {/* Price + units row */}
          <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            {price && (
              <div style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 14px" }}>
                <p style={{ fontSize: 10, color: C.muted, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Price</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>{price}</p>
              </div>
            )}
            {project.total_units && (
              <div style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 14px" }}>
                <p style={{ fontSize: 10, color: C.muted, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Units</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>{project.total_units}</p>
              </div>
            )}
            {project.possession_date && (
              <div style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 14px" }}>
                <p style={{ fontSize: 10, color: C.muted, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Possession</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>{formatDate(project.possession_date)}</p>
              </div>
            )}
          </div>

          {/* Differentiator */}
          {project.primary_differentiator && (
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: "0 0 14px",
              display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
              {project.primary_differentiator}
            </p>
          )}

          {/* Quick tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {project.rera_id && <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 99, background: C.greenBg, color: C.green, fontWeight: 600 }}>✓ RERA Registered</span>}
            {project.pool_details && <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 99, background: "#f0f9ff", color: "#0369a1" }}>🏊 Pool</span>}
            {project.dist_airport_km && <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 99, background: "#faf5ff", color: "#7e22ce" }}>✈ {project.dist_airport_km}km to Airport</span>}
            {project.special_amenities?.slice(0, 2).map((a, i) => (
              <span key={i} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 99, background: "#f9fafb", color: C.muted }}>{a}</span>
            ))}
          </div>

          {/* CTA row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button
              onClick={() => setEnquireOpen(true)}
              style={{ padding: "11px 0", background: C.bgDark, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Enquire Now
            </button>
            <Link
              href={`/portfolio/${project.project_slug}`}
              style={{ padding: "11px 0", background: "#f3f4f6", color: C.text, textDecoration: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, textAlign: "center", display: "block" }}
            >
              Full Details →
            </Link>
          </div>
        </div>
      </div>

      {enquireOpen && <EnquireModal project={project} token={token} onClose={() => setEnquireOpen(false)} />}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BrochurePageClient({ brochure, projects, token }: Props) {
  // Track view on mount
  useEffect(() => {
    fetch(`/api/brochure/${token}/view`, { method: "POST" }).catch(() => {});
  }, [token]);

  const expiresDate = new Date(brochure.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      {/* ── Header ── */}
      <div style={{ background: C.bgDark, padding: "28px 20px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", margin: 0 }}>
                Westside Realty
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0 }}>
                {brochure.created_by_name ? `Shared by ${brochure.created_by_name}` : "Curated for you"}
              </p>
            </div>
          </div>
          <h1 style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, color: "#fff", margin: "0 0 8px", lineHeight: 1.2 }}>
            {brochure.title ?? "Your Property Options"}
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 }}>
            {projects.length} project{projects.length !== 1 ? "s" : ""} curated for you · Valid until {expiresDate}
          </p>
        </div>
      </div>

      {/* ── Project cards ── */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 80px" }}>
        {projects.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.muted, fontSize: 15 }}>
            No projects available in this brochure.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {projects.map((p, i) => (
              <ProjectCard key={p.project_slug} project={p} index={i} token={token} />
            ))}
          </div>
        )}

        {/* Footer CTA */}
        <div style={{ marginTop: 48, background: C.bgDark, borderRadius: 18, padding: "28px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: C.gold, textTransform: "uppercase", margin: "0 0 8px" }}>
            Need help deciding?
          </p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>
            Talk to a Goa property advisor
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "0 0 20px" }}>
            Site visits, floor plans, and developer-direct pricing — all arranged for you.
          </p>
          <a
            href="https://wa.me/919502500068"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-block", background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 14, padding: "12px 32px", borderRadius: 10, textDecoration: "none" }}
          >
            WhatsApp Us
          </a>
        </div>
      </div>
    </div>
  );
}
