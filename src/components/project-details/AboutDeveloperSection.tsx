import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface AboutDeveloperSectionProps {
  developerName: string;
  citySlug: string;
  developerSlug: string;
  logoUrl?: string | null;
  tagline?: string | null;
  yearsInBusiness?: number | null;
  totalProjects?: number | null;
  totalSftDelivered?: string | null;
  description?: string | null;
  notableProjects?: string | null;
}

export default function AboutDeveloperSection({
  developerName,
  citySlug,
  developerSlug,
  logoUrl,
  tagline,
  yearsInBusiness,
  totalProjects,
  totalSftDelivered,
  description,
  notableProjects,
}: AboutDeveloperSectionProps) {
  return (
    <section className="mb-8">
      <Card>
        <CardHeader>
          <CardTitle>About {developerName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {logoUrl && (
            <div className="mb-4">
              <img src={logoUrl} alt={`${developerName} logo`} className="h-16 w-auto" />
            </div>
          )}
          {tagline && <p className="text-lg font-semibold text-foreground">{tagline}</p>}
          {description && (
            <div 
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
          {(yearsInBusiness || totalProjects || totalSftDelivered) && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              {yearsInBusiness && (
                <div>
                  <p className="text-2xl font-bold text-primary">{yearsInBusiness}+</p>
                  <p className="text-sm text-muted-foreground">Years</p>
                </div>
              )}
              {totalProjects && (
                <div>
                  <p className="text-2xl font-bold text-primary">{totalProjects}+</p>
                  <p className="text-sm text-muted-foreground">Projects</p>
                </div>
              )}
              {totalSftDelivered && (
                <div>
                  <p className="text-2xl font-bold text-primary">{totalSftDelivered}</p>
                  <p className="text-sm text-muted-foreground">Sq.Ft Delivered</p>
                </div>
              )}
            </div>
          )}
          {notableProjects && (
            <div className="pt-4 border-t">
              <p className="text-sm font-semibold text-foreground mb-2">Notable Projects:</p>
              <p className="text-sm text-muted-foreground">{notableProjects}</p>
            </div>
          )}
          <div className="pt-4">
            <Link 
              href={`/developers/${developerSlug}`}
              className="text-primary hover:underline font-semibold"
            >
              View Full Developer Profile →
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}


