import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Calendar, Building2 } from "lucide-react";

interface ProjectKeyFactsStripProps {
  priceDisplay?: string | null;
  reraId?: string | null;
  reraLink?: string | null;
  status?: string | null;
  onEnquire: () => void;
}

export default function ProjectKeyFactsStrip({
  priceDisplay,
  reraId,
  reraLink,
  status,
  onEnquire,
}: ProjectKeyFactsStripProps) {
  const getStatusColor = (status: string) => {
    const lower = status.toLowerCase();
    if (lower.includes('ready') || lower.includes('completed')) return 'bg-green-600';
    if (lower.includes('construction') || lower.includes('ongoing')) return 'bg-amber-600';
    if (lower.includes('sold')) return 'bg-destructive';
    if (lower.includes('upcoming') || lower.includes('pre-launch')) return 'bg-blue-600';
    return 'bg-primary';
  };

  return (
    <div className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Price Display */}
          <div className="flex items-center gap-6 flex-wrap">
            {priceDisplay && (
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-sm font-medium">Starting</span>
                <span className="text-xl md:text-2xl font-bold">{priceDisplay}</span>
              </div>
            )}

            {/* RERA Badge */}
            {reraId && (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-400" />
                {reraLink ? (
                  <a
                    href={reraLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-400 hover:text-green-300 underline underline-offset-2"
                  >
                    RERA: {reraId}
                  </a>
                ) : (
                  <span className="text-sm text-green-400">RERA: {reraId}</span>
                )}
              </div>
            )}

            {/* Status Badge */}
            {status && (
              <Badge className={`${getStatusColor(status)} text-white border-0`}>
                <Building2 className="h-3 w-3 mr-1" />
                {status}
              </Badge>
            )}
          </div>

          {/* CTA Button */}
          <Button 
            onClick={onEnquire}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
          >
            Get Best Price
          </Button>
        </div>
      </div>
    </div>
  );
}
