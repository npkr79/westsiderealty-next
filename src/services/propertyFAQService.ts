import { createClient } from '@/lib/supabase/client';

export interface PropertyFAQ {
  id: string;
  property_id: string;
  property_type: string;
  question: string;
  answer: string;
  display_order: number;
}

export async function getPropertyFAQs(propertyId: string, propertyType: string): Promise<PropertyFAQ[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('property_faqs')
      .select('*')
      .eq('property_id', propertyId)
      .eq('property_type', propertyType)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[PropertyFAQService] Error fetching FAQs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[PropertyFAQService] Error:', error);
    return [];
  }
}

