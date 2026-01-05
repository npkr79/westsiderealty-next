import { createClient } from "@/lib/supabase/client";

export interface HeroBannerOffer {
  id: string;
  title: string;
  offer_headline?: string | null;
  rera_number?: string | null;
  rera_link?: string | null;
  location_text?: string | null;
  location_highlight?: string | null;
  configurations?: Array<{
    bhk?: string;
    sqft?: string;
    sqm?: string;
    price?: string;
    location?: string;
  }> | null;
  cta_text?: string | null;
  cta_link: string;
  background_image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Client-side service for fetching hero banner offers
 */
export const heroBannerService = {
  /**
   * Fetch active hero banner offers ordered by display_order (max 3)
   */
  async getActiveOffers(): Promise<HeroBannerOffer[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("hero_banner_offers")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(3);

    if (error) {
      console.error("Error fetching hero banner offers:", error);
      return [];
    }

    return (data || []) as HeroBannerOffer[];
  },
};

/**
 * Server-side service for fetching hero banner offers
 * Use this in server components
 */
export async function getHeroBannerOffersServer(): Promise<HeroBannerOffer[]> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("hero_banner_offers")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .limit(3);

  if (error) {
    console.error("Error fetching hero banner offers:", error);
    return [];
  }

  return (data || []) as HeroBannerOffer[];
}
