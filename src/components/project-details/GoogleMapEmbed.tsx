"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface GoogleMapEmbedProps {
  embedUrl?: string | null;
}

export default function GoogleMapEmbed({ embedUrl }: GoogleMapEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);

  if (!embedUrl) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setIsLoading(false)}
            className="absolute inset-0"
          />
        </div>
      </CardContent>
    </Card>
  );
}
