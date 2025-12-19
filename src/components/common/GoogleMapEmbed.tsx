import { convertGoogleMapsToEmbed } from "@/utils/urlConverters";
import { Button } from "@/components/ui/button";
import { ExternalLink, Star } from "lucide-react";
import Link from "next/link";

interface GoogleMapEmbedProps {
  url?: string;
  title?: string;
  height?: number;
  lat?: number;
  lng?: number;
  zoom?: number;
  mapType?: 'roadmap' | 'satellite';
  // New props for info card overlay
  businessName?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
}

const DEFAULT_TITLE = "Property Location Map";
const DEFAULT_HEIGHT = 450;

export default function GoogleMapEmbed({
  url,
  title = DEFAULT_TITLE,
  height = DEFAULT_HEIGHT,
  lat,
  lng,
  zoom = 17,
  mapType = 'satellite',
  businessName,
  address,
  rating,
  reviewCount
}: GoogleMapEmbedProps) {
  
  // Helper function to create Google Maps embed URL from coordinates with marker
  const createMapsEmbedFromCoords = (
    latitude: number,
    longitude: number,
    zoomLevel: number = 18,
    mode: 'roadmap' | 'satellite' = 'satellite'
  ): string => {
    // Using Google Maps Embed API with marker
    const mapTypeParam = mode === 'satellite' ? '&maptype=satellite' : '';
    return `https://maps.google.com/maps?q=${latitude},${longitude}&t=k&z=${zoomLevel}&output=embed&iwloc=near${mapTypeParam}`;
  };

  // Helper to generate directions URL
  const getDirectionsUrl = () => {
    if (lat !== undefined && lng !== undefined) {
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }
    return "#";
  };

  // Priority 1: If lat/lng provided, use them directly
  if (lat !== undefined && lng !== undefined) {
    const embedUrl = createMapsEmbedFromCoords(lat, lng, zoom, mapType);
    const directionsUrl = getDirectionsUrl();
    
    return (
      <div className="w-full relative" style={{ height: height }}>
        {/* Info Card Overlay */}
        {(businessName || address || rating) && (
          <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-xs">
            {businessName && (
              <h3 className="font-semibold text-lg text-foreground mb-1">
                {businessName}
              </h3>
            )}
            {address && (
              <p className="text-sm text-muted-foreground mb-3">
                {address}
              </p>
            )}
            {rating && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {rating}
                </span>
                {reviewCount && (
                  <span className="text-sm text-muted-foreground">
                    • {reviewCount} reviews
                  </span>
                )}
              </div>
            )}
            <Button
              asChild
              size="sm"
              className="w-full"
            >
              <Link
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Directions
              </Link>
            </Button>
          </div>
        )}
        <iframe
          src={embedUrl}
          width="100%"
          height={height}
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={title}
          className="w-full h-full"
        />
      </div>
    );
  }

  // Priority 2: Convert provided URL
  if (url) {
    const embedUrl = convertGoogleMapsToEmbed(url);
    
    if (!embedUrl) {
      return (
        <div className="w-full bg-muted/20 rounded-lg flex items-center justify-center p-8" style={{ height }}>
          <p className="text-muted-foreground text-center">
            Unable to display map. Invalid URL format.
          </p>
        </div>
      );
    }

    // URL already has satellite view built in from converter
    const enhancedUrl = embedUrl;
    const directionsUrl = url; // Use original URL for directions

    return (
      <div className="w-full relative" style={{ height: height }}>
        {/* Info Card Overlay */}
        {(businessName || address || rating) && (
          <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-xs">
            {businessName && (
              <h3 className="font-semibold text-lg text-foreground mb-1">
                {businessName}
              </h3>
            )}
            {address && (
              <p className="text-sm text-muted-foreground mb-3">
                {address}
              </p>
            )}
            {rating && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {rating}
                </span>
                {reviewCount && (
                  <span className="text-sm text-muted-foreground">
                    • {reviewCount} reviews
                  </span>
                )}
              </div>
            )}
            <Button
              asChild
              size="sm"
              className="w-full"
            >
              <Link
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Directions
              </Link>
            </Button>
          </div>
        )}
        <iframe
          src={enhancedUrl}
          width="100%"
          height={height}
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={title}
          className="w-full h-full"
        />
      </div>
    );
  }

  // No valid data provided
  return (
    <div className="w-full bg-muted/20 rounded-lg flex items-center justify-center p-8" style={{ height }}>
      <p className="text-muted-foreground text-center">
        No map location available
      </p>
    </div>
  );
}
