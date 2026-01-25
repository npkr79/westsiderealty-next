"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface StickyBottomButtonsProps {
  whatsappNumber?: string | null;
  whatsappMessage?: string | null;
  onSubmitInterest?: () => void;
  hasBrochure?: boolean;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export default function StickyBottomButtons({
  onSubmitInterest,
  hasBrochure = false,
  primaryLabel = "Enquire Now",
  secondaryLabel = "Contact Us",
  onPrimaryClick,
  onSecondaryClick,
}: StickyBottomButtonsProps) {
  const handlePrimary = onSubmitInterest || onPrimaryClick;
  const handleSecondary = onSecondaryClick;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Button className="flex-1" size="lg" onClick={handlePrimary}>
          {hasBrochure && <Download className="mr-2 h-4 w-4" />}
          {primaryLabel}
        </Button>
        <Button className="flex-1" size="lg" variant="outline" onClick={handleSecondary}>
          {secondaryLabel}
        </Button>
      </div>
    </div>
  );
}
