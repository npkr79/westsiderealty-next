"use client";

import { useState, useEffect } from "react";
import type { ComponentProps } from "react";
import RentalYieldIntelligenceImpl from "./RentalYieldIntelligence";

// Renders null on both server and client during initial hydration, then mounts
// after useEffect. This keeps the React fiber tree identical between SSR and
// client hydration, preventing Radix useId counter shifts in components below
// (e.g. FaqAccordion). dynamic({ ssr: false }) creates an internal Suspense
// boundary on the client that is absent from server HTML — this pattern avoids that.
export default function RentalYieldIntelligenceNoSSR(
  props: ComponentProps<typeof RentalYieldIntelligenceImpl>,
) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return <RentalYieldIntelligenceImpl {...props} />;
}
