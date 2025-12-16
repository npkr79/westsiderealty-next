"use client";

import { useState } from "react";

interface ImageLightboxProps {
  images: string[];
}

export default function ImageLightbox({ images }: ImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const openAt = (index: number) => {
    setActiveIndex(index);
    setOpen(true);
  };

  return (
    <>
      <div className="grid gap-2 md:grid-cols-3">
        {images.slice(0, 3).map((src, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => openAt(idx)}
            className="overflow-hidden rounded-lg border border-border"
          >
            <img
              src={src}
              alt={`Gallery image ${idx + 1}`}
              className="h-40 w-full object-cover transition-transform duration-200 hover:scale-105"
            />
          </button>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setOpen(false)}
          />
          <div className="relative max-h-[90vh] max-w-5xl">
            <img
              src={images[activeIndex]}
              alt={`Gallery image ${activeIndex + 1}`}
              className="max-h-[90vh] max-w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}


