import { convertGoogleMapsToEmbed } from "@/utils/urlConverters";

interface GoogleMapEmbedProps {
  url?: string;
  title?: string;
  height?: number;
  lat?: number;
  lng?: number;
  zoom?: number;
  mapType?: 'roadmap' | 'satellite';
}

const DEFAULT_TITLE = "Property Location Map";
const DEFAULT_HEIGHT = 450;

export default function GoogleMapEmbed({
  url,
  title = DEFAULT_TITLE,
  height = DEFAULT_HEIGHT,
  lat,
  lng,
  zoom = 18,
  mapType = 'satellite'
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

  // Priority 1: If lat/lng provided, use them directly
  if (lat !== undefined && lng !== undefined) {
    const embedUrl = createMapsEmbedFromCoords(lat, lng, zoom, mapType);
    
    return (
      <div className="w-full relative" style={{ height: height }}>
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

    return (
      <div className="w-full relative" style={{ height: height }}>
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
