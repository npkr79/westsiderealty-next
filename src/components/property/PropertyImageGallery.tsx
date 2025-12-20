"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PropertyImageGalleryProps {
  images: string[];
  title: string;
}

export function PropertyImageGallery({ images, title }: PropertyImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Limit to max 10 images
  const displayImages = images.slice(0, 10);

  if (!displayImages || displayImages.length === 0) {
    return (
      <div className="relative w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground">No images available</span>
      </div>
    );
  }

  const scrollPrev = () => setSelectedIndex(prev => 
    prev === 0 ? displayImages.length - 1 : prev - 1
  );
  
  const scrollNext = () => setSelectedIndex(prev => 
    prev === displayImages.length - 1 ? 0 : prev + 1
  );

  return (
    <>
      {/* Main Image */}
      <div className="relative w-full h-96 md:h-[500px] rounded-lg overflow-hidden bg-gray-100 mb-4">
        <Image
          src={displayImages[selectedIndex] || "/placeholder.svg"}
          alt={`${title} - Image ${selectedIndex + 1}`}
          fill
          className="object-cover"
          priority
        />
        
        {/* Expand Button */}
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setLightboxOpen(true)}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white border-0"
        >
          <Expand className="w-4 h-4" />
        </Button>

        {/* Image Counter */}
        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {selectedIndex + 1} / {displayImages.length}
        </div>

        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              onClick={scrollPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={scrollNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnail Scroller */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {displayImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-20 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                idx === selectedIndex 
                  ? "border-primary scale-105" 
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={img || "/placeholder.svg"}
                alt={`Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-7xl w-full p-0 bg-black/95">
          <div className="relative w-full h-[90vh]">
            <Image
              src={displayImages[selectedIndex] || "/placeholder.svg"}
              alt={`${title} - Full size`}
              fill
              className="object-contain"
            />
            
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 text-white hover:bg-white/20"
            >
              ×
            </Button>

            {/* Navigation in Lightbox */}
            {displayImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={scrollPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={scrollNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}

            {/* Image Counter in Lightbox */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              {selectedIndex + 1} / {displayImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

