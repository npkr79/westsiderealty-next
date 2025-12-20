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

  // Priority 2: Use provided URL directly if it's already an embed URL
  if (url) {
    // Check if URL is already a Google Maps embed URL
    const isEmbedUrl = url.includes('maps/embed') || url.includes('maps?pb=');
    
    let embedUrl: string;
    let directionsUrl: string;
    
    if (isEmbedUrl) {
      // Use embed URL directly (may already have satellite view and place marker)
      embedUrl = url;
      // Extract place ID or coordinates for directions
      const placeMatch = url.match(/!1s([^!]+)/);
      if (placeMatch) {
        directionsUrl = `https://www.google.com/maps/place/${encodeURIComponent(placeMatch[1])}`;
      } else {
        directionsUrl = url.replace('/embed', '').replace('output=embed', '');
      }
    } else {
      // Convert regular Google Maps URL to embed
      const convertedUrl = convertGoogleMapsToEmbed(url);
      if (!convertedUrl) {
        return (
          <div className="w-full bg-muted/20 rounded-lg flex items-center justify-center p-8" style={{ height }}>
            <p className="text-muted-foreground text-center">
              Unable to display map. Invalid URL format.
            </p>
          </div>
        );
      }
      embedUrl = convertedUrl;
      directionsUrl = url;
    }

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

  // No valid data provided
  return (
    <div className="w-full bg-muted/20 rounded-lg flex items-center justify-center p-8" style={{ height }}>
      <p className="text-muted-foreground text-center">
        No map location available
      </p>
    </div>
  );
}
