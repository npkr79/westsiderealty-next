import { contentQualityService } from './contentQualityService';
import type { GeneratedContent } from './contentStorageService';

export interface TextResponseMetrics {
  wordCount: number;
  readabilityScore: number;
  sentimentScore: number;
  keywordDensity: Record<string, number>;
  structureScore: number;
  engagementScore: number;
}

export interface EnhancedTextResponse {
  originalContent: string;
  enhancedContent: string;
  improvements: string[];
  metrics: TextResponseMetrics;
  qualityScore: number;
  suggestions: string[];
  processingTime: number;
}

export interface TextResponseTemplate {
  id: string;
  name: string;
  description: string;
  structure: string[];
  minWordCount: number;
  maxWordCount: number;
  requiredElements: string[];
  sampleContent: string;
}

export class EnhancedTextResponseService {
  private static instance: EnhancedTextResponseService;
  private responseCache = new Map<string, EnhancedTextResponse>();
  private templates: TextResponseTemplate[] = [];

  public static getInstance(): EnhancedTextResponseService {
    if (!EnhancedTextResponseService.instance) {
      EnhancedTextResponseService.instance = new EnhancedTextResponseService();
    }
    return EnhancedTextResponseService.instance;
  }

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize predefined response templates
   */
  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'property-description',
        name: 'Property Description Template',
        description: 'Comprehensive property description for real estate listings',
        structure: [
          'Opening Hook (25-50 words)',
          'Key Features (100-150 words)', 
          'Location Advantages (75-100 words)',
          'Investment Potential (50-75 words)',
          'Call to Action (15-25 words)'
        ],
        minWordCount: 250,
        maxWordCount: 400,
        requiredElements: ['location', 'price', 'features', 'contact'],
        sampleContent: `Discover your dream home in this stunning 3BHK apartment located in the heart of Hyderabad's most sought-after neighborhood. This meticulously designed residence offers spacious living areas, modern amenities, and breathtaking city views.

**Key Features:**
- Spacious 1,450 sq ft layout with optimal space utilization
- Premium finishes including vitrified tiles and modular kitchen
- 24/7 security with CCTV surveillance and intercom facility
- World-class amenities: swimming pool, gym, children's play area
- Covered parking and 100% power backup

**Prime Location Benefits:**
Located in Gachibowli, just 2km from major IT hubs including Microsoft and Google offices. Excellent connectivity via metro and bus routes. Top-rated schools, hospitals, and shopping malls within 3km radius.

**Investment Potential:**
With 12% annual appreciation and 6% rental yield, this property offers excellent ROI. The area's rapid infrastructure development ensures long-term value growth.

Contact us today to schedule a site visit and secure your future!`
      },
      {
        id: 'market-analysis',
        name: 'Market Analysis Template',
        description: 'Detailed real estate market analysis and trends',
        structure: [
          'Market Overview (50-75 words)',
          'Current Trends (100-125 words)',
          'Price Analysis (75-100 words)',
          'Future Outlook (75-100 words)',
          'Investment Recommendations (50-75 words)'
        ],
        minWordCount: 350,
        maxWordCount: 500,
        requiredElements: ['statistics', 'trends', 'forecast', 'recommendations'],
        sampleContent: `The Hyderabad real estate market continues to demonstrate robust growth with steady demand across all segments. Current market dynamics show strong fundamentals driven by IT sector expansion and infrastructure development.

**Current Market Trends:**
- Average price appreciation of 8-12% annually across prime micro-markets
- Increased demand for ready-to-move properties post-pandemic
- Growing preference for gated communities with comprehensive amenities
- Rising interest in sustainable and smart home features
- Strong rental market with yields ranging from 3-7% depending on location

**Price Analysis:**
Current average prices range from ₹4,500/sq ft in emerging areas to ₹8,500/sq ft in established localities. Premium segments command ₹10,000+/sq ft. Price stability observed with gradual upward trajectory supported by genuine demand.

**Future Outlook:**
Infrastructure projects including metro expansion and IT corridor development will drive growth. Expected 15-20% appreciation over next 3 years in well-connected areas. Supply-demand balance remains favorable for sustained growth.

**Investment Strategy:**
Focus on emerging micro-markets with infrastructure development pipeline. Diversify across property types and consider both capital appreciation and rental yield potential for optimal returns.`
      },
      {
        id: 'developer-profile',
        name: 'Developer Profile Template',
        description: 'Comprehensive developer company profile and track record',
        structure: [
          'Company Introduction (50-75 words)',
          'Track Record & Experience (100-150 words)',
          'Notable Projects (100-125 words)',
          'Quality Standards (75-100 words)',
          'Awards & Recognition (50-75 words)'
        ],
        minWordCount: 375,
        maxWordCount: 525,
        requiredElements: ['experience', 'projects', 'quality', 'achievements'],
        sampleContent: `Established in 1995, ABC Developers has emerged as one of Hyderabad's most trusted real estate companies, delivering premium residential and commercial projects across the city's prime locations.

**Track Record & Experience:**
With 28+ years of industry experience, ABC Developers has successfully completed 45+ projects, delivering over 15,000 units to satisfied customers. The company maintains an impeccable track record of on-time project completion with zero legal disputes. Their portfolio spans across luxury villas, premium apartments, and commercial complexes, catering to diverse market segments from affordable housing to ultra-luxury developments.

**Notable Projects:**
- Signature Towers, Gachibowli: 500-unit luxury complex with world-class amenities
- Green Valley Villas, Kokapet: 150 premium villas with sustainable design features  
- Tech Park Plaza, Hitec City: 2 million sq ft commercial development
- Sunrise Apartments, Kondapur: 800-unit mid-segment housing project

**Quality Standards:**
All projects feature premium construction materials, earthquake-resistant RCC structure, and modern amenities. The company follows strict quality control processes with third-party audits and maintains ISO 9001:2015 certification for quality management systems.

**Recognition:**
Winner of "Best Residential Developer" award 2022-23 and CREDAI Excellence Award for customer satisfaction. IGBC certified for green building practices across multiple projects.`
      }
    ];
  }

  /**
   * Enhance a text response with improved quality, structure, and engagement
   */
  async enhanceTextResponse(
    originalText: string,
    context: {
      type?: string;
      targetAudience?: string;
      keywords?: string[];
      minWords?: number;
      maxWords?: number;
    } = {}
  ): Promise<EnhancedTextResponse> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(originalText, context);
    if (this.responseCache.has(cacheKey)) {
      return this.responseCache.get(cacheKey)!;
    }

    try {
      // Analyze original text
      const originalMetrics = this.analyzeText(originalText);
      
      // Apply enhancements
      const enhancedContent = await this.applyEnhancements(originalText, context);
      
      // Analyze enhanced text
      const enhancedMetrics = this.analyzeText(enhancedContent);
      
      // Generate improvement summary
      const improvements = this.generateImprovements(originalMetrics, enhancedMetrics);
      
      // Generate suggestions for further improvement
      const suggestions = this.generateSuggestions(enhancedContent, context);
      
      // Calculate overall quality score
      const qualityScore = this.calculateQualityScore(enhancedMetrics, context);
      
      const result: EnhancedTextResponse = {
        originalContent: originalText,
        enhancedContent,
        improvements,
        metrics: enhancedMetrics,
        qualityScore,
        suggestions,
        processingTime: Date.now() - startTime
      };

      // Cache the result
      this.responseCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error enhancing text response:', error);
      throw new Error(`Failed to enhance text response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply various enhancements to improve text quality
   */
  private async applyEnhancements(text: string, context: any): Promise<string> {
    let enhanced = text;

    // 1. Fix basic grammar and formatting
    enhanced = this.fixBasicGrammar(enhanced);
    
    // 2. Improve structure and flow
    enhanced = this.improveStructure(enhanced);
    
    // 3. Enhance readability
    enhanced = this.enhanceReadability(enhanced);
    
    // 4. Add engaging elements
    enhanced = this.addEngagingElements(enhanced, context);
    
    // 5. Optimize for SEO if keywords provided
    if (context.keywords && context.keywords.length > 0) {
      enhanced = this.optimizeForSEO(enhanced, context.keywords);
    }
    
    // 6. Ensure proper length
    enhanced = this.adjustLength(enhanced, context.minWords, context.maxWords);

    return enhanced;
  }

  /**
   * Fix basic grammar and formatting issues
   */
  private fixBasicGrammar(text: string): string {
    let fixed = text;
    
    // Fix common grammar issues
    fixed = fixed.replace(/\bi\b/g, 'I'); // Capitalize 'I'
    fixed = fixed.replace(/\s+/g, ' '); // Remove extra spaces
    fixed = fixed.replace(/\.{2,}/g, '.'); // Fix multiple periods
    fixed = fixed.replace(/\?{2,}/g, '?'); // Fix multiple question marks
    fixed = fixed.replace(/!{2,}/g, '!'); // Fix multiple exclamation marks
    
    // Ensure proper sentence spacing
    fixed = fixed.replace(/\.(\w)/g, '. $1');
    fixed = fixed.replace(/\?(\w)/g, '? $1');
    fixed = fixed.replace(/!(\w)/g, '! $1');
    
    // Capitalize first letter of sentences
    fixed = fixed.replace(/(^|\. )([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    
    return fixed.trim();
  }

  /**
   * Improve text structure and flow
   */
  private improveStructure(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length < 3) return text;
    
    // Group sentences into paragraphs
    const paragraphs: string[] = [];
    let currentParagraph: string[] = [];
    
    sentences.forEach((sentence, index) => {
      currentParagraph.push(sentence.trim());
      
      // Create new paragraph every 3-4 sentences or at logical breaks
      if (currentParagraph.length >= 3 || this.isLogicalBreak(sentence, sentences[index + 1])) {
        paragraphs.push(currentParagraph.join('. ') + '.');
        currentParagraph = [];
      }
    });
    
    // Add remaining sentences
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join('. ') + '.');
    }
    
    return paragraphs.join('\n\n');
  }

  /**
   * Check if there should be a logical break between sentences
   */
  private isLogicalBreak(current: string, next?: string): boolean {
    if (!next) return true;
    
    const transitionWords = ['however', 'moreover', 'furthermore', 'additionally', 'meanwhile', 'consequently'];
    const nextLower = next.toLowerCase().trim();
    
    return transitionWords.some(word => nextLower.startsWith(word));
  }

  /**
   * Enhance readability with better word choice and sentence variety
   */
  private enhanceReadability(text: string): string {
    let enhanced = text;
    
    // Replace weak words with stronger alternatives
    const replacements = {
      'very good': 'excellent',
      'very bad': 'terrible',
      'very big': 'enormous',
      'very small': 'tiny',
      'a lot of': 'numerous',
      'lots of': 'many',
      'thing': 'aspect',
      'stuff': 'features',
      'nice': 'appealing',
      'great': 'outstanding',
      'awesome': 'remarkable'
    };
    
    Object.entries(replacements).forEach(([weak, strong]) => {
      const regex = new RegExp(`\\b${weak}\\b`, 'gi');
      enhanced = enhanced.replace(regex, strong);
    });
    
    return enhanced;
  }

  /**
   * Add engaging elements like bullet points, headers, and calls to action
   */
  private addEngagingElements(text: string, context: any): string {
    let enhanced = text;
    
    // Add bullet points for lists
    enhanced = this.convertToLists(enhanced);
    
    // Add emphasis to important points
    enhanced = this.addEmphasis(enhanced);
    
    // Add call to action if appropriate
    if (context.type === 'property-description' || context.type === 'marketing') {
      enhanced = this.addCallToAction(enhanced);
    }
    
    return enhanced;
  }

  /**
   * Convert appropriate content to bullet point lists
   */
  private convertToLists(text: string): string {
    // Look for sentences that could be converted to lists
    const listIndicators = /(\d+\.|•|-)?\s*(features?|benefits?|advantages?|amenities?).*?:/gi;
    
    return text.replace(listIndicators, (match) => {
      return `\n**${match.trim()}**\n`;
    });
  }

  /**
   * Add emphasis to important terms
   */
  private addEmphasis(text: string): string {
    const importantTerms = [
      'premium', 'luxury', 'exclusive', 'prime location', 'world-class',
      'state-of-the-art', 'award-winning', 'certified', 'guaranteed'
    ];
    
    let enhanced = text;
    importantTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      enhanced = enhanced.replace(regex, `**${term}**`);
    });
    
    return enhanced;
  }

  /**
   * Add appropriate call to action
   */
  private addCallToAction(text: string): string {
    const ctas = [
      'Contact us today to learn more!',
      'Schedule a site visit now!',
      'Book your dream home today!',
      'Don\'t miss this opportunity - enquire now!',
      'Call us for exclusive offers!'
    ];
    
    // Only add if text doesn't already have a CTA
    const hasCTA = /contact|call|visit|book|enquire/i.test(text);
    if (!hasCTA) {
      const randomCTA = ctas[Math.floor(Math.random() * ctas.length)];
      return text + '\n\n' + randomCTA;
    }
    
    return text;
  }

  /**
   * Optimize text for SEO with natural keyword integration
   */
  private optimizeForSEO(text: string, keywords: string[]): string {
    let optimized = text;
    
    keywords.forEach(keyword => {
      const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(keywordRegex);
      
      // If keyword density is too low, try to add it naturally
      if (!matches || matches.length < 2) {
        optimized = this.addKeywordNaturally(optimized, keyword);
      }
    });
    
    return optimized;
  }

  /**
   * Add keyword naturally to text
   */
  private addKeywordNaturally(text: string, keyword: string): string {
    const sentences = text.split(/[.!?]+/);
    
    // Try to add keyword to first or last sentence
    if (sentences.length > 0) {
      const firstSentence = sentences[0].trim();
      if (!firstSentence.toLowerCase().includes(keyword.toLowerCase())) {
        sentences[0] = `${firstSentence} featuring ${keyword}`;
      }
    }
    
    return sentences.join('. ') + '.';
  }

  /**
   * Adjust text length to meet requirements
   */
  private adjustLength(text: string, minWords?: number, maxWords?: number): string {
    const words = text.split(/\s+/);
    
    if (minWords && words.length < minWords) {
      return this.expandText(text, minWords - words.length);
    }
    
    if (maxWords && words.length > maxWords) {
      return this.trimText(text, maxWords);
    }
    
    return text;
  }

  /**
   * Expand text to meet minimum word count
   */
  private expandText(text: string, additionalWords: number): string {
    // Add descriptive phrases and elaboration
    const expansions = [
      'This exceptional property',
      'Located in a prime area',
      'With modern amenities and facilities',
      'Designed for contemporary living',
      'Offering unparalleled comfort and convenience'
    ];
    
    let expanded = text;
    let wordsAdded = 0;
    
    for (const expansion of expansions) {
      if (wordsAdded >= additionalWords) break;
      
      expanded = expansion + ' ' + expanded;
      wordsAdded += expansion.split(' ').length;
    }
    
    return expanded;
  }

  /**
   * Trim text to meet maximum word count
   */
  private trimText(text: string, maxWords: number): string {
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;
    
    // Trim from the end, trying to keep complete sentences
    const trimmed = words.slice(0, maxWords).join(' ');
    const lastSentenceEnd = Math.max(
      trimmed.lastIndexOf('.'),
      trimmed.lastIndexOf('!'),
      trimmed.lastIndexOf('?')
    );
    
    if (lastSentenceEnd > trimmed.length * 0.8) {
      return trimmed.substring(0, lastSentenceEnd + 1);
    }
    
    return trimmed + '...';
  }

  /**
   * Analyze text metrics
   */
  private analyzeText(text: string): TextResponseMetrics {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return {
      wordCount: words.length,
      readabilityScore: this.calculateReadabilityScore(text, words, sentences),
      sentimentScore: this.calculateSentimentScore(text),
      keywordDensity: this.calculateKeywordDensity(words),
      structureScore: this.calculateStructureScore(text),
      engagementScore: this.calculateEngagementScore(text)
    };
  }

  /**
   * Calculate readability score (Flesch Reading Ease approximation)
   */
  private calculateReadabilityScore(text: string, words: string[], sentences: string[]): number {
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0) / words.length;
    
    // Simplified Flesch Reading Ease formula
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllables);
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Count syllables in a word (approximation)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    // Adjust for silent 'e'
    if (word.endsWith('e')) count--;
    
    return Math.max(1, count);
  }

  /**
   * Calculate sentiment score (positive/negative sentiment)
   */
  private calculateSentimentScore(text: string): number {
    const positiveWords = [
      'excellent', 'outstanding', 'premium', 'luxury', 'beautiful', 'amazing',
      'perfect', 'wonderful', 'fantastic', 'great', 'good', 'best', 'top'
    ];
    
    const negativeWords = [
      'poor', 'bad', 'terrible', 'awful', 'horrible', 'worst', 'disappointing',
      'inadequate', 'insufficient', 'limited', 'lacking', 'deficient'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
    
    const totalSentimentWords = positiveCount + negativeCount;
    if (totalSentimentWords === 0) return 50; // Neutral
    
    return (positiveCount / totalSentimentWords) * 100;
  }

  /**
   * Calculate keyword density for important terms
   */
  private calculateKeywordDensity(words: string[]): Record<string, number> {
    const importantKeywords = [
      'property', 'apartment', 'villa', 'investment', 'location', 'amenities',
      'price', 'sqft', 'bhk', 'luxury', 'premium', 'developer'
    ];
    
    const density: Record<string, number> = {};
    const totalWords = words.length;
    
    importantKeywords.forEach(keyword => {
      const count = words.filter(word => 
        word.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      density[keyword] = totalWords > 0 ? (count / totalWords) * 100 : 0;
    });
    
    return density;
  }

  /**
   * Calculate structure score based on formatting and organization
   */
  private calculateStructureScore(text: string): number {
    let score = 0;
    
    // Check for paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length > 1) score += 20;
    
    // Check for headers
    if (/#{1,6}|^\*\*.*\*\*$/m.test(text)) score += 20;
    
    // Check for lists
    if (/^\s*[-•*]\s+/m.test(text) || /^\s*\d+\.\s+/m.test(text)) score += 20;
    
    // Check for emphasis
    if (/\*\*.*\*\*|\*.*\*/.test(text)) score += 20;
    
    // Check for proper sentence structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = text.split(/\s+/).length / sentences.length;
    if (avgSentenceLength >= 10 && avgSentenceLength <= 25) score += 20;
    
    return Math.min(100, score);
  }

  /**
   * Calculate engagement score based on engaging elements
   */
  private calculateEngagementScore(text: string): number {
    let score = 0;
    
    // Check for questions
    if (/\?/.test(text)) score += 15;
    
    // Check for call to action
    if (/contact|call|visit|book|enquire|schedule/i.test(text)) score += 25;
    
    // Check for numbers and statistics
    if (/\d+%|\d+\s*(sqft|bhk|cr|lakh|km)/i.test(text)) score += 20;
    
    // Check for emotional words
    const emotionalWords = ['dream', 'perfect', 'ideal', 'amazing', 'stunning', 'beautiful'];
    if (emotionalWords.some(word => text.toLowerCase().includes(word))) score += 20;
    
    // Check for specific details
    if (/₹\d+|Rs\.\s*\d+|\d+\s*BHK/i.test(text)) score += 20;
    
    return Math.min(100, score);
  }

  /**
   * Generate improvement summary
   */
  private generateImprovements(original: TextResponseMetrics, enhanced: TextResponseMetrics): string[] {
    const improvements: string[] = [];
    
    if (enhanced.wordCount > original.wordCount) {
      improvements.push(`Expanded content from ${original.wordCount} to ${enhanced.wordCount} words`);
    }
    
    if (enhanced.readabilityScore > original.readabilityScore) {
      improvements.push(`Improved readability score by ${(enhanced.readabilityScore - original.readabilityScore).toFixed(1)} points`);
    }
    
    if (enhanced.structureScore > original.structureScore) {
      improvements.push(`Enhanced text structure and formatting`);
    }
    
    if (enhanced.engagementScore > original.engagementScore) {
      improvements.push(`Increased engagement elements and call-to-action`);
    }
    
    if (enhanced.sentimentScore > original.sentimentScore) {
      improvements.push(`Improved positive sentiment and tone`);
    }
    
    return improvements;
  }

  /**
   * Generate suggestions for further improvement
   */
  private generateSuggestions(text: string, context: any): string[] {
    const suggestions: string[] = [];
    
    // Word count suggestions
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 200) {
      suggestions.push('Consider adding more detailed descriptions and examples');
    } else if (wordCount > 500) {
      suggestions.push('Content might be too long - consider breaking into sections');
    }
    
    // Structure suggestions
    if (!/#{1,6}|^\*\*.*\*\*$/m.test(text)) {
      suggestions.push('Add headers to improve content organization');
    }
    
    if (!/^\s*[-•*]\s+/m.test(text) && !/^\s*\d+\.\s+/m.test(text)) {
      suggestions.push('Consider using bullet points for key features');
    }
    
    // SEO suggestions
    if (context.keywords && context.keywords.length > 0) {
      const hasKeywords = context.keywords.some((keyword: string) => 
        text.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!hasKeywords) {
        suggestions.push('Include target keywords naturally in the content');
      }
    }
    
    // Engagement suggestions
    if (!/contact|call|visit|book|enquire/i.test(text)) {
      suggestions.push('Add a clear call-to-action to encourage user engagement');
    }
    
    if (!/\d+%|\d+\s*(sqft|bhk|cr|lakh)/i.test(text)) {
      suggestions.push('Include specific numbers and statistics for credibility');
    }
    
    return suggestions;
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(metrics: TextResponseMetrics, context: any): number {
    const weights = {
      readability: 0.25,
      structure: 0.25,
      engagement: 0.25,
      sentiment: 0.15,
      wordCount: 0.10
    };
    
    let wordCountScore = 100;
    if (context.minWords || context.maxWords) {
      const min = context.minWords || 0;
      const max = context.maxWords || 1000;
      if (metrics.wordCount < min || metrics.wordCount > max) {
        wordCountScore = Math.max(0, 100 - Math.abs(metrics.wordCount - (min + max) / 2) / 10);
      }
    }
    
    return Math.round(
      metrics.readabilityScore * weights.readability +
      metrics.structureScore * weights.structure +
      metrics.engagementScore * weights.engagement +
      metrics.sentimentScore * weights.sentiment +
      wordCountScore * weights.wordCount
    );
  }

  /**
   * Generate cache key for response caching
   */
  private generateCacheKey(text: string, context: any): string {
    const contextStr = JSON.stringify(context);
    return `${text.substring(0, 50)}_${contextStr}`.replace(/\s+/g, '_');
  }

  /**
   * Get available templates
   */
  getTemplates(): TextResponseTemplate[] {
    return [...this.templates];
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): TextResponseTemplate | undefined {
    return this.templates.find(template => template.id === id);
  }

  /**
   * Apply template to generate structured content
   */
  async applyTemplate(templateId: string, data: Record<string, any>): Promise<string> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    // Use template sample content as base and customize with provided data
    let content = template.sampleContent;
    
    // Replace placeholders with actual data
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\[${key}\\]`, 'gi');
      content = content.replace(placeholder, String(value));
    });
    
    return content;
  }

  /**
   * Validate content against quality standards
   */
  validateContent(content: string): { isValid: boolean; issues: string[]; score: number } {
    const generatedContent: GeneratedContent = {
      seo_title: 'Sample Title',
      meta_description: 'Sample Description',
      h1_title: 'Sample H1',
      hero_hook: 'Sample Hook',
      overview_seo: content
    };
    
    const qualityCheck = contentQualityService.checkQuality(generatedContent);
    
    return {
      isValid: qualityCheck.passed,
      issues: qualityCheck.issues,
      score: qualityCheck.score
    };
  }

  /**
   * Clear response cache
   */
  clearCache(): void {
    this.responseCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.responseCache.size,
      keys: Array.from(this.responseCache.keys())
    };
  }
}

export const enhancedTextResponseService = EnhancedTextResponseService.getInstance();