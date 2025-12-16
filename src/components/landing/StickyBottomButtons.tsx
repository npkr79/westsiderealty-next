"use client";

import { Button } from "@/components/ui/button";

interface StickyBottomButtonsProps {
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export default function StickyBottomButtons({
  primaryLabel = "Enquire Now",
  secondaryLabel = "Call Now",
  onPrimaryClick,
  onSecondaryClick,
}: StickyBottomButtonsProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Button className="flex-1" size="lg" onClick={onPrimaryClick}>
          {primaryLabel}
        </Button>
        <Button className="flex-1" size="lg" variant="outline" onClick={onSecondaryClick}>
          {secondaryLabel}
        </Button>
      </div>
    </div>
  );
}


