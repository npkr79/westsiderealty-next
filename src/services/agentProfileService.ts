
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();


// Define a User type that matches AgentProfileData for updateProfile return
type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  bio: string;
  specialization: string;
  profileImage: string;
  serviceAreas: string[];
  whatsapp: string;
  linkedin: string;
  instagram: string;
  createdAt: string;
  profileCompleted: boolean;
};

export const agentProfileService = {
  async updateProfile(userId: string, profileData: any): Promise<User | null> {
    try {
      console.log('AgentProfileService: Updating profile for user:', userId);

      // crm_users only stores: full_name, phone, whatsapp_number
      // bio, specialization, service_areas, profile_image, linkedin, instagram, profile_completed
      // do NOT exist on crm_users — update only the available fields
      const { data, error } = await supabase
        .from('crm_users')
        .update({
          full_name: profileData.name,
          phone: profileData.phone,
          whatsapp_number: profileData.whatsapp,
        })
        .eq('id', userId)
        .select('id, full_name, phone, whatsapp_number, created_at, crm_roles(name)')
        .single();

      if (error) {
        console.error('AgentProfileService: Update error:', error);
        return null;
      }

      // Get user role from crm_roles join
      const crmRoles = (data as any)?.crm_roles;
      const userRole: string = Array.isArray(crmRoles)
        ? (crmRoles[0]?.name ?? 'agent')
        : (crmRoles?.name ?? 'agent');

      const updatedUser: User = {
        id: String((data as any).id),
        name: String((data as any).full_name || ''),
        email: '',
        phone: String((data as any).phone || ''),
        role: userRole,
        bio: '',
        specialization: '',
        profileImage: '',
        serviceAreas: [],
        whatsapp: String((data as any).whatsapp_number || ''),
        linkedin: '',
        instagram: '',
        createdAt: String((data as any).created_at || ''),
        profileCompleted: false,
      };

      console.log('AgentProfileService: Profile updated successfully');
      return updatedUser;
    } catch (error) {
      console.error('AgentProfileService: Update exception:', error);
      return null;
    }
  },

  async getAllAgents(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('crm_users')
        .select('id, full_name, phone, is_active, created_at')
        .eq('is_active', true)
        .order('full_name');

      if (error) {
        console.error('AgentProfileService: Get agents error:', error);
        return [];
      }

      return (data || []).map((agent: any) => ({
        id: agent.id,
        agent_id: agent.id,
        name: agent.full_name,
        phone: agent.phone,
        is_active: agent.is_active,
        created_at: agent.created_at,
        service_areas: [],
      }));
    } catch (error) {
      console.error('AgentProfileService: Get agents exception:', error);
      return [];
    }
  },

  async getAgentById(agentId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('crm_users')
        .select('id, full_name, phone, is_active, created_at')
        .eq('id', agentId)
        .single();

      if (error) {
        console.error('AgentProfileService: Get agent error:', error);
        return null;
      }

      return {
        id: data.id,
        agent_id: data.id,
        name: data.full_name,
        phone: data.phone,
        is_active: data.is_active,
        created_at: data.created_at,
        service_areas: [],
      };
    } catch (error) {
      console.error('AgentProfileService: Get agent exception:', error);
      return null;
    }
  }
};
