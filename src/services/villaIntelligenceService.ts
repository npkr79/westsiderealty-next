import { createClient } from "@/lib/supabase/server";

export const villaIntelligenceService = {
  async getProfileBySlug(city: string, slug: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("villa_intelligence_profiles")
      .select("*")
      .eq("city_slug", city.toLowerCase())
      .eq("url_slug", slug.toLowerCase())
      .maybeSingle();

    if (error) {
      const errorMessage =
        (error as any)?.message ??
        (error as any)?.details ??
        JSON.stringify(error);
      console.error("[WVIE] fetch error:", errorMessage);
      return null;
    }

    return data ?? null;
  },
  async getProfileByProjectId(reraProjectId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("villa_intelligence_profiles")
      .select("*")
      .eq("rera_project_id", reraProjectId)
      .maybeSingle();

    if (error) {
      const errorMessage =
        (error as any)?.message ??
        (error as any)?.details ??
        JSON.stringify(error);
      console.error("[WVIE] fetch error:", errorMessage);
      return null;
    }

    return data ?? null;
  },
};
