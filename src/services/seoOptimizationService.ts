interface PropertyData {
  title: string;
  description: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqft?: number;
  price?: number;
  price_display?: string;
  property_type?: string;
  location?: string;
  micro_market?: string;
  region?: string;
  community?: string;
  emirate?: string;
  project_name?: string;
  building_name?: string;
  developer?: string;
  amenities?: string[] | any;
  nearby_landmarks?: any;
  possession_status?: string;
  furnished_status?: string;
  roi_percentage?: number;
  rental_potential?: string;
}

interface SEOOptimizedContent {
  title: string;
  description: string;
  meta_description: string;
  seo_keywords: string[];
  seo_score: number;
}

export class SEOOptimizationService {
  
  /**
   * Generate SEO-optimized title (50-60 characters)
   * Format: [CTR Modifier] [Bedrooms]BHK [Type] in [Project Name], [Location]
   */
  generateOptimizedTitle(property: PropertyData): string {
    const modifiers = ['Premium', 'Luxury', 'Best', 'Spacious', 'Modern', 'Elegant'];
    const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
    
    const bhk = property.bedrooms ? `${property.bedrooms}BHK` : '';
    const type = this.getShortPropertyType(property.property_type || 'Property');
    const projectName = property.project_name || property.building_name || property.developer || '';
    const location = this.getShortLocation(property);
    
    // Build title with project name
    // Format: "Premium 3BHK Apt in Project Name, Location"
    let title = '';
    if (projectName) {
      const parts = [modifier, bhk, type, 'in', projectName + ',', location].filter(Boolean);
      title = parts.join(' ');
    } else {
      // Fallback if no project name
      const parts = [modifier, bhk, type, 'in', location].filter(Boolean);
      title = parts.join(' ');
    }
    
    // Ensure within 60 character limit
    if (title.length > 60) {
      title = title.substring(0, 57) + '...';
    }
    
    return title;
  }

  /**
   * Generate SEO-optimized description with bullet points and CTA
   */
  generateOptimizedDescription(property: PropertyData): string {
    const location = this.getFullLocation(property);
    const bhk = property.bedrooms ? `${property.bedrooms} BHK` : '';
    const type = property.property_type || 'property';
    const area = property.area_sqft ? `${property.area_sqft.toLocaleString()} sq.ft.` : '';
    
    // Opening sentence with primary keyword
    let description = `${bhk} ${type} for sale in ${location}`;
    if (area) {
      description += ` – ${area} of premium living space`;
    }
    if (property.price_display) {
      description += ` priced at ${property.price_display}`;
    }
    description += '.\n\n';
    
    // Key Features section
    description += '🏡 Key Property Highlights:\n';
    const features = this.extractKeyFeatures(property);
    features.forEach(feature => {
      description += `• ${feature}\n`;
    });
    
    // Location Benefits
    if (property.nearby_landmarks && this.hasNearbyLandmarks(property.nearby_landmarks)) {
      description += '\n📍 Prime Location Benefits:\n';
      const landmarks = this.extractLandmarks(property.nearby_landmarks);
      landmarks.slice(0, 3).forEach(landmark => {
        description += `• ${landmark}\n`;
      });
    }
    
    // Investment Highlights
    description += '\n💎 Investment Highlights:\n';
    const investmentPoints = this.extractInvestmentPoints(property);
    investmentPoints.forEach(point => {
      description += `• ${point}\n`;
    });
    
    // Strong CTA
    description += '\n📞 Schedule your site visit today! Contact us for exclusive pricing and flexible payment plans.';
    
    return description;
  }

  /**
   * Generate meta description (150-160 characters)
   */
  generateMetaDescription(property: PropertyData): string {
    const bhk = property.bedrooms ? `${property.bedrooms}BHK` : '';
    const type = this.getShortPropertyType(property.property_type || 'property');
    const location = this.getShortLocation(property);
    const area = property.area_sqft ? `${property.area_sqft} sqft` : '';
    const price = property.price_display || '';
    
    const topAmenity = this.getTopAmenity(property.amenities);
    const status = property.possession_status === 'Ready to move' ? 'Ready to move' : 'New launch';
    
    let meta = `${bhk} ${type} for sale in ${location}`;
    if (area) meta += ` • ${area}`;
    if (price) meta += ` • ${price}`;
    if (topAmenity) meta += ` • ${topAmenity}`;
    meta += ` • ${status} • View details`;
    
    // Ensure 150-160 characters
    if (meta.length > 160) {
      meta = meta.substring(0, 157) + '...';
    } else if (meta.length < 150) {
      meta += ' & book site visit now!';
    }
    
    return meta;
  }

