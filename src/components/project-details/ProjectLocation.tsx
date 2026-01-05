import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { extractGoogleMapsEmbedUrl } from "@/lib/utils/extractGoogleMapsEmbedUrl";

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
  // Extract and normalize Google Maps embed URL (handles iframe HTML, malformed URLs, etc.)
  const embedUrl = extractGoogleMapsEmbedUrl(googleMapsEmbedUrl ?? googleMapsUrl);
  
  // Only render map container if we have a valid embed URL
  const hasMap = !!embedUrl;

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
          <iframe
            src={embedUrl!}
            title="Project location map"
            loading="lazy"
            className="w-full h-[360px] border-0"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
    </section>
  );
}


