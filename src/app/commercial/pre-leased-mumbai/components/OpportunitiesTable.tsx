"use client";

import { useState, useCallback } from "react";
import type { CommercialProperty } from "../data";

type SortKey = "areaSqftNum" | "askingPriceNum" | "yieldNum" | null;
type SortDir = "asc" | "desc";

interface Props {
  properties: CommercialProperty[];
}

export default function OpportunitiesTable({ properties }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [openNote, setOpenNote] = useState<number | null>(null);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey]
  );

  const sorted = [...properties].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const scrollToForm = (propertyRef: string) => {
    const el = document.getElementById("inquiry-form");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        const select = document.getElementById("inquiry-property-select") as HTMLSelectElement | null;
        if (select) {
          const option = Array.from(select.options).find((o) => o.value.startsWith(propertyRef));
          if (option) { select.value = option.value; select.dispatchEvent(new Event("change", { bubbles: true })); }
        }
      }, 600);
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span style={{ color: "rgba(255,255,255,0.2)", marginLeft: 4 }}>↕</span>;
    return <span style={{ color: "#c8a96e", marginLeft: 4 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const thStyle: React.CSSProperties = {
    padding: "12px 16px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    whiteSpace: "nowrap",
    background: "#0d0d0d",
  };

  const tdStyle: React.CSSProperties = {
    padding: "14px 16px",
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    verticalAlign: "top",
  };

  return (
    <section id="opportunities-table" style={{ background: "#0a0a0a", padding: "80px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h2
          style={{
            fontSize: "clamp(24px, 3vw, 36px)",
            fontWeight: 700,
            color: "#fff",
            marginBottom: 8,
            letterSpacing: "-0.02em",
          }}
        >
          Current Opportunities
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 32 }}>
          11 pre-leased commercial mandates across Mumbai Metropolitan Region
        </p>

        {/* Table — horizontally scrollable on mobile */}
        <div
          style={{
            overflowX: "auto",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Property / Tenant</th>
                <th style={thStyle}>Location</th>
                <th
                  style={{ ...thStyle, cursor: "pointer" }}
                  onClick={() => handleSort("areaSqftNum")}
                >
                  Area (sq ft) <SortIcon col="areaSqftNum" />
                </th>
                <th
                  style={{ ...thStyle, cursor: "pointer" }}
                  onClick={() => handleSort("askingPriceNum")}
                >
                  Asking <SortIcon col="askingPriceNum" />
                </th>
                <th style={thStyle}>Monthly Rent</th>
                <th
                  style={{ ...thStyle, cursor: "pointer" }}
                  onClick={() => handleSort("yieldNum")}
                >
                  Yield <SortIcon col="yieldNum" />
                </th>
                <th style={thStyle}>Inquire</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <>
                  <tr
                    key={p.id}
                    style={{
                      background: p.exclusive ? "rgba(200,169,110,0.04)" : "transparent",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = p.exclusive ? "rgba(200,169,110,0.08)" : "rgba(255,255,255,0.03)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = p.exclusive ? "rgba(200,169,110,0.04)" : "transparent"; }}
                  >
                    <td style={{ ...tdStyle, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{p.id}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <span style={{ fontWeight: 600, color: "#fff" }}>{p.name}</span>
                        {p.exclusive && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: "0.1em",
                              background: "rgba(200,169,110,0.15)",
                              border: "1px solid rgba(200,169,110,0.4)",
                              color: "#c8a96e",
                              padding: "2px 7px",
                              borderRadius: 999,
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                              marginTop: 2,
                            }}
                          >
                            EXCLUSIVE
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: "rgba(255,255,255,0.6)" }}>{p.location}</td>
                    <td style={tdStyle}>{p.areaSqft}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: "#fff" }}>{p.askingPrice}</td>
                    <td style={{ ...tdStyle, color: "rgba(255,255,255,0.6)" }}>{p.monthlyRent}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: "#c8a96e" }}>{p.yield}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                          onClick={() => scrollToForm(`#${p.id}`)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 999,
                            background: "linear-gradient(135deg,#c8a96e,#a8843e)",
                            color: "#0a0a0a",
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            border: "none",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                          aria-label={`Inquire about property ${p.id}`}
                        >
                          Inquire
                        </button>
                        <button
                          onClick={() => setOpenNote(openNote === p.id ? null : p.id)}
                          style={{
                            padding: "5px 10px",
                            borderRadius: 999,
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.15)",
                            color: "rgba(255,255,255,0.5)",
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                          aria-label={`View notes for property ${p.id}`}
                        >
                          {openNote === p.id ? "Hide" : "Notes"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {openNote === p.id && (
                    <tr key={`note-${p.id}`} style={{ background: "rgba(200,169,110,0.03)" }}>
                      <td colSpan={8} style={{ padding: "8px 16px 16px 48px" }}>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.6 }}>
                          {p.notes}
                        </p>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 16, textAlign: "center" }}>
          Click column headers to sort. Click Notes to view full terms. Detailed fact sheets available on request.
        </p>
      </div>
    </section>
  );
}
