import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();


interface RelationshipFixResult {
  fixed: number;
  failed: number;
  errors: string[];
}

class ProjectRelationshipService {
  async fixMissingRelationships(): Promise<RelationshipFixResult> {
    const result: RelationshipFixResult = {
      fixed: 0,
      failed: 0,
      errors: []
    };

    // Get all projects with NULL relationships
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('id, project_name, city_id, micro_market_id, developer_id')
      .or('city_id.is.null,micro_market_id.is.null,developer_id.is.null');

    if (fetchError || !projects) {
      result.errors.push(`Failed to fetch projects: ${fetchError?.message}`);
      return result;
    }

    console.log(`Found ${projects.length} projects with missing relationships`);

    // Get all cities, micromarkets, and developers for matching
    const { data: cities } = await supabase.from('cities').select('id, city_name');
    const { data: micromarkets } = await supabase.from('micro_markets').select('id, micro_market_name, city_id');
    const { data: developers } = await supabase.from('developers').select('id, developer_name');

    if (!cities || !micromarkets || !developers) {
      result.errors.push('Failed to fetch reference data');
      return result;
    }

    for (const project of projects) {
      try {
        const updates: any = {};
        let needsUpdate = false;

        // Try to extract city from project name
        if (!project.city_id) {
          const cityMatch = this.findBestMatch(project.project_name, cities.map(c => c.city_name));
          if (cityMatch) {
            const city = cities.find(c => c.city_name === cityMatch);
            if (city) {
              updates.city_id = city.id;
              needsUpdate = true;
            }
          }
        }

        // Try to extract micromarket from project name
        if (!project.micro_market_id) {
          const mmMatch = this.findBestMatch(project.project_name, micromarkets.map(m => m.micro_market_name));
          if (mmMatch) {
            const micromarket = micromarkets.find(m => m.micro_market_name === mmMatch);
            if (micromarket) {
              updates.micro_market_id = micromarket.id;
              if (!updates.city_id && micromarket.city_id) {
                updates.city_id = micromarket.city_id;
              }
              needsUpdate = true;
            }
          }
        }

        // Try to extract developer from project name
        if (!project.developer_id) {
          const devMatch = this.findBestMatch(project.project_name, developers.map(d => d.developer_name));
          if (devMatch) {
            const developer = developers.find(d => d.developer_name === devMatch);
            if (developer) {
              updates.developer_id = developer.id;
              needsUpdate = true;
            }
          }
        }

        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', project.id);

          if (updateError) {
            result.failed++;
            result.errors.push(`Failed to update project ${project.id}: ${updateError.message}`);
          } else {
            result.fixed++;
            console.log(`Fixed relationships for project: ${project.project_name}`);
          }
        }
      } catch (err: any) {
        result.failed++;
        result.errors.push(`Error processing project ${project.id}: ${err.message}`);
      }
    }

    return result;
  }

  private findBestMatch(text: string, candidates: string[]): string | null {
    const normalizedText = text.toLowerCase();
    
    // First try exact substring match
    for (const candidate of candidates) {
      if (normalizedText.includes(candidate.toLowerCase())) {
        return candidate;
      }
    }

    // Try fuzzy matching - find words that appear in both
    const textWords = normalizedText.split(/\s+/);
    let bestMatch: string | null = null;
    let maxScore = 0;

    for (const candidate of candidates) {
      const candidateWords = candidate.toLowerCase().split(/\s+/);
      const score = candidateWords.filter(word => 
        textWords.some(textWord => textWord.includes(word) || word.includes(textWord))
      ).length;

      if (score > maxScore) {
        maxScore = score;
        bestMatch = candidate;
      }
    }

    return maxScore > 0 ? bestMatch : null;
  }

  async validateAllRelationships(): Promise<{ valid: number; invalid: number }> {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, city_id, micro_market_id, developer_id');

    if (!projects) return { valid: 0, invalid: 0 };

    const valid = projects.filter(p => p.city_id && p.micro_market_id && p.developer_id).length;
    const invalid = projects.length - valid;

    return { valid, invalid };
  }
}

export const projectRelationshipService = new ProjectRelationshipService();
