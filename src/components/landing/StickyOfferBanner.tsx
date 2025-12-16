"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";

interface StickyOfferBannerProps {
  message?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  onUnlockClick?: () => void;
}

export default function StickyOfferBanner({
  message = "Limited-time launch offers available. Talk to our team today.",
  ctaLabel = "Request Callback",
  onCtaClick,
  onUnlockClick,
}: StickyOfferBannerProps) {
  const handleClick = onUnlockClick || onCtaClick;
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-16 z-30 flex justify-center px-4">
      <div className="flex w-full max-w-3xl items-center gap-3 rounded-full border border-primary bg-primary/90 px-4 py-2 text-primary-foreground shadow-lg">
        <button
          type="button"
          className="ml-1 rounded-full bg-primary-foreground/15 p-1 hover:bg-primary-foreground/25"
          onClick={() => setVisible(false)}
        >
          <X className="h-4 w-4" />
        </button>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <Button size="sm" variant="secondary" onClick={handleClick}>
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}


