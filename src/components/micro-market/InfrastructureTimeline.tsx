import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface InfrastructureItem {
  year: string;
  project: string;
  status: string;
  impact: string;
}

interface InfrastructureTimelineProps {
  data: InfrastructureItem[];
}

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const statusLower = status.toLowerCase();
  if (statusLower === 'operational' || statusLower === 'completed') return 'default';
  if (statusLower === 'under construction' || statusLower === 'in progress') return 'secondary';
  if (statusLower === 'proposed' || statusLower === 'planned') return 'outline';
  return 'secondary';
};

export default function InfrastructureTimeline({ data }: InfrastructureTimelineProps) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <h2 className="micro-market-h2">Infrastructure Roadmap</h2>
      
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 md:left-12 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
        
        <div className="space-y-6">
          {data.map((item, idx) => (
            <div key={idx} className="flex gap-4 md:gap-8">
              {/* Year Circle */}
              <div className="flex-shrink-0 w-12 md:w-24 flex items-start justify-center">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm md:text-lg shadow-md z-10">
                  {item.year}
                </div>
              </div>
              
              {/* Content Card */}
              <Card className="flex-1">
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{item.project}</h3>
                    <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground italic">{item.impact}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
