
import { createClient } from '@/lib/supabase/server';

import { convertYouTubeToEmbed, convertGoogleMapsToEmbed } from '@/utils/urlConverters';
const supabase = await createClient();

export interface LandingPage {
  id: string;
  uri: string;
  title: string;
  headline: string;
  subheadline: string;
  rich_description: string;
  location_info: string;
  whatsapp_number: string;
  whatsapp_message: string;
  youtube_video_url?: string;
  show_google_map: boolean;
  google_map_url?: string;
  map_latitude?: number;
  map_longitude?: number;
  map_zoom?: number;
  map_type?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  hero_image_url?: string;
  hero_image_supabase_path?: string;
  status: string;
  seo_title?: string;
  seo_description?: string;
  seo_h1_override?: string;
  section_headings?: Record<string, string>;
  show_faq?: boolean;
  template_type?: string;
  cta_primary_text?: string;
  cta_secondary_text?: string;
  popup_form_title?: string;
  popup_form_description?: string;
  project_land_area?: string;
  project_total_towers?: string;
  project_total_floors?: string;
  project_total_flats?: string;
  project_flats_per_floor?: string;
  project_elevation_image_url?: string;
  project_elevation_supabase_path?: string;
  rera_number?: string;
  rera_link?: string;
  brochure_url?: string;
  created_at: string;
  updated_at: string;
}

export interface LandingPageImage {
  id: string;
  landing_page_id: string;
  image_url: string;
  alt_text?: string;
  display_order: number;
  supabase_storage_path?: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
  updated_at: string;
}

