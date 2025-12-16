import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Images, ShieldCheck } from "lucide-react";
import ImageLightbox from "@/components/landing/ImageLightbox";

interface ProjectHeroGalleryProps {
  images: string[];
  projectName: string;
  status?: string;
  reraId?: string;
}

export default function ProjectHeroGallery({ images, projectName, status, reraId }: ProjectHeroGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  const displayImages = images.length > 0 ? images.slice(0, 3) : [
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400"
  ];

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'ready':
      case 'ready to move':
        return 'bg-green-600';
      case 'under construction':
        return 'bg-amber-500';
      case 'upcoming':
        return 'bg-blue-600';
      default:
        return 'bg-primary';
    }
  };

  const openLightbox = (index: number) => {
    setInitialIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="relative w-full h-[50vh] md:h-[70vh] bg-muted overflow-hidden">
        {/* Main Full Width Image */}
        <button
          onClick={() => openLightbox(0)}
          className="relative w-full h-full group"
        >
          <img
            src={displayImages[0]}
            alt={projectName}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Bottom Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Project Info Overlay - Bottom Left */}
          <div className="absolute bottom-8 left-8 text-white z-10">
            <h1 className="text-3xl md:text-5xl font-bold mb-2">{projectName}</h1>
          </div>
        </button>

        {/* Status Badge - Top Left with Glass Effect */}
        {status && (
          <Badge className={`absolute top-6 left-6 ${getStatusColor(status)} backdrop-blur-md bg-white/20 text-white px-4 py-2 text-sm font-semibold shadow-lg`}>
            {status}
          </Badge>
        )}

        {/* RERA Verified Badge - Top Left Below Status */}
        {reraId && (
          <Badge className="absolute top-20 left-6 bg-green-600/90 backdrop-blur-md text-white px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-lg">
            <ShieldCheck className="w-4 h-4" />
            RERA Verified
          </Badge>
        )}

        {/* View All Photos Button */}
        <Button
          onClick={() => openLightbox(0)}
          variant="secondary"
          className="absolute bottom-8 right-8 bg-white/90 hover:bg-white backdrop-blur-sm shadow-lg"
        >
          <Images className="h-4 w-4 mr-2" />
          View All {images.length} Photos
        </Button>
      </div>

      <ImageLightbox
        images={images.length > 0 ? images : displayImages}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        initialIndex={initialIndex}
      />
    </>
  );
}
