"use client";

import { sanitizeHTML } from "@/lib/utils/htmlSanitizer";

interface ProjectOverviewSectionProps {
  reraId?: string | null;
  possessionDate?: string | null;
  status?: string | null;
  description?: string | null;
  highlights?: any;
}

export default function ProjectOverviewSection({
  description,
}: ProjectOverviewSectionProps) {
  if (!description) return null;

  // Sanitize HTML to prevent iframe/script injection
  const sanitizedDescription = sanitizeHTML(description);

  return (
    <div className="space-y-3">
      <p
        className="text-sm text-muted-foreground leading-relaxed"
        // legacy descriptions can be HTML; keep it simple
        dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
      />
    </div>
  );
}