export interface LandingPageHighlight {
  id: string;
  landing_page_id: string;
  icon_name: string;
  title: string;
  subtitle?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface LandingPageFloorPlan {
  id: string;
  landing_page_id: string;
  plan_name: string;
  image_url: string;
  supabase_storage_path?: string;
  display_order: number;
  is_master_plan: boolean;
  created_at: string;
  updated_at: string;
}

export interface LandingPageConfiguration {
  id: string;
  landing_page_id: string;
  unit_type: string;
  size_min?: number;
  size_max?: number;
  starting_price?: number;
  price_display?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface LandingPageSpecification {
  id: string;
  landing_page_id: string;
  category: string;
  specification_key: string;
  specification_value: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface LandingPageLocationPoint {
  id: string;
  landing_page_id: string;
  landmark_name: string;
  landmark_type?: string;
  distance: string;
  description?: string;
  icon_name?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface LandingPageFAQ {
  id: string;
  landing_page_id: string;
  category: string;
  question: string;
  answer: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

class SupabaseLandingPagesService {
  async getAllLandingPages(): Promise<LandingPage[]> {
    try {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as LandingPage[];
    } catch (error) {
      console.error('Error loading landing pages:', error);
      return [];
    }
  }

  async getLandingPageByUri(uri: string): Promise<LandingPage | null> {
    try {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('uri', uri)
        .maybeSingle();

      if (error) throw error;
      return data as LandingPage | null;
    } catch (error) {
      console.error('Error loading landing page by URI:', error);
      return null;
    }
  }

  async getLandingPageById(id: string): Promise<LandingPage | null> {
    try {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as LandingPage | null;
    } catch (error) {
      console.error('Error loading landing page by ID:', error);
      return null;
    }
  }

  async saveLandingPage(landingPage: Partial<LandingPage>): Promise<LandingPage> {
    try {
      // Ensure required fields are present
      if (!landingPage.headline || !landingPage.title || !landingPage.uri) {
        throw new Error('Missing required fields: headline, title, and uri are required');
      }

      // Prepare the data for upsert, excluding computed fields
      const { created_at, updated_at, ...pageData } = landingPage;
      
      // Create a properly typed object for upsert with proper defaults and validation
      const upsertData: any = {
        ...pageData,
        headline: pageData.headline!,
        title: pageData.title!,
        uri: pageData.uri!,
        subheadline: pageData.subheadline || '',
        rich_description: pageData.rich_description || '',
        location_info: pageData.location_info || '',
        whatsapp_number: pageData.whatsapp_number || '919866085831',
        whatsapp_message: pageData.whatsapp_message || 'Hi, I\'m interested in this property listed on your site. Please share more details.',
        show_google_map: pageData.show_google_map ?? true,
        status: pageData.status || 'draft'
      };

      // Remove or fix fields that violate CHECK constraints
      // Ensure map_type is valid or null
      if (upsertData.map_type && !['roadmap', 'satellite', 'hybrid', 'terrain'].includes(upsertData.map_type)) {
        delete upsertData.map_type;
      }

      // Ensure hero_media_type is valid or null
      if (upsertData.hero_media_type && !['image', 'video'].includes(upsertData.hero_media_type)) {
        delete upsertData.hero_media_type;
      }

      // Ensure hero_text_display_mode is valid or null
      if (upsertData.hero_text_display_mode && 
          !['persistent', 'fade-out', 'bottom-left', 'smart-auto-hide', 'scroll-trigger'].includes(upsertData.hero_text_display_mode)) {
        delete upsertData.hero_text_display_mode;
      }
      
      let data;
      let error;

      // If we have an ID, it's an update; otherwise, it's an insert
      if (landingPage.id) {
        console.log('Updating existing landing page with ID:', landingPage.id);
        // UPDATE existing landing page - remove id from update data (it should only be in WHERE clause)
        const { id: _id, ...updateData } = upsertData;
        const result = await supabase
          .from('landing_pages')
          .update(updateData)
          .eq('id', landingPage.id)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      } else {
        console.log('Inserting new landing page');
        // INSERT new landing page (remove id from data if it exists)
        const { id, ...insertData } = upsertData;
        const result = await supabase
          .from('landing_pages')
          .insert(insertData)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Detailed Supabase error:', error);
        throw error;
      }
      return data as LandingPage;
    } catch (error) {
      console.error('Error saving landing page:', error);
      throw error;
    }
  }

  async deleteLandingPage(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('landing_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting landing page:', error);
      throw error;
    }
  }

  // Image management methods
  async getLandingPageImages(landingPageId: string): Promise<LandingPageImage[]> {
    try {
      const { data, error } = await supabase
        .from('landing_page_images')
        .select('*')
        .eq('landing_page_id', landingPageId)
        .order('display_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading landing page images:', error);
      return [];
    }
  }

  async updateImageOrder(imageId: string, newOrder: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('landing_page_images')
        .update({ display_order: newOrder })
        .eq('id', imageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating image order:', error);
      throw error;
    }
  }

  async uploadHeroImage(file: File, landingPageId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-${landingPageId}-${Date.now()}.${fileExt}`;
      const filePath = `hero/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('landing-pages')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('landing-pages')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading hero image:', error);
      throw error;
    }
  }

  async uploadGalleryImage(file: File, landingPageId: string, altText?: string): Promise<void> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `gallery-${landingPageId}-${Date.now()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('landing-pages')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('landing-pages')
        .getPublicUrl(filePath);

      const images = await this.getLandingPageImages(landingPageId);
      const newOrder = Math.max(0, ...images.map(img => img.display_order)) + 1;

      const { error: insertError } = await supabase
        .from('landing_page_images')
        .insert({
          landing_page_id: landingPageId,
          image_url: data.publicUrl,
          supabase_storage_path: filePath,
          alt_text: altText || `Landing page image ${newOrder}`,
          display_order: newOrder,
          file_size: file.size,
          mime_type: file.type
        });

      if (insertError) throw insertError;
    } catch (error) {
      console.error('Error uploading gallery image:', error);
      throw error;
    }
  }

  async removeImage(imageId: string): Promise<void> {
    try {
      const { data: image, error: fetchError } = await supabase
        .from('landing_page_images')
        .select('supabase_storage_path')
        .eq('id', imageId)
        .single();

      if (fetchError) throw fetchError;

      if (image?.supabase_storage_path) {
        await supabase.storage
          .from('landing-pages')
          .remove([image.supabase_storage_path]);
      }

      const { error: deleteError } = await supabase
        .from('landing_page_images')
        .delete()
        .eq('id', imageId);

      if (deleteError) throw deleteError;
    } catch (error) {
      console.error('Error removing image:', error);
      throw error;
    }
  }

  // Property highlights management methods
  async getLandingPageHighlights(landingPageId: string): Promise<LandingPageHighlight[]> {
    try {
      const { data, error } = await supabase
        .from('landing_page_highlights')
        .select('*')
        .eq('landing_page_id', landingPageId)
        .order('display_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading landing page highlights:', error);
      return [];
    }
  }

  async saveHighlights(landingPageId: string, highlights: Omit<LandingPageHighlight, 'id' | 'landing_page_id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    try {
      // Delete existing highlights
      await supabase
        .from('landing_page_highlights')
        .delete()
        .eq('landing_page_id', landingPageId);

      // Insert new highlights
      if (highlights.length > 0) {
        const { error } = await supabase
          .from('landing_page_highlights')
          .insert(
            highlights.map((highlight, index) => ({
              landing_page_id: landingPageId,
              icon_name: highlight.icon_name,
              title: highlight.title,
              subtitle: highlight.subtitle,
              display_order: index
            }))
          );

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving highlights:', error);
      throw error;
    }
  }

  async updateHighlightOrder(highlightId: string, newOrder: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('landing_page_highlights')
        .update({ display_order: newOrder })
        .eq('id', highlightId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating highlight order:', error);
      throw error;
    }
  }

  // Floor Plans management methods
  async getFloorPlans(landingPageId: string): Promise<LandingPageFloorPlan[]> {
    try {
      const { data, error } = await supabase
        .from('landing_page_floor_plans')
        .select('*')
        .eq('landing_page_id', landingPageId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading floor plans:', error);
      return [];
    }
  }

  async saveFloorPlans(
    landingPageId: string,
    floorPlans: Partial<LandingPageFloorPlan>[]
  ): Promise<void> {
    try {
      // Delete existing floor plans
      const { error: deleteError } = await supabase
        .from('landing_page_floor_plans')
        .delete()
        .eq('landing_page_id', landingPageId);

      if (deleteError) throw deleteError;

      // Insert new floor plans (only those with required fields)
      const validPlans = floorPlans.filter(plan => plan.plan_name && plan.image_url);
      
      if (validPlans.length > 0) {
        const plansToInsert = validPlans.map((plan, index) => ({
          landing_page_id: landingPageId,
          plan_name: plan.plan_name!,
          image_url: plan.image_url!,
          supabase_storage_path: plan.supabase_storage_path,
          display_order: index,
          is_master_plan: plan.is_master_plan || false
        }));

        const { error: insertError } = await supabase
          .from('landing_page_floor_plans')
          .insert(plansToInsert);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error saving floor plans:', error);
      throw error;
    }
  }

  async uploadFloorPlanImage(file: File, landingPageId: string): Promise<{ url: string; path: string }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `floor-plan-${landingPageId}-${Date.now()}.${fileExt}`;
      const filePath = `floor-plans/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('landing-pages')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('landing-pages')
        .getPublicUrl(filePath);

      return { url: data.publicUrl, path: filePath };
    } catch (error) {
      console.error('Error uploading floor plan image:', error);
      throw error;
    }
  }

