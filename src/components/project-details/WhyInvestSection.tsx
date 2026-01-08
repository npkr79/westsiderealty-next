import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, BarChart3 } from "lucide-react";

interface WhyInvestSectionProps {
  investmentAnalysis?: any;
}

export default function WhyInvestSection({ investmentAnalysis }: WhyInvestSectionProps) {
  if (!investmentAnalysis) return null;

  const highlights = investmentAnalysis.highlights || investmentAnalysis.key_points || [];
  const roi = investmentAnalysis.roi || investmentAnalysis.expected_roi;
  const appreciation = investmentAnalysis.appreciation || investmentAnalysis.appreciation_rate;

  // If investmentAnalysis is just a string, render it
  if (typeof investmentAnalysis === 'string') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Why Invest in This Project?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: investmentAnalysis }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investment Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {(roi || appreciation) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roi && (
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                <TrendingUp className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Expected ROI</div>
                  <div className="text-2xl font-bold text-foreground">{roi}</div>
                </div>
              </div>
            )}
            {appreciation && (
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                <BarChart3 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Annual Appreciation</div>
                  <div className="text-2xl font-bold text-foreground">{appreciation}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {highlights.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Key Investment Highlights</h3>
            <ul className="space-y-2">
              {highlights.map((highlight: any, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{typeof highlight === 'string' ? highlight : highlight.text || highlight.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {investmentAnalysis.description && (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: investmentAnalysis.description }} />
        )}
      </CardContent>
    </Card>
  );
}
