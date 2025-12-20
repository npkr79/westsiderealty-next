"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') handleClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length]);

  // If controlled mode, only show the lightbox overlay
  if (controlledOpen !== undefined) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
        <button
          type="button"
          className="absolute inset-0"
          onClick={handleClose}
          aria-label="Close lightbox"
        />
        
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white"
          onClick={handleClose}
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Next image"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
            {activeIndex + 1} / {images.length}
          </div>
        )}

        <div className="relative max-h-[90vh] max-w-5xl z-10" onClick={(e) => e.stopPropagation()}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <button
            type="button"
            className="absolute inset-0"
            onClick={handleClose}
            aria-label="Close lightbox"
          />
          
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white"
            onClick={handleClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              {activeIndex + 1} / {images.length}
            </div>
          )}

          <div className="relative max-h-[90vh] max-w-5xl z-10" onClick={(e) => e.stopPropagation()}>
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
