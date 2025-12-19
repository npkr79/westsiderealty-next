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

  // Parse trends data - handle different formats
  const overview = trends.overview || trends.description || trends.intro;
  const priceTrends = trends.price_trends || trends.recent_price_trends || trends.growth_patterns || [];
  const emergingMarkets = trends.emerging_markets || trends.emerging_micromarkets || [];
  const infrastructureProjects = trends.infrastructure_projects || trends.infrastructure_drivers || [];
  const rentalDemand = trends.rental_demand || trends.rental_roi || [];
  const futureOutlook = trends.future_outlook || trends.investment_recommendations || [];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-[hsl(var(--heading-blue))]">
          Market Trends in {cityName}
        </h2>
        
        {/* Overview */}
        {overview && (
          <div className="max-w-4xl mx-auto mb-8">
            <p className="text-lg text-muted-foreground leading-relaxed">
              {typeof overview === 'string' ? overview : JSON.stringify(overview)}
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Recent Price Trends */}
          {Array.isArray(priceTrends) && priceTrends.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Price Trends and Growth Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  {priceTrends.map((trend: string, idx: number) => (
                    <li key={idx}>{typeof trend === 'string' ? trend : JSON.stringify(trend)}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Emerging Micro-Markets */}
          {Array.isArray(emergingMarkets) && emergingMarkets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Emerging Micro-Markets</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  {emergingMarkets.map((market: string, idx: number) => (
                    <li key={idx}>{typeof market === 'string' ? market : JSON.stringify(market)}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Infrastructure Projects */}
          {Array.isArray(infrastructureProjects) && infrastructureProjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Infrastructure Projects Driving Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  {infrastructureProjects.map((project: string, idx: number) => (
                    <li key={idx}>{typeof project === 'string' ? project : JSON.stringify(project)}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Rental Demand */}
          {Array.isArray(rentalDemand) && rentalDemand.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rental Demand and ROI Potential</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  {rentalDemand.map((item: string, idx: number) => (
                    <li key={idx}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Future Outlook */}
          {Array.isArray(futureOutlook) && futureOutlook.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Future Outlook and Investment Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  {futureOutlook.map((item: string, idx: number) => (
                    <li key={idx}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Market Stats Cards */}
          {cityData?.average_price_sqft && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Avg. Price per Sq.Ft.</CardTitle>
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
                <CardTitle className="text-lg">Annual Appreciation</CardTitle>
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
                <CardTitle className="text-lg">Rental Yield</CardTitle>
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



