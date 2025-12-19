import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Building2, Train, GraduationCap, Home, MapPin } from "lucide-react";

interface WhyInvestSectionProps {
  cityName: string;
  cityData: any;
}

export default function WhyInvestSection({ cityName, cityData }: WhyInvestSectionProps) {
  // Get investment reasons from cityData or use defaults
  const investmentReasons = cityData?.investment_reasons_json || cityData?.investment_reasons_stats_json || [];
  
  // Default reasons for Hyderabad
  const defaultReasons = [
    {
      id: "growth",
      title: "High Growth Potential",
      stat: "22% YoY Growth",
      description: "Consistent price appreciation driven by IT sector expansion and infrastructure development",
      icon: TrendingUp
    },
    {
      id: "infrastructure",
      title: "World-Class Infrastructure",
      stat: "50+ IT Parks",
      description: "Extensive IT corridors, metro connectivity, and modern urban planning",
      icon: Building2
    },
    {
      id: "connectivity",
      title: "Excellent Connectivity",
      stat: "3 Metro Lines",
      description: "Comprehensive metro network connecting key business districts and residential areas",
      icon: Train
    },
    {
      id: "education",
      title: "Education & Healthcare",
      stat: "100+ Schools",
      description: "Top-tier educational institutions and world-class healthcare facilities",
      icon: GraduationCap
    },
    {
      id: "lifestyle",
      title: "Quality of Life",
      stat: "₹30K Avg Rent",
      description: "Affordable living costs with premium amenities and cultural richness",
      icon: Home
    },
    {
      id: "location",
      title: "Strategic Location",
      stat: "500+ MNCs",
      description: "Hub for multinational corporations and emerging tech startups",
      icon: MapPin
    }
  ];

  // Use data from cityData if available, otherwise use defaults
  const reasons = Array.isArray(investmentReasons) && investmentReasons.length > 0
    ? investmentReasons.map((reason: any, idx: number) => ({
        id: reason.id || `reason-${idx}`,
        title: reason.title || reason.name,
        stat: reason.stat || reason.statistic || reason.badge,
        description: reason.description || reason.text,
        icon: reason.icon || defaultReasons[idx % defaultReasons.length]?.icon || TrendingUp
      }))
    : defaultReasons;

  return (
    <section className="py-16 bg-secondary/10">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-[hsl(var(--heading-blue))]">
          Why Invest in {cityName}?
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {reasons.map((reason, idx) => {
            const IconComponent = reason.icon || TrendingUp;
            return (
              <Card key={reason.id || idx} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <IconComponent className="h-8 w-8 text-primary" />
                    {reason.stat && (
                      <Badge variant="secondary" className="ml-auto">
                        {reason.stat}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{reason.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>{reason.description}</p>
                  <div className="mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">Verified Data</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Bottom Banner */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 text-center border border-primary/20">
          <p className="text-lg font-semibold text-foreground">
            {cityName} Ranks Among Top 5 Cities for Real Estate Investment in India
          </p>
        </div>
      </div>
    </section>
  );
}



