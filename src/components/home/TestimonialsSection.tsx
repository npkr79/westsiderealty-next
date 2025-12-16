"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabaseTestimonialService } from "@/services/admin/supabaseTestimonialService";

interface Testimonial {
  id: string;
  name: string;
  location?: string | null;
  message: string;
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await supabaseTestimonialService.getTestimonials();
        setTestimonials(data as any);
      } catch {
        // swallow errors for now
      }
    };
    load();
  }, []);

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section className="py-10 bg-background">
      <div className="container mx-auto max-w-5xl px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">What Our Clients Say</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.slice(0, 3).map((t) => (
            <Card key={t.id}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-3">"{t.message}"</p>
                <p className="font-semibold text-sm">{t.name}</p>
                {t.location && (
                  <p className="text-xs text-muted-foreground">{t.location}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}


