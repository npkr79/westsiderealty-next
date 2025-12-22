import { createClient } from '@/lib/supabase/server';

export interface SampleResponseTemplate {
  id: string;
  name: string;
  type: 'market_analysis' | 'property_description' | 'investment_advice' | 'location_overview' | 'custom';
  description: string;
  category: string;
  defaultContext: Record<string, any>;
  variations: {
    short: string;
    medium: string;
    long: string;
  };
  toneAdaptations: {
    professional: Record<string, string>;
    conversational: Record<string, string>;
    technical: Record<string, string>;
    marketing: Record<string, string>;
  };
}

export interface SampleResponseConfig {
  templates: SampleResponseTemplate[];
  contextVariables: {
    [key: string]: {
      type: 'string' | 'number' | 'array' | 'boolean';
      description: string;
      defaultValue?: any;
      options?: any[];
    };
  };
  lengthTargets: {
    short: { min: number; max: number; target: number };
    medium: { min: number; max: number; target: number };
    long: { min: number; max: number; target: number };
  };
}

export interface GeneratedSampleResponse {
  id: string;
  templateId: string;
  type: string;
  content: string;
  wordCount: number;
  characterCount: number;
  generatedAt: string;
  context: Record<string, any>;
  metadata: {
    tone: string;
    length: string;
    processingTime: number;
    template: string;
    version: string;
  };
  quality: {
    score: number;
    factors: {
      relevance: number;
      coherence: number;
      completeness: number;
      engagement: number;
    };
  };
}

export class SampleResponseService {
  private static instance: SampleResponseService;
  private templates: Map<string, SampleResponseTemplate> = new Map();
  private config: SampleResponseConfig;

  constructor() {
    this.config = this.initializeConfig();
    this.loadTemplates();
  }

  static getInstance(): SampleResponseService {
    if (!SampleResponseService.instance) {
      SampleResponseService.instance = new SampleResponseService();
    }
    return SampleResponseService.instance;
  }

  private initializeConfig(): SampleResponseConfig {
    return {
      templates: [],
      contextVariables: {
        cityName: {
          type: 'string',
          description: 'Name of the city for location-specific content',
          defaultValue: 'Hyderabad'
        },
        micromarketName: {
          type: 'string',
          description: 'Specific micro-market or locality name',
          defaultValue: 'Gachibowli'
        },
        projectName: {
          type: 'string',
          description: 'Real estate project name',
          defaultValue: 'Premium Residences'
        },
        developerName: {
          type: 'string',
          description: 'Developer or builder name',
          defaultValue: 'Prestigious Developers'
        },
        avgPrice: {
          type: 'number',
          description: 'Average price per square foot',
          defaultValue: 5500
        },
        priceRange: {
          type: 'string',
          description: 'Price range for properties',
          defaultValue: '₹50 lakhs - ₹1.5 crores'
        },
        appreciation: {
          type: 'number',
          description: 'Annual appreciation percentage',
          defaultValue: 10
        },
        rentalYield: {
          type: 'number',
          description: 'Expected rental yield percentage',
          defaultValue: 7
        },
        propertyType: {
          type: 'string',
          description: 'Type of property (apartments, villas, etc.)',
          defaultValue: 'Apartments',
          options: ['Apartments', 'Villas', 'Plots', 'Commercial', 'Mixed-use']
        },
        configurations: {
          type: 'array',
          description: 'Available property configurations',
          defaultValue: ['2 BHK', '3 BHK', '4 BHK']
        },
        amenities: {
          type: 'array',
          description: 'Key amenities and facilities',
          defaultValue: ['Swimming Pool', 'Gym', 'Clubhouse', 'Security', 'Parking']
        },
        connectivity: {
          type: 'array',
          description: 'Transportation and connectivity options',
          defaultValue: ['Metro', 'Bus Routes', 'Highway Access', 'Airport Proximity']
        },
        targetBuyers: {
          type: 'array',
          description: 'Primary target buyer segments',
          defaultValue: ['IT Professionals', 'Families', 'Investors']
        },
        investorType: {
          type: 'string',
          description: 'Type of investor profile',
          defaultValue: 'First-time investor',
          options: ['First-time investor', 'Experienced investor', 'NRI investor', 'Institutional investor']
        },
        timeframe: {
          type: 'string',
          description: 'Investment or analysis timeframe',
          defaultValue: '3-5 years',
          options: ['1-2 years', '3-5 years', '5-10 years', '10+ years']
        }
      },
      lengthTargets: {
        short: { min: 80, max: 150, target: 120 },
        medium: { min: 250, max: 400, target: 320 },
        long: { min: 500, max: 800, target: 650 }
      }
    };
  }

