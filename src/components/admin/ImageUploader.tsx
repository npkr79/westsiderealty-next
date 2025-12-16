"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  label?: string;
  onChange?: (file: File | null) => void;
}

export function ImageUploader({ label = "Upload Image", onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-2">
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
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          onChange?.(file);
        }}
      />
    </div>
  );
}


