import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InvestmentZone {
  name: string;
  description?: string;
}

interface InvestmentAreasSectionProps {
  cityName: string;
  investmentZonesData?: InvestmentZone[] | null;
}

export default function InvestmentAreasSection({
  cityName,
  investmentZonesData,
}: InvestmentAreasSectionProps) {
  if (!Array.isArray(investmentZonesData) || investmentZonesData.length === 0) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px 4">
        <h2 className="text-2xl md:tex-3xl font-bold mb-6 text-[hsl(var(--heading-blue))]">
          High-Potential Investment Zones in {cityName}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {investmentZonesData.map((zone: any, idx) => {
            // Handle both string and object formats for zone
            const zoneName = typeof zone === 'object' && zone !== null
              ? (zone.name || zone.title || JSON.stringify(zone))
              : String(zone);
            const zoneDescription = typeof zone === 'object' && zone !== null
              ? (typeof zone.description === 'string' ? zone.description : (zone.description?.text || zone.description?.content || ''))
              : '';
            
            return (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle>{zoneName}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {zoneDescription}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}


