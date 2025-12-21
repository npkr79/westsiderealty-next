import { Card, CardContent } from "@/components/ui/card";
import { Percent, Shield, Banknote, Clock, Building, FileCheck } from "lucide-react";

interface Benefit {
  icon: string;
  title: string;
  description: string;
  bgColor: string;
  iconColor: string;
}

const defaultBenefits: Benefit[] = [
  {
    icon: "Percent",
    title: "10-15% Cost Savings",
    description: "Purchase premium apartments significantly below builder's listed price.",
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    icon: "Shield",
    title: "Same Legal Protection",
    description: "Full RERA registration, clear titles, and standard sale agreements.",
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: "Banknote",
    title: "Flexible Payments",
    description: "Often more negotiable payment terms compared to builder sales.",
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    icon: "Clock",
    title: "Faster Possession",
    description: "Many units are ready or near-ready for immediate possession.",
    bgColor: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    icon: "Building",
    title: "Same Specifications",
    description: "Identical construction quality, amenities, and common areas.",
    bgColor: "bg-rose-100",
    iconColor: "text-rose-600",
  },
  {
    icon: "FileCheck",
    title: "No Hidden Costs",
    description: "Transparent pricing with same maintenance and statutory charges.",
    bgColor: "bg-cyan-100",
    iconColor: "text-cyan-600",
  },
];

const iconMap: Record<string, any> = {
  Percent,
  Shield,
  Banknote,
  Clock,
  Building,
  FileCheck,
};

interface BenefitsGridProps {
  benefits: Benefit[];
  whyBuyContent: string;
}

export function BenefitsGrid({ benefits, whyBuyContent }: BenefitsGridProps) {
  const displayBenefits = benefits.length > 0 ? benefits : defaultBenefits;

  return (
    <section className="container mx-auto px-4 py-16 bg-slate-50/50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-center">
          Why Buy Landowner or Investor Share Units?
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
          {whyBuyContent}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayBenefits.map((benefit, index) => {
            const IconComponent = iconMap[benefit.icon] || Percent;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${benefit.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                    <IconComponent className={`h-6 w-6 ${benefit.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

