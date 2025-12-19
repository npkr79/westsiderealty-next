import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Building2,
  Train,
  GraduationCap,
  Home,
  MapPin,
  Briefcase,
} from "lucide-react";

interface WhyInvestSectionProps {
  cityName: string;
  cityData: any;
}

export default function WhyInvestSection({ cityName, cityData }: WhyInvestSectionProps) {
  // Get investment reasons from cityData or use defaults
  const investmentReasons = cityData?.investment_reasons_json || [];
  const bottomStat = cityData?.investment_reasons_stats_json;

  const iconMap: Record<string, React.ElementType> = {
    "trending-up": TrendingUp,
    building: Building2,
    train: Train,
    "graduation-cap": GraduationCap,
    home: Home,
    briefcase: Briefcase,
    "map-pin": MapPin,
  };
  
  // Default reasons for Hyderabad
  const defaultReasons: Array<{
    id: string;
    title: string;
    stat: string;
    description: string;
    icon: React.ElementType;
    color?: string;
  }> = [
    {
      id: "growth",
      title: "High Growth Potential",
      stat: "22% YoY Growth",
      description:
        "Consistent price appreciation driven by IT sector expansion and infrastructure development",
      icon: TrendingUp,
    },
    {
      id: "infrastructure",
      title: "World-Class Infrastructure",
      stat: "50+ IT Parks",
      description:
        "Extensive IT corridors, metro connectivity, and modern urban planning",
      icon: Building2,
    },
    {
      id: "connectivity",
      title: "Excellent Connectivity",
      stat: "3 Metro Lines",
      description:
        "Comprehensive metro network connecting key business districts and residential areas",
      icon: Train,
    },
    {
      id: "education",
      title: "Education & Healthcare",
      stat: "100+ Schools",
      description:
        "Top-tier educational institutions and world-class healthcare facilities",
      icon: GraduationCap,
    },
    {
      id: "lifestyle",
      title: "Quality of Life",
      stat: "₹30K Avg Rent",
      description:
        "Affordable living costs with premium amenities and cultural richness",
      icon: Home,
    },
    {
      id: "location",
      title: "Strategic Location",
      stat: "500+ MNCs",
      description:
        "Hub for multinational corporations and emerging tech startups",
      icon: MapPin,
    },
  ];

  // Use data from cityData if available, otherwise use defaults
  const reasons = Array.isArray(investmentReasons) && investmentReasons.length > 0
    ? investmentReasons.map((reason: any, idx: number) => {
        const IconFromData =
          (reason.icon && iconMap[reason.icon as string]) ||
          defaultReasons[idx % defaultReasons.length]?.icon ||
          TrendingUp;
        const mapped = {
          id: reason.id || `reason-${idx}`,
          title: reason.title || reason.name,
          stat: reason.stat,
          description: reason.description || reason.text,
          icon: IconFromData,
        } as (typeof defaultReasons)[number];
        if (reason.color) {
          mapped.color = reason.color as string;
        }
        return mapped;
      })
    : defaultReasons;

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-[hsl(var(--heading-blue))]">
          Why Invest in {cityName}?
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {reasons.map((reason, idx) => {
            const IconComponent = reason.icon || TrendingUp;
            return (
              <Card key={reason.id || idx} className="bg-white/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className="p-3 rounded-lg bg-primary/10"
                      style={reason.color ? { backgroundColor: reason.color + "20" } : undefined}
                    >
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    {reason.stat && (
                      <Badge variant="secondary" className="ml-auto font-semibold">
                        {reason.stat}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{reason.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>{reason.description}</p>
                  <div className="mt-3 pt-3 border-t border-border">
                    <span className="text-xs font-medium text-primary">Verified Data</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Bottom Banner / Highlight Stat */}
        {bottomStat ? (
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 text-center border border-primary/20 shadow-md">
            <p className="text-lg font-semibold text-foreground mb-1">
              {bottomStat.text}
            </p>
            {bottomStat.description && (
              <p className="text-sm text-muted-foreground">
                {bottomStat.description}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 text-center border border-primary/20 shadow-md">
            <p className="text-lg font-semibold text-foreground">
              {cityName} Ranks Among Top 5 Cities for Real Estate Investment in India
            </p>
          </div>
        )}
      </div>
    </section>
  );
}



