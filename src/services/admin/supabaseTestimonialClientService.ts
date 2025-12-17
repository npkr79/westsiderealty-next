import { createClient } from '@/lib/supabase/client';

// Client-side Supabase Testimonial Service

export interface SupabaseTestimonial {
  id: string;
  name: string;
  location: string | null;
  text: string;
  rating: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

class SupabaseTestimonialClientService {
  async getTestimonials(publishedOnly = true): Promise<SupabaseTestimonial[]> {
    const supabase = createClient();
    const query = supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (publishedOnly) {
      query.eq("status", "published");
    }
    
    const { data, error } = await query;
    if (error) {
      console.error("Error fetching testimonials:", error);
      return [];
    }
    return data || [];
  }
}

export const supabaseTestimonialClientService = new SupabaseTestimonialClientService();

