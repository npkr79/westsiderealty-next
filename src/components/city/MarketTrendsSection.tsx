import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MarketTrendsSectionProps {
  trends: any;
  cityName: string;
  cityData?: {
    average_price_sqft?: number | null;
    annual_appreciation_pct?: number | null;
    rental_yield_pct?: number | null;
  };
}

export default function MarketTrendsSection({
  trends,
  cityName,
  cityData,
}: MarketTrendsSectionProps) {
  if (!trends) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-[hsl(var(--heading-blue))]">
          Market Trends in {cityName}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {cityData?.average_price_sqft && (
            <Card>
              <CardHeader>
                <CardTitle>Avg. Price per Sq.Ft.</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  ₹{cityData.average_price_sqft.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}
          {cityData?.annual_appreciation_pct && (
            <Card>
              <CardHeader>
                <CardTitle>Annual Appreciation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {cityData.annual_appreciation_pct}%
                </p>
              </CardContent>
            </Card>
          )}
          {cityData?.rental_yield_pct && (
            <Card>
              <CardHeader>
                <CardTitle>Rental Yield</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {cityData.rental_yield_pct}%
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}



