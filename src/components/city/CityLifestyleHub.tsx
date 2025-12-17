import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CityLifestyleHubProps {
  lifestyleData: any;
  cityName: string;
}

export default function CityLifestyleHub({ lifestyleData, cityName }: CityLifestyleHubProps) {
  if (!lifestyleData) return null;

  const sections = Array.isArray(lifestyleData)
    ? lifestyleData
    : Array.isArray(lifestyleData?.sections) ? lifestyleData.sections : [];

  if (!Array.isArray(sections) || !sections.length) return null;

  return (
    <section className="py-16 bg-secondary/10">
      <div className="container px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[hsl(var(--heading-blue))]">
          Lifestyle & Social Infrastructure in {cityName}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section: any, idx: number) => (
            <Card key={idx} className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">
                  {section.title || section.name || "Lifestyle Highlight"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {section.description && <p>{section.description}</p>}
                {Array.isArray(section.points) && section.points.length > 0 && (
                  <ul className="list-disc list-inside space-y-1">
                    {section.points.map((point: string, i: number) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}


