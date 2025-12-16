"use client";

import { Button } from "@/components/ui/button";

interface ProjectStickyNavProps {
  projectName: string;
  onWhatsApp: () => void;
}

/**
 * Minimal sticky top bar for quick access actions on project pages.
 */
export default function ProjectStickyNav({
  projectName,
  onWhatsApp,
}: ProjectStickyNavProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4 py-2">
        <p className="text-sm font-medium text-foreground line-clamp-1">
          {projectName}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={onWhatsApp}
          >
            WhatsApp Enquiry
          </Button>
          <Button
            size="sm"
            type="button"
            onClick={() =>
              document
                .getElementById("price")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            View Pricing
          </Button>
        </div>
      </div>
    </div>
  );
}


