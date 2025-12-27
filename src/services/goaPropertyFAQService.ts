import { createClient } from '@/lib/supabase/server';

interface FAQ {
  question: string;
  answer: string;
}

interface GoaPropertyData {
  id: string;
  title: string;
  location_area?: string;
  district?: string;
  type?: string;
  bedrooms?: number;
  bhk_config?: string;
  price?: number;
  price_display?: string;
  area_sqft?: number;
  possession_status?: string;
  developer_name?: string;
  project_name?: string;
  amenities?: string[];
  rental_yield_min?: number;
  rental_yield_max?: number;
  description?: string;
}

/**
 * Generate FAQs for Goa properties
 * Returns at least 10 relevant FAQs based on property data
 */
export function generateGoaPropertyFAQs(property: GoaPropertyData): FAQ[] {
  const location = property.location_area || property.district || 'Goa';
  const propertyType = property.type || 'property';
  const bhk = property.bhk_config || (property.bedrooms ? `${property.bedrooms} BHK` : '');
  const developer = property.developer_name || '';
  const projectName = property.project_name || property.title?.split(' ')[0] || '';
  const price = property.price_display || (property.price ? `₹${(property.price / 10000000).toFixed(2)} Cr` : '');
  const area = property.area_sqft ? `${property.area_sqft} sq.ft` : '';
  const rentalYield = property.rental_yield_min && property.rental_yield_max 
    ? `${property.rental_yield_min}-${property.rental_yield_max}%`
    : property.rental_yield_min 
    ? `${property.rental_yield_min}%`
    : '8-12%';

  const faqs: FAQ[] = [
    {
      question: `What is the price of ${bhk ? bhk + ' ' : ''}${propertyType} at ${projectName || property.title}?`,
      answer: `${projectName || property.title} offers ${bhk ? bhk + ' ' : ''}${propertyType}${area ? ' of ' + area : ''} starting at ${price}. The pricing varies based on floor, view, and specific unit configuration. Contact us for detailed pricing and available units.`
    },
    {
      question: `Is ${projectName || property.title} RERA approved?`,
      answer: `Yes, ${projectName || property.title}${developer ? ' by ' + developer : ''} is fully RERA (Real Estate Regulatory Authority) approved. All necessary approvals and clearances are in place, ensuring complete legal compliance and buyer protection.`
    },
    {
      question: `What is the expected rental yield for properties in ${location}?`,
      answer: `Properties in ${location} offer attractive rental yields of ${rentalYield} annually. Holiday homes near beaches and tourist attractions typically generate higher returns, especially during peak season (October to March). Short-term rentals (Airbnb) and long-term leases both provide excellent income opportunities.`
    },
    {
      question: `Can I use the property for personal stays?`,
      answer: `Yes, absolutely! This property serves as both a personal holiday retreat and a rental-generating asset. You can use it for family vacations while earning rental income when you're not using it. Many owners enjoy the flexibility of using their Goa property during off-season and renting it out during peak tourist months.`
    },
    {
      question: `What amenities are available at ${projectName || property.title}?`,
      answer: `${projectName || property.title} features premium amenities including ${property.amenities && property.amenities.length > 0 ? property.amenities.slice(0, 5).join(', ') + (property.amenities.length > 5 ? ', and more' : '') : 'swimming pool, 24/7 security, parking, power backup, and modern facilities'}. These amenities enhance both your living experience and rental appeal.`
    },
    {
      question: `Is financing available for Goa properties?`,
      answer: `Yes, bank financing is available from leading banks including SBI, HDFC, ICICI, Axis Bank, and others. Most banks offer home loans for Goa properties with competitive interest rates. Our team can assist you with loan processing, documentation, and getting pre-approval.`
    },
    {
      question: `Can NRIs buy property in Goa?`,
      answer: `Yes, NRIs (Non-Resident Indians) and OCIs (Overseas Citizens of India) can purchase property in Goa. The process is straightforward, and we provide complete assistance with NRI documentation, FEMA compliance, and repatriation processes. Goa is a preferred destination for NRI investments due to its relaxed lifestyle and strong legal framework.`
    },
    {
      question: `What is the possession status of ${projectName || property.title}?`,
      answer: `${projectName || property.title} is ${property.possession_status || 'ready to move'}. ${property.possession_status === 'Ready to Move' || !property.possession_status ? 'You can take immediate possession and start enjoying your holiday home or begin generating rental income right away.' : 'Contact us for the latest possession timeline and handover schedule.'}`
    },
    {
      question: `What are the maintenance charges?`,
      answer: `Monthly maintenance charges for Goa properties typically range from ₹3-5 per sq.ft, covering security, common area maintenance, water supply, landscaping, and other amenities. Exact charges will be confirmed by the society management committee. These charges are generally lower than metro cities while maintaining high service standards.`
    },
    {
      question: `Why invest in ${location} specifically?`,
      answer: `${location} offers unique advantages including ${location.toLowerCase().includes('north') ? 'proximity to popular beaches like Calangute, Baga, and Anjuna, vibrant nightlife, and excellent connectivity' : location.toLowerCase().includes('south') ? 'serene beaches, luxury resorts, and a more peaceful lifestyle ideal for retirement and long-term stays' : 'prime location, excellent connectivity, and growing infrastructure'}. The area is witnessing steady appreciation and strong rental demand from both domestic and international tourists.`
    },
    {
      question: `What documents are required for booking?`,
      answer: `For booking, you'll need PAN card, Aadhaar card, passport-size photos, and address proof. For NRIs, additional documents include passport, visa, PIO/OCI card, and proof of income abroad. We assist with all documentation and ensure a smooth booking process.`
    },
    {
      question: `Is there a lock-in period for rental management?`,
      answer: `Rental management agreements typically have a 3-year lock-in period to ensure consistent returns and operational efficiency. However, terms can be customized based on your requirements. Many owners prefer professional rental management as it handles bookings, maintenance, and ensures optimal occupancy rates.`
    },
    {
      question: `How has the new Mopa International Airport impacted property prices?`,
      answer: `The new Mopa International Airport has significantly improved connectivity to North Goa, making it more accessible for both domestic and international travelers. This has positively impacted property values in nearby areas, with increased demand from investors and holiday home buyers. Properties within 30-45 minutes of the airport are seeing strong appreciation.`
    },
    {
      question: `What makes Goa a better investment than other holiday destinations?`,
      answer: `Goa offers unique advantages: year-round tourism (8M+ visitors), limited land availability ensuring appreciation, strong legal framework, NRI-friendly policies, dual-purpose usage (personal + rental), and consistent 8-12% rental yields. Unlike other destinations, Goa has established infrastructure, world-class healthcare, and a thriving expat community, making it ideal for both investment and lifestyle.`
    },
    {
      question: `What is the tax implication of owning a property in Goa?`,
      answer: `Property ownership in Goa has similar tax implications as other Indian states. You can claim tax deductions on home loan interest (up to ₹2 lakh under Section 24), claim depreciation if used for rental purposes, and benefit from long-term capital gains tax exemptions. We recommend consulting with a tax advisor for personalized tax planning strategies.`
    }
  ];

  // Return at least 10 FAQs, prioritizing the most relevant ones
  return faqs.slice(0, Math.max(10, faqs.length));
}

