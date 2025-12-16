import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickFactsModuleProps {
  localityPincode?: string | null;
  pricePerSqftMin?: number | null;
  pricePerSqftMax?: number | null;
  keyAdjacentAreas?: string[] | null;
  annualAppreciationMin?: number | null;
  annualAppreciationMax?: number | null;
  nearestMmtsStatus?: string | null;
  microMarketName: string;
}

export default function QuickFactsModule({
  localityPincode,
  pricePerSqftMin,
  pricePerSqftMax,
  keyAdjacentAreas,
  annualAppreciationMin,
  annualAppreciationMax,
  nearestMmtsStatus,
  microMarketName,
}: QuickFactsModuleProps) {
  return (
    <section className="mb-12">
      <Card>
        <CardHeader>
          <CardTitle>Quick Facts – {microMarketName}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {localityPincode && (
            <div>
              <p className="text-xs text-muted-foreground">PIN Code</p>
              <p className="font-semibold">{localityPincode}</p>
            </div>
          )}
          {pricePerSqftMin != null && pricePerSqftMax != null && (
            <div>
              <p className="text-xs text-muted-foreground">Price Range (per sq.ft.)</p>
              <p className="font-semibold">
                ₹{pricePerSqftMin.toLocaleString()} – ₹{pricePerSqftMax.toLocaleString()}
              </p>
            </div>
          )}
          {annualAppreciationMin != null && annualAppreciationMax != null && (
            <div>
              <p className="text-xs text-muted-foreground">Annual Appreciation</p>
              <p className="font-semibold">
                {annualAppreciationMin}% – {annualAppreciationMax}%
              </p>
            </div>
          )}
          {nearestMmtsStatus && (
            <div>
              <p className="text-xs text-muted-foreground">Transit Connectivity</p>
              <p className="font-semibold">{nearestMmtsStatus}</p>
            </div>
          )}
          {keyAdjacentAreas && keyAdjacentAreas.length > 0 && (
            <div className="md:col-span-2">
              <p className="text-xs text-muted-foreground">Key Adjacent Areas</p>
              <p className="font-semibold">{keyAdjacentAreas.join(", ")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}


