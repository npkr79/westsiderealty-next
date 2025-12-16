
/**
 * Converts any Google Drive sharing link to a direct image/video view link.
 * If possible, uses the Google Drive thumbnail API which works more reliably for embedding.
 * Supports:
 * - "https://drive.google.com/file/d/FILEID/view?usp=sharing"
 * - "https://drive.google.com/open?id=FILEID"
 * - "https://drive.google.com/uc?id=FILEID"
 * - etc.
 * Return unchanged if not recognized.
 */
export function getGoogleDriveDirectUrl(url?: string): string | undefined {
  if (!url) return undefined;

  // Support /file/d/FILEID/view (with optional params after)
  const fileId1 = url.match(/\/file\/d\/([A-Za-z0-9_-]{10,})(?:\/view.*)?/)?.[1];
  if (fileId1) {
    // Use Google Drive Thumbnail API
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId1}&sz=w800-h600`;
    console.log("[gdrive.ts/getGoogleDriveDirectUrl] Matched /file/d/: using thumbnail API", { original: url, fileId1, thumbnailUrl });
    return thumbnailUrl;
  }
  // /open?id=FILEID or ?id=FILEID
  const fileId2 = url.match(/[?&]id=([A-Za-z0-9_-]{10,})/)?.[1];
  if (fileId2) {
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId2}&sz=w800-h600`;
    console.log("[gdrive.ts/getGoogleDriveDirectUrl] Matched ?id=: using thumbnail API", { original: url, fileId2, thumbnailUrl });
    return thumbnailUrl;
  }
  // Already a uc? link, convert to thumbnail API if possible
  const fileId3 = url.match(/\/uc\?export=view&id=([A-Za-z0-9_-]{10,})/)?.[1];
  if (fileId3) {
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId3}&sz=w800-h600`;
    console.log("[gdrive.ts/getGoogleDriveDirectUrl] Matched /uc?export=view&id=: using thumbnail API", { original: url, fileId3, thumbnailUrl });
    return thumbnailUrl;
  }
  // If already a thumbnail API link, just return it
  if (url.includes("drive.google.com/thumbnail?id=")) {
    console.log("[gdrive.ts/getGoogleDriveDirectUrl] Already thumbnail:", url);
    return url;
  }
  // Fallback - no match
  console.log("[gdrive.ts/getGoogleDriveDirectUrl] No GDrive pattern matched:", url);
  return url;
}
