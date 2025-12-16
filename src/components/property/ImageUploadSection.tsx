"use client";

import { useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export interface SimpleUploadedImage {
  url: string;
  name?: string;
}

interface ImageUploadSectionProps {
  uploadedImages: SimpleUploadedImage[] | any[];
  setUploadedImages: (images: SimpleUploadedImage[] | any[]) => void;
  existingImages?: string[];
  onExistingImageRemove?: (url: string) => void;
  onCoverImageChange?: (url: string) => void;
  coverImage?: string;
  isEditMode?: boolean;
}

export default function ImageUploadSection({
  uploadedImages,
  setUploadedImages,
  existingImages = [],
  onExistingImageRemove,
  onCoverImageChange,
  coverImage,
  isEditMode,
}: ImageUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const newImages: SimpleUploadedImage[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      newImages.push({ url, name: file.name });
    });
    // Normalize uploadedImages to SimpleUploadedImage format
    const normalized = uploadedImages.map((img: any) => 
      img.url ? { url: img.url, name: img.name } : img
    );
    setUploadedImages([...normalized, ...newImages]);
  };

  const handleRemoveExisting = (url: string) => {
    onExistingImageRemove?.(url);
  };

  const handleRemoveUploaded = (url: string) => {
    // Normalize and filter
    const normalized = uploadedImages.map((img: any) => 
      img.url ? { url: img.url, name: img.name } : img
    );
    setUploadedImages(normalized.filter((img: any) => {
      const imgUrl = img.url || img.preview || img.id;
      return imgUrl !== url;
    }));
  };

  const allExisting = existingImages || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Property Photos</h3>
          <p className="text-xs text-muted-foreground">
            Upload high-quality images. The first image will be used as the cover unless you select a different one.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload Images
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {allExisting.map((url) => (
          <div key={url} className="relative group rounded-md border border-border overflow-hidden">
            <Image
              src={url || "/placeholder.svg"}
              alt="Existing property image"
              width={320}
              height={240}
              className="h-32 w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-between bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onCoverImageChange?.(url)}
              >
                {coverImage === url ? "Cover" : "Set Cover"}
              </Button>
              {isEditMode && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemoveExisting(url)}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}

        {uploadedImages.map((img) => (
          <div key={img.url} className="relative group rounded-md border border-border overflow-hidden">
            <Image
              src={img.url || "/placeholder.svg"}
              alt={img.name || "Uploaded property image"}
              width={320}
              height={240}
              className="h-32 w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-end bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1">
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => handleRemoveUploaded(img.url)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