  async uploadProjectElevationImage(file: File, landingPageId: string): Promise<{ url: string; path: string }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `project-elevation-${landingPageId}-${Date.now()}.${fileExt}`;
      const filePath = `project-elevation/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('landing-pages')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('landing-pages')
        .getPublicUrl(filePath);

      return { url: data.publicUrl, path: filePath };
    } catch (error) {
      console.error('Error uploading project elevation image:', error);
      throw error;
    }
  }

  convertYouTubeUrl(url: string): string {
    return convertYouTubeToEmbed(url);
  }

  convertGoogleMapsUrl(url: string): string {
    return convertGoogleMapsToEmbed(url);
  }

  // Configurations management methods
  async getConfigurations(landingPageId: string): Promise<LandingPageConfiguration[]> {
    try {
      const { data, error } = await supabase
        .from('landing_page_configurations')
        .select('*')
        .eq('landing_page_id', landingPageId)
        .order('display_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading configurations:', error);
      return [];
    }
  }

  async saveConfigurations(
    landingPageId: string,
    configurations: Omit<LandingPageConfiguration, 'id' | 'landing_page_id' | 'created_at' | 'updated_at'>[]
  ): Promise<void> {
    try {
      // Delete existing configurations
      await supabase
        .from('landing_page_configurations')
        .delete()
        .eq('landing_page_id', landingPageId);

      // Insert new configurations
      if (configurations.length > 0) {
        const { error } = await supabase
          .from('landing_page_configurations')
          .insert(
            configurations.map((config, index) => ({
              landing_page_id: landingPageId,
              unit_type: config.unit_type,
              size_min: config.size_min,
              size_max: config.size_max,
              starting_price: config.starting_price,
              price_display: config.price_display,
              display_order: index
            }))
          );

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving configurations:', error);
      throw error;
    }
  }

  async deleteConfiguration(configurationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('landing_page_configurations')
        .delete()
        .eq('id', configurationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting configuration:', error);
      throw error;
    }
  }

  // Specifications management methods
  async getSpecifications(landingPageId: string): Promise<LandingPageSpecification[]> {
    try {
      const { data, error } = await supabase
        .from('landing_page_specifications')
        .select('*')
        .eq('landing_page_id', landingPageId)
        .order('category')
        .order('display_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading specifications:', error);
      return [];
    }
  }

  async saveSpecifications(
    landingPageId: string,
    specifications: Omit<LandingPageSpecification, 'id' | 'landing_page_id' | 'created_at' | 'updated_at'>[]
  ): Promise<void> {
    try {
      // Delete existing specifications
      await supabase
        .from('landing_page_specifications')
        .delete()
        .eq('landing_page_id', landingPageId);

      // Insert new specifications
      if (specifications.length > 0) {
        const { error } = await supabase
          .from('landing_page_specifications')
          .insert(
            specifications.map((spec, index) => ({
              landing_page_id: landingPageId,
              category: spec.category,
              specification_key: spec.specification_key,
              specification_value: spec.specification_value,
              display_order: index
            }))
          );

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving specifications:', error);
      throw error;
    }
  }

  async deleteSpecification(specificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('landing_page_specifications')
        .delete()
        .eq('id', specificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting specification:', error);
      throw error;
    }
  }

  // Location Points management methods
  async getLocationPoints(landingPageId: string): Promise<LandingPageLocationPoint[]> {
    try {
      const { data, error } = await supabase
        .from('landing_page_location_points')
        .select('*')
        .eq('landing_page_id', landingPageId)
        .order('display_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading location points:', error);
      return [];
    }
  }

  async saveLocationPoints(
    landingPageId: string,
    locationPoints: Omit<LandingPageLocationPoint, 'id' | 'landing_page_id' | 'created_at' | 'updated_at'>[]
  ): Promise<void> {
    try {
      // Delete existing location points
      await supabase
        .from('landing_page_location_points')
        .delete()
        .eq('landing_page_id', landingPageId);

      // Insert new location points
      if (locationPoints.length > 0) {
        const { error } = await supabase
          .from('landing_page_location_points')
          .insert(
            locationPoints.map((point, index) => ({
              landing_page_id: landingPageId,
              landmark_name: point.landmark_name,
              landmark_type: point.landmark_type,
              distance: point.distance,
              description: point.description,
              icon_name: point.icon_name,
              display_order: index
            }))
          );

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving location points:', error);
      throw error;
    }
  }

  async deleteLocationPoint(locationPointId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('landing_page_location_points')
        .delete()
        .eq('id', locationPointId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting location point:', error);
      throw error;
    }
  }

  // FAQ management methods
  async getFAQs(landingPageId: string): Promise<LandingPageFAQ[]> {
    try {
      const { data, error } = await supabase
        .from('landing_page_faqs' as any)
        .select('*')
        .eq('landing_page_id', landingPageId)
        .order('display_order');

      if (error) throw error;
      return (data || []) as unknown as LandingPageFAQ[];
    } catch (error) {
      console.error('Error loading FAQs:', error);
      return [];
    }
  }

  async saveFAQs(
    landingPageId: string,
    faqs: Omit<LandingPageFAQ, 'id' | 'landing_page_id' | 'created_at' | 'updated_at'>[]
  ): Promise<void> {
    try {
      // Delete existing FAQs
      await supabase
        .from('landing_page_faqs' as any)
        .delete()
        .eq('landing_page_id', landingPageId);

      // Insert new FAQs
      if (faqs.length > 0) {
        const { error } = await supabase
          .from('landing_page_faqs' as any)
          .insert(
            faqs.map((faq, index) => ({
              landing_page_id: landingPageId,
              category: faq.category,
              question: faq.question,
              answer: faq.answer,
              display_order: index
            })) as any
          );

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving FAQs:', error);
      throw error;
    }
  }

  async deleteFAQ(faqId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('landing_page_faqs' as any)
        .delete()
        .eq('id', faqId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      throw error;
    }
  }
}

export const supabaseLandingPagesService = new SupabaseLandingPagesService();
