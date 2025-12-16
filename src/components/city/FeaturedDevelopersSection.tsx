import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { developersHubService } from "@/services/developersHubService";
import Link from "next/link";

interface FeaturedDevelopersSectionProps {
  cityId: string;
  cityName: string;
}

export default async function FeaturedDevelopersSection({
  cityId,
  cityName,
}: FeaturedDevelopersSectionProps) {
  const developers = await developersHubService.getDevelopers({ cityFocus: cityName });
  const items = developers || [];

  if (!items || items.length === 0) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:tex-3xl font-bold mb-6 text-[hsl(var(--heading-blue))]">
          Featured Developers in {cityName}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((dev: any) => (
            <Card key={dev.id}>
              <CardHeader>
                <CardTitle>{dev.developer_name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                {dev.tagline && <p>{dev.tagline}</p>}
                <Link
                  href={`/developers/${dev.url_slug}`}
                  className="text-primary font-medium hover:underline"
                >
                  View Developer Profile →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}


