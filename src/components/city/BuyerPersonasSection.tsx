import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-[hsl(var(--heading-blue))]">
          Who's Buying in {cityName}?
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {personas.map((persona, idx) => (
            <Card key={idx} className="h-full">
              <CardHeader>
                <CardTitle className="text-xl">{persona.title || persona.name || persona.type}</CardTitle>
                {persona.budget && (
                  <Badge variant="secondary" className="mt-2 w-fit">
                    Budget: {persona.budget}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                {persona.description && (
                  <p className="leading-relaxed">{persona.description}</p>
                )}
                
                {persona.preferences && Array.isArray(persona.preferences) && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Preferences:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {persona.preferences.map((pref: any, i: number) => {
                        // Handle both string and object formats
                        const prefText = typeof pref === 'string' ? pref : (pref?.text || pref?.name || JSON.stringify(pref));
                        return <li key={i}>{prefText}</li>;
                      })}
                    </ul>
                  </div>
                )}
                
                {persona.priorities && Array.isArray(persona.priorities) && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Priorities:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {persona.priorities.map((priority: any, i: number) => {
                        // Handle both string and object formats
                        const priorityText = typeof priority === 'string' ? priority : (priority?.text || priority?.name || JSON.stringify(priority));
                        return <li key={i}>{priorityText}</li>;
                      })}
                    </ul>
                  </div>
                )}
                
                {persona.target_areas && Array.isArray(persona.target_areas) && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Target Areas:</h4>
                    <div className="flex flex-wrap gap-2">
                      {persona.target_areas.map((area: any, i: number) => {
                        // Handle both string and object formats
                        const areaName = typeof area === 'string' ? area : (area?.name || area?.title || JSON.stringify(area));
                        return (
                          <Badge key={i} variant="outline">{areaName}</Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {persona.investment_goals && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Investment Goals:</h4>
                    <p>{persona.investment_goals}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}


