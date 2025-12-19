import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HyderabadInvestmentGuide() {
  return (
    <section className="py-16 bg-secondary/5">
      <div className="container mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Hyderabad Investment Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Hyderabad&apos;s western corridor – including Kokapet, Narsingi, Financial District,
              and Gachibowli – has emerged as one of India&apos;s most resilient real estate
              markets, driven by strong IT/ITES employment and infrastructure.
            </p>
            <p>
              Investors typically look for a balance of capital appreciation and rental yield,
              with projects close to employment hubs, upcoming metro connectivity, and quality
              social infrastructure.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}



