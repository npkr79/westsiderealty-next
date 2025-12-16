import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectLocationProps {
  googleMapsUrl?: string | null;
  googleMapsEmbedUrl?: string | null;
  landmarks: any[];
  microMarketName?: string | null;
  cityName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export default function ProjectLocation({
  googleMapsUrl,
  googleMapsEmbedUrl,
  landmarks,
  microMarketName,
  cityName,
}: ProjectLocationProps) {
  const hasMap = !!(googleMapsEmbedUrl || googleMapsUrl);

  return (
    <section className="mt-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Location – {microMarketName || cityName || "Project Location"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {cityName && (
            <p>
              Explore connectivity, social infrastructure, and commute times in{" "}
              <span className="font-semibold text-foreground">{cityName}</span>
              {microMarketName ? ` – ${microMarketName}` : ""}.
            </p>
          )}

          {Array.isArray(landmarks) && landmarks.length > 0 && (
            <ul className="grid md:grid-cols-2 gap-2">
              {landmarks.map((lm: any, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>
                    {typeof lm === "string"
                      ? lm
                      : lm?.label || lm?.name || lm?.title}
                    {lm?.distance && ` – ${lm.distance}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {hasMap && (
        <div className="rounded-lg border overflow-hidden">
          {googleMapsEmbedUrl ? (
            <iframe
              src={googleMapsEmbedUrl}
              title="Project location map"
              loading="lazy"
              className="w-full h-[360px] border-0"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : googleMapsUrl ? (
            <div className="p-4 text-center text-sm">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-2"
              >
                Open location in Google Maps
              </a>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}


