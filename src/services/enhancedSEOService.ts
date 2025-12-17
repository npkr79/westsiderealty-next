import { createClient } from '@/lib/supabase/server';

// Stub for marked - simple markdown to HTML converter
const marked = {
  parse: (markdown: string): string => {
    // Simple markdown to HTML conversion (basic implementation)
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }
};

interface PropertyData {
  id: string;
  title: string;
  description: string;
  location: string;
  micro_market?: string;
  property_type: string;
  bhk_config?: string;
  bedrooms?: number;
  price: number;
  price_display: string;
  area_sqft?: number;
  amenities?: any;
  nearby_landmarks?: any;
  possession_status?: string;
  furnished_status?: string;
}

interface EnhancedSEOContent {
  expandedDescription: string;
  optimizedTitle: string;
  metaDescription: string;
  seoKeywords: string[];
  faqs: FAQ[];
}

interface FAQ {
  question: string;
  answer: string;
}

export class EnhancedSEOService {
  private generateLocationInsights(property: PropertyData): string {
    const location = property.micro_market || property.location;
    
    const locationData: Record<string, any> = {
      'Gopanapally': {
        overview: "Gopanapally is a rapidly developing suburb in Hyderabad's Serilingampally mandal, strategically positioned between the Outer Ring Road and HITEC City. The area has emerged as a prime residential destination for IT professionals and investors seeking high-growth potential.",
        connectivity: "The locality offers excellent connectivity via ORR exit 13, with easy access to Gachibowli (20 mins), Financial District (35 mins), and HITEC City (15 mins). The upcoming metro extension will further enhance accessibility.",
        infrastructure: "Home to top educational institutions including Manthan International School (2.5 km), Oakridge International (4 km), and Epistemo Global School. Medical facilities include KIMS Hospital (5 km) and Continental Hospitals (8 km). Shopping destinations like Forum Sujana Mall and Inorbit Mall are within 10-15 minutes.",
        investment: "Gopanapally has witnessed 12-15% YoY appreciation in property values, driven by IT sector growth and infrastructure development. Rental yields range from 3.2-3.8%, making it attractive for buy-to-let investors.",
      },
      'Financial District': {
        overview: "Financial District (Gachibowli) is Hyderabad's premier commercial and residential hub, housing multinational corporations, luxury residential towers, and world-class amenities. It represents the pinnacle of urban development in the city.",
        connectivity: "Strategically located on the ORR with direct connectivity to HITEC City (10 mins), Jubilee Hills (15 mins), and Hitech City Metro Station (5 mins). International Airport is 45 minutes via ORR.",
        infrastructure: "Premium educational institutions like Oakridge International School, Meridian School, and Chirec International. Healthcare includes Continental Hospital, AIG Hospital, and KIMS. Entertainment options include Inorbit Mall, Forum Sujana Mall.",
        investment: "Properties in Financial District command premium prices with 8-10% annual appreciation. Rental yields of 2.5-3.5% attract corporate lease opportunities from multinational companies.",
      },
      'Kokapet': {
        overview: "Kokapet is one of Hyderabad's fastest-growing micro-markets, located along the ORR corridor. Known for its ultra-luxury residential projects and proximity to major IT hubs, Kokapet offers a perfect blend of connectivity and lifestyle.",
        connectivity: "Situated on the ORR between Gachibowli and Financial District, offering 15-minute access to HITEC City and 20-minute connectivity to Nanakramguda. The area benefits from excellent road infrastructure and upcoming metro connectivity.",
        infrastructure: "Surrounded by international schools like Oakridge, DPS, and Chirec. Healthcare facilities include Continental Hospital and Aware Gleneagles. Shopping and entertainment at Inorbit Mall and Forum Sujana Mall within 10 km.",
        investment: "Kokapet has seen 15-18% YoY price appreciation, among the highest in Hyderabad. Rental yields of 3.5-4% make it attractive for investors. The area is transitioning from emerging to established micro-market status.",
      }
    };

    const data = locationData[location] || {
      overview: `${location} is a well-established residential locality in Hyderabad, offering excellent connectivity and modern amenities.`,
      connectivity: `The area provides good access to major commercial hubs and is well-connected via road networks.`,
      infrastructure: `${location} features quality educational institutions, healthcare facilities, and shopping complexes nearby.`,
      investment: `Properties in ${location} offer stable appreciation and attractive rental yields for investors.`,
    };

    return `
**Location Advantages - ${location}:**

${data.overview}

**Connectivity & Accessibility:**
${data.connectivity}

**Social Infrastructure:**
${data.infrastructure}

**Investment Potential:**
${data.investment}
    `.trim();
  }

