"use client";

import { createClient } from "@/lib/supabase/client";
import { microMarketPagesService } from "@/services/microMarketPagesService";
import { cityService } from "@/services/cityService";
import { developerService } from "@/services/developerService";

/**
 * Formats a slug into a human-readable title
 * Example: "financial-district" -> "Financial District"
 */
export function formatSlug(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Fetches city name from database by slug
 */
export async function getCityName(slug: string): Promise<string> {
  try {
    const cityData = await cityService.getCityBySlug(slug);
    return cityData?.city_name || formatSlug(slug);
  } catch (error) {
    console.error('Error fetching city name:', error);
    return formatSlug(slug);
  }
}

/**
 * Fetches micro-market name from database by slug
 */
export async function getMicroMarketName(slug: string): Promise<string> {
  try {
    const data = await microMarketPagesService.getMicroMarketPageBySlug(slug);
    return data?.micro_market_name || formatSlug(slug);
  } catch (error) {
    console.error('Error fetching micro-market name:', error);
    return formatSlug(slug);
  }
}

/**
 * Fetches project name from database by slug
 */
export async function getProjectName(slug: string): Promise<string> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('projects')
      .select('project_name')
      .eq('url_slug', slug)
      .single();
    return data?.project_name || formatSlug(slug);
  } catch (error) {
    console.error('Error fetching project name:', error);
    return formatSlug(slug);
  }
}

/**
 * Fetches developer name from database by slug
 */
export async function getDeveloperName(slug: string): Promise<string> {
  try {
    const devData = await developerService.getDeveloperBySlug(slug);
    return devData?.developer_name || formatSlug(slug);
  } catch (error) {
    console.error('Error fetching developer name:', error);
    return formatSlug(slug);
  }
}

/**
 * Fetches listing title from database by slug
 * Tries each city's property table
 */
export async function getListingTitle(slug: string, citySlug: string): Promise<string> {
  try {
    const supabase = createClient();
    let data = null;
    
    // Query the appropriate city's property table
    if (citySlug === 'hyderabad') {
      const result = await supabase
        .from('hyderabad_properties')
        .select('title')
        .eq('slug', slug)
        .maybeSingle();
      data = result.data;
    } else if (citySlug === 'goa') {
      const result = await supabase
        .from('goa_holiday_properties')
        .select('title')
        .eq('seo_slug', slug)
        .maybeSingle();
      data = result.data;
    } else if (citySlug === 'dubai') {
      const result = await supabase
        .from('dubai_properties')
        .select('title')
        .eq('slug', slug)
        .maybeSingle();
      data = result.data;
    }
    
    if (data?.title) {
      // Truncate long titles for breadcrumb display
      return data.title.length > 50 
        ? data.title.substring(0, 50) + '...' 
        : data.title;
    }
    
    return formatSlug(slug);
  } catch (error) {
    console.error('Error fetching listing title:', error);
    return formatSlug(slug);
  }
}
