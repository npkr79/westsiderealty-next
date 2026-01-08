"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";

type Props = Omit<ImageProps, "src" | "onError"> & {
  src?: ImageProps["src"] | null;
  fallbackSrc?: ImageProps["src"];
  unoptimized?: boolean;
};

const DEFAULT_FALLBACK: ImageProps["src"] = "/agency_logo.png";

function isEmptySrc(src: Props["src"]): boolean {
  if (src == null) return true;
  if (typeof src !== "string") return false;
  const s = src.trim().toLowerCase();
  return s.length === 0 || s === "null" || s === "undefined";
}

function srcKey(src: ImageProps["src"]): string {
  if (typeof src === "string") return src;
  if (src == null) return "fallback";
  // Handle StaticImport or StaticRequire
  if (typeof src === "object" && "src" in src) {
    return typeof src.src === "string" ? src.src : "fallback";
  }
  return "fallback";
}

export default function ImageWithFallback({
  src,
  fallbackSrc,
  alt,
  unoptimized,
  ...props
}: Props) {
  const fallback = fallbackSrc ?? DEFAULT_FALLBACK;

  const initialSrc = React.useMemo(() => {
    return isEmptySrc(src) ? fallback : (src as ImageProps["src"]);
  }, [src, fallback]);

  const [currentSrc, setCurrentSrc] = React.useState(initialSrc);
  const [didFallback, setDidFallback] = React.useState(isEmptySrc(src));

  React.useEffect(() => {
    setCurrentSrc(initialSrc);
    setDidFallback(isEmptySrc(src));
  }, [initialSrc, src]);

  const showingFallback = srcKey(currentSrc) === srcKey(fallback);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      unoptimized={unoptimized}
      onError={() => {
        console.warn("[ImageWithFallback] image failed -> fallback", {
          failed: srcKey(currentSrc),
          fallback: srcKey(fallback),
        });
        if (didFallback) return;
        setDidFallback(true);
        setCurrentSrc(fallback);
      }}
    />
  );
}
