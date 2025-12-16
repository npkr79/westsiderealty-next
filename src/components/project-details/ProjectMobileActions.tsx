"use client";

import { Button } from "@/components/ui/button";

interface ProjectMobileActionsProps {
  onWhatsApp: () => void;
  onEnquire: () => void;
}

/**
 * Mobile-only fixed bottom CTA bar for quick enquiry actions.
 */
export default function ProjectMobileActions({
  onWhatsApp,
  onEnquire,
}: ProjectMobileActionsProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 shadow-lg md:hidden">
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onWhatsApp}
        >
          WhatsApp
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={onEnquire}
        >
          Enquire
        </Button>
      </div>
    </div>
  );
}


