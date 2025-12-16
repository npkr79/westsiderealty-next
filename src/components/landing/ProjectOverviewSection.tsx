import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectOverviewSectionProps {
  title?: string;
  description?: string;
  highlights?: string[];
}

export default function ProjectOverviewSection({
  title = "Project Overview",
  description,
  highlights,
}: ProjectOverviewSectionProps) {
  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto max-w-5xl px 4">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {description && <p>{description}</p>}
            {highlights && highlights.length > 0 && (
              <ul className="list-disc pl-5 space-y-1">
                {highlights.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}


