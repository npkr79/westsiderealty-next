
import { createClient } from '@/lib/supabase/client';

import type { Database } from '@/integrations/supabase/types';

export interface AgentProfile {
  id: string;
  agent_id?: string;
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
  active?: boolean;
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
    throw new Error(
      "Agent creation is restricted. Use the admin API to create agents."
    );
  },

  // Get agent by ID
  async getAgentById(agentId: string): Promise<AgentProfile | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('crm_users')
      .select('id, full_name, phone, is_active, created_at, whatsapp_number')
      .eq('id', agentId)
      .single();

    if (error) {
      console.error('Error fetching agent:', error);
      return null;
    }

    return {
      id: data.id,
      agent_id: data.id,
      name: data.full_name || '',
      email: '',
      phone: data.phone,
      bio: null,
      specialization: null,
      profile_image: null,
      service_areas: [],
      whatsapp: data.whatsapp_number,
      linkedin: null,
      instagram: null,
      active: data.is_active,
      profile_completed: false,
      license_number: null,
      created_at: data.created_at,
      updated_at: data.created_at,
    };
  },

  // Update agent profile
  async updateAgent(agentId: string, updates: Partial<AgentProfile>): Promise<AgentProfile> {
    const supabase = createClient();
    // Only full_name, phone, whatsapp_number exist on crm_users
    const updateData: Record<string, any> = {};
    if (updates.name !== undefined) updateData.full_name = updates.name;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.whatsapp !== undefined) updateData.whatsapp_number = updates.whatsapp;

    const { data, error } = await supabase
      .from('crm_users')
      .update(updateData)
      .eq('id', agentId)
      .select('id, full_name, phone, is_active, created_at, whatsapp_number')
      .single();

    if (error) throw error;

    return {
      id: data.id,
      agent_id: data.id,
      name: data.full_name || '',
      email: '',
      phone: data.phone,
      bio: null,
      specialization: null,
      profile_image: null,
      service_areas: [],
      whatsapp: data.whatsapp_number,
      linkedin: null,
      instagram: null,
      active: data.is_active,
      profile_completed: false,
      license_number: null,
      created_at: data.created_at,
      updated_at: data.created_at,
    };
  },

  // Get all agents (for admin)
  async getAllAgents(): Promise<AgentProfile[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('crm_users')
      .select('id, full_name, phone, is_active, created_at, whatsapp_number')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((agent: any) => ({
      id: agent.id,
      agent_id: agent.id,
      name: agent.full_name || '',
      email: '',
      phone: agent.phone,
      bio: null,
      specialization: null,
      profile_image: null,
      service_areas: [],
      whatsapp: agent.whatsapp_number,
      linkedin: null,
      instagram: null,
      active: agent.is_active ?? true,
      profile_completed: false,
      license_number: null,
      created_at: agent.created_at,
      updated_at: agent.created_at,
    }));
  },

  // Get public agent profiles
  async getPublicAgents(): Promise<AgentProfile[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('crm_users')
      .select('id, full_name, phone, is_active, created_at, whatsapp_number')
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;

    return (data || []).map((agent: any) => ({
      id: agent.id,
      agent_id: agent.id,
      name: agent.full_name || '',
      email: '',
      phone: agent.phone,
      bio: null,
      specialization: null,
      profile_image: null,
      service_areas: [],
      whatsapp: agent.whatsapp_number,
      linkedin: null,
      instagram: null,
      active: agent.is_active ?? true,
      profile_completed: false,
      license_number: null,
      created_at: agent.created_at,
      updated_at: agent.created_at,
    }));
  },

  // Search agents
  async searchAgents(query: string): Promise<AgentProfile[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('crm_users')
      .select('id, full_name, phone, is_active, created_at, whatsapp_number')
      .eq('is_active', true)
      .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('full_name');

    if (error) throw error;

    return (data || []).map((agent: any) => ({
      id: agent.id,
      agent_id: agent.id,
      name: agent.full_name || '',
      email: '',
      phone: agent.phone,
      bio: null,
      specialization: null,
      profile_image: null,
      service_areas: [],
      whatsapp: agent.whatsapp_number,
      linkedin: null,
      instagram: null,
      active: agent.is_active ?? true,
      profile_completed: false,
      license_number: null,
      created_at: agent.created_at,
      updated_at: agent.created_at,
    }));
  },

  // Utility methods
  async deleteAgent(agentId: string): Promise<void> {
    const supabase = createClient();
    // Deleting the whole crm_users row would remove the user — deactivate instead
    const { error } = await supabase
      .from('crm_users')
      .update({ is_active: false })
      .eq('id', agentId);

    if (error) throw error;
  },

  async activateAgent(agentId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('crm_users')
      .update({ is_active: true })
      .eq('id', agentId);

    if (error) throw error;
  },

  async deactivateAgent(agentId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('crm_users')
      .update({ is_active: false })
      .eq('id', agentId);

    if (error) throw error;
  }
};
