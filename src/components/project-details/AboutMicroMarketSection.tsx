import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AboutMicroMarketSectionProps {
  microMarketName: string;
  citySlug: string;
  microMarketSlug: string;
  heroHook?: string | null;
  growthStory?: string | null;
  pricePerSqftMin?: number | null;
  pricePerSqftMax?: number | null;
  appreciationRate?: number | null;
}

// Sanitize HTML to remove iframes, scripts, and other potentially dangerous elements
function sanitizeHTML(html: string): string {
  if (!html) return '';
  
  // Remove iframe tags and their content
  html = html.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
  html = html.replace(/<iframe[^>]*\/?>/gi, '');
  
  // Remove script tags and their content
  html = html.replace(/<script[^>]*>.*?<\/script>/gi, '');
  html = html.replace(/<script[^>]*\/?>/gi, '');
  
  // Remove embed and object tags
  html = html.replace(/<embed[^>]*>.*?<\/embed>/gi, '');
  html = html.replace(/<embed[^>]*\/?>/gi, '');
  html = html.replace(/<object[^>]*>.*?<\/object>/gi, '');
  html = html.replace(/<object[^>]*\/?>/gi, '');
  
  // Remove on* event handlers (onclick, onload, etc.)
  html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  html = html.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  return html;
}

export default function AboutMicroMarketSection({
  microMarketName,
  citySlug,
  microMarketSlug,
  heroHook,
  growthStory,
  pricePerSqftMin,
  pricePerSqftMax,
  appreciationRate,
}: AboutMicroMarketSectionProps) {
  if (!microMarketName && !growthStory && !heroHook) return null;

  const displayCity =
    citySlug.charAt(0).toUpperCase() + citySlug.slice(1).toLowerCase();

  // Sanitize HTML content to prevent iframe/script injection
  const sanitizedHeroHook = heroHook ? sanitizeHTML(heroHook) : null;
  const sanitizedGrowthStory = growthStory ? sanitizeHTML(growthStory) : null;

  return (
    <section className="mb-8">
      <Card>
        <CardHeader>
          <CardTitle>
            About {microMarketName} Micro-Market in {displayCity}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {sanitizedHeroHook && (
            <p 
              className="text-base font-medium text-foreground"
              dangerouslySetInnerHTML={{ __html: sanitizedHeroHook }}
            />
          )}

          {sanitizedGrowthStory && (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizedGrowthStory }}
            />
          )}

          {(pricePerSqftMin || pricePerSqftMax || appreciationRate) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {(pricePerSqftMin || pricePerSqftMax) && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Avg. Price Range
                  </p>
                  <p className="font-semibold text-foreground">
                    ₹
                    {pricePerSqftMin
                      ? pricePerSqftMin.toLocaleString()
                      : "-"}
                    {pricePerSqftMax &&
                      ` - ₹${pricePerSqftMax.toLocaleString()}`}
                    /sq.ft
                  </p>
                </div>
              )}
              {appreciationRate && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Annual Appreciation
                  </p>
                  <p className="font-semibold text-foreground">
                    {appreciationRate}%+
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Location
                </p>
                <p className="font-semibold text-foreground">
                  {microMarketName}, {displayCity}
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground pt-2">
            Looking for more projects in {microMarketName}? Browse curated
            listings in this micro-market on the{" "}
            <a
              href={`/${citySlug}/micro-markets/${microMarketSlug}`}
              className="text-primary underline underline-offset-2"
            >
              {microMarketName} hub page
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </section>
  );
}


