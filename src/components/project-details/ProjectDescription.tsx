"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ProjectDescriptionProps {
  htmlContent?: string | null;
  maxLength?: number; // Approximate character length before truncating
}

export default function ProjectDescription({ htmlContent, maxLength = 1000 }: ProjectDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!htmlContent) return null;

  // Simple check: if content is longer than maxLength characters, allow collapse
  const shouldTruncate = htmlContent.length > maxLength;
  const displayContent = isExpanded || !shouldTruncate ? htmlContent : htmlContent.substring(0, maxLength) + "...";

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">About This Project</h2>
      <div
        className={`prose prose-lg max-w-none rich-content ${
          !isExpanded && shouldTruncate ? "line-clamp-6" : ""
        }`}
        dangerouslySetInnerHTML={{ __html: displayContent }}
      />
      {shouldTruncate && (
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full sm:w-auto"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Read Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Read More
            </>
          )}
        </Button>
      )}
    </div>
  );
}
