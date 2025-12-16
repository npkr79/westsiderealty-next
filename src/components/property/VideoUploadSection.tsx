"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface VideoUploadSectionProps {
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
}

export function VideoUploadSection({ videoUrl, onVideoUrlChange }: VideoUploadSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="video-url">Video URL (optional)</Label>
      <Input
        id="video-url"
        type="url"
        placeholder="https://youtube.com/..."
        value={videoUrl}
        onChange={(e) => onVideoUrlChange(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        Paste a YouTube, Vimeo, or hosted video URL to show a walkthrough/video tour on the property detail page.
      </p>
    </div>
  );
}


