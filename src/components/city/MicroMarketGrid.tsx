import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import type { MicroMarketGridItem } from "@/services/microMarketService";

interface MicroMarketGridProps {
  microMarkets: MicroMarketGridItem[];
  citySlug: string;
}

export default function MicroMarketGrid({ microMarkets, citySlug }: MicroMarketGridProps) {
  if (!microMarkets || microMarkets.length === 0) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-[hsl(var(--heading-blue))]">
          Prime Micro-Markets in {citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {microMarkets.map((mm) => (
            <Card key={mm.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{mm.micro_market_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {mm.short_description && <p>{mm.short_description}</p>}
                <Link
                  href={`/${citySlug}/${mm.url_slug}`}
                  className="text-primary font-medium hover:underline"
                >
                  View Area Guide →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}


