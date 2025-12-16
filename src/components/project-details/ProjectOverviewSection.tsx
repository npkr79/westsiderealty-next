"use client";

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

  return (
    <div className="space-y-3">
      <p
        className="text-sm text-muted-foreground leading-relaxed"
        // legacy descriptions can be HTML; keep it simple
        dangerouslySetInnerHTML={{ __html: description }}
      />
    </div>
  );
}


