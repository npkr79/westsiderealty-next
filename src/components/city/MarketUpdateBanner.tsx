import { Card } from "@/components/ui/card";

interface MarketUpdateBannerProps {
  citySlug: string;
  microMarketSlug?: string;
}

export default function MarketUpdateBanner({
  citySlug,
  microMarketSlug,
}: MarketUpdateBannerProps) {
  return (
    <section className="bg-amber-50 border-y border-amber-200 py-4">
      <div className="container mx-auto px-4">
        <Card className="border-amber-200 bg-amber-50">
          <div className="p-4 text-sm text-amber-900">
            Stay tuned for the latest price trends and market updates for{" "}
            <strong>
              {microMarketSlug
                ? `${microMarketSlug}, ${citySlug}`
                : citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}
            </strong>
            . Our research team is continuously updating insights to help you make informed
            decisions.
          </div>
        </Card>
      </div>
    </section>
  );
}