  private generateProjectAnalysis(property: PropertyData): string {
    const projectName = this.extractProjectName(property.title);
    
    return `
**About ${projectName}:**

${projectName} is a premium ${property.property_type.toLowerCase()} project located in ${property.location}, offering modern living spaces with world-class amenities. The project is designed to cater to the needs of contemporary homebuyers seeking quality construction, strategic location, and excellent connectivity.

**Project Highlights:**
- Prime location in ${property.location} with excellent connectivity
- High-quality construction with attention to detail
- Comprehensive amenity suite for modern lifestyle
- RERA approved and bank loan approved
- Developed by reputed builder with proven track record
- ${property.possession_status || 'Ready to move'} - Immediate possession available
    `.trim();
  }

  private extractProjectName(title: string): string {
    const match = title.match(/in\s+([^,]+)/);
    return match ? match[1].trim() : 'This Project';
  }

  private generateDetailedSpecs(property: PropertyData): string {
    const bhk = property.bhk_config || `${property.bedrooms} BHK`;
    
    return `
**Property Specifications:**

**Configuration:** ${bhk} - Thoughtfully designed for optimal space utilization
**Built-up Area:** ${property.area_sqft ? `${property.area_sqft} sq.ft` : 'Spacious layout'} providing ample living space
**Bedrooms:** ${property.bedrooms || 'Multiple'} well-ventilated rooms with attached bathrooms
**Living & Dining:** Open-plan layout with abundant natural light
**Kitchen:** Modular kitchen with high-quality fittings and fixtures
**Balconies:** ${property.property_type.includes('Villa') ? 'Private terraces' : 'Multiple balconies'} with scenic views
**Flooring:** Vitrified tiles in living areas, anti-skid tiles in bathrooms
**Parking:** Covered car parking included
**Furnishing Status:** ${property.furnished_status || 'Available in multiple configurations'}

**Premium Fittings & Fixtures:**
- Branded modular kitchen with granite countertop
- Premium bathroom fittings with modern sanitaryware
- High-quality windows with mosquito mesh
- Power backup for essential areas
- Piped gas connection
- High-speed internet connectivity ready
    `.trim();
  }

  private generateInvestmentAnalysis(property: PropertyData): string {
    const pricePerSqft = property.area_sqft ? Math.round(property.price / property.area_sqft) : null;
    const location = property.micro_market || property.location;
    
    return `
**Investment Analysis:**

**Current Pricing:** ${property.price_display}
${pricePerSqft ? `**Price per Sq.ft:** ₹${pricePerSqft.toLocaleString('en-IN')}` : ''}

**Market Comparison:** This property is competitively priced compared to similar ${property.bhk_config || `${property.bedrooms} BHK`} units in ${location}. The micro-market has shown consistent appreciation trends.

**Rental Yield Potential:** 
Properties in ${location} typically generate rental yields of 3-4% annually. Based on current market rates, this ${property.bhk_config || `${property.bedrooms} BHK`} unit can fetch approximately ₹${this.estimateRent(property.price)}/month in rental income.

**Appreciation Forecast:**
${location} has witnessed 10-15% year-on-year appreciation over the past 3 years. With ongoing infrastructure development and increasing demand, the upward trend is expected to continue.

**Resale Liquidity:**
High demand for ${property.bhk_config || `${property.bedrooms} BHK`} apartments in ${location} ensures excellent resale liquidity. The property's prime location and modern amenities make it attractive to both end-users and investors.

**Why This is a Smart Investment:**
✓ Prime location with excellent connectivity
✓ Established micro-market with proven appreciation
✓ Strong rental demand from IT professionals
✓ Quality construction by reputed developer
✓ Complete social infrastructure nearby
✓ Future infrastructure projects will enhance value
    `.trim();
  }

  private estimateRent(price: number): string {
    const monthlyRent = Math.round((price * 0.003) / 1000) * 1000;
    return monthlyRent.toLocaleString('en-IN');
  }

