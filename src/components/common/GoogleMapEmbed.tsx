import { convertGoogleMapsToEmbed } from "@/utils/urlConverters";
import { extractGoogleMapsEmbedUrl } from "@/lib/utils/extractGoogleMapsEmbedUrl";
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
  
  // Helper function to create Google Maps embed URL from coordinates with red pin marker
  const createMapsEmbedFromCoords = (
    latitude: number,
    longitude: number,
    zoomLevel: number = 16,
    mode: 'roadmap' | 'satellite' = 'satellite'
  ): string => {
    // Using Google Maps Embed API with red pin marker
    // The format: q=lat,lng shows a red pin marker with address card
    // For satellite view, use t=k parameter
    const mapTypeParam = mode === 'satellite' ? '&t=k' : '';
    return `https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoomLevel}&output=embed${mapTypeParam}`;
  };

  // Helper function to create Google Maps embed URL from address/place name
  const createMapsEmbedFromAddress = (
    address: string,
    zoomLevel: number = 16,
    mode: 'roadmap' | 'satellite' = 'satellite'
  ): string => {
    // Using Google Maps Embed API with place search
    // The format: q=address shows a red pin marker with address card
    const mapTypeParam = mode === 'satellite' ? '&t=k' : '';
    const encodedAddress = encodeURIComponent(address);
    return `https://maps.google.com/maps?q=${encodedAddress}&z=${zoomLevel}&output=embed${mapTypeParam}`;
  };

  // Helper to generate directions URL
  const getDirectionsUrl = () => {
    if (lat !== undefined && lng !== undefined) {
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }
    return "#";
  };

  // Priority 1: If URL is provided, sanitize and use it (highest priority for Goa properties)
  // Use the centralized extractGoogleMapsEmbedUrl helper to handle iframe HTML, malformed URLs, etc.
  if (url) {
    const embedUrl = extractGoogleMapsEmbedUrl(url);
    
    // Only render if we have a valid embed URL
    if (!embedUrl) {
      // Invalid URL - skip to next priority (coordinates or address)
    } else {
    const placeMatch = embedUrl.match(/!1s([^!]+)/);
    let directionsUrl: string;
    if (placeMatch) {
      directionsUrl = `https://www.google.com/maps/place/${encodeURIComponent(placeMatch[1])}`;
    } else {
      const coordsMatch = embedUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (coordsMatch) {
        directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coordsMatch[1]},${coordsMatch[2]}`;
      } else {
        directionsUrl = embedUrl.replace('/embed', '').replace('output=embed', '').replace('&output=embed', '');
      }
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
  }

  // Priority 2: If lat/lng provided, use them directly
  if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
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

  // Priority 3: If no coordinates but we have address or businessName, construct from address
  if ((lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) && !url && (address || businessName)) {
    const addressQuery = businessName && address
      ? `${businessName}, ${address}`
      : businessName || address || title;
    const embedUrl = createMapsEmbedFromAddress(addressQuery, zoom, mapType);
    const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`;
    
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
          className="w-full h-full rounded-lg"
        />
      </div>
    );
  }

  // Priority 4: Use provided URL and convert if needed (fallback for non-embed URLs)
  // This path handles non-embed URLs that need conversion (e.g., regular Google Maps share URLs)
  // Note: Priority 1 already handled embed URLs, so this only runs if URL wasn't an embed URL
  if (url) {
    // Try to extract/sanitize first (handles iframe HTML, malformed URLs)
    const sanitizedUrl = extractGoogleMapsEmbedUrl(url);
    
    if (sanitizedUrl) {
      // Already a valid embed URL after sanitization
      const placeMatch = sanitizedUrl.match(/!1s([^!]+)/);
      let directionsUrl: string;
      if (placeMatch) {
        directionsUrl = `https://www.google.com/maps/place/${encodeURIComponent(placeMatch[1])}`;
      } else {
        const coordsMatch = sanitizedUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (coordsMatch) {
          directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coordsMatch[1]},${coordsMatch[2]}`;
        } else {
          directionsUrl = sanitizedUrl.replace('/embed', '').replace('output=embed', '').replace('&output=embed', '');
        }
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
    
    // If sanitization failed, try converting regular Google Maps URL to embed
    const convertedUrl = convertGoogleMapsToEmbed(url);
    if (convertedUrl) {
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
                  href={url}
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
            src={convertedUrl}
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
    
    // URL is invalid - don't render map container
    // Fall through to "No valid data provided" below
  }

  // No valid data provided - don't render anything
  return null;
}
