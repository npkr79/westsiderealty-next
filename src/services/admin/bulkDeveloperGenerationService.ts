import { createClient } from '@/lib/supabase/server';


import { geminiContentService, type GenerateContentResponse } from "./geminiContentService";
import { retryService } from "./retryService";
import { errorHandlingService } from "./errorHandlingService";
const supabase = await createClient();

export interface DeveloperProgress {
  status: 'pending' | 'generating' | 'completed' | 'failed';
  currentSection?: string;
  completedSections: number;
  totalSections: number;
  error?: string;
}

export interface BulkGenerationProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  developers: Record<string, DeveloperProgress>;
}

export interface Developer {
  id: string;
  developer_name: string;
  url_slug: string;
  is_published: boolean;
}

const SECTIONS = [
  'hero_description',
  'overview',
  'notable_projects',
  'awards',
  'testimonials',
  'history_timeline',
  'faqs',
  'metadata'
];

/**
 * Bulk Developer Generation Service
 * Handles batch generation of complete developer content
 */
export const bulkDeveloperGenerationService = {
  /**
   * Get all unpublished developers
   */
  async getUnpublishedDevelopers(): Promise<Developer[]> {
    const { data, error } = await supabase
      .from('developers')
      .select('id, developer_name, url_slug, is_published')
      .eq('is_published', false)
      .order('developer_name');

    if (error) throw error;
    return data || [];
  },

  /**
   * Generate content for multiple developers in bulk
   */
  async generateBulkDevelopers(
    developers: Developer[],
    onProgress: (progress: BulkGenerationProgress) => void,
    onError: (error: { developerId: string; developerName: string; error: string }) => void,
    isPaused: () => boolean,
    batchSize: number = 5
  ): Promise<void> {
    const progress: BulkGenerationProgress = {
      total: developers.length,
      completed: 0,
      failed: 0,
      inProgress: 0,
      developers: {}
    };

    // Initialize progress for all developers
    developers.forEach(dev => {
      progress.developers[dev.id] = {
        status: 'pending',
        completedSections: 0,
        totalSections: SECTIONS.length
      };
    });

    onProgress({ ...progress });

    // Process developers in batches
    for (let i = 0; i < developers.length; i += batchSize) {
      if (isPaused()) {
        console.log('Generation paused by user');
        break;
      }

      const batch = developers.slice(i, i + batchSize);
      
      // Process batch sequentially (not in parallel) to respect rate limits
      for (const developer of batch) {
        if (isPaused()) {
          console.log('Generation paused by user');
          break;
        }

        progress.inProgress++;
        progress.developers[developer.id].status = 'generating';
        onProgress({ ...progress });

        try {
          await this.generateSingleDeveloper(
            developer,
            (section) => {
              progress.developers[developer.id].currentSection = section;
              progress.developers[developer.id].completedSections++;
              onProgress({ ...progress });
            }
          );

          progress.developers[developer.id].status = 'completed';
          progress.completed++;
          progress.inProgress--;
          onProgress({ ...progress });

          // Add delay between developers to respect rate limits
          await retryService.delay(2000);
        } catch (error: any) {
          console.error(`Failed to generate developer ${developer.developer_name}:`, error);
          
          progress.developers[developer.id].status = 'failed';
          progress.developers[developer.id].error = error.message || 'Generation failed';
          progress.failed++;
          progress.inProgress--;
          
          onError({
            developerId: developer.id,
            developerName: developer.developer_name,
            error: error.message || 'Unknown error'
          });
          
          onProgress({ ...progress });
        }
      }

      // Add delay between batches
      if (i + batchSize < developers.length && !isPaused()) {
        await retryService.delay(5000);
      }
    }
  },

  /**
   * Generate complete content for a single developer
   */
  async generateSingleDeveloper(
    developer: Developer,
    onSectionComplete: (section: string) => void
  ): Promise<void> {
    console.log(`Starting generation for developer: ${developer.developer_name}`);

    // Fetch existing developer data for context
    const { data: existingData, error: fetchError } = await supabase
      .from('developers')
      .select('*')
      .eq('id', developer.id)
      .single();

    if (fetchError) throw fetchError;

    // Build context from existing data
    const context = {
      developer_name: existingData.developer_name,
      url_slug: existingData.url_slug,
      specialization: existingData.specialization,
      years_in_business: existingData.years_in_business,
      total_projects: existingData.total_projects,
      location_focus: existingData.location_focus,
      primary_city_focus: existingData.primary_city_focus,
      website_url: existingData.website_url,
      tagline: existingData.tagline,
    };

    // Generate all sections using Gemini
    const sectionsToGenerate = [...SECTIONS];
    const prompts: Record<string, string> = this.buildPrompts(developer.developer_name, context);

    let generatedContent: Record<string, any> = {};

    try {
      const response = await retryService.withRetry(
        async () => {
          onSectionComplete('Generating all sections...');
          
          const result = await geminiContentService.generateContent({
            pageType: 'developer',
            entityId: developer.id,
            sections: sectionsToGenerate,
            context,
            prompts
          });

          if (!result.success) {
            throw new Error(result.error || 'Generation failed');
          }

          return result;
        },
        {
          maxAttempts: 3,
          delayMs: 3000,
          backoffMultiplier: 2,
        }
      );

      // Parse and validate the generated content
      generatedContent = this.parseGeneratedContent(response);
      
      // Validate content quality (non-fatal - only logs warnings, never throws)
      this.validateContent(generatedContent);

      // Check for empty/failed sections and retry
      const jsonFields = ['notable_projects', 'awards', 'testimonials', 'history_timeline', 'faqs'];
      const emptySections = SECTIONS.filter(section => {
        const field = jsonFields.find(f => section.includes(f));
        return field && Array.isArray(generatedContent[section]) && generatedContent[section].length === 0;
      });

      if (emptySections.length > 0) {
        console.log(`Retrying ${emptySections.length} empty sections for ${developer.developer_name}`);
        
        // Retry with even stricter prompts
        for (const section of emptySections) {
          try {
            onSectionComplete(`Retrying ${section}...`);
            
            const originalPrompt = prompts[section];
            const retryPrompt = `ABSOLUTELY CRITICAL: Return ONLY valid JSON array, no text before or after.\n${originalPrompt}`;
            
            const retryResponse = await geminiContentService.generateContent({
              pageType: 'developer',
              entityId: developer.id,
              sections: [section],
              context,
              prompts: { [section]: retryPrompt }
            });
            
            // Merge retry results
            if (retryResponse.success && retryResponse.results[section]) {
              const retryContent = this.parseGeneratedContent(retryResponse);
              if (Array.isArray(retryContent[section]) && retryContent[section].length > 0) {
                generatedContent[section] = retryContent[section];
                console.log(`✓ Successfully retried section ${section}`);
              }
            }
            
            // Small delay between retries
            await retryService.delay(1000);
          } catch (retryError) {
            console.error(`Retry failed for section ${section}:`, retryError);
            // Continue with empty array
          }
        }
      }

      onSectionComplete('Saving to database...');

      // Save to database
      await this.saveDeveloperContent(developer.id, generatedContent);

      onSectionComplete('Publishing page...');

      // Publish the developer page
      await this.publishDeveloperPage(developer.id);

      console.log(`Successfully generated and published developer: ${developer.developer_name}`);
    } catch (error: any) {
      console.error(`Error generating developer ${developer.developer_name}:`, error);
      
      // Log which sections succeeded and which failed
      const sectionStatus = Object.entries(generatedContent).map(([section, value]) => {
        if (Array.isArray(value)) {
          return `${section}: ${value.length} items`;
        } else if (typeof value === 'string') {
          return `${section}: ${value.length} chars`;
        }
        return `${section}: ${typeof value}`;
      }).join(', ');
      
      console.error('Section status:', sectionStatus);
      console.error('Generated content preview:', JSON.stringify(generatedContent, null, 2).substring(0, 500));
      throw error;
    }
  },

  /**
   * Extract JSON from text with markdown/artifacts
   */
  extractJSON(text: string): any {
    // Remove all markdown artifacts
    let cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^#{1,6}\s+.*$/gm, '') // Remove markdown headers
      .replace(/^\*\*.*\*\*$/gm, '')   // Remove bold text lines
      .trim();
    
    // Extract JSON array/object
    const jsonArrayMatch = cleaned.match(/\[[\s\S]*\]/);
    const jsonObjectMatch = cleaned.match(/\{[\s\S]*\}/);
    
    if (jsonArrayMatch) {
      cleaned = jsonArrayMatch[0];
    } else if (jsonObjectMatch) {
      cleaned = jsonObjectMatch[0];
    }
    
    // Fix common JSON issues
    cleaned = cleaned
      .replace(/,\s*([}\]])/g, '$1')  // Remove trailing commas
      .replace(/\n/g, ' ')            // Replace newlines with spaces
      .replace(/\s+/g, ' ');          // Normalize whitespace
    
    // Try to parse with error recovery
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      // Try to fix unterminated strings by finding last complete object
      const lastCompleteArray = cleaned.lastIndexOf('}]');
      if (lastCompleteArray !== -1) {
        const truncated = cleaned.substring(0, lastCompleteArray + 2);
        try {
          return JSON.parse(truncated);
        } catch (e2) {
          const errorMessage = e2 instanceof Error ? e2.message : String(e2);
          throw new Error(`Could not extract valid JSON: ${errorMessage}`);
        }
      }
      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new Error(`Could not extract valid JSON: ${errorMessage}`);
    }
  },

  /**
   * Build prompts for all sections with strict JSON formatting
   */
  buildPrompts(developerName: string, context: any): Record<string, string> {
    return {
      hero_description: `Write a compelling 2-3 sentence hero description for ${developerName} that highlights their unique value proposition, expertise, and market position. Focus on their specialization: ${context.specialization || 'real estate development'}.`,
      
      overview: `Write a comprehensive 300-400 word SEO-optimized overview of ${developerName}. Include their history, market presence, specialization areas, key achievements, and what sets them apart. Mention their ${context.years_in_business || 'years'} of experience and ${context.total_projects || 'multiple'} projects delivered.`,
      
      notable_projects: `CRITICAL: Return ONLY a valid JSON array with NO additional text, markdown, or explanations.
List 5-6 notable projects by ${developerName} in this exact format:
[
  {
    "name": "Project Name",
    "location": "Area, City",
    "type": "Residential/Commercial",
    "description": "50 word description",
    "features": ["feature1", "feature2", "feature3"]
  }
]
Start your response with [ and end with ]. No markdown headers (###), no code blocks (\`\`\`), no explanations before or after.`,
      
      awards: `CRITICAL: Return ONLY a valid JSON array with NO additional text, markdown, or explanations.
List 5-7 prestigious awards received by ${developerName} in this exact format:
[
  {
    "award": "Award Name",
    "year": 2020,
    "organization": "Awarding Body",
    "description": "Significance of this award"
  }
]
Start your response with [ and end with ]. No markdown headers, no code blocks, no explanations.`,
      
      testimonials: `CRITICAL: Return ONLY a valid JSON array with NO additional text, markdown, or explanations.
Create 3 realistic testimonials from satisfied customers of ${developerName} in this exact format:
[
  {
    "name": "Customer Name",
    "role": "Designation",
    "project": "Project Name",
    "feedback": "80-100 word testimonial",
    "rating": 4.8
  }
]
Start your response with [ and end with ]. No markdown headers, no code blocks, no explanations.`,
      
      history_timeline: `CRITICAL: Return ONLY a valid JSON array with NO additional text, markdown, or explanations.
Create a chronological timeline of major milestones in ${developerName}'s journey in this exact format:
[
  {
    "year": 2010,
    "title": "Milestone Title",
    "description": "50 word description"
  }
]
Include 6-8 key events. Start your response with [ and end with ]. No markdown headers, no code blocks, no explanations.`,
      
      faqs: `CRITICAL: Return ONLY a valid JSON array with NO additional text, markdown, or explanations.
Create 5 frequently asked questions and answers about ${developerName} in this exact format:
[
  {
    "question": "Question text?",
    "answer": "100-150 word detailed answer"
  }
]
Start your response with [ and end with ]. No markdown headers, no code blocks, no explanations.`,
      
      metadata: `Generate additional metadata for ${developerName}. Return as plain text with sections separated by "---":
USP: (100 words about unique selling proposition)
---
SPECIALIZATION: (one line)
---
FOUNDER_BIO: (150 words about founder's vision and leadership)
---
AWARDS_SUMMARY: (100 words highlighting key achievements)`
    };
  },

  /**
   * Parse and clean generated content with robust JSON extraction
   */
  parseGeneratedContent(response: GenerateContentResponse): Record<string, any> {
    const content: Record<string, any> = {};
    const jsonFields = ['notable_projects', 'awards', 'testimonials', 'history_timeline', 'faqs'];

    Object.entries(response.results).forEach(([section, result]) => {
      if (result.error) {
        console.warn(`Section ${section} had error:`, result.error);
        // Provide fallback empty structures for JSON fields
        if (jsonFields.some(field => section.includes(field))) {
          content[section] = [];
        }
        return;
      }

      let parsed: any = result.content;
      
      const isJsonField = jsonFields.some(field => section.includes(field));
      
      if (isJsonField) {
        try {
          // Use enhanced JSON extraction
          parsed = this.extractJSON(parsed);
          
          // Validate it's an array
          if (!Array.isArray(parsed)) {
            console.warn(`Section ${section} is not an array, wrapping it`);
            parsed = [parsed];
          }
          
          // Log if empty
          if (parsed.length === 0) {
            console.warn(`Section ${section} returned empty array`);
          }
          
        } catch (e: any) {
          console.error(`Failed to parse JSON for section ${section}:`, e);
          console.error('Raw content:', result.content.substring(0, 200));
          // Fallback to empty array
          parsed = [];
        }
      } else {
        // For text fields, clean up markdown artifacts
        parsed = parsed
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .replace(/^#{1,6}\s+/gm, '')
          .trim();
      }

      content[section] = parsed;
    });

    return content;
  },

  /**
   * Validate generated content quality (non-fatal – NEVER throws, only logs warnings)
   */
  validateContent(content: Record<string, any>): void {
    try {
      // Check if hero_description and overview have reasonable length
      const hasHeroDescription = content.hero_description && 
                                 typeof content.hero_description === 'string' && 
                                 content.hero_description.length >= 50;
      const hasOverview = content.overview && 
                          typeof content.overview === 'string' && 
                          content.overview.length >= 50;

      if (!hasHeroDescription) {
        console.warn('⚠️ hero_description is missing or too short');
      }
      if (!hasOverview) {
        console.warn('⚠️ overview is missing or too short');
      }

      // If one of them exists, use it to backfill the other
      if (!hasHeroDescription && hasOverview) {
        console.log('Backfilling hero_description from overview');
        content.hero_description = String(content.overview).slice(0, 400);
      } else if (hasHeroDescription && !hasOverview) {
        console.log('Backfilling overview from hero_description');
        content.overview = String(content.hero_description);
      } else if (!hasHeroDescription && !hasOverview) {
        console.warn('⚠️ Neither hero_description nor overview are present - using defaults');
        content.hero_description = 'Leading real estate developer';
        content.overview = 'A prominent real estate developer with a strong track record.';
      }

      // Validate JSON fields - allow empty arrays and initialize missing ones
      const jsonFields = ['notable_projects', 'awards', 'testimonials', 'history_timeline', 'faqs'];
      for (const field of jsonFields) {
        if (content[field] !== undefined && content[field] !== null) {
          if (!Array.isArray(content[field])) {
            console.warn(`Field ${field} is not an array, attempting to fix`);
            // Try to wrap it in an array
            content[field] = [content[field]];
          }
          
          // Log if empty but don't fail
          if (content[field].length === 0) {
            console.warn(`Field ${field} is an empty array (may have failed generation)`);
          }
        } else {
          // Initialize as empty array if missing
          content[field] = [];
          console.warn(`Field ${field} was missing, initialized as empty array`);
        }
      }

      console.log('✅ Content validation completed (non-fatal mode - no errors thrown)');
    } catch (error) {
      console.error('⚠️ Validation encountered an error but continuing anyway:', error);
      // Even if validation itself fails, we don't throw - just log
    }
  },

  /**
   * Save generated content to database
   */
  async saveDeveloperContent(developerId: string, content: Record<string, any>): Promise<void> {
    const updateData: any = {
      hero_description: content.hero_description || null,
      long_description_seo: content.overview || null,
      notable_projects_json: content.notable_projects || [],
      key_awards_json: content.awards || [],
      testimonial_json: content.testimonials || [],
      history_timeline_json: content.history_timeline || [],
      faqs_json: content.faqs || [],
      content_generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add metadata fields if available (parse from text format)
    if (content.metadata) {
      try {
        const metadataText = typeof content.metadata === 'string' ? content.metadata : JSON.stringify(content.metadata);
        const sections = metadataText.split('---').map(s => s.trim());
        
        sections.forEach(section => {
          if (section.startsWith('USP:')) {
            updateData.usp = section.replace('USP:', '').trim();
          } else if (section.startsWith('SPECIALIZATION:')) {
            updateData.specialization = section.replace('SPECIALIZATION:', '').trim();
          } else if (section.startsWith('FOUNDER_BIO:')) {
            updateData.founder_bio_summary = section.replace('FOUNDER_BIO:', '').trim();
          } else if (section.startsWith('AWARDS_SUMMARY:')) {
            updateData.awards_summary_text = section.replace('AWARDS_SUMMARY:', '').trim();
          }
        });
      } catch (e) {
        console.warn('Failed to parse metadata:', e);
      }
    }

    const { error } = await supabase
      .from('developers')
      .update(updateData)
      .eq('id', developerId);

    if (error) throw error;
  },

  /**
   * Publish developer page
   */
  async publishDeveloperPage(developerId: string): Promise<void> {
    const { error } = await supabase
      .from('developers')
      .update({
        is_published: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', developerId);

    if (error) throw error;
  },

  /**
   * Generate report of bulk generation results
   */
  generateReport(progress: BulkGenerationProgress, errors: Array<{ developerId: string; developerName: string; error: string }>): string {
    const successRate = progress.total > 0 
      ? ((progress.completed / progress.total) * 100).toFixed(1)
      : 0;

    let report = `Bulk Developer Generation Report\n`;
    report += `Generated on: ${new Date().toLocaleString()}\n`;
    report += `${'='.repeat(50)}\n\n`;
    
    report += `Summary:\n`;
    report += `  Total Developers: ${progress.total}\n`;
    report += `  Successfully Generated: ${progress.completed}\n`;
    report += `  Failed: ${progress.failed}\n`;
    report += `  Success Rate: ${successRate}%\n\n`;

    if (errors.length > 0) {
      report += `Failed Developers (${errors.length}):\n`;
      report += `${'='.repeat(50)}\n`;
      errors.forEach((error, idx) => {
        report += `${idx + 1}. ${error.developerName}\n`;
        report += `   Error: ${error.error}\n\n`;
      });
    }

    report += `\nDetailed Status:\n`;
    report += `${'='.repeat(50)}\n`;
    Object.entries(progress.developers).forEach(([id, dev]) => {
      const status = dev.status.toUpperCase();
      report += `[${status}] Sections: ${dev.completedSections}/${dev.totalSections}\n`;
      if (dev.error) {
        report += `  Error: ${dev.error}\n`;
      }
    });

    return report;
  }
};
