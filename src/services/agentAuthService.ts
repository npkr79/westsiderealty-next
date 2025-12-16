import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();


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
    try {
      const defaultPassword = 'Welcome@123';
      
      // 1. Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: agentData.email,
        password: defaultPassword,
        options: {
          data: {
            name: agentData.name,
            phone: agentData.phone
          },
          emailRedirectTo: `${window.location.origin}/agent/dashboard`
        }
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Failed to create auth user');
      }

      // 2. Update agent profile (created by trigger)
      const { error: updateError } = await supabase
        .from('agents')
        .update({
          phone: agentData.phone,
          specialization: agentData.specialization || null,
          active: true,
          profile_completed: false
        })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('Failed to update agent profile:', updateError);
      }

      // 3. Create phone authentication record with default password
      const { error: phoneAuthError } = await supabase
        .rpc('create_hashed_phone_auth', {
          agent_id: authData.user.id,
          phone_number: agentData.phone,
          plain_password: defaultPassword
        });

      if (phoneAuthError) {
        console.error('Failed to create phone auth:', phoneAuthError);
        // Don't rollback, agent can still login with email
      }

      // 4. Assign agent role in user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'agent'
        });

      if (roleError) {
        console.error('Failed to assign agent role:', roleError);
      }

      return { success: true, agent: { id: authData.user.id, ...agentData } };
    } catch (error) {
      console.error('Error creating agent account:', error);
      return { success: false, error };
    }
  },

  /**
   * Updates agent password in both Supabase Auth and phone_auth table
   */
  async updateAgentPassword(agentId: string, newPassword: string) {
    try {
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
        .from('agents')
        .update({ profile_completed: true })
        .eq('id', agentId);

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
      const { data, error } = await supabase
        .from('phone_auth')
        .select('agent_id, agents(*)')
        .eq('phone', phone)
        .eq('active', true)
        .single();

      if (error) throw error;
      return { success: true, agent: data };
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
      // Deactivate in agents table
      const { error: agentError } = await supabase
        .from('agents')
        .update({ active: false })
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
      // Activate in agents table
      const { error: agentError } = await supabase
        .from('agents')
        .update({ active: true })
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
