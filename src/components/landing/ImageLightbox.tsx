"use client";

import { useState, useEffect } from "react";

interface ImageLightboxProps {
  images: string[];
  isOpen?: boolean;
  onClose?: () => void;
  initialIndex?: number;
}

export default function ImageLightbox({ images, isOpen: controlledOpen, onClose, initialIndex = 0 }: ImageLightboxProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // Use controlled mode if isOpen is provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleClose = () => {
    if (controlledOpen !== undefined) {
      onClose?.();
    } else {
      setInternalOpen(false);
    }
  };

  // Update active index when initialIndex changes
  useEffect(() => {
    if (initialIndex !== undefined) {
      setActiveIndex(initialIndex);
    }
  }, [initialIndex]);

  if (!images || images.length === 0) return null;

  const openAt = (index: number) => {
    setActiveIndex(index);
    if (controlledOpen === undefined) {
      setInternalOpen(true);
    }
  };

  // If controlled mode, only show the lightbox overlay
  if (controlledOpen !== undefined) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <button
          type="button"
          className="absolute inset-0"
          onClick={handleClose}
        />
        <div className="relative max-h-[90vh] max-w-5xl">
          <img
            src={images[activeIndex]}
            alt={`Gallery image ${activeIndex + 1}`}
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
          />
        </div>
      </div>
    );
  }

  // Uncontrolled mode - show gallery grid and lightbox
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

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <button
            type="button"
            className="absolute inset-0"
            onClick={handleClose}
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


