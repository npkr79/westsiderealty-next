
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();


export interface AgentCommission {
  id: string;
  agent_id: string;
  property_id: string | null;
  lead_id: string | null;
  commission_type: string;
  amount: number;
  percentage: number | null;
  status: string;
  earned_at: string;
  paid_at: string | null;
  created_at: string;
}

export const agentCommissionService = {
  async getAgentCommissions(agentId: string): Promise<AgentCommission[]> {
    const { data, error } = await supabase
      .from('agent_commissions')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createCommission(commission: Omit<AgentCommission, 'id' | 'created_at'>): Promise<AgentCommission> {
    const { data, error } = await supabase
      .from('agent_commissions')
      .insert([commission])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