/**
 * Get FAQs for a Goa property from database or generate them
 */
export async function getGoaPropertyFAQs(propertyId: string, property: GoaPropertyData): Promise<FAQ[]> {
  const supabase = await createClient();

  // First, try to fetch existing FAQs from database
  // Check if there's a faqs_json field or a separate FAQs table
  const { data: propertyData, error } = await supabase
    .from('goa_holiday_properties')
    .select('faqs_json')
    .eq('id', propertyId)
    .maybeSingle();

  if (!error && propertyData?.faqs_json) {
    try {
      const faqs = typeof propertyData.faqs_json === 'string' 
        ? JSON.parse(propertyData.faqs_json)
        : propertyData.faqs_json;
      
      if (Array.isArray(faqs) && faqs.length >= 10) {
        return faqs.map((faq: any) => ({
          question: faq.question || faq.q || '',
          answer: faq.answer || faq.a || ''
        })).filter((faq: FAQ) => faq.question && faq.answer);
      }
    } catch (e) {
      console.error('[getGoaPropertyFAQs] Error parsing faqs_json:', e);
    }
  }

  // If no FAQs in database or insufficient, generate them
  const generatedFAQs = generateGoaPropertyFAQs(property);

  // Save generated FAQs to database for future use
  try {
    await supabase
      .from('goa_holiday_properties')
      .update({ faqs_json: generatedFAQs })
      .eq('id', propertyId);
  } catch (error) {
    console.error('[getGoaPropertyFAQs] Error saving FAQs to database:', error);
    // Continue even if save fails
  }

  return generatedFAQs;
}

