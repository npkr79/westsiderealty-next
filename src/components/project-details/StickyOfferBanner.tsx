"use client";

import { Button } from "@/components/ui/button";

interface StickyOfferBannerProps {
  offerData: any;
  onClaim: () => void;
}

/**
 * Simple bottom-fixed banner for special project offers.
 * This is a lightweight approximation of the original SPA component.
 */
export default function StickyOfferBanner({ offerData, onClaim }: StickyOfferBannerProps) {
  if (!offerData) return null;

  const message = typeof offerData === "string" ? offerData : offerData?.headline || "Limited-time launch offers available";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-primary text-primary-foreground">
      <div className="container mx-auto flex flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:justify-between">
        <p className="text-sm font-medium text-center sm:text-left">
          {message}
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={onClaim}
        >
          Claim Offer
        </Button>
      </div>
    </div>
  );
}