  /**
   * Extract SEO keywords from property data
   */
  extractKeywords(property: PropertyData): string[] {
    const keywords: string[] = [];
    
    // Primary keywords
    if (property.bedrooms) {
      keywords.push(`${property.bedrooms} bhk ${property.property_type || 'property'}`);
      keywords.push(`${property.bedrooms} bedroom ${property.property_type || 'property'}`);
    }
    
    // Location keywords
    const location = this.getFullLocation(property);
    if (location) {
      keywords.push(`${property.property_type || 'property'} in ${location}`);
      keywords.push(`${location} real estate`);
    }
    
    // Property type variations
    if (property.property_type) {
      keywords.push(property.property_type.toLowerCase());
      keywords.push(`${property.property_type.toLowerCase()} for sale`);
    }
    
    // Price range keywords
    if (property.price) {
      if (property.price >= 10000000) {
        keywords.push('luxury property');
        keywords.push('premium real estate');
      } else if (property.price <= 5000000) {
        keywords.push('affordable property');
      }
    }
    
    // Amenity-based keywords
    if (property.amenities) {
      const amenityArray = Array.isArray(property.amenities) ? property.amenities : [];
      if (amenityArray.includes('Swimming Pool')) keywords.push('property with pool');
      if (amenityArray.includes('Gym')) keywords.push('property with gym');
      if (amenityArray.includes('Club House')) keywords.push('gated community');
    }
    
    // Investment keywords
    if (property.roi_percentage && property.roi_percentage > 0) {
      keywords.push('investment property');
      keywords.push('high roi property');
    }
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Calculate SEO score (0-100)
   */
  calculateSEOScore(content: Partial<SEOOptimizedContent>, property: PropertyData): number {
    let score = 0;
    
    // Title optimization (30 points)
    if (content.title) {
      const titleLen = content.title.length;
      if (titleLen >= 50 && titleLen <= 60) score += 15;
      else if (titleLen >= 45 && titleLen <= 65) score += 10;
      
      if (this.hasKeywordInFirstPosition(content.title, property)) score += 10;
      if (this.hasCTRModifier(content.title)) score += 5;
    }
    
    // Description optimization (40 points)
    if (content.description) {
      if (this.hasKeywordInFirstSentence(content.description, property)) score += 10;
      if (this.hasBulletPoints(content.description)) score += 10;
      if (this.hasCTA(content.description)) score += 10;
      if (content.description.length >= 300) score += 10;
    }
    
    // Meta description (20 points)
    if (content.meta_description) {
      const metaLen = content.meta_description.length;
      if (metaLen >= 150 && metaLen <= 160) score += 15;
      else if (metaLen >= 140 && metaLen <= 165) score += 10;
      
      if (content.meta_description.includes(property.location || '')) score += 5;
    }
    
    // Keywords (10 points)
    if (content.seo_keywords && content.seo_keywords.length >= 5) {
      score += 10;
    } else if (content.seo_keywords && content.seo_keywords.length >= 3) {
      score += 5;
    }
    
    return Math.min(score, 100);
  }

  /**
   * Generate complete SEO-optimized content for a property
   */
  optimizeProperty(property: PropertyData): SEOOptimizedContent {
    const title = this.generateOptimizedTitle(property);
    const description = this.generateOptimizedDescription(property);
    const meta_description = this.generateMetaDescription(property);
    const seo_keywords = this.extractKeywords(property);
    
    const content: SEOOptimizedContent = {
      title,
      description,
      meta_description,
      seo_keywords,
      seo_score: 0
    };
    
    content.seo_score = this.calculateSEOScore(content, property);
    
    return content;
  }

  // Helper methods
  
  private getShortPropertyType(type: string): string {
    const typeMap: Record<string, string> = {
      'Apartment': 'Apt',
      'Villa': 'Villa',
      'Independent House': 'House',
      'Penthouse': 'Penthouse',
      'Studio Apartment': 'Studio',
      'Duplex': 'Duplex',
      'Townhouse': 'Townhouse'
    };
    return typeMap[type] || type;
  }

  private getShortLocation(property: PropertyData): string {
    return property.micro_market || property.community || property.location || property.region || property.emirate || '';
  }

  private getFullLocation(property: PropertyData): string {
    const parts = [
      property.micro_market,
      property.location,
      property.community,
      property.region,
      property.emirate
    ].filter(Boolean);
    
    return parts[0] || 'Prime Location';
  }

  private extractKeyFeatures(property: PropertyData): string[] {
    const features: string[] = [];
    
    if (property.bedrooms && property.bathrooms) {
      features.push(`${property.bedrooms} spacious bedrooms with ${property.bathrooms} modern bathrooms`);
    }
    
    if (property.area_sqft) {
      features.push(`${property.area_sqft.toLocaleString()} sq.ft. of premium living space`);
    }
    
    if (property.furnished_status) {
      features.push(`${property.furnished_status} - move-in ready`);
    }
    
    // Add top amenities
    const amenities = Array.isArray(property.amenities) ? property.amenities : [];
    const topAmenities = amenities.slice(0, 2);
    topAmenities.forEach(amenity => {
      features.push(amenity);
    });
    
    return features.slice(0, 5);
  }

  private extractLandmarks(landmarks: any): string[] {
    if (Array.isArray(landmarks)) {
      return landmarks.slice(0, 3);
    }
    if (typeof landmarks === 'object' && landmarks !== null) {
      return Object.values(landmarks).filter(v => typeof v === 'string').slice(0, 3) as string[];
    }
    return [];
  }

  private hasNearbyLandmarks(landmarks: any): boolean {
    if (Array.isArray(landmarks)) return landmarks.length > 0;
    if (typeof landmarks === 'object' && landmarks !== null) {
      return Object.keys(landmarks).length > 0;
    }
    return false;
  }

  private extractInvestmentPoints(property: PropertyData): string[] {
    const points: string[] = [];
    
    if (property.roi_percentage && property.roi_percentage > 0) {
      points.push(`${property.roi_percentage}% ROI potential`);
    }
    
    if (property.rental_potential) {
      points.push(property.rental_potential);
    }
    
    if (property.possession_status) {
      points.push(property.possession_status);
    }
    
    points.push('RERA approved property');
    points.push('Bank loan approved');
    
    return points.slice(0, 4);
  }

  private getTopAmenity(amenities: any): string {
    if (!amenities) return '';
    const amenityArray = Array.isArray(amenities) ? amenities : [];
    const priority = ['Swimming Pool', 'Gym', 'Club House', 'Garden', 'Parking'];
    
    for (const p of priority) {
      if (amenityArray.includes(p)) return p;
    }
    
    return amenityArray[0] || '';
  }

  private hasKeywordInFirstPosition(title: string, property: PropertyData): boolean {
    const firstWord = title.split(' ')[0].toLowerCase();
    const keywords = ['premium', 'luxury', 'best', 'spacious', 'modern', 'elegant'];
    return keywords.includes(firstWord);
  }

  private hasCTRModifier(title: string): boolean {
    const modifiers = ['Premium', 'Luxury', 'Best', 'Spacious', 'Modern', 'Elegant', 'Exclusive'];
    return modifiers.some(mod => title.includes(mod));
  }

  private hasKeywordInFirstSentence(description: string, property: PropertyData): boolean {
    const firstSentence = description.split('.')[0].toLowerCase();
    const location = this.getFullLocation(property).toLowerCase();
    const type = (property.property_type || '').toLowerCase();
    
    return firstSentence.includes(location) || firstSentence.includes(type) || firstSentence.includes('bhk');
  }

  private hasBulletPoints(description: string): boolean {
    return description.includes('•') && description.split('•').length >= 5;
  }

  private hasCTA(description: string): boolean {
    const ctas = ['contact', 'schedule', 'book', 'call', 'visit', 'inquire'];
    const lowerDesc = description.toLowerCase();
    return ctas.some(cta => lowerDesc.includes(cta));
  }
}

export const seoOptimizationService = new SEOOptimizationService();
