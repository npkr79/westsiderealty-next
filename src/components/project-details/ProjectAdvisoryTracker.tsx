"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  getAdvisoryTrackingContext,
  setAdvisoryTrackingContext,
  trackListingsEvent,
} from "@/lib/analytics/listingsTracking";
import type { ListingIntent } from "@/components/project-details/ProjectIntentSelector";

interface ProjectAdvisoryTrackerProps {
  projectId: string;
  microMarket?: string;
  intent: ListingIntent;
}

const SECTION_IDS = ["buyer-fit", "comparison", "risk", "density"] as const;

export default function ProjectAdvisoryTracker({
  projectId,
  microMarket,
  intent,
}: ProjectAdvisoryTrackerProps) {
  const seenSectionsRef = useRef<Set<string>>(new Set());
  const sectionEnterRef = useRef<Record<string, number>>({});
  const sectionDurationsRef = useRef<Record<string, number>>({});
  const maxDepthRef = useRef<number>(0);
  const mountedAt = useMemo(() => Date.now(), []);

  useEffect(() => {
    setAdvisoryTrackingContext({
      projectId,
      microMarket,
      intent,
      startedAt: mountedAt,
      sectionsViewed: [],
      sectionViewMs: {},
      maxScrollDepth: 0,
    });
    trackListingsEvent("page_view", {
      projectId,
      microMarket: microMarket || null,
      intent,
    });
  }, [intent, microMarket, mountedAt, projectId]);

  useEffect(() => {
    const trustSection = document.querySelector('[data-advisory-section="trust-signals"]');
    if (!trustSection) return;
    const signalEls = Array.from(trustSection.querySelectorAll("[data-trust-signal]"));
    const onHover = (event: Event) => {
      const target = event.currentTarget as HTMLElement | null;
      const signal = target?.getAttribute("data-trust-signal");
      if (!signal) return;
      trackListingsEvent("advisory_section_viewed", {
        projectId,
        microMarket: microMarket || null,
        intent,
        sectionId: "trust-signals",
        interaction: "hover",
        signal,
        scrollDepth: maxDepthRef.current,
      });
    };
    const onClick = (event: Event) => {
      const target = event.currentTarget as HTMLElement | null;
      const signal = target?.getAttribute("data-trust-signal");
      if (!signal) return;
      trackListingsEvent("advisory_section_viewed", {
        projectId,
        microMarket: microMarket || null,
        intent,
        sectionId: "trust-signals",
        interaction: "click",
        signal,
        scrollDepth: maxDepthRef.current,
      });
    };
    signalEls.forEach((el) => {
      el.addEventListener("mouseenter", onHover);
      el.addEventListener("click", onClick);
    });
    return () => {
      signalEls.forEach((el) => {
        el.removeEventListener("mouseenter", onHover);
        el.removeEventListener("click", onClick);
      });
    };
  }, [intent, microMarket, projectId]);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const maxScrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
      const depth = Math.min(1, window.scrollY / maxScrollable);
      if (depth > maxDepthRef.current) {
        maxDepthRef.current = depth;
        setAdvisoryTrackingContext({ maxScrollDepth: Number(depth.toFixed(3)) });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const nowTs = Date.now();
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("data-advisory-section");
          if (!id) return;
          if (entry.isIntersecting) {
            sectionEnterRef.current[id] = nowTs;
            if (!seenSectionsRef.current.has(id)) {
              seenSectionsRef.current.add(id);
              const context = getAdvisoryTrackingContext();
              const sectionsViewed = Array.from(new Set([...(context.sectionsViewed || []), id]));
              setAdvisoryTrackingContext({ sectionsViewed });
              trackListingsEvent("advisory_section_viewed", {
                projectId,
                microMarket: microMarket || null,
                intent,
                sectionId: id,
                viewedSectionsCount: sectionsViewed.length,
                scrollDepth: maxDepthRef.current,
              });
            }
          } else if (sectionEnterRef.current[id]) {
            const delta = nowTs - sectionEnterRef.current[id];
            sectionDurationsRef.current[id] = (sectionDurationsRef.current[id] || 0) + Math.max(0, delta);
            delete sectionEnterRef.current[id];
            setAdvisoryTrackingContext({
              sectionViewMs: {
                ...(getAdvisoryTrackingContext().sectionViewMs || {}),
                [id]: sectionDurationsRef.current[id],
              },
            });
          }
        });
      },
      { threshold: [0.35] }
    );

    const elements = SECTION_IDS.map((id) =>
      document.querySelector(`[data-advisory-section="${id}"]`)
    ).filter(Boolean) as Element[];
    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [intent, microMarket, projectId]);

  return null;
}

