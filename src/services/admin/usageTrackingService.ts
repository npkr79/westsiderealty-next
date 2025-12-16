import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();


export interface UsageStats {
  totalRequests: number;
  successRate: number;
  avgGenerationTime: number;
  estimatedCost: number;
  lovableRequests: number;
  perplexityRequests: number;
  lovableUsagePercent: number;
  perplexityUsagePercent: number;
}

interface UsageRecord {
  id: string;
  provider: 'lovable' | 'perplexity';
  page_type: string;
  sections_count: number;
  success: boolean;
  generation_time_ms: number;
  estimated_cost: number;
  created_at: string;
}

export const usageTrackingService = {
  async trackGeneration(data: {
    provider: 'lovable' | 'perplexity';
    pageType: string;
    sectionsCount: number;
    success: boolean;
    generationTimeMs: number;
    estimatedCost: number;
  }): Promise<void> {
    try {
      // Store in localStorage for demo/development
      const records = this.getLocalRecords();
      records.push({
        id: crypto.randomUUID(),
        provider: data.provider,
        page_type: data.pageType,
        sections_count: data.sectionsCount,
        success: data.success,
        generation_time_ms: data.generationTimeMs,
        estimated_cost: data.estimatedCost,
        created_at: new Date().toISOString(),
      });
      
      // Keep only last 100 records
      const trimmed = records.slice(-100);
      localStorage.setItem('usage_tracking', JSON.stringify(trimmed));
    } catch (error) {
      console.error("Error tracking usage:", error);
    }
  },

  async getUsageStats(days: number = 30): Promise<UsageStats> {
    try {
      const records = this.getLocalRecords();
      
      // Filter by date range
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const filtered = records.filter(
        (r) => new Date(r.created_at) >= cutoffDate
      );

      if (filtered.length === 0) {
        return {
          totalRequests: 0,
          successRate: 0,
          avgGenerationTime: 0,
          estimatedCost: 0,
          lovableRequests: 0,
          perplexityRequests: 0,
          lovableUsagePercent: 0,
          perplexityUsagePercent: 0,
        };
      }

      const successful = filtered.filter((r) => r.success);
      const lovableRequests = filtered.filter((r) => r.provider === 'lovable');
      const perplexityRequests = filtered.filter((r) => r.provider === 'perplexity');

      const totalTime = filtered.reduce((sum, r) => sum + r.generation_time_ms, 0);
      const totalCost = filtered.reduce((sum, r) => sum + r.estimated_cost, 0);

      return {
        totalRequests: filtered.length,
        successRate: (successful.length / filtered.length) * 100,
        avgGenerationTime: totalTime / filtered.length / 1000, // Convert to seconds
        estimatedCost: totalCost,
        lovableRequests: lovableRequests.length,
        perplexityRequests: perplexityRequests.length,
        lovableUsagePercent: (lovableRequests.length / filtered.length) * 100,
        perplexityUsagePercent: (perplexityRequests.length / filtered.length) * 100,
      };
    } catch (error) {
      console.error("Error getting usage stats:", error);
      throw error;
    }
  },

  getLocalRecords(): UsageRecord[] {
    try {
      const data = localStorage.getItem('usage_tracking');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  clearUsageData(): void {
    localStorage.removeItem('usage_tracking');
  },
};
