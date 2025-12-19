"use client";

import { useEffect } from "react";

interface DebugClientProps {
  citySlug: string;
  projectSlug: string;
}

export default function DebugClient({ citySlug, projectSlug }: DebugClientProps) {
  useEffect(() => {
    console.log("[DebugClient] 🎯 Client-side component mounted");
    console.log("[DebugClient] Params:", { citySlug, projectSlug });
    console.log("[DebugClient] Current URL:", window.location.href);
  }, [citySlug, projectSlug]);

  return null; // This component doesn't render anything
}

