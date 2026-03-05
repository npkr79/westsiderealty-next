"use client";

import { useState } from "react";

export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-white transition-colors hover:bg-white/4"
          >
            <span>{item.q}</span>
            <span className="text-slate-400 text-base flex-shrink-0 ml-4 transition-transform duration-200" style={{ transform: open === i ? "rotate(45deg)" : "none" }}>
              +
            </span>
          </button>
          {open === i && (
            <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
