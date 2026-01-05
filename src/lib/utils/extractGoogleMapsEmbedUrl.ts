/**
 * Extract and normalize Google Maps embed URL from database field.
 * 
 * Handles multiple input formats:
 * 1. Clean URL: "https://www.google.com/maps/embed?pb=..."
 * 2. Full iframe HTML: "<iframe src='https://...'></iframe>"
 * 3. Protocol-relative: "//maps.google.com/..."
 * 4. Missing protocol: "maps.google.com/..."
 * 5. Malformed: "https://maps.google.com/8Place...&output=embed" (missing /maps?q=)
 * 
 * Returns null if the input is invalid or not a Google Maps URL.
 */
export function extractGoogleMapsEmbedUrl(input?: string | null): string | null {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  // 1) If stored as iframe HTML, extract src
  const extracted =
    raw.match(/src\s*=\s*"([^"]+)"/i)?.[1] ??
    raw.match(/src\s*=\s*'([^']+)'/i)?.[1] ??
    raw;

  let url = extracted.trim();
  if (!url) return null;

  // 2) Normalize protocol / missing slashes / protocol-relative
  if (url.startsWith("//")) url = `https:${url}`;
  if (/^https:\/[^/]/i.test(url)) url = url.replace(/^https:\//i, "https://");
  if (/^http:\/[^/]/i.test(url)) url = url.replace(/^http:\//i, "http://");
  if (/^(maps\.google\.com\/|www\.maps\.google\.com\/)/i.test(url)) url = `https://${url}`;

  // must be absolute now
  if (!/^https?:\/\//i.test(url)) return null;

  // 3) Fix weird stored form: https://maps.google.com/8Place...&output=embed  (missing /maps?q=)
  // Accepts both with/without the leading digit(s). Only applies when it does NOT already contain /maps?
  if (
    /^https?:\/\/(www\.)?maps\.google\.com\//i.test(url) &&
    !/\/maps(\/|\?|$)/i.test(url) &&
    /&output=embed/i.test(url)
  ) {
    const afterDomain = url.replace(/^https?:\/\/(www\.)?maps\.google\.com\//i, "");
    const afterDigits = afterDomain.replace(/^\d+/, "");
    const place = afterDigits.split("&output=embed")[0].replace(/^\/+/, "");
    if (place) {
      url = `https://maps.google.com/maps?q=${place}&output=embed`;
    }
  }

  // 4) Validate domain + URL parse
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const isGoogleMaps =
      host === "maps.google.com" ||
      host === "www.maps.google.com" ||
      (host === "www.google.com" && u.pathname.startsWith("/maps"));
    if (!isGoogleMaps) return null;
    return url;
  } catch {
    return null;
  }
}
