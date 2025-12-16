
import { createClient } from '@/lib/supabase/server';

import { convertYouTubeToEmbed, convertGoogleMapsToEmbed } from '@/utils/urlConverters';
const supabase = await createClient();

export interface GoaVillaContent {
  id: string;
  headline: string;
  subheadline: string;
  rich_description: string;
  location_info: string;
  whatsapp_number: string;
  whatsapp_message: string;
  youtube_video_url?: string;
  show_google_map: boolean;
  google_map_url?: string;
  hero_image_url?: string;
  hero_image_supabase_path?: string;
  created_at: string;
  updated_at: string;
}

export interface GoaVillaImage {
  id: string;
  image_url: string;
  alt_text?: string;
  display_order: number;
  supabase_storage_path?: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
  updated_at: string;
}

class SupabaseGoaVillaService {
  async getContent(): Promise<GoaVillaContent | null> {
    try {
      const { data, error } = await supabase
        .from('goa_villa_content')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading villa content:', error);
      return null;
    }
  }

  async saveContent(content: Partial<GoaVillaContent>): Promise<void> {
    try {
      const { error } = await supabase
        .from('goa_villa_content')
        .upsert({
          ...content,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving villa content:', error);
      throw error;
    }
  }

  async getImages(): Promise<GoaVillaImage[]> {
    try {
      const { data, error } = await supabase
        .from('goa_villa_images')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading villa images:', error);
      return [];
    }
  }

  async uploadHeroImage(file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-${Date.now()}.${fileExt}`;
      const filePath = `hero/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('villa-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('villa-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading hero image:', error);
      throw error;
    }
  }

  async uploadGalleryImage(file: File, altText?: string): Promise<void> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `gallery-${Date.now()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('villa-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('villa-images')
        .getPublicUrl(filePath);

      const images = await this.getImages();
      const newOrder = Math.max(0, ...images.map(img => img.display_order)) + 1;

      const { error: insertError } = await supabase
        .from('goa_villa_images')
        .insert({
          image_url: data.publicUrl,
          supabase_storage_path: filePath,
          alt_text: altText || `Villa image ${newOrder}`,
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
      // Get image details first
      const { data: image, error: fetchError } = await supabase
        .from('goa_villa_images')
        .select('supabase_storage_path')
        .eq('id', imageId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage if path exists
      if (image?.supabase_storage_path) {
        await supabase.storage
          .from('villa-images')
          .remove([image.supabase_storage_path]);
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('goa_villa_images')
        .delete()
        .eq('id', imageId);

      if (deleteError) throw deleteError;
    } catch (error) {
      console.error('Error removing image:', error);
      throw error;
    }
  }

  async updateImageOrder(imageId: string, newOrder: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('goa_villa_images')
        .update({ display_order: newOrder })
        .eq('id', imageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating image order:', error);
      throw error;
    }
  }

  convertYouTubeUrl(url: string): string {
    return convertYouTubeToEmbed(url);
  }

  convertGoogleMapsUrl(url: string): string {
    return convertGoogleMapsToEmbed(url);
  }
}

export const supabaseGoaVillaService = new SupabaseGoaVillaService();
