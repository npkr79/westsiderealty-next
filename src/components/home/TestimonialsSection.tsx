"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Quote } from "lucide-react";
import { supabaseTestimonialClientService } from "@/services/admin/supabaseTestimonialClientService";

interface Testimonial {
  id: string;
  name: string;
  location?: string | null;
  message?: string;
  text?: string;
  rating?: number;
}

interface TestimonialsSectionProps {
  testimonials?: any[];
}

export default function TestimonialsSection({ testimonials: propTestimonials }: TestimonialsSectionProps = {}) {
  const [internalTestimonials, setInternalTestimonials] = useState<Testimonial[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If testimonials are provided as props (from server), use them immediately - no useEffect needed
  // This ensures testimonials are in the initial HTML for SEO
  // Only fetch client-side if no props provided (fallback for pages that don't pass props)
  useEffect(() => {
    // Only fetch if no server-provided testimonials
    if (!propTestimonials || propTestimonials.length === 0) {
      const load = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await supabaseTestimonialClientService.getTestimonials(true);
          if (data && Array.isArray(data) && data.length > 0) {
            setInternalTestimonials(data as any);
          } else {
            setInternalTestimonials([]);
            setError("No testimonials available");
          }
        } catch (error) {
          console.error("Error loading testimonials:", error);
          setError("Failed to load testimonials");
          setInternalTestimonials([]);
        } finally {
          setLoading(false);
        }
      };
      load();
    } else {
      setLoading(false);
    }
  }, [propTestimonials]);

  // Prioritize server-provided testimonials for SEO (rendered in initial HTML)
  // These are available immediately without waiting for useEffect
  const displayTestimonials = (propTestimonials && propTestimonials.length > 0) ? propTestimonials : internalTestimonials;

  // Show loading state
  if (loading && (!displayTestimonials || displayTestimonials.length === 0)) {
    return (
      <section className="py-20 px-4 relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              What Our Clients Say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 lg:p-8">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Show error state
  if (error && (!displayTestimonials || displayTestimonials.length === 0)) {
    return null; // Don't show error, just hide section
  }

  if (!displayTestimonials || displayTestimonials.length === 0) return null;

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            What Our Clients Say
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Real stories from satisfied clients across Hyderabad, Goa, and Dubai
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {displayTestimonials.slice(0, 6).map((t: any, index: number) => {
            const testimonialText = t.message || t.text || "";
            const rating = t.rating || 5;
            const name = t.name || "Client";
            const location = t.location || null;

            return (
              <Card
                key={t.id || index}
                className="group relative overflow-hidden border-l-4 border-l-primary/50 bg-background/80 backdrop-blur-sm shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient accent stripe */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary/50"></div>

                {/* Decorative quote icon */}
                <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Quote className="h-16 w-16 text-primary" />
                </div>

                <CardContent className="p-6 lg:p-8 relative z-10">
                  {/* Star Rating */}
                  {rating && (
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < rating
                              ? "fill-amber-400 text-amber-400"
                              : "fill-muted text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Testimonial Text */}
                  <blockquote className="mb-6">
                    <p className="text-base lg:text-lg text-foreground leading-relaxed font-serif italic relative pl-6">
                      <span className="absolute left-0 top-0 text-4xl text-primary/30 font-serif leading-none">
                        "
                      </span>
                      {testimonialText}
                    </p>
                  </blockquote>

                  {/* Author Info */}
                  <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/30">
                        <span className="text-sm font-bold text-primary">
                          {getInitials(name)}
                        </span>
                      </div>
                    </div>

                    {/* Name and Location */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm lg:text-base text-foreground truncate">
                        {name}
                      </p>
                      {location && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <p className="text-xs lg:text-sm text-muted-foreground truncate">
                            {location}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-all duration-300 pointer-events-none"></div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}