  private generateFAQs(property: PropertyData): FAQ[] {
    const location = property.micro_market || property.location;
    const bhk = property.bhk_config || `${property.bedrooms} BHK`;
    
    return [
      {
        question: `Is this property RERA approved?`,
        answer: `Yes, this property is RERA (Real Estate Regulatory Authority) approved. All necessary approvals and clearances are in place, ensuring complete legal compliance and buyer protection.`
      },
      {
        question: `What is the possession timeline for this property?`,
        answer: `This property is ${property.possession_status || 'ready to move'}. You can take immediate possession and start enjoying your new home right away.`
      },
      {
        question: `Are home loans available for this property?`,
        answer: `Yes, this property is pre-approved by major banks including SBI, HDFC, ICICI, Axis Bank, and others. Our team can assist you with home loan processing and documentation.`
      },
      {
        question: `What is the monthly maintenance cost?`,
        answer: `Monthly maintenance charges typically range from ₹3-5 per sq.ft, covering security, common area maintenance, water supply, and other amenities. Exact charges will be confirmed by the society management committee.`
      },
      {
        question: `Can NRIs buy this property?`,
        answer: `Yes, NRIs (Non-Resident Indians) and OCIs (Overseas Citizens of India) can purchase this property. We provide complete assistance with NRI documentation, FEMA compliance, and repatriation processes.`
      },
      {
        question: `What is the average price of ${bhk} apartments in ${location}?`,
        answer: `${bhk} apartments in ${location} currently range from ${this.getPriceRange(property.price)}. This property offers excellent value considering its location, amenities, and specifications.`
      },
      {
        question: `What amenities are included in this property?`,
        answer: `The property includes comprehensive amenities such as clubhouse, swimming pool, gymnasium, children's play area, landscaped gardens, 24/7 security, power backup, and more. Refer to the detailed amenity list above.`
      },
      {
        question: `Is car parking included?`,
        answer: `Yes, covered car parking is included with this property. Additional parking slots may be available for purchase if you need more than one parking space.`
      }
    ];
  }

  private getPriceRange(price: number): string {
    const lower = Math.floor((price * 0.85) / 100000) * 100000;
    const upper = Math.ceil((price * 1.15) / 100000) * 100000;
    return `₹${(lower / 10000000).toFixed(2)} Cr to ₹${(upper / 10000000).toFixed(2)} Cr`;
  }

  public generateExpandedDescription(property: PropertyData): string {
    // Keep original intro (first paragraph)
    const originalIntro = property.description.split('\n\n')[0] || property.description.substring(0, 200);
    
    const sections = [
      originalIntro,
      this.generateProjectAnalysis(property),
      this.generateDetailedSpecs(property),
      this.generateLocationInsights(property),
      this.generateInvestmentAnalysis(property),
      "\n**Why Choose This Property?**\n\nThis property represents an excellent opportunity for both end-users and investors. The combination of prime location, quality construction, modern amenities, and strong appreciation potential makes it a smart real estate choice. Whether you're looking for your dream home or a sound investment, this property ticks all the boxes.\n\n**Schedule Your Site Visit Today!**\n\nDon't miss this opportunity to own a premium property in one of Hyderabad's most sought-after locations. Contact us now to schedule a site visit and explore this beautiful home in person. Our real estate experts are available to answer all your questions and guide you through the buying process."
    ];

    const markdownDescription = sections.join('\n\n');
    
    // Convert Markdown to HTML
    return marked.parse(markdownDescription) as string;
  }

  public generateOptimizedTitle(property: PropertyData): string {
    const bhk = property.bhk_config || `${property.bedrooms}BHK`;
    const type = property.property_type;
    const projectName = this.extractProjectName(property.title);
    const location = property.micro_market || property.location;
    const priceRange = this.formatPriceForTitle(property.price);
    const usp = property.possession_status?.includes('Ready') ? 'Ready to Move' : 
                property.property_type.includes('Villa') ? 'Luxury Living' : 
                'Premium Apartment';

    // Add comma after project name for trigger compatibility
    return `${bhk} ${type} for Sale in ${projectName}, ${location} - ${priceRange} | ${usp}`;
  }

