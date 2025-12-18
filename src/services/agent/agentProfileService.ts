
import { createClient } from '@/lib/supabase/server';

import type { Database } from '@/integrations/supabase/types';

export interface AgentProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  specialization: string | null;
  profile_image: string | null;
  service_areas: string[];
  whatsapp: string | null;
  linkedin: string | null;
  instagram: string | null;
  active: boolean;
  profile_completed: boolean;
  license_number: string | null;
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

export const agentProfileService = {
  // Create a new agent profile
  async createAgent(agentData: Partial<AgentProfile>): Promise<AgentProfile> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('agents')
      .insert([{
        name: agentData.name || '',
        email: agentData.email || '',
        phone: agentData.phone,
        bio: agentData.bio,
        specialization: agentData.specialization,
        profile_image: agentData.profile_image,
        service_areas: JSON.stringify(agentData.service_areas || []),
        whatsapp: agentData.whatsapp,
        linkedin: agentData.linkedin,
        instagram: agentData.instagram,
        active: agentData.active ?? true,
        profile_completed: agentData.profile_completed ?? false,
        license_number: agentData.license_number || 'A02500003159'
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      service_areas: parseJsonField(data.service_areas, [])
    };
  },

  // Get agent by ID
  async getAgentById(agentId: string): Promise<AgentProfile | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error) {
      console.error('Error fetching agent:', error);
      return null;
    }

    return {
      ...data,
      service_areas: parseJsonField(data.service_areas, [])
    };
  },

  // Update agent profile
  async updateAgent(agentId: string, updates: Partial<AgentProfile>): Promise<AgentProfile> {
    const supabase = await createClient();
    const updateData: any = { ...updates };
    
    // Convert service_areas to JSON string if it's an array
    if (updates.service_areas) {
      updateData.service_areas = JSON.stringify(updates.service_areas);
    }

    const { data, error } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', agentId)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      service_areas: parseJsonField(data.service_areas, [])
    };
  },

  // Get all agents (for admin)
  async getAllAgents(): Promise<AgentProfile[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(agent => ({
      ...agent,
      service_areas: parseJsonField(agent.service_areas, [])
    }));
  },

  // Get public agent profiles
  async getPublicAgents(): Promise<AgentProfile[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) throw error;

    return data.map(agent => ({
      ...agent,
      service_areas: parseJsonField(agent.service_areas, [])
    }));
  },

  // Search agents
  async searchAgents(query: string): Promise<AgentProfile[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('active', true)
      .or(`name.ilike.%${query}%,specialization.ilike.%${query}%,bio.ilike.%${query}%`)
      .order('name');

    if (error) throw error;

    return data.map(agent => ({
      ...agent,
      service_areas: parseJsonField(agent.service_areas, [])
    }));
  },

  // Utility methods
  async deleteAgent(agentId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId);

    if (error) throw error;
  },

  async activateAgent(agentId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('agents')
      .update({ active: true })
      .eq('id', agentId);

    if (error) throw error;
  },

  async deactivateAgent(agentId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('agents')
      .update({ active: false })
      .eq('id', agentId);

    if (error) throw error;
  }
};
