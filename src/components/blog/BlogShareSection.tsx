"use client";

import SocialShareButtons from "@/components/common/SocialShareButtons";
import PrintButton from "@/components/blog/PrintButton";

interface BlogShareSectionProps {
  url: string;
  title: string;
  description: string;
  hashtags: string[];
  date: string;
}

export default function BlogShareSection({
  url,
  title,
  description,
  hashtags,
  date,
}: BlogShareSectionProps) {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold mb-3 text-foreground">Share this article</h4>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <SocialShareButtons
          url={url}
          title={title}
          description={description}
          hashtags={hashtags}
        />
        
        <div className="flex gap-3 items-center">
          <PrintButton />
          <span className="text-xs text-muted-foreground hidden md:inline">
            {new Date(date).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

