
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();


export interface AgentPerformance {
  id: string;
  agent_id: string;
  properties_listed: number;
  properties_sold: number;
  total_leads: number;
  converted_leads: number;
  total_revenue: number;
  commission_earned: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

export const agentPerformanceService = {
  async getAgentPerformance(agentId: string): Promise<AgentPerformance | null> {
    const { data, error } = await supabase
      .from('agent_performance')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (error) {
      console.error('Error fetching agent performance:', error);
      return null;
    }

    return data;
  },

  async updateAgentPerformance(agentId: string, performance: Partial<AgentPerformance>): Promise<AgentPerformance> {
    const { data, error } = await supabase
      .from('agent_performance')
      .upsert({
        agent_id: agentId,
        ...performance,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