  private loadTemplates(): void {
    const templates: SampleResponseTemplate[] = [
      {
        id: 'market-analysis-basic',
        name: 'Basic Market Analysis',
        type: 'market_analysis',
        description: 'Comprehensive market analysis with pricing, trends, and investment potential',
        category: 'Market Intelligence',
        defaultContext: {
          cityName: 'Hyderabad',
          avgPrice: 5500,
          appreciation: 10,
          rentalYield: 7,
          topAreas: ['Gachibowli', 'Kondapur', 'Kokapet']
        },
        variations: {
          short: 'market_analysis_short',
          medium: 'market_analysis_medium',
          long: 'market_analysis_long'
        },
        toneAdaptations: {
          professional: {
            vocabulary: 'technical, formal',
            style: 'analytical, data-driven',
            perspective: 'expert analysis'
          },
          conversational: {
            vocabulary: 'accessible, friendly',
            style: 'engaging, relatable',
            perspective: 'helpful advisor'
          },
          technical: {
            vocabulary: 'industry-specific, precise',
            style: 'detailed, methodical',
            perspective: 'technical specialist'
          },
          marketing: {
            vocabulary: 'persuasive, benefit-focused',
            style: 'compelling, action-oriented',
            perspective: 'sales consultant'
          }
        }
      },
      {
        id: 'property-description-detailed',
        name: 'Detailed Property Description',
        type: 'property_description',
        description: 'Comprehensive property description with features, amenities, and location benefits',
        category: 'Property Marketing',
        defaultContext: {
          projectName: 'Premium Residences',
          developerName: 'Prestigious Developers',
          location: 'Gachibowli',
          configurations: ['2 BHK', '3 BHK'],
          priceRange: '₹60 lakhs - ₹1.2 crores'
        },
        variations: {
          short: 'property_description_short',
          medium: 'property_description_medium',
          long: 'property_description_long'
        },
        toneAdaptations: {
          professional: {
            vocabulary: 'formal, precise',
            style: 'informative, structured',
            perspective: 'property consultant'
          },
          conversational: {
            vocabulary: 'warm, inviting',
            style: 'storytelling, lifestyle-focused',
            perspective: 'friendly guide'
          },
          technical: {
            vocabulary: 'specifications, measurements',
            style: 'detailed, factual',
            perspective: 'technical expert'
          },
          marketing: {
            vocabulary: 'aspirational, benefit-rich',
            style: 'persuasive, emotional',
            perspective: 'lifestyle marketer'
          }
        }
      },
      {
        id: 'investment-advice-strategic',
        name: 'Strategic Investment Advice',
        type: 'investment_advice',
        description: 'Strategic investment guidance with risk assessment and return projections',
        category: 'Investment Strategy',
        defaultContext: {
          investorType: 'First-time investor',
          location: 'Hyderabad',
          budgetRange: '₹50 lakhs - 1.5 crores',
          timeframe: '5-7 years'
        },
        variations: {
          short: 'investment_advice_short',
          medium: 'investment_advice_medium',
          long: 'investment_advice_long'
        },
        toneAdaptations: {
          professional: {
            vocabulary: 'financial, analytical',
            style: 'advisory, structured',
            perspective: 'investment advisor'
          },
          conversational: {
            vocabulary: 'practical, understandable',
            style: 'guidance-focused, supportive',
            perspective: 'trusted mentor'
          },
          technical: {
            vocabulary: 'financial metrics, analysis',
            style: 'quantitative, precise',
            perspective: 'financial analyst'
          },
          marketing: {
            vocabulary: 'opportunity-focused, compelling',
            style: 'motivational, action-driven',
            perspective: 'investment promoter'
          }
        }
      },
      {
        id: 'location-overview-comprehensive',
        name: 'Comprehensive Location Overview',
        type: 'location_overview',
        description: 'Detailed location analysis with connectivity, amenities, and growth prospects',
        category: 'Location Intelligence',
        defaultContext: {
          locationName: 'Gachibowli',
          cityName: 'Hyderabad',
          distanceFromCenter: '15 km',
          connectivity: ['Metro', 'IT Parks', 'Airport']
        },
        variations: {
          short: 'location_overview_short',
          medium: 'location_overview_medium',
          long: 'location_overview_long'
        },
        toneAdaptations: {
          professional: {
            vocabulary: 'geographical, analytical',
            style: 'informative, comprehensive',
            perspective: 'location expert'
          },
          conversational: {
            vocabulary: 'lifestyle-focused, relatable',
            style: 'descriptive, engaging',
            perspective: 'local guide'
          },
          technical: {
            vocabulary: 'infrastructure, specifications',
            style: 'detailed, factual',
            perspective: 'urban planner'
          },
          marketing: {
            vocabulary: 'advantage-focused, attractive',
            style: 'promotional, compelling',
            perspective: 'location marketer'
          }
        }
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  async generateSampleResponse(
    templateId: string,
    context: Record<string, any> = {},
    length: 'short' | 'medium' | 'long' = 'medium',
    tone: 'professional' | 'conversational' | 'technical' | 'marketing' = 'professional'
  ): Promise<GeneratedSampleResponse> {
    const startTime = Date.now();

    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Merge default context with provided context
      const mergedContext = { ...template.defaultContext, ...context };

      // Generate content based on template and parameters
      const content = await this.generateContent(template, mergedContext, length, tone);

      // Calculate quality metrics
      const quality = this.assessQuality(content, template, length);

      const processingTime = Date.now() - startTime;
      const wordCount = content.split(/\s+/).length;
      const characterCount = content.length;

      const response: GeneratedSampleResponse = {
        id: `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        templateId,
        type: template.type,
        content: content.trim(),
        wordCount,
        characterCount,
        generatedAt: new Date().toISOString(),
        context: mergedContext,
        metadata: {
          tone,
          length,
          processingTime,
          template: template.name,
          version: '1.0'
        },
        quality
      };

      return response;
    } catch (error: any) {
      throw new Error(`Failed to generate sample response: ${error.message}`);
    }
  }

  private async generateContent(
    template: SampleResponseTemplate,
    context: Record<string, any>,
    length: 'short' | 'medium' | 'long',
    tone: string
  ): Promise<string> {
    // This would integrate with the existing content generation system
    // For now, we'll use the template-based approach from the API route

    const baseTemplates = {
      market_analysis: {
        short: (ctx: any) => `
The ${ctx.cityName || 'local'} real estate market is experiencing ${ctx.trend || 'steady growth'} with average prices at ₹${ctx.avgPrice || '5,500'}/sqft. 
Current market dynamics show ${ctx.demandLevel || 'strong'} demand from ${ctx.buyerSegment || 'IT professionals and young families'}, 
driven by ${ctx.growthDriver || 'infrastructure development and employment growth'}. 
Investment potential remains ${ctx.potential || 'attractive'} with expected appreciation of ${ctx.appreciation || '8-12%'} annually.
`,
        medium: (ctx: any) => `
${ctx.cityName || 'This market'} presents a compelling real estate investment opportunity with current average pricing at ₹${ctx.avgPrice || '5,500'}/sqft across prime residential areas. 
The market has demonstrated consistent growth over the past ${ctx.timeframe || '3-5 years'}, with key micro-markets like ${ctx.topAreas || 'emerging IT corridors'} leading appreciation trends.

Current market dynamics indicate ${ctx.demandLevel || 'robust'} demand from diverse buyer segments including ${ctx.buyerProfiles || 'first-time homebuyers, upgrade buyers, and investors'}. 
Primary growth drivers include ${ctx.infrastructure || 'metro connectivity expansion'}, ${ctx.employment || 'IT sector growth'}, and ${ctx.amenities || 'lifestyle infrastructure development'}.

Investment analysis suggests ${ctx.roiShort || '15-20%'} returns over 2-3 years for ready properties, while under-construction projects in emerging areas offer ${ctx.roiLong || '35-50%'} potential over 5-7 years. 
Rental yields average ${ctx.rentalYield || '6-8%'} annually, making it attractive for income-focused investors.

Risk factors remain manageable with established developers, RERA compliance, and strong economic fundamentals supporting long-term growth prospects.
`,
        long: (ctx: any) => `
The ${ctx.cityName || 'metropolitan'} real estate market represents one of India's most dynamic property investment destinations, characterized by sustained growth, diverse inventory, and strong fundamentals. 
Current market analysis reveals average residential pricing at ₹${ctx.avgPrice || '5,500'}/sqft, with premium micro-markets commanding ₹${ctx.premiumPrice || '8,000-12,000'}/sqft and emerging areas offering entry points at ₹${ctx.affordablePrice || '3,500-4,500'}/sqft.

**Market Performance & Trends**
Historical data demonstrates consistent appreciation averaging ${ctx.historicalGrowth || '8-10%'} annually over the past decade, with certain micro-markets like ${ctx.topPerformers || 'IT corridor areas'} achieving ${ctx.topGrowth || '12-15%'} growth rates. 
Transaction volumes have increased by ${ctx.volumeGrowth || '25-30%'} year-over-year, indicating strong market confidence and liquidity.

**Demand Drivers & Buyer Segments**
Primary demand originates from ${ctx.primaryBuyers || 'IT professionals (40%), upgrade buyers (25%), and investors (35%)'}, supported by ${ctx.employmentGrowth || 'robust job creation in technology and financial services sectors'}. 
Infrastructure catalysts include ${ctx.infrastructure || 'metro expansion, highway connectivity, and airport proximity'}, creating accessibility premiums across connected corridors.

**Investment Potential & Returns**
Short-term investment opportunities (1-3 years) in ready-to-move properties offer ${ctx.shortTermROI || '15-25%'} capital appreciation with immediate rental income potential of ${ctx.rentalYield || '6-8%'} annually. 
Medium-term strategies (3-5 years) focusing on under-construction projects in growth corridors present ${ctx.mediumTermROI || '35-50%'} appreciation potential, benefiting from infrastructure completion and area maturation.

Long-term wealth creation (5-10 years) through strategic micro-market selection offers ${ctx.longTermROI || '60-100%'} returns, particularly in areas undergoing transformation through planned developments and connectivity improvements.

**Risk Assessment & Mitigation**
Market risks remain well-contained through diversified economic base, regulatory oversight via RERA, and established developer ecosystem. 
Key risk mitigation strategies include thorough due diligence, developer track record verification, and strategic timing aligned with infrastructure completion cycles.

**Future Outlook**
Market projections indicate continued growth supported by ${ctx.futureDrivers || 'technology sector expansion, infrastructure investments, and demographic trends'}. 
Expected price trajectory suggests ${ctx.futureGrowth || '8-12%'} annual appreciation over the next 5 years, with select micro-markets potentially outperforming market averages by ${ctx.outperformance || '2-4%'}.
`
      }
      // Add other template types as needed
    };

    const templateFunction = baseTemplates[template.type]?.[length];
    if (!templateFunction) {
      throw new Error(`Template function not found for ${template.type}:${length}`);
    }

    let content = templateFunction(context);

    // Apply tone adaptations
    content = this.applyToneAdaptation(content, template.toneAdaptations[tone] || {});

    return content;
  }

  private applyToneAdaptation(content: string, toneConfig: Record<string, string>): string {
    // Simple tone adaptation - in a real implementation, this would be more sophisticated
    let adaptedContent = content;

    if (toneConfig.style === 'conversational, friendly') {
      adaptedContent = adaptedContent.replace(/demonstrates/g, 'shows');
      adaptedContent = adaptedContent.replace(/indicates/g, 'suggests');
      adaptedContent = adaptedContent.replace(/Furthermore/g, 'Also');
    }

    if (toneConfig.style === 'compelling, action-oriented') {
      adaptedContent = adaptedContent.replace(/opportunity/g, 'golden opportunity');
      adaptedContent = adaptedContent.replace(/potential/g, 'exciting potential');
      adaptedContent = adaptedContent.replace(/Consider/g, 'Don\'t miss out on');
    }

    return adaptedContent;
  }

  private assessQuality(
    content: string,
    template: SampleResponseTemplate,
    length: 'short' | 'medium' | 'long'
  ): { score: number; factors: { relevance: number; coherence: number; completeness: number; engagement: number } } {
    const wordCount = content.split(/\s+/).length;
    const target = this.config.lengthTargets[length];

    // Simple quality assessment
    const lengthScore = Math.max(0, 1 - Math.abs(wordCount - target.target) / target.target);
    
    // Basic content quality checks
    const hasStructure = content.includes('**') || content.includes('###') || content.includes('-');
    const hasNumbers = /\d+/.test(content);
    const hasKeywords = template.type === 'market_analysis' ? 
      /market|price|investment|return|yield/i.test(content) : true;

    const factors = {
      relevance: hasKeywords ? 0.9 : 0.6,
      coherence: hasStructure ? 0.8 : 0.6,
      completeness: lengthScore,
      engagement: hasNumbers && hasStructure ? 0.8 : 0.6
    };

    const score = (factors.relevance + factors.coherence + factors.completeness + factors.engagement) / 4;

    return { score, factors };
  }

  getAvailableTemplates(): SampleResponseTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplate(templateId: string): SampleResponseTemplate | undefined {
    return this.templates.get(templateId);
  }

  getContextVariables(): typeof this.config.contextVariables {
    return this.config.contextVariables;
  }

  async saveSampleResponse(response: GeneratedSampleResponse): Promise<void> {
    try {
      const supabase = await createClient();
      
      const { error } = await supabase
        .from('sample_responses')
        .insert([{
          id: response.id,
          template_id: response.templateId,
          type: response.type,
          content: response.content,
          word_count: response.wordCount,
          character_count: response.characterCount,
          context: response.context,
          metadata: response.metadata,
          quality_score: response.quality.score,
          quality_factors: response.quality.factors,
          created_at: response.generatedAt
        }]);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Error saving sample response:', error);
      throw new Error(`Failed to save sample response: ${error.message}`);
    }
  }

  async getSampleResponseHistory(limit: number = 50): Promise<GeneratedSampleResponse[]> {
    try {
      const supabase = await createClient();
      
      const { data, error } = await supabase
        .from('sample_responses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data?.map(row => ({
        id: row.id,
        templateId: row.template_id,
        type: row.type,
        content: row.content,
        wordCount: row.word_count,
        characterCount: row.character_count,
        generatedAt: row.created_at,
        context: row.context,
        metadata: row.metadata,
        quality: {
          score: row.quality_score,
          factors: row.quality_factors
        }
      })) || [];
    } catch (error: any) {
      console.error('Error fetching sample response history:', error);
      return [];
    }
  }
}

// Export singleton instance
export const sampleResponseService = SampleResponseService.getInstance();