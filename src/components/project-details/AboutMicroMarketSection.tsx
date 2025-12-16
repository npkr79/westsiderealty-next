import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AboutMicroMarketSectionProps {
  title?: string;
  description?: string;
}

export default function AboutMicroMarketSection({
  title,
  description,
}: AboutMicroMarketSectionProps) {
  if (!title && !description) return null;

  return (
    <section className="mb-8">
      <Card>
        <CardHeader>
          <CardTitle>{title || "About the Micro-Market"}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {description && <p>{description}</p>}
        </CardContent>
      </Card>
    </section>
  );
}


