
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();


export interface AgentPreferences {
  id: string;
  agent_id: string;
  notification_email: boolean;
  notification_whatsapp: boolean;
  notification_sms: boolean;
  auto_assign_leads: boolean;
  preferred_contact_time: { start: string; end: string };
  working_days: string[];
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
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

export const agentPreferencesService = {
  async getAgentPreferences(agentId: string): Promise<AgentPreferences | null> {
    const { data, error } = await supabase
      .from('agent_preferences')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (error) {
      console.error('Error fetching agent preferences:', error);
      return null;
    }

    return {
      ...data,
      preferred_contact_time: parseJsonField(data.preferred_contact_time, { start: "09:00", end: "18:00" }),
      working_days: parseJsonField(data.working_days, ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]),
      settings: parseJsonField(data.settings, {})
    };
  },

  async updateAgentPreferences(agentId: string, preferences: Partial<AgentPreferences>): Promise<AgentPreferences> {
    const updateData: any = { ...preferences };
    
    // Convert JSON fields to strings if they're objects
    if (preferences.preferred_contact_time) {
      updateData.preferred_contact_time = JSON.stringify(preferences.preferred_contact_time);
    }
    if (preferences.working_days) {
      updateData.working_days = JSON.stringify(preferences.working_days);
    }
    if (preferences.settings) {
      updateData.settings = JSON.stringify(preferences.settings);
    }

    const { data, error } = await supabase
      .from('agent_preferences')
      .upsert({
        agent_id: agentId,
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      preferred_contact_time: parseJsonField(data.preferred_contact_time, { start: "09:00", end: "18:00" }),
      working_days: parseJsonField(data.working_days, ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]),
      settings: parseJsonField(data.settings, {})
    };
  }
};
