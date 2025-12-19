import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrainFront, Map } from "lucide-react";

export default function HyderabadInvestmentGuide() {
  return (
    <section className="py-16 bg-secondary/5">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-[hsl(var(--heading-blue))]">
          Investment Guide 2025
        </h2>
        
        <div className="space-y-8">
          {/* Infrastructure Boom */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrainFront className="h-6 w-6 text-primary" />
                <CardTitle>The Infrastructure Boom: Metro Phase 2 & RRR</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Hyderabad&apos;s infrastructure expansion is driving unprecedented growth. Metro Phase 2 
                connects key business districts, while the Regional Ring Road (RRR) will create new 
                growth corridors. These projects are expected to boost property values by 15-25% 
                in connected areas over the next 3-5 years.
              </p>
            </CardContent>
          </Card>

          {/* Where to Invest - Premium vs Growth */}
          <div>
            <h3 className="text-2xl font-bold mb-6 text-[hsl(var(--heading-blue))]">
              Where to Invest: Premium vs. Growth Corridors
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Kokapet Card */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Kokapet</CardTitle>
                    <Badge variant="default">Premium Choice</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">YoY Growth:</span>
                    <span>+18%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Avg Price:</span>
                    <span>₹8,500-12,000/sqft</span>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="font-semibold text-foreground mb-1">Verdict:</p>
                    <p>Established premium market with strong appreciation potential. Ideal for long-term investors seeking stable returns.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Kollur/Tellapur Card */}
              <Card className="border-2 border-secondary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Kollur / Tellapur</CardTitle>
                    <Badge variant="secondary">Growth Choice</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">YoY Growth:</span>
                    <span>+22%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Avg Price:</span>
                    <span>₹6,500-9,000/sqft</span>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="font-semibold text-foreground mb-1">Verdict:</p>
                    <p>Emerging growth corridor with high appreciation potential. Best for investors seeking higher returns with moderate risk.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Strategic Growth */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Map className="h-6 w-6 text-primary" />
                <CardTitle>Strategic Growth: HMDA Master Plan 2031</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                The HMDA Master Plan 2031 outlines strategic development zones that will shape 
                Hyderabad&apos;s real estate landscape. Key focus areas include the Western Corridor, 
                Financial District expansion, and new IT hubs. Investors should align their 
                strategies with these planned developments for maximum returns.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}



