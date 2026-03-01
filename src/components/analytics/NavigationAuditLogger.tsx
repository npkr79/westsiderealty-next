"use client";

import { useEffect } from "react";

/**
 * Lightweight no-op logger fallback.
 * Keeps pages stable when analytics package is unavailable.
 */
export default function NavigationAuditLogger() {
  useEffect(() => {
    // Intentionally minimal: avoid runtime errors on critical routes.
  }, []);

  return null;
}
