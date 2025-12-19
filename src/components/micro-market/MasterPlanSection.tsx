import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MasterPlanSectionProps {
  data: any;
}

export default function MasterPlanSection({ data }: MasterPlanSectionProps) {
  if (!data) return null;

  return (
    <section className="mb-12">
      <Card>
        <CardHeader>
          <CardTitle>Master Plan & Zoning</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Minimal placeholder; real layout is handled in the micro-market page content itself */}
          <div className="prose max-w-none text-muted-foreground">
            {typeof data === "string" ? (
              <div dangerouslySetInnerHTML={{ __html: data }} />
            ) : (
              <pre className="whitespace-pre-wrap text-xs">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}



