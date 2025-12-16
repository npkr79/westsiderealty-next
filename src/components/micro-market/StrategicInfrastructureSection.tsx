import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface StrategicInfrastructureSectionProps {
  microMarketName: string;
  nearestMmtsStatus?: string | null;
}

export default function StrategicInfrastructureSection({
  microMarketName,
  nearestMmtsStatus,
}: StrategicInfrastructureSectionProps) {
  return (
    <section className="mb-12">
      <Card>
        <CardHeader>
          <CardTitle>Strategic Infrastructure & Connectivity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            {microMarketName} benefits from growing social and physical infrastructure, making it
            an increasingly attractive destination for both end-users and investors.
          </p>
          {nearestMmtsStatus && (
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{nearestMmtsStatus}</span>
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}


