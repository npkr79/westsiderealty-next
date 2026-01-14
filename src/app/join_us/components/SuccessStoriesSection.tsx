"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Quote, TrendingUp } from "lucide-react";
import Image from "next/image";

interface SuccessStory {
  name: string;
  photo_url?: string | null;
  testimonial: string;
  metrics?: {
    earnings?: string;
    deals?: string;
    years?: string;
  };
}

interface SuccessStoriesSectionProps {
  title: string;
  subtitle?: string | null;
  stories: SuccessStory[];
}

export function SuccessStoriesSection({
  title,
  subtitle,
  stories,
}: SuccessStoriesSectionProps) {
  if (stories.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories && Array.isArray(stories) && stories.length > 0 ? (
            stories.map((story, index) => {
              // Validate story structure
              if (!story || typeof story !== 'object') {
                return null;
              }
              
              const name = typeof story.name === 'string' ? story.name : 'Anonymous';
              const testimonial = typeof story.testimonial === 'string' ? story.testimonial : '';
              const photoUrl = typeof story.photo_url === 'string' ? story.photo_url : null;
              const metrics = story.metrics && typeof story.metrics === 'object' ? story.metrics : {};
              
              return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  {story.photo_url ? (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={story.photo_url}
                        alt={story.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-primary">
                        {story.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{story.name}</h3>
                    {story.metrics && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {story.metrics.earnings && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            {story.metrics.earnings}
                          </span>
                        )}
                        {story.metrics.deals && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {story.metrics.deals}
                          </span>
                        )}
                        {story.metrics.years && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {story.metrics.years}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <Quote className="absolute -top-2 -left-2 h-8 w-8 text-primary/20" />
                  <p className="text-muted-foreground leading-relaxed pl-6">
                    {story.testimonial}
                  </p>
                </div>
              </CardContent>
            </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center text-muted-foreground py-8">
              No success stories available.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
