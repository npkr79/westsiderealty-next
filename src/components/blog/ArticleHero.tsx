"use client";

import { Badge } from "@/components/ui/badge";

interface ArticleHeroProps {
  image?: string | null;
  title: string;
  category?: string;
  date?: string;
  excerpt?: string;
}

export default function ArticleHero({ title, category, date, image, excerpt }: ArticleHeroProps) {
  return (
    <section className="py-10 border-b border-border bg-background">
      <div className="container mx-auto max-w-3xl px-4 space-y-3">
        {category && (
          <Badge variant="outline" className="text-xs">
            {category}
          </Badge>
        )}
        <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
        {date && (
          <p className="text-xs text-muted-foreground">
            {new Date(date).toLocaleDateString()}
          </p>
        )}
      </div>
    </section>
  );
}


