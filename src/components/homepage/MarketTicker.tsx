"use client";

export interface TickerMarket {
  name: string;
  slug: string;
  pricePerSqft: number | null;
  maturity: string | null;
  entryTiming: string | null;
}

interface Props {
  markets: TickerMarket[];
}

const MATURITY_COLORS: Record<string, string> = {
  Established: "#3b82f6",
  Growing:     "#22c55e",
  Emerging:    "#f59e0b",
  Peak:        "#ef4444",
};

const ENTRY_BADGE: Record<string, { bg: string; color: string }> = {
  Optimal: { bg: "#dcfce7", color: "#15803d" },
  Good:    { bg: "#dbeafe", color: "#1d4ed8" },
  Wait:    { bg: "#fef3c7", color: "#92400e" },
  Late:    { bg: "#fee2e2", color: "#991b1b" },
};

export default function MarketTicker({ markets }: Props) {
  if (!markets.length) return null;

  // Duplicate for seamless infinite scroll
  const items = [...markets, ...markets];

  return (
    <div
      className="hidden md:block w-full overflow-hidden"
      style={{ background: "#0f172a", height: 40 }}
    >
      <style>{`
        @keyframes wsTickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ws-ticker-track {
          animation: wsTickerScroll 35s linear infinite;
          will-change: transform;
        }
        .ws-ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="ws-ticker-track flex items-center h-full w-max">
        {items.map((m, i) => {
          const dot   = MATURITY_COLORS[m.maturity ?? ""] ?? "#94a3b8";
          const badge = m.entryTiming ? ENTRY_BADGE[m.entryTiming] : null;
          return (
            <div
              key={i}
              className="flex items-center flex-shrink-0 h-full"
              style={{ paddingLeft: 24, paddingRight: 24, gap: 10 }}
            >
              {/* Signal dot */}
              <span
                className="rounded-full flex-shrink-0"
                style={{ width: 6, height: 6, background: dot }}
              />
              {/* Name */}
              <span
                className="whitespace-nowrap"
                style={{ fontSize: 11, letterSpacing: "0.04em", color: "#9ca3af", fontWeight: 500 }}
              >
                {m.name}
              </span>
              {/* Price */}
              {m.pricePerSqft != null && (
                <span
                  className="whitespace-nowrap"
                  style={{ fontSize: 11, fontWeight: 600, color: "white" }}
                >
                  ₹{m.pricePerSqft.toLocaleString("en-IN")}
                </span>
              )}
              {/* Entry badge */}
              {badge && m.entryTiming && (
                <span
                  className="whitespace-nowrap"
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 100,
                    background: badge.bg,
                    color: badge.color,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {m.entryTiming}
                </span>
              )}
              {/* Separator */}
              <span style={{ color: "#1e2d4a", marginLeft: 14, fontSize: 10 }}>·</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
