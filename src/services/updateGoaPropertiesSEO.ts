import { createClient } from '@/lib/supabase/server';
import { generateGoaPropertySlug } from "@/utils/seoUrlGenerator";

const supabase = await createClient();

/**
 * Service to update existing Goa properties with SEO-optimized content
 */

interface PropertyEnhancement {
  project_name: string;
  developer_name?: string;
  micro_location: string;
  macro_location: string;
  rental_yield_min: number;
  rental_yield_max: number;
  investment_highlights: string[];
  property_highlights: any[];
  location_guide_title: string;
  location_guide_content: string;
}

const propertyEnhancements: Record<string, PropertyEnhancement> = {
  'Veora-villa-morjim-goa': {
    project_name: 'Veora',
    developer_name: 'ALYF',
    micro_location: 'Morjim',
    macro_location: 'North Goa',
    rental_yield_min: 7,
    rental_yield_max: 9,
    investment_highlights: [
      'Prime North Goa Location with High Tourist Footfall',
      'Proven Developer: ALYF\'s Track Record of Quality',
      'Strong Capital Appreciation in Morjim Villas Segment',
      'Excellent Rental Income Potential for Luxury Vacation Stays'
    ],
    property_highlights: [
      { icon: 'Waves', title: 'Beachfront Access', subtitle: 'Just 500m from Morjim Beach', display_order: 0 },
      { icon: 'Infinity', title: 'Private Infinity Pool', subtitle: 'Each villa features a stunning pool', display_order: 1 },
      { icon: 'Users', title: 'Staff Quarters', subtitle: 'Dedicated servant quarters', display_order: 2 },
      { icon: 'Shield', title: 'Concierge Services', subtitle: '24/7 luxury concierge', display_order: 3 },
      { icon: 'TrendingUp', title: 'High ROI', subtitle: 'Proven rental income potential', display_order: 4 },
      { icon: 'CheckCircle', title: 'RERA Approved', subtitle: 'Fully compliant and certified', display_order: 5 }
    ],
    location_guide_title: 'Discover Life in Morjim, Goa',
    location_guide_content: '<p><strong>Morjim, Goa</strong>, often referred to as \'Little Russia\' for its vibrant international community, is the jewel of <strong>North Goa\'s</strong> coastline. Renowned for its pristine, less crowded beaches, thriving culinary scene, and a relaxed, bohemian atmosphere, <strong>Morjim</strong> offers an unparalleled lifestyle.</p><p>It\'s a sanctuary for those seeking <strong>luxury villas in Goa</strong> away from the bustling crowds, yet close enough to the vibrant nightlife of places like Vagator and Anjuna. With excellent <strong>connectivity</strong> to key areas, <strong>Morjim</strong> represents a perfect blend of peaceful living and a dynamic cultural experience, making it an ideal <strong>Goa investment</strong> for discerning buyers.</p>'
  },
  'inizio-villa-corjuem': {
    project_name: 'Inizio',
    developer_name: 'Prestige Group',
    micro_location: 'Corjuem',
    macro_location: 'North Goa',
    rental_yield_min: 6,
    rental_yield_max: 8,
    investment_highlights: [
      'Prime North Goa Location',
      'RERA Approved and Bank Loan Approved',
      'High Rental Income Potential',
      'Excellent Capital Appreciation Area'
    ],
    property_highlights: [
      { icon: 'Home', title: 'Spacious Layout', subtitle: '4,542 sq.ft. premium living', display_order: 0 },
      { icon: 'Bath', title: 'Luxury Bathrooms', subtitle: '6 modern bathrooms', display_order: 1 },
      { icon: 'Car', title: 'Ample Parking', subtitle: 'Multiple parking spaces', display_order: 2 },
      { icon: 'Shield', title: 'RERA Approved', subtitle: 'Certified and compliant', display_order: 3 }
    ],
    location_guide_title: 'Discover Corjuem, North Goa',
    location_guide_content: '<p><strong>Corjuem</strong> is a peaceful village in <strong>North Goa</strong>, known for its serene environment and proximity to major attractions. The area offers excellent connectivity to beaches, markets, and tourist destinations while maintaining a tranquil residential atmosphere. Perfect for those seeking a <strong>luxury villa in Goa</strong> away from the hustle.</p>'
  },
  'la-irene-pilern-goa': {
    project_name: 'La Irene',
    developer_name: 'La Irene Developers',
    micro_location: 'Pilerne',
    macro_location: 'North Goa',
    rental_yield_min: 6,
    rental_yield_max: 8,
    investment_highlights: [
      'Strategic North Goa Location',
      'RERA Approved Property',
      'Bank Loan Approved',
      'High Tourist Footfall Area'
    ],
    property_highlights: [
      { icon: 'Home', title: 'Expansive Space', subtitle: '5,000 sq.ft. living area', display_order: 0 },
      { icon: 'Bath', title: 'Premium Bathrooms', subtitle: '6 luxury bathrooms', display_order: 1 },
      { icon: 'CheckCircle', title: 'RERA Certified', subtitle: 'Fully approved', display_order: 2 }
    ],
    location_guide_title: 'Pilerne - Gateway to North Goa',
    location_guide_content: '<p><strong>Pilerne</strong> is strategically located in <strong>North Goa</strong>, offering excellent connectivity to Mapusa, Panjim, and popular beaches. The area is known for its peaceful environment and rapid development, making it an attractive <strong>investment location in Goa</strong>.</p>'
  },
  'Vitaura-Colva-South-Goa': {
    project_name: 'Vitaura',
    developer_name: 'Vitaura Developers',
    micro_location: 'Colva',
    macro_location: 'South Goa',
    rental_yield_min: 5,
    rental_yield_max: 7,
    investment_highlights: [
      'Prime South Goa Beach Location',
      'RERA Approved',
      'Excellent Rental Potential',
      'Popular Tourist Destination'
    ],
    property_highlights: [
      { icon: 'Waves', title: 'Beach Proximity', subtitle: 'Near Colva Beach', display_order: 0 },
      { icon: 'Home', title: 'Spacious Villa', subtitle: '4,245 sq.ft.', display_order: 1 },
      { icon: 'Shield', title: 'RERA Approved', subtitle: 'Certified property', display_order: 2 }
    ],
    location_guide_title: 'Colva - South Goa\'s Beach Paradise',
    location_guide_content: '<p><strong>Colva</strong> is one of <strong>South Goa\'s</strong> most popular beach destinations, known for its long sandy beaches and vibrant atmosphere. The area offers a perfect blend of tourist attractions and peaceful residential living, making it ideal for <strong>vacation homes</strong> and <strong>investment properties</strong>.</p>'
  },
  'savannah-calangute-goa': {
    project_name: 'Savannah',
    developer_name: 'Savannah Builders',
    micro_location: 'Calangute',
    macro_location: 'North Goa',
    rental_yield_min: 7,
    rental_yield_max: 9,
    investment_highlights: [
      'Prime Calangute Beach Location',
      'High Tourist Footfall',
      'Excellent Rental Income',
      'RERA Approved'
    ],
    property_highlights: [
      { icon: 'Waves', title: 'Beach Location', subtitle: 'Near Calangute Beach', display_order: 0 },
      { icon: 'TrendingUp', title: 'High ROI', subtitle: 'Strong rental demand', display_order: 1 },
      { icon: 'Shield', title: 'RERA Certified', subtitle: 'Fully approved', display_order: 2 }
    ],
    location_guide_title: 'Calangute - The Queen of Beaches',
    location_guide_content: '<p><strong>Calangute</strong> is <strong>North Goa\'s</strong> most famous beach destination, known as the "Queen of Beaches." With excellent infrastructure, shopping, dining, and nightlife, Calangute offers the best of <strong>Goa\'s tourist attractions</strong> while providing strong <strong>investment opportunities</strong> for luxury properties.</p>'
  }
};

