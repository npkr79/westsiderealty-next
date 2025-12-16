import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();


export interface SEOContent {
  description_main: string;
  description_developer: string;
  description_micromarket: string;
  description_investment: string;
}

export interface GenerateSEOContentRequest {
  property: any;
}

export interface GenerateSEOContentResponse {
  success: boolean;
  content?: SEOContent;
  error?: string;
}

export const goaSEOContentService = {
  async generateContent(property: any): Promise<GenerateSEOContentResponse> {
    try {
      console.log('[goaSEOContentService] Generating content for:', property.title);
      
      const { data, error } = await supabase.functions.invoke('generate-goa-seo-content', {
        body: { property }
      });

      if (error) {
        console.error('[goaSEOContentService] Error:', error);
        throw error;
      }

      if (!data.success) {
        const errorMsg = data.error || 'Failed to generate content';
        console.error('[goaSEOContentService] API returned error:', errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }

      return {
        success: true,
        content: data.content
      };
    } catch (error: any) {
      console.error('[goaSEOContentService] Error generating content:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate content'
      };
    }
  },

  async updatePropertyContent(propertyId: string, content: SEOContent): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[goaSEOContentService] Updating property:', propertyId);
      
      const { error } = await supabase
        .from('goa_holiday_properties')
        .update({
          description_main: content.description_main,
          description_developer: content.description_developer,
          description_micromarket: content.description_micromarket,
          description_investment: content.description_investment,
          updated_at: new Date().toISOString()
        })
        .eq('id', propertyId);

      if (error) {
        console.error('[goaSEOContentService] Update error:', error);
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('[goaSEOContentService] Error updating property:', error);
      return {
        success: false,
        error: error.message || 'Failed to update property'
      };
    }
  },

  async generateAndSave(property: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Generate content
      const generateResult = await this.generateContent(property);
      if (!generateResult.success || !generateResult.content) {
        return {
          success: false,
          error: generateResult.error || 'Failed to generate content'
        };
      }

      // Save to database
      const updateResult = await this.updatePropertyContent(property.id, generateResult.content);
      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error || 'Failed to save content'
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('[goaSEOContentService] Error in generateAndSave:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate and save content'
      };
    }
  }
};
