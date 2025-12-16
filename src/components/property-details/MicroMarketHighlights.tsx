"use client";

interface MicroMarketHighlightsProps {
  marketData: {
    name?: string;
    description?: string;
    price_range_text?: string;
  };
}

export default function MicroMarketHighlights({ marketData }: MicroMarketHighlightsProps) {
  if (!marketData) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-foreground">
        {marketData.name || "Micro-Market Highlights"}
      </h2>
      {marketData.description && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {marketData.description}
        </p>
      )}
      {marketData.price_range_text && (
        <p className="text-sm font-medium text-foreground">
          Typical ticket sizes: {marketData.price_range_text}
        </p>
      )}
    </section>
  );
}


