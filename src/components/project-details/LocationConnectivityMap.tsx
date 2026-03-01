"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface LocationConnectivityMapProps {
  latitude: number;
  longitude: number;
  projectName: string;
}

export default function LocationConnectivityMap({
  latitude,
  longitude,
  projectName,
}: LocationConnectivityMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin: "140px 0px", threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible]);

  const mapUrl = useMemo(
    () =>
      `https://maps.google.com/maps?ll=${latitude},${longitude}&q=${latitude},${longitude}&z=14&t=k&hl=en&output=embed`,
    [latitude, longitude]
  );

  return (
    <div ref={containerRef} className="relative h-[280px] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      {isVisible ? (
        <>
          <iframe
            src={mapUrl}
            title={`${projectName} location map`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full border-0 pointer-events-none"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/5" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900/85 ring-4 ring-white/60" />
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading map…</div>
      )}
    </div>
  );
}
