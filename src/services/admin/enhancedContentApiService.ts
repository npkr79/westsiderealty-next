import { createClient } from '@/lib/supabase/server';
import { geminiContentService } from './geminiContentService';
import { lovableContentService } from './lovableContentService';
import { perplexityContentService } from './perplexityContentService';
import { contentStorageService } from './contentStorageService';
import { contentQualityService } from './contentQualityService';
import { enhancedTextResponseService } from './enhancedTextResponseService';
import { responseQualityValidator } from './responseQualityValidator';
import { retryService } from './retryService';
import { usageTrackingService } from './usageTrackingService';
import { errorHandlingService } from './errorHandlingService';
import type { GenerateContentRequest, GenerateContentResponse } from './geminiContentService';
import type { EnhancedTextResponse, TextResponseTemplate } from './enhancedTextResponseService';
import type { QualityReport } from './responseQualityValidator';

export interface EnhancedGenerateContentRequest extends GenerateContentRequest {
  enhanceResponses?: boolean;
  validateQuality?: boolean;
  templateId?: string;
  customContext?: {
    targetAudience?: string;
    tone?: 'professional' | 'casual' | 'technical' | 'marketing';
    keywords?: string[];
    minWords?: number;
    maxWords?: number;
    requiredElements?: string[];
  };
}

export interface EnhancedGenerateContentResponse extends GenerateContentResponse {
  enhanced?: boolean;
  qualityReport?: QualityReport;
  enhancements?: Record<string, EnhancedTextResponse>;
  processingMetrics?: {
    originalProcessingTime: number;
    enhancementTime: number;
    validationTime: number;
    totalTime: number;
  };
}

export interface ContentProcessingOptions {
  provider?: 'gemini' | 'lovable' | 'perplexity';
  enhanceText?: boolean;
  validateQuality?: boolean;
  useTemplate?: string;
  retryOnFailure?: boolean;
  maxRetries?: number;
  cacheResults?: boolean;
}

export class EnhancedContentApiService {
  private static instance: EnhancedContentApiService;
  private processingCache = new Map<string, EnhancedGenerateContentResponse>();
  private readonly DEFAULT_OPTIONS: ContentProcessingOptions = {
    provider: 'gemini',
    enhanceText: true,
    validateQuality: true,
    retryOnFailure: true,
    maxRetries: 3,
    cacheResults: true
  };

  public static getInstance(): EnhancedContentApiService {
    if (!EnhancedContentApiService.instance) {
      EnhancedContentApiService.instance = new EnhancedContentApiService();
    }
    return EnhancedContentApiService.instance;
  }

