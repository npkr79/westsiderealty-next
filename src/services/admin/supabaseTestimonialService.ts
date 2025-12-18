import { createClient } from '@/lib/supabase/server';

// Supabase Testimonial Service

export interface SupabaseTestimonial {
  id: string;
  name: string;
  location: string;
  text: string;
  rating: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

class SupabaseTestimonialService {
  async getTestimonials(publishedOnly = true): Promise<SupabaseTestimonial[]> {
    const supabase = await createClient();
    const query = supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });
    if (publishedOnly) {
      // Will already be filtered by RLS, but can double filter just in case
      query.eq("status", "published");
    }
    const { data, error } = await query;
    if (error) {
      console.error("Error fetching testimonials:", error);
      return [];
    }
    return data || [];
  }

  async addTestimonial(payload: Omit<SupabaseTestimonial, "id" | "status" | "created_at" | "updated_at">): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("testimonials")
      .insert([{ ...payload, status: "published" }]);
    if (error) {
      console.error("Error adding testimonial:", error);
      return false;
    }
    return true;
  }

  async updateTestimonial(id: string, payload: Partial<Omit<SupabaseTestimonial, "id" | "created_at" | "updated_at">>) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("testimonials")
      .update({ ...payload })
      .eq("id", id);
    if (error) {
      console.error("Error updating testimonial:", error);
      return false;
    }
    return true;
  }

  async deleteTestimonial(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("testimonials")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Error deleting testimonial:", error);
      return false;
    }
    return true;
  }
}

export const supabaseTestimonialService = new SupabaseTestimonialService();
