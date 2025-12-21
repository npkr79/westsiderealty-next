import { Card, CardContent } from "@/components/ui/card";
import { Building2, Percent, Shield } from "lucide-react";

interface HeroSectionProps {
  title: string;
  description: string;
  totalProjects: number;
  totalUnits: number;
}

export function HeroSection({ title, description, totalProjects, totalUnits }: HeroSectionProps) {
  return (
    <section className="relative py-20 px-4 bg-gradient-to-b from-primary/10 via-background to-background border-b">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            {title}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-3">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                {totalProjects}+
              </div>
              <div className="text-sm text-muted-foreground">Projects Available</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-3">
                <Percent className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                10-15%
              </div>
              <div className="text-sm text-muted-foreground">Below Market Price</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-3">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                100%
              </div>
              <div className="text-sm text-muted-foreground">RERA Approved</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