  /**
   * Generate enhanced content with quality validation and text improvements
   */
  async generateEnhancedContent(
    request: EnhancedGenerateContentRequest,
    options: ContentProcessingOptions = {}
  ): Promise<EnhancedGenerateContentResponse> {
    const startTime = Date.now();
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      console.log('🚀 Starting enhanced content generation:', {
        pageType: request.pageType,
        entityId: request.entityId,
        sections: request.sections,
        options: opts
      });

      // Check cache first
      const cacheKey = this.generateCacheKey(request, opts);
      if (opts.cacheResults && this.processingCache.has(cacheKey)) {
        console.log('📋 Returning cached result');
        return this.processingCache.get(cacheKey)!;
      }

      // Step 1: Generate base content using selected provider
      const baseResponse = await this.generateBaseContent(request, opts);
      const originalProcessingTime = Date.now() - startTime;

      // Step 2: Apply template if specified
      if (request.templateId) {
        await this.applyTemplate(baseResponse, request.templateId, request.context);
      }

      // Step 3: Enhance text responses if enabled
      const enhancementStartTime = Date.now();
      const enhancements: Record<string, EnhancedTextResponse> = {};
      
      if (opts.enhanceText && request.enhanceResponses !== false) {
        console.log('✨ Enhancing text responses...');
        
        for (const [sectionKey, sectionData] of Object.entries(baseResponse.results)) {
          if (sectionData.content && sectionData.content.length > 50) {
            try {
              const enhancement = await enhancedTextResponseService.enhanceTextResponse(
                sectionData.content,
                {
                  type: request.pageType,
                  ...request.customContext
                }
              );
              
              enhancements[sectionKey] = enhancement;
              
              // Update the base response with enhanced content
              baseResponse.results[sectionKey] = {
                ...sectionData,
                content: enhancement.enhancedContent,
                wordCount: enhancement.metrics.wordCount,
                enhanced: true
              };
              
              console.log(`📝 Enhanced ${sectionKey}: ${enhancement.improvements.length} improvements`);
            } catch (error) {
              console.error(`❌ Failed to enhance ${sectionKey}:`, error);
              // Continue with original content if enhancement fails
            }
          }
        }
      }
      
      const enhancementTime = Date.now() - enhancementStartTime;

      // Step 4: Validate quality if enabled
      const validationStartTime = Date.now();
      let qualityReport: QualityReport | undefined;
      
      if (opts.validateQuality && request.validateQuality !== false) {
        console.log('🔍 Validating content quality...');
        
        try {
          // Combine all content for overall quality assessment
          const combinedContent = Object.values(baseResponse.results)
            .map(r => r.content)
            .join('\n\n');
          
          qualityReport = responseQualityValidator.validateContent(
            combinedContent,
            request.customContext
          );
          
          console.log(`📊 Quality Report: ${qualityReport.grade} (${qualityReport.overallScore}/100)`);
          
          // If quality is too low and retries are enabled, try to improve
          if (!qualityReport.passed && opts.retryOnFailure && qualityReport.overallScore < 60) {
            console.log('🔄 Quality below threshold, attempting improvement...');
            return this.retryWithImprovements(request, baseResponse, qualityReport, opts);
          }
          
        } catch (error) {
          console.error('❌ Quality validation failed:', error);
          // Continue without quality report if validation fails
        }
      }
      
      const validationTime = Date.now() - validationStartTime;
      const totalTime = Date.now() - startTime;

      // Step 5: Prepare enhanced response
      const enhancedResponse: EnhancedGenerateContentResponse = {
        ...baseResponse,
        enhanced: opts.enhanceText || false,
        qualityReport,
        enhancements: Object.keys(enhancements).length > 0 ? enhancements : undefined,
        processingMetrics: {
          originalProcessingTime,
          enhancementTime,
          validationTime,
          totalTime
        }
      };

      // Cache the result
      if (opts.cacheResults) {
        this.processingCache.set(cacheKey, enhancedResponse);
      }

      // Track usage
      await this.trackUsage(request, enhancedResponse, opts);

      console.log('✅ Enhanced content generation completed:', {
        totalTime,
        enhanced: !!enhancedResponse.enhanced,
        qualityScore: qualityReport?.overallScore,
        sectionsProcessed: Object.keys(baseResponse.results).length
      });

      return enhancedResponse;

    } catch (error: any) {
      console.error('❌ Enhanced content generation failed:', error);
      
      // Use error handling service for structured error response
      const handledError = await errorHandlingService.handleError(error, {
        operation: 'generateEnhancedContent',
        context: { request, options: opts }
      });
      
      throw new Error(`Enhanced content generation failed: ${handledError.message}`);
    }
  }

  /**
   * Generate base content using selected provider
   */
  private async generateBaseContent(
    request: EnhancedGenerateContentRequest,
    options: ContentProcessingOptions
  ): Promise<GenerateContentResponse> {
    const { provider, retryOnFailure, maxRetries } = options;
    
    const generateFunction = async (): Promise<GenerateContentResponse> => {
      switch (provider) {
        case 'gemini':
          return geminiContentService.generateContent(request);
        case 'lovable':
          return lovableContentService.generateContent(request);
        case 'perplexity':
          return perplexityContentService.generateContent(request);
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    };

    if (retryOnFailure) {
      return retryService.executeWithRetry(
        generateFunction,
        maxRetries || 3,
        1000, // 1 second base delay
        `generate-content-${provider}`
      );
    }

    return generateFunction();
  }

  /**
   * Apply template to generated content
   */
  private async applyTemplate(
    response: GenerateContentResponse,
    templateId: string,
    context: Record<string, any>
  ): Promise<void> {
    try {
      const template = enhancedTextResponseService.getTemplate(templateId);
      if (!template) {
        console.warn(`Template not found: ${templateId}`);
        return;
      }

      console.log(`📋 Applying template: ${template.name}`);

      // Apply template to each section that needs it
      for (const [sectionKey, sectionData] of Object.entries(response.results)) {
        if (sectionData.content && template.structure.length > 0) {
          try {
            const templatedContent = await enhancedTextResponseService.applyTemplate(
              templateId,
              { ...context, originalContent: sectionData.content }
            );
            
            response.results[sectionKey] = {
              ...sectionData,
              content: templatedContent,
              templated: true
            };
          } catch (error) {
            console.error(`Failed to apply template to ${sectionKey}:`, error);
            // Continue with original content
          }
        }
      }
    } catch (error) {
      console.error('Template application failed:', error);
      // Continue without template
    }
  }

  /**
   * Retry content generation with quality improvements
   */
  private async retryWithImprovements(
    request: EnhancedGenerateContentRequest,
    baseResponse: GenerateContentResponse,
    qualityReport: QualityReport,
    options: ContentProcessingOptions
  ): Promise<EnhancedGenerateContentResponse> {
    console.log('🔄 Retrying with quality improvements...');
    
    // Enhance the request with quality improvement context
    const improvedRequest: EnhancedGenerateContentRequest = {
      ...request,
      customContext: {
        ...request.customContext,
        qualityIssues: qualityReport.recommendations,
        targetScore: 70,
        improvementFocus: this.getImprovementFocus(qualityReport)
      }
    };

    // Retry with enhanced context
    return this.generateEnhancedContent(improvedRequest, {
      ...options,
      retryOnFailure: false // Prevent infinite retry loop
    });
  }

  /**
   * Determine improvement focus based on quality report
   */
  private getImprovementFocus(qualityReport: QualityReport): string[] {
    const focus: string[] = [];
    
    qualityReport.results.forEach(({ rule, result }) => {
      if (!result.passed && rule.severity === 'error') {
        focus.push(rule.category);
      }
    });
    
    return [...new Set(focus)]; // Remove duplicates
  }

  /**
   * Track usage metrics
   */
  private async trackUsage(
    request: EnhancedGenerateContentRequest,
    response: EnhancedGenerateContentResponse,
    options: ContentProcessingOptions
  ): Promise<void> {
    try {
      await usageTrackingService.trackUsage({
        operation: 'enhanced_content_generation',
        provider: options.provider || 'unknown',
        pageType: request.pageType,
        sectionsGenerated: request.sections.length,
        enhanced: !!response.enhanced,
        qualityScore: response.qualityReport?.overallScore,
        processingTime: response.processingMetrics?.totalTime,
        success: response.success
      });
    } catch (error) {
      console.error('Failed to track usage:', error);
      // Don't throw - usage tracking failure shouldn't break the main flow
    }
  }

  /**
   * Generate cache key for request/options combination
   */
  private generateCacheKey(
    request: EnhancedGenerateContentRequest,
    options: ContentProcessingOptions
  ): string {
    const keyData = {
      pageType: request.pageType,
      entityId: request.entityId,
      sections: request.sections.sort(),
      provider: options.provider,
      enhance: options.enhanceText,
      validate: options.validateQuality,
      template: request.templateId,
      context: request.customContext
    };
    
    return JSON.stringify(keyData).replace(/\s+/g, '');
  }

  /**
   * Get available text response templates
   */
  getAvailableTemplates(): TextResponseTemplate[] {
    return enhancedTextResponseService.getTemplates();
  }

  /**
   * Validate content quality without generation
   */
  async validateContentQuality(
    content: string,
    context?: any
  ): Promise<QualityReport> {
    return responseQualityValidator.validateContent(content, context);
  }

  /**
   * Enhance existing text content
   */
  async enhanceTextContent(
    content: string,
    context?: any
  ): Promise<EnhancedTextResponse> {
    return enhancedTextResponseService.enhanceTextResponse(content, context);
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    cacheSize: number;
    cacheHitRate: number;
    totalProcessed: number;
  } {
    return {
      cacheSize: this.processingCache.size,
      cacheHitRate: 0, // Would need to track hits/misses for accurate calculation
      totalProcessed: this.processingCache.size
    };
  }

  /**
   * Clear processing cache
   */
  clearCache(): void {
    this.processingCache.clear();
    enhancedTextResponseService.clearCache();
  }

  /**
   * Batch process multiple content requests
   */
  async batchProcessContent(
    requests: EnhancedGenerateContentRequest[],
    options: ContentProcessingOptions = {}
  ): Promise<EnhancedGenerateContentResponse[]> {
    console.log(`🔄 Processing ${requests.length} content requests in batch...`);
    
    const results: EnhancedGenerateContentResponse[] = [];
    const errors: Array<{ index: number; error: Error }> = [];
    
    // Process requests in parallel with concurrency limit
    const concurrency = 3; // Limit concurrent requests to avoid overwhelming services
    const chunks = this.chunkArray(requests, concurrency);
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (request, index) => {
        try {
          const result = await this.generateEnhancedContent(request, options);
          return { index: results.length + index, result };
        } catch (error) {
          const errorObj = error instanceof Error ? error : new Error(String(error));
          errors.push({ index: results.length + index, error: errorObj });
          return null;
        }
      });
      
      const chunkResults = await Promise.all(chunkPromises);
      
      // Add successful results and track errors
      chunkResults.forEach((item, index) => {
        if (item) {
          results.push(item.result);
        } else {
          // Add placeholder for failed request to maintain order
          results.push({
            success: false,
            pageType: chunk[index].pageType,
            entityId: chunk[index].entityId,
            results: {},
            progress: 0,
            provider: options.provider || 'unknown',
            error: `Request failed: ${errors.find(e => e.index === results.length)?.error.message}`
          } as EnhancedGenerateContentResponse);
        }
      });
    }
    
    console.log(`✅ Batch processing completed: ${results.length - errors.length}/${requests.length} successful`);
    
    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length} requests failed:`, errors);
    }
    
    return results;
  }

  /**
   * Utility function to chunk array for batch processing
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

export const enhancedContentApiService = EnhancedContentApiService.getInstance();