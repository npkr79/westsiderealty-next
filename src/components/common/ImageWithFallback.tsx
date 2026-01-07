"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";

type Props = Omit<ImageProps, "src" | "onError"> & {
  src?: ImageProps["src"] | null;
  fallbackSrc?: ImageProps["src"];
};

const DEFAULT_FALLBACK: ImageProps["src"] = "/agency_logo.png";

function isEmptySrc(src: Props["src"]) {
  return (
    src == null ||
    (typeof src === "string" && src.trim().length === 0)
  );
}

export default function ImageWithFallback({
  src,
  fallbackSrc,
  alt,
  ...props
}: Props) {
  const fallback = fallbackSrc ?? DEFAULT_FALLBACK;

  const initialSrc = React.useMemo(() => {
    return isEmptySrc(src) ? fallback : (src as ImageProps["src"]);
  }, [src, fallback]);

  const [currentSrc, setCurrentSrc] = React.useState(initialSrc);
  const [didFallback, setDidFallback] = React.useState(false);

  // If parent updates src (e.g., data arrives later), reset the state
  React.useEffect(() => {
    setCurrentSrc(initialSrc);
    setDidFallback(isEmptySrc(src)); // if src missing, we already "fell back"
  }, [initialSrc, src]);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={() => {
        // Prevent infinite loop if fallback fails
        if (didFallback) return;
        setDidFallback(true);
        setCurrentSrc(fallback);
      }}
    />
  );
}
