"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";

type Props = Omit<ImageProps, "src" | "onError"> & {
  src?: ImageProps["src"] | null;
  fallbackSrc?: ImageProps["src"];
};

const DEFAULT_FALLBACK: ImageProps["src"] = "/agency_logo.png";

function isBadString(s: string) {
  const t = s.trim().toLowerCase();
  return t === "" || t === "null" || t === "undefined";
}

function isValidRemoteUrl(s: string) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * IMPORTANT: Next/Image can throw on invalid src strings (e.g. "https:///...")
 * so we sanitize BEFORE passing to <Image>.
 */
function sanitizeSrc(src: Props["src"]): Props["src"] {
  if (src == null) return null;

  if (typeof src !== "string") return src; // StaticImport etc.

  if (isBadString(src)) return null;

  // If it looks remote, ensure it's a valid absolute URL
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return isValidRemoteUrl(src) ? src : null;
  }

  // Allow local public paths like "/xyz.png"
  if (src.startsWith("/")) return src;

  // Anything else (relative like "images/a.png") treat as invalid
  return null;
}

export default function ImageWithFallback({
  src,
  fallbackSrc,
  alt,
  ...props
}: Props) {
  const fallback = fallbackSrc ?? DEFAULT_FALLBACK;
  const cleanSrc = React.useMemo(() => sanitizeSrc(src), [src]);

  const initialSrc = React.useMemo(() => {
    return cleanSrc == null ? fallback : cleanSrc;
  }, [cleanSrc, fallback]);

  const [currentSrc, setCurrentSrc] = React.useState(initialSrc);
  const [didFallback, setDidFallback] = React.useState(cleanSrc == null);

  React.useEffect(() => {
    setCurrentSrc(initialSrc);
    setDidFallback(cleanSrc == null);
  }, [initialSrc, cleanSrc]);

  const isUsingFallback = currentSrc === fallback;

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (didFallback) return; // prevent loops
        // TEMP debug – keep until verified on prod
        console.warn("[ImageWithFallback] falling back", { src, fallback });
        setDidFallback(true);
        setCurrentSrc(fallback);
      }}
    />
  );
}
