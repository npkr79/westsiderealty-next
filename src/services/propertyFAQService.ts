import { createClient } from '@/lib/supabase/client';

export interface PropertyFAQ {
  id?: string;
  question: string;
  answer: string;
  display_order?: number;
}

/**
 * Fetch FAQs from projects table based on project_name
 * Matches property.project_name with projects.project_name and gets faqs_json
 */
export async function getPropertyFAQsFromProject(projectName: string | null | undefined): Promise<PropertyFAQ[]> {
  if (!projectName) {
    console.log('[PropertyFAQService] No project name provided');
    return [];
  }

  try {
    console.log('[PropertyFAQService] Fetching FAQs for project:', projectName);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('projects')
      .select('faqs_json, project_name')
      .eq('project_name', projectName)
      .maybeSingle();

    if (error) {
      console.error('[PropertyFAQService] Error fetching project FAQs:', error);
      return [];
    }

    if (!data) {
      console.log('[PropertyFAQService] No project found with name:', projectName);
      return [];
    }

    if (!data.faqs_json) {
      console.log('[PropertyFAQService] Project found but no faqs_json:', projectName);
      return [];
    }

    console.log('[PropertyFAQService] Found faqs_json for project:', projectName, 'Type:', typeof data.faqs_json);

    // Parse faqs_json - it could be a string or already an object
    let faqs: any[] = [];
    
    if (typeof data.faqs_json === 'string') {
      try {
        faqs = JSON.parse(data.faqs_json);
      } catch (parseError) {
        console.error('[PropertyFAQService] Error parsing faqs_json:', parseError);
        return [];
      }
    } else if (Array.isArray(data.faqs_json)) {
      faqs = data.faqs_json;
    } else if (data.faqs_json && typeof data.faqs_json === 'object') {
      // If it's an object with a 'faqs' array property
      faqs = data.faqs_json.faqs || data.faqs_json.items || [];
    }

    // Transform to PropertyFAQ format
    const formattedFAQs: PropertyFAQ[] = faqs
      .map((faq: any, index: number): PropertyFAQ | null => {
        // Handle different possible structures
        if (typeof faq === 'string') {
          // If it's just a string, create a generic FAQ
          return {
            id: `faq-${index}`,
            question: `Question ${index + 1}`,
            answer: faq,
            display_order: index
          };
        } else if (faq && typeof faq === 'object') {
          return {
            id: faq.id || `faq-${index}`,
            question: faq.question || faq.title || `Question ${index + 1}`,
            answer: faq.answer || faq.content || faq.text || '',
            display_order: faq.display_order !== undefined ? faq.display_order : faq.order || index
          };
        }
        return null;
      })
      .filter((faq): faq is PropertyFAQ => 
        faq !== null && 
        typeof faq.question === 'string' && 
        faq.question.length > 0 &&
        typeof faq.answer === 'string' && 
        faq.answer.length > 0
      );

    // Sort by display_order if available
    const sortedFAQs = formattedFAQs.sort((a, b) => {
      const orderA = a.display_order ?? 999;
      const orderB = b.display_order ?? 999;
      return orderA - orderB;
    });

    console.log('[PropertyFAQService] Returning', sortedFAQs.length, 'FAQs for project:', projectName);
    return sortedFAQs;
  } catch (error) {
    console.error('[PropertyFAQService] Error:', error);
    return [];
  }
}

