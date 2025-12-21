import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface ExplanationSectionProps {
  landownerShare: string;
  investorShare: string;
}

export function ExplanationSection({ landownerShare, investorShare }: ExplanationSectionProps) {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
          Understanding Landowner & Investor Share Units
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Landowner Share Card */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                What is Landowner Share?
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-6">{landownerShare}</p>

              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Usually priced 10-15% below builder rates</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Same specifications as builder units</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Flexible payment terms possible</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Investor Share Card */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                What is Investor Share?
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-6">{investorShare}</p>

              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Ready or near-ready possession units</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Motivated sellers for quick deals</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Avoid pre-launch risks</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

