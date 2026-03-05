"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackBehaviorEvent } from "@/lib/analytics/behaviorTracking";

export default function BehaviorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    void trackBehaviorEvent("page_view", {
      path: pathname,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
    });
  }, [pathname]);

  return null;
}