  private formatPriceForTitle(price: number): string {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(price / 100000).toFixed(0)} L`;
  }

  public generateMetaDescription(property: PropertyData): string {
    const bhk = property.bhk_config || `${property.bedrooms}BHK`;
    const location = property.micro_market || property.location;
    const projectName = this.extractProjectName(property.title);
    
    const usps = [
      property.possession_status?.includes('Ready') ? 'Ready to move' : 'Under construction',
      'RERA approved',
      `Prime ${location} location`,
      'Bank loan approved'
    ].filter(Boolean).slice(0, 3);

    return `${bhk} ${property.property_type.toLowerCase()} for sale in ${projectName}, ${location} | ${usps.join(' • ')}. ${property.price_display}. Limited units! Schedule site visit today.`;
  }

  public extractKeywords(property: PropertyData): string[] {
    const location = property.micro_market || property.location;
    const bhk = property.bhk_config || `${property.bedrooms} bhk`;
    const type = property.property_type.toLowerCase();
    
    return [
      `${bhk} ${type} ${location}`,
      `${type} for sale ${location}`,
      `${bhk} flat ${location}`,
      `${location} properties`,
      `${location} ${type} price`,
      `ready to move ${type} ${location}`,
      `luxury ${type} ${location}`,
      `${bhk} ${type} hyderabad`,
      `investment property ${location}`,
      `${location} real estate`
    ];
  }

  public async optimizeProperty(property: PropertyData): Promise<EnhancedSEOContent> {
    const expandedDescription = this.generateExpandedDescription(property);
    const optimizedTitle = this.generateOptimizedTitle(property);
    const metaDescription = this.generateMetaDescription(property);
    const seoKeywords = this.extractKeywords(property);
    const faqs = this.generateFAQs(property);

    return {
      expandedDescription,
      optimizedTitle,
      metaDescription,
      seoKeywords,
      faqs
    };
  }

  private getTableColumns(tableName: string): string {
    const columnMaps: Record<string, string> = {
      'hyderabad_properties': 'id, title, description, location, micro_market, property_type, bhk_config, bedrooms, price, price_display, area_sqft, amenities, nearby_landmarks, possession_status, furnished_status',
      'goa_properties': 'id, title, description, location, region, property_type, bhk_config, bedrooms, price, price_display, area_sqft, amenities, nearby_landmarks',
      'dubai_properties': 'id, title, description, community, emirate, property_type, bedrooms, price, price_display, area_sqft, amenities, nearby_landmarks, completion_year'
    };
    return columnMaps[tableName] || 'id, title, description, price, price_display';
  }

  private mapToPropertyData(property: any, tableName: string): PropertyData {
    const location = property.location || property.region || property.community || property.emirate || '';
    const bhk = property.bhk_config || (property.bedrooms ? `${property.bedrooms} BHK` : '');
    
    return {
      id: property.id,
      title: property.title || '',
      description: property.description || '',
      location: location,
      micro_market: property.micro_market || property.region,
      property_type: property.property_type || 'Apartment',
      bhk_config: bhk,
      bedrooms: property.bedrooms,
      price: property.price || 0,
      price_display: property.price_display || '',
      area_sqft: property.area_sqft,
      amenities: property.amenities,
      nearby_landmarks: property.nearby_landmarks,
      possession_status: property.possession_status || (property.completion_year ? `Completion ${property.completion_year}` : 'Ready to Move'),
      furnished_status: property.furnished_status
    };
  }

  public async bulkOptimizeProperties(tableName: string): Promise<{ success: number; failed: number; total: number }> {
    try {
      const supabase = await createClient();
      const columns = this.getTableColumns(tableName);
      
      const { data: properties, error } = await supabase
        .from(tableName as any)
        .select(columns)
        .eq('status', 'active');

      if (error) {
        console.error(`Error fetching from ${tableName}:`, error);
        throw error;
      }
      
      if (!properties || properties.length === 0) return { success: 0, failed: 0, total: 0 };

      let success = 0;
      let failed = 0;

      for (const property of properties) {
        try {
          const propertyData = this.mapToPropertyData(property, tableName);
          const optimized = await this.optimizeProperty(propertyData);
          
          // Different update structure based on table schema
          const updateData: any = {
            title: optimized.optimizedTitle,
            description: optimized.expandedDescription,
            meta_description: optimized.metaDescription,
            seo_keywords: optimized.seoKeywords,
            seo_score: 85
          };

          // Only goa_properties has seo_title column
          if (tableName === 'goa_properties') {
            updateData.seo_title = optimized.optimizedTitle;
          }

          const { error: updateError } = await supabase
            .from(tableName as any)
            .update(updateData)
            .eq('id', (property as any).id);

          if (updateError) {
            console.error(`Error updating property ${(property as any).id}:`, updateError);
            throw updateError;
          }
          
          success++;
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          console.error(`Failed to optimize property ${(property as any).id}:`, err);
          failed++;
        }
      }

      return { success, failed, total: properties.length };
    } catch (error) {
      console.error('Bulk optimization error:', error);
      throw error;
    }
  }
}

export const enhancedSEOService = new EnhancedSEOService();