export async function updateGoaPropertiesSEO() {
  console.log('🚀 Starting Goa Properties SEO Update...');
  
  const { data: properties, error } = await supabase
    .from('goa_holiday_properties')
    .select('*');

  if (error) {
    console.error('❌ Error fetching properties:', error);
    return { success: false, error };
  }

  let updated = 0;
  let failed = 0;
  const results = [];

  for (const property of properties || []) {
    try {
      const enhancement = propertyEnhancements[property.seo_slug || ''] || {} as Partial<PropertyEnhancement>;
      
      const projectName = enhancement.project_name || property.title?.split(' ')[0] || property.seo_slug?.split('-')[0];
      const microLocation = enhancement.micro_location || property.location_area || 'Goa';
      const macroLocation = enhancement.macro_location || property.district || 'North Goa';

      const newSlug = generateGoaPropertySlug({
        micro_location: microLocation,
        project_name: projectName,
        property_type: property.type || 'Villa',
        bhk_config: property.bhk_config || `${property.bedrooms}BHK`
      });

      const seoTitle = `${property.bhk_config || `${property.bedrooms}BHK`} ${property.type} for Sale - ${projectName}${enhancement.developer_name ? ` by ${enhancement.developer_name}` : ''} in ${microLocation}, ${macroLocation}`;

      const metaDescription = `Invest in ultra-luxury ${(property.type || 'Villa').toLowerCase()} at ${projectName}${enhancement.developer_name ? ` by ${enhancement.developer_name}` : ''} in ${microLocation}, Goa. Stunning designs, high ROI, and unparalleled coastal living. Explore now!`;

      const updateData: any = {
        project_name: projectName,
        developer_name: enhancement.developer_name || null,
        micro_location: microLocation,
        macro_location: macroLocation,
        seo_slug: newSlug,
        seo_title: seoTitle,
        meta_description: metaDescription,
        rental_yield_min: enhancement.rental_yield_min || null,
        rental_yield_max: enhancement.rental_yield_max || null,
        investment_highlights: enhancement.investment_highlights || [
          `Prime ${macroLocation} Location`,
          'RERA Approved Property',
          'High ROI Investment Opportunity',
          'Excellent Rental Income Potential'
        ],
        property_highlights: enhancement.property_highlights || [
          { icon: 'Home', title: 'Spacious Living', subtitle: `${property.area_sqft} sq.ft.`, display_order: 0 },
          { icon: 'Bed', title: `${property.bedrooms} Bedrooms`, subtitle: `${property.bathrooms} Bathrooms`, display_order: 1 },
          { icon: 'Shield', title: 'RERA Approved', subtitle: 'Certified property', display_order: 2 }
        ],
        location_guide_title: enhancement.location_guide_title || `Discover ${microLocation}, ${macroLocation}`,
        location_guide_content: enhancement.location_guide_content || `<p><strong>${microLocation}</strong> is a prime location in <strong>${macroLocation}</strong>, offering excellent connectivity and lifestyle amenities. Perfect for <strong>luxury living</strong> and <strong>investment</strong> in Goa.</p>`,
        template_type: 'standard',
        seo_keywords: [
          projectName.toLowerCase(),
          microLocation.toLowerCase(),
          macroLocation.toLowerCase().replace(' ', '-'),
          property.type?.toLowerCase() || 'villa',
          'goa',
          'luxury',
          'investment'
        ]
      };

      const { error: updateError } = await supabase
        .from('goa_holiday_properties')
        .update(updateData)
        .eq('id', property.id);

      if (updateError) {
        console.error(`❌ Failed to update ${property.title}:`, updateError);
        failed++;
        results.push({ property: property.title, success: false, error: updateError });
      } else {
        console.log(`✅ Updated: ${property.title}`);
        console.log(`   Old slug: ${property.seo_slug}`);
        console.log(`   New slug: ${newSlug}`);
        updated++;
        results.push({ property: property.title, success: true, newSlug, seoTitle });
      }
    } catch (err) {
      console.error(`❌ Error processing ${property.title}:`, err);
      failed++;
      results.push({ property: property.title, success: false, error: err });
    }
  }

  console.log('\n📊 Update Summary:');
  console.log(`  ✅ Successfully updated: ${updated}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📈 Total processed: ${properties?.length || 0}`);

  return { success: true, updated, failed, total: properties?.length || 0, results };
}
