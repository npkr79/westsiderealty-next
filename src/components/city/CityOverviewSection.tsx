import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CityOverviewSectionProps {
  overviewData: any;
}

export default function CityOverviewSection({ overviewData }: CityOverviewSectionProps) {
  if (!overviewData) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-[hsl(var(--heading-blue))]">
          City Overview
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Life in the City</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {typeof overviewData === "string" ? (
              <div dangerouslySetInnerHTML={{ __html: overviewData }} />
            ) : (
              <pre className="whitespace-pre-wrap text-xs">
                {JSON.stringify(overviewData, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}


