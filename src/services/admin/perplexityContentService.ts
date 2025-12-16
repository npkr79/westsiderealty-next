import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();


export interface GenerateContentRequest {
  pageType: 'city' | 'micromarket' | 'developer' | 'project';
  entityId: string;
  sections: string[];
  context: Record<string, any>;
  prompts: Record<string, string>;
}

export interface GenerateContentResponse {
  success: boolean;
  pageType: string;
  entityId: string;
  results: Record<string, {
    content: string;
    wordCount: number;
    generated_at: string;
    error?: string;
  }>;
  progress: number;
  provider: string;
  error?: string;
}

export const perplexityContentService = {
  async generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse> {
    try {
      console.log('Calling Perplexity edge function with request:', {
        pageType: request.pageType,
        entityId: request.entityId,
        sections: request.sections,
      });

      const { data, error } = await supabase.functions.invoke('generate-page-content-perplexity', {
        body: request,
      });

      if (error) {
        console.error('Perplexity edge function error:', error);
        throw error;
      }

      console.log('Perplexity response:', data);

      return data as GenerateContentResponse;
    } catch (error: any) {
      console.error('Error calling Perplexity service:', error);
      return {
        success: false,
        pageType: request.pageType,
        entityId: request.entityId,
        results: {},
        progress: 0,
        provider: 'perplexity',
        error: error.message || 'Failed to generate content',
      };
    }
  },

  validateApiKey(): boolean {
    // API key validation happens in the edge function
    return true;
  },
};
