
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();


export interface AgentActivity {
  id: string;
  agent_id: string;
  activity_type: string;
  activity_description: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// Helper function to safely parse JSON fields
const parseJsonField = (field: any, defaultValue: any = null) => {
  if (field === null || field === undefined) {
    return defaultValue;
  }
  
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch {
      return defaultValue;
    }
  }
  
  return field;
};

export const agentActivityService = {
  async getAgentActivities(agentId: string, limit: number = 50): Promise<AgentActivity[]> {
    const { data, error } = await supabase
      .from('agent_activities')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    return (data || []).map(activity => ({
      ...activity,
      metadata: parseJsonField(activity.metadata, {})
    }));
  },

  async logAgentActivity(activity: Omit<AgentActivity, 'id' | 'created_at'>): Promise<AgentActivity> {
    const { data, error } = await supabase
      .from('agent_activities')
      .insert([{
        ...activity,
        metadata: JSON.stringify(activity.metadata)
      }])
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      metadata: parseJsonField(data.metadata, {})
    };
  }
};
