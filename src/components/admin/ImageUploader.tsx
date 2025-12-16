"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ImageUploaderProps {
  label?: string;
  onChange?: (file: File | null | string) => void;
  value?: string | null;
  bucket?: string;
  aspectRatio?: string;
}

export function ImageUploader({ label = "Upload Image", onChange, value, bucket }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (onChange) {
      // If bucket is provided, we might want to upload and return URL
      // For now, just pass the file or URL string
      onChange(file);
    }
  };

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative h-32 w-32 rounded-lg border overflow-hidden">
          <Image
            src={value}
            alt="Preview"
            fill
            className="object-cover"
          />
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}


