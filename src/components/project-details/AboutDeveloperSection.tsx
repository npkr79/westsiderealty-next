import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AboutDeveloperSectionProps {
  developerName?: string;
  developerDescription?: string;
}

export default function AboutDeveloperSection({
  developerName,
  developerDescription,
}: AboutDeveloperSectionProps) {
  if (!developerName && !developerDescription) return null;

  return (
    <section className="mb-8">
      <Card>
        <CardHeader>
          <CardTitle>About the Developer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {developerName && <p className="font-semibold text-foreground">{developerName}</p>}
          {developerDescription && <p>{developerDescription}</p>}
        </CardContent>
      </Card>
    </section>
  );
}


