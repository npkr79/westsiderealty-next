import { createClient } from "@/lib/supabase/client";
import { createServiceClient } from "@/lib/supabase/serviceClient";

// Flexible interface that works with whatever columns exist in homepage_banners table
export interface HeroBannerOffer {
  id: string;
  title?: string;
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
  cta_link?: string;
  background_image_url?: string;
  image_url?: string; // Desktop image
  hero_banner_mobile_url?: string | null; // Mobile image
  display_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  // Allow any other fields that might exist in the table
  [key: string]: any;
}

/**
 * Client-side service for fetching hero banner offers
 */
export const heroBannerService = {
  /**
   * Fetch all active hero banner offers ordered by display_order
   * Returns all rows where is_active = true (no limit)
   */
  async getActiveOffers(): Promise<HeroBannerOffer[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("homepage_banners")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

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
  
  // Try with is_active and display_order first (most common case)
  let query = supabase
    .from("homepage_banners")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  let { data, error } = await query;

  // If error is about missing column, try without filters/ordering
  if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
    console.log("[getHeroBannerOffersServer] Column error, retrying without is_active/display_order filters...");
    const retryQuery = supabase
      .from("homepage_banners")
      .select("*");
    
    const retryResult = await retryQuery;
    if (retryResult.error) {
      console.error("[getHeroBannerOffersServer] Retry error:", retryResult.error);
      return [];
    }
    
    data = retryResult.data;
    error = null;
  }

  if (error) {
    if (error.code === "42501" || error.status === 403) {
      try {
        const serviceClient = createServiceClient();
        let serviceQuery = serviceClient
          .from("homepage_banners")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });
        let { data: serviceData, error: serviceError } = await serviceQuery;

        if (serviceError && (serviceError.code === "42703" || serviceError.message?.includes("does not exist"))) {
          console.log(
            "[getHeroBannerOffersServer] Service column error, retrying without is_active/display_order filters..."
          );
          const retryQuery = serviceClient.from("homepage_banners").select("*");
          const retryResult = await retryQuery;
          if (retryResult.error) {
            console.error("[getHeroBannerOffersServer] Service retry error:", retryResult.error);
            return [];
          }
          serviceData = retryResult.data;
          serviceError = null;
        }

        if (serviceError) {
          console.error("[getHeroBannerOffersServer] Service error:", serviceError);
          return [];
        }

        return (serviceData || []) as HeroBannerOffer[];
      } catch (serviceError) {
        console.error("[getHeroBannerOffersServer] Service client failure:", serviceError);
        return [];
      }
    }
    console.error("[getHeroBannerOffersServer] Error fetching hero banner offers:", error);
    return [];
  }

  console.log("[getHeroBannerOffersServer] Fetched banners:", data?.length || 0);
  if (data && data.length > 0) {
    console.log("[getHeroBannerOffersServer] Sample banner data:", JSON.stringify(data[0], null, 2));
  }

  return (data || []) as HeroBannerOffer[];
}
