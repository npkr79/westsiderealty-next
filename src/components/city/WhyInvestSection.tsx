import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WhyInvestSectionProps {
  cityName: string;
  cityData: any;
}

export default function WhyInvestSection({ cityName }: WhyInvestSectionProps) {
  return (
    <section className="py-16 bg-secondary/10">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-[hsl(var(--heading-blue))]">
          Why Invest in {cityName}?
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Strong Fundamentals</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {cityName} benefits from robust employment drivers, infrastructure growth, and
              sustained housing demand, making it a resilient long-term market.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Diverse Inventory</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              From ready-to-move homes to curated investment-grade assets, the city offers options
              across budgets and risk profiles.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Proven Appreciation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Key micro-markets have demonstrated healthy price appreciation and rental yields over
              the last 5–10 years, supported by real end-user demand.
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}



