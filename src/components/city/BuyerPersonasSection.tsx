import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BuyerPersonasSectionProps {
  personas: any[];
  cityName: string;
}

export default function BuyerPersonasSection({
  personas,
  cityName,
}: BuyerPersonasSectionProps) {
  if (!Array.isArray(personas) || personas.length === 0) return null;

  return (
    <section className="py-16 bg-secondary/5">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-[hsl(var(--heading-blue))]">
          Who Buys in {cityName}?
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {personas.map((persona, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle>{persona.title || persona.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                {persona.description && <p>{persona.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}


