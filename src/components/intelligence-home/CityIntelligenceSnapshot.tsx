"use client";

import { useEffect, useState } from "react";

const useCountUp = (target: number, duration = 1200) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        raf = window.requestAnimationFrame(tick);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
};

export default function CityIntelligenceSnapshot() {
  const apartmentCount = useCountUp(212);
  const villaCount = useCountUp(64);
  const wdiCount = useCountUp(71);

  const metrics = [
    { label: "Apartment systems analyzed", value: apartmentCount },
    { label: "Villa ecosystems analyzed", value: villaCount },
    { label: "City WDI (apartments)", value: `${wdiCount} / 100` },
    { label: "City land posture (villas)", value: "Balanced" },
  ];

  return (
    <section className="relative overflow-hidden border-y border-slate-800/80 bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(30,41,59,0.6),_transparent_70%)]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:120px_120px]" />
      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-300">
            City Intelligence Terminal
          </p>
          <h2 className="text-3xl font-semibold text-white">
            Hyderabad structural signals
          </h2>
          <p className="text-sm text-slate-400">
            Derived from Telangana RERA structural disclosures.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((item) => (
            <div
              key={item.label}
              className="rounded-[22px] border border-white/10 bg-white/5 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.4)]"
            >
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
