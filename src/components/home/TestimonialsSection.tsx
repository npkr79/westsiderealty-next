"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabaseTestimonialClientService } from "@/services/admin/supabaseTestimonialClientService";

interface Testimonial {
  id: string;
  name: string;
  location?: string | null;
  message: string;
}

interface TestimonialsSectionProps {
  testimonials?: any[];
}

export default function TestimonialsSection({ testimonials: propTestimonials }: TestimonialsSectionProps = {}) {
  const [internalTestimonials, setInternalTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    if (propTestimonials && propTestimonials.length > 0) {
      setInternalTestimonials(propTestimonials as any);
    } else {
      const load = async () => {
        try {
          const data = await supabaseTestimonialClientService.getTestimonials(true);
          setInternalTestimonials(data as any);
        } catch (error) {
          console.error("Error loading testimonials:", error);
          setInternalTestimonials([]);
        }
      };
      load();
    }
  }, [propTestimonials]);

  const displayTestimonials = propTestimonials && propTestimonials.length > 0 ? propTestimonials : internalTestimonials;

  if (!displayTestimonials || displayTestimonials.length === 0) return null;

  return (
    <section className="py-10 bg-background">
      <div className="container mx-auto max-w-5xl px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">What Our Clients Say</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {displayTestimonials.slice(0, 3).map((t: any) => {
            // Handle both 'message' and 'text' fields from different services
            const testimonialText = t.message || t.text || "";
            return (
              <Card key={t.id || Math.random()}>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-3">"{testimonialText}"</p>
                  <p className="font-semibold text-sm">{t.name || "Client"}</p>
                  {t.location && (
                    <p className="text-xs text-muted-foreground">{t.location}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}


