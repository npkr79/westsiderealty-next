import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrainFront, Map } from "lucide-react";

interface InvestmentZonesData {
  headline?: string;
  subheadline?: string;
  infrastructure_boom?: {
    title?: string;
    content?: string;
  };
  zones_comparison?: Array<{
    name: string;
    type?: string;
    tagline?: string;
    yoy_growth?: string;
    avg_price?: string;
    verdict?: string;
    slug?: string;
  }>;
  hmda_master_plan?: {
    title?: string;
    description?: string;
    vectors?: string[];
  };
  bottom_stat?: {
    text?: string;
    description?: string;
  };
}

interface HyderabadInvestmentGuideProps {
  zones: InvestmentZonesData | null | undefined;
}

export default function HyderabadInvestmentGuide({ zones }: HyderabadInvestmentGuideProps) {
  if (!zones) return null;

  const {
    headline,
    subheadline,
    infrastructure_boom,
    zones_comparison,
    hmda_master_plan,
    bottom_stat,
  } = zones;

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-[hsl(var(--heading-blue))]">
          {headline || "Investment Guide 2025"}
        </h2>
        {subheadline && (
          <p className="text-center text-muted-foreground mb-8 max-w-3xl mx-auto">
            {subheadline}
          </p>
        )}

        <div className="space-y-8">
          {/* Infrastructure Boom */}
          {infrastructure_boom && (
            <Card className="bg-white/80 backdrop-blur-sm border shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <TrainFront className="h-6 w-6 text-primary" />
                  <CardTitle>{infrastructure_boom.title || "Infrastructure Boom"}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{infrastructure_boom.content}</p>
              </CardContent>
            </Card>
          )}

          {/* Where to Invest - Zones Comparison */}
          {Array.isArray(zones_comparison) && zones_comparison.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold mb-6 text-[hsl(var(--heading-blue))]">
                Where to Invest: Premium vs. Growth Corridors
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {zones_comparison.map((zone, idx) => (
                  <Card
                    key={zone.slug || zone.name || idx}
                    className={`border-2 ${
                      idx === 0 ? "border-primary/20" : "border-secondary/20"
                    } bg-white/80 backdrop-blur-sm shadow-lg`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{zone.name}</CardTitle>
                        {zone.type && (
                          <Badge variant={idx === 0 ? "default" : "secondary"}>
                            {zone.type}
                          </Badge>
                        )}
                      </div>
                      {zone.tagline && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {zone.tagline}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      {zone.yoy_growth && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">YoY Growth:</span>
                          <span>{zone.yoy_growth}</span>
                        </div>
                      )}
                      {zone.avg_price && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">Avg Price:</span>
                          <span>{zone.avg_price}</span>
                        </div>
                      )}
                      {zone.verdict && (
                        <div className="pt-2 border-t border-border">
                          <p className="font-semibold text-foreground mb-1">Verdict:</p>
                          <p>{zone.verdict}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Strategic Growth - HMDA Master Plan */}
          {hmda_master_plan && (
            <Card className="bg-white/80 backdrop-blur-sm border shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Map className="h-6 w-6 text-primary" />
                  <CardTitle>{hmda_master_plan.title || "Strategic Growth: HMDA Master Plan"}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                {hmda_master_plan.description && <p>{hmda_master_plan.description}</p>}
                {Array.isArray(hmda_master_plan.vectors) && hmda_master_plan.vectors.length > 0 && (
                  <ul className="list-disc list-inside space-y-1">
                    {hmda_master_plan.vectors.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bottom Stat */}
          {bottom_stat && (bottom_stat.text || bottom_stat.description) && (
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 text-center border border-primary/20 shadow-md">
              {bottom_stat.text && (
                <p className="text-lg font-semibold text-foreground mb-1">
                  {bottom_stat.text}
                </p>
              )}
              {bottom_stat.description && (
                <p className="text-sm text-muted-foreground">
                  {bottom_stat.description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

