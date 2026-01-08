import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, BarChart3, CheckCircle2, AlertCircle } from "lucide-react";
import { safeJsonParse } from "@/lib/safeJson";

interface InvestmentData {
  verdict?: string;
  appreciation_potential?: string;
  rental_yield?: string;
  growth_drivers?: string[];
  pros?: string[];
  cons?: string[];
  highlights?: string[];
  key_points?: string[];
  roi?: string;
  expected_roi?: string;
  appreciation?: string;
  appreciation_rate?: string;
  description?: string;
}

interface WhyInvestSectionProps {
  investmentAnalysis?: any;
  projectName?: string;
}

export default function WhyInvestSection({ investmentAnalysis, projectName }: WhyInvestSectionProps) {
  if (!investmentAnalysis) return null;

  // Parse investment analysis JSON
  const data: InvestmentData = safeJsonParse(investmentAnalysis, {});

  // Don't render if no meaningful data
  const hasContent = data.verdict || data.pros?.length || data.cons?.length || 
                     data.appreciation_potential || data.growth_drivers?.length ||
                     data.highlights?.length || data.key_points?.length;

  if (!hasContent && typeof investmentAnalysis !== 'string') return null;

  const highlights = data.highlights || data.key_points || data.growth_drivers || [];
  const roi = data.roi || data.expected_roi;
  const appreciation = data.appreciation || data.appreciation_rate || data.appreciation_potential;

  // If investmentAnalysis is just a string, render it
  if (typeof investmentAnalysis === 'string') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{projectName ? `Why Invest in ${projectName}?` : 'Why Invest in This Project?'}</CardTitle>
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
        <CardTitle>{projectName ? `Why Invest in ${projectName}?` : 'Investment Analysis'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.verdict && (
          <div className="p-4 rounded-lg border-l-4 border-primary bg-primary/5">
            <p className="text-foreground leading-relaxed">{data.verdict}</p>
          </div>
        )}

        {(roi || appreciation || data.rental_yield) && (
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
            {(appreciation || data.rental_yield) && (
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                <BarChart3 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {appreciation ? 'Annual Appreciation' : 'Rental Yield'}
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {appreciation || data.rental_yield}
                  </div>
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
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{typeof highlight === 'string' ? highlight : highlight.text || highlight.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.pros && data.pros.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Pros
              </h3>
              <ul className="space-y-2">
                {data.pros.map((pro: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span className="text-foreground">{typeof pro === 'string' ? pro : pro.text || pro.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.cons && data.cons.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Considerations
              </h3>
              <ul className="space-y-2">
                {data.cons.map((con: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span className="text-foreground">{typeof con === 'string' ? con : con.text || con.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {data.description && (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: data.description }} />
        )}
      </CardContent>
    </Card>
  );
}
