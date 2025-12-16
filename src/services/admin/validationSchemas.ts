import { z } from "zod";

/**
 * Validation schemas for content generation system
 */

export const pageTypeSchema = z.enum(['city', 'micromarket', 'developer', 'project']);

export const providerSchema = z.enum(['perplexity', 'lovable']);

export const entityIdSchema = z.string()
  .uuid({ message: 'Entity ID must be a valid UUID' })
  .min(1, { message: 'Entity ID is required' });

export const generatedContentSchema = z.object({
  seo_title: z.string()
    .min(10, 'SEO title must be at least 10 characters')
    .max(60, 'SEO title must not exceed 60 characters'),
  
  meta_description: z.string()
    .min(50, 'Meta description must be at least 50 characters')
    .max(160, 'Meta description must not exceed 160 characters'),
  
  h1_title: z.string()
    .min(10, 'H1 title must be at least 10 characters')
    .max(70, 'H1 title must not exceed 70 characters'),
  
  hero_hook: z.string()
    .min(20, 'Hero hook must be at least 20 characters')
    .max(200, 'Hero hook must not exceed 200 characters'),
  
  overview_seo: z.string()
    .min(100, 'Overview must be at least 100 characters')
    .max(5000, 'Overview must not exceed 5000 characters'),
  
  faqs: z.array(z.object({
    question: z.string().min(10, 'Question must be at least 10 characters'),
    answer: z.string().min(20, 'Answer must be at least 20 characters')
  })).optional(),
  
  market_snapshot: z.object({
    totalProjects: z.number().int().positive(),
    avgPriceSqft: z.number().positive(),
    appreciation: z.number(),
    topDevelopers: z.array(z.string())
  }).optional(),
  
  lifestyle_infrastructure: z.object({
    connectivity: z.array(z.string()),
    amenities: z.array(z.string())
  }).optional(),
  
  testimonials: z.array(z.object({
    name: z.string().min(2),
    role: z.string().min(2),
    feedback: z.string().min(20),
    rating: z.number().min(1).max(5)
  })).optional(),
});

export const seedDataRequestSchema = z.object({
  pageType: pageTypeSchema,
  entityId: entityIdSchema,
});

export const generateContentRequestSchema = z.object({
  provider: providerSchema,
  pageType: pageTypeSchema,
  entityId: entityIdSchema,
});

export const publishPageRequestSchema = z.object({
  pageType: pageTypeSchema,
  entityId: entityIdSchema,
  content: generatedContentSchema,
  extractRelationships: z.boolean().default(true),
});

/**
 * Validate input data
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: z.ZodError): string {
  return errors.issues
    .map(err => `${err.path.join('.')}: ${err.message}`)
    .join('; ');
}
