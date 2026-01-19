import { createClient } from '@/lib/supabase/client';

export interface CreateAgentData {
  name: string;
  email: string;
  phone: string;
  specialization?: string;
}

export const agentAuthService = {
  /**
   * Creates a new agent account with phone authentication
   */
  async createAgentAccount(agentData: CreateAgentData) {
    return {
      success: false,
      error: new Error("Agent creation is restricted to admin API."),
    };
  },

  /**
   * Updates agent password in both Supabase Auth and phone_auth table
   */
  async updateAgentPassword(agentId: string, newPassword: string) {
    try {
      const supabase = createClient();
      // Update Supabase Auth password
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) throw authError;

      // Update phone_auth table
      const { error: phoneError } = await supabase
        .rpc('create_hashed_phone_auth', {
          agent_id: agentId,
          phone_number: '', // Will be ignored in UPDATE
          plain_password: newPassword
        });

      if (phoneError) {
        console.error('Failed to update phone auth:', phoneError);
      }

      // Mark first login as complete
      await supabase
        .from('agents_profile')
        .update({ profile_completed: true })
        .eq('agent_id', agentId);

      return { success: true };
    } catch (error) {
      console.error('Error updating agent password:', error);
      return { success: false, error };
    }
  },

  /**
   * Retrieves agent by phone number
   */
  async getAgentByPhone(phone: string) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('phone_auth')
        .select('agent_id')
        .eq('phone', phone)
        .eq('active', true)
        .single();

      if (error) throw error;
      if (!data?.agent_id) {
        return { success: false, error: new Error('Agent not found') };
      }

      const { data: agent } = await supabase
        .from('agents_profile')
        .select('*')
        .eq('agent_id', data.agent_id)
        .single();

      return { success: true, agent };
    } catch (error) {
      console.error('Error getting agent by phone:', error);
      return { success: false, error };
    }
  },

  /**
   * Deactivates an agent account
   */
  async deactivateAgent(agentId: string) {
    try {
      const supabase = createClient();
      // Deactivate in agents table
      const { error: agentError } = await supabase
        .from('raw_agents')
        .update({ is_active: false })
        .eq('id', agentId);

      if (agentError) throw agentError;

      // Deactivate in phone_auth table
      const { error: phoneAuthError } = await supabase
        .from('phone_auth')
        .update({ active: false })
        .eq('agent_id', agentId);

      if (phoneAuthError) throw phoneAuthError;

      return { success: true };
    } catch (error) {
      console.error('Error deactivating agent:', error);
      return { success: false, error };
    }
  },

  /**
   * Activates an agent account
   */
  async activateAgent(agentId: string) {
    try {
      const supabase = createClient();
      // Activate in agents table
      const { error: agentError } = await supabase
        .from('raw_agents')
        .update({ is_active: true })
        .eq('id', agentId);

      if (agentError) throw agentError;

      // Activate in phone_auth table
      const { error: phoneAuthError } = await supabase
        .from('phone_auth')
        .update({ active: true })
        .eq('agent_id', agentId);

      if (phoneAuthError) throw phoneAuthError;

      return { success: true };
    } catch (error) {
      console.error('Error activating agent:', error);
      return { success: false, error };
    }
  }
};
