import { createClient } from '@/lib/supabase/server';


import { ContentBlock, Amenity } from '@/types/landingPageTemplate';
const supabase = await createClient();

class SupabaseLandingPagesContentService {
  // Content Blocks Methods
  async getContentBlocks(landingPageId: string): Promise<ContentBlock[]> {
    try {
      const { data, error } = await supabase
        .from('landing_page_content_blocks')
        .select('*')
        .eq('landing_page_id', landingPageId)
        .order('display_order');

      if (error) throw error;
      return (data || []) as ContentBlock[];
    } catch (error) {
      console.error('Error loading content blocks:', error);
      return [];
    }
  }

  async saveContentBlocks(landingPageId: string, blocks: Partial<ContentBlock>[]): Promise<void> {
    try {
      // Delete existing content blocks
      await supabase
        .from('landing_page_content_blocks')
        .delete()
        .eq('landing_page_id', landingPageId);

      // Insert new content blocks
      if (blocks.length > 0) {
        const { error } = await supabase
          .from('landing_page_content_blocks')
          .insert(
            blocks.map((block, index) => ({
              landing_page_id: landingPageId,
              block_type: block.block_type,
              content: block.content,
              display_order: index,
              metadata: block.metadata || {}
            }))
          );

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving content blocks:', error);
      throw error;
    }
  }

  async deleteContentBlock(blockId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('landing_page_content_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting content block:', error);
      throw error;
    }
  }

  // Amenities Methods
  async getAmenities(landingPageId: string): Promise<Amenity[]> {
    try {
      const { data, error } = await supabase
        .from('landing_page_amenities')
        .select('*')
        .eq('landing_page_id', landingPageId)
        .order('display_order');

      if (error) throw error;
      return (data || []) as Amenity[];
    } catch (error) {
      console.error('Error loading amenities:', error);
      return [];
    }
  }

  async saveAmenities(landingPageId: string, amenities: Partial<Amenity>[]): Promise<void> {
    try {
      // Delete existing amenities
      await supabase
        .from('landing_page_amenities')
        .delete()
        .eq('landing_page_id', landingPageId);

      // Insert new amenities
      if (amenities.length > 0) {
        const { error } = await supabase
          .from('landing_page_amenities')
          .insert(
            amenities.map((amenity, index) => ({
              landing_page_id: landingPageId,
              title: amenity.title,
              description: amenity.description,
              image_url: amenity.image_url,
              supabase_storage_path: amenity.supabase_storage_path,
              display_order: index
            }))
          );

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving amenities:', error);
      throw error;
    }
  }

  async uploadAmenityImage(file: File, landingPageId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `amenity-${landingPageId}-${Date.now()}.${fileExt}`;
      const filePath = `amenities/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('landing-pages')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('landing-pages')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading amenity image:', error);
      throw error;
    }
  }

  async deleteAmenity(amenityId: string): Promise<void> {
    try {
      const { data: amenity, error: fetchError } = await supabase
        .from('landing_page_amenities')
        .select('supabase_storage_path')
        .eq('id', amenityId)
        .single();

      if (fetchError) throw fetchError;

      if (amenity?.supabase_storage_path) {
        await supabase.storage
          .from('landing-pages')
          .remove([amenity.supabase_storage_path]);
      }

      const { error: deleteError } = await supabase
        .from('landing_page_amenities')
        .delete()
        .eq('id', amenityId);

      if (deleteError) throw deleteError;
    } catch (error) {
      console.error('Error deleting amenity:', error);
      throw error;
    }
  }
}

export const supabaseLandingPagesContentService = new SupabaseLandingPagesContentService();
