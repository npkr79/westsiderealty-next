import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();


export interface PropertyDescriptionRequest {
  city: string;
  propertyType: string;
  location: string;
  microMarket: string;
  projectName?: string;
  price: string;
  priceDisplay?: string;
  bhkConfig: string;
  bedrooms: string;
  bathrooms: string;
  areaSqft: string;
  floorNumber?: string;
  totalFloors?: string;
  facing?: string;
  parkingSpaces?: string;
  ownershipType: string;
  possessionStatus: string;
}

export interface PropertyDescriptionResponse {
  success: boolean;
  fullDescription: string;
  error?: string;
}

export const aiPropertyDescriptionService = {
  async generateDescription(data: PropertyDescriptionRequest): Promise<PropertyDescriptionResponse> {
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-property-description', {
        body: data
      });

      if (error) {
        throw error;
      }

      return result as PropertyDescriptionResponse;
    } catch (error: any) {
      console.error('Error generating property description:', error);
      return {
        success: false,
        fullDescription: '',
        error: error.message || 'Failed to generate description'
      };
    }
  },

  formatDescription(fullDescription: string): string {
    return fullDescription;
  }
};
