
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

      // Update agents table
      const { data, error } = await supabase
        .from('agents')
        .update({
          name: profileData.name,
          phone: profileData.phone,
          bio: profileData.bio,
          specialization: profileData.specialization,
          service_areas: profileData.service_areas || [],
          whatsapp: profileData.whatsapp,
          linkedin: profileData.linkedin,
          instagram: profileData.instagram,
          profile_image: profileData.profile_image,
          profile_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('AgentProfileService: Update error:', error);
        return null;
      }

      // Get user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      const userRole = roleData?.role || 'agent';

      // Fix service areas type conversion
      const serviceAreas: string[] = Array.isArray(data.service_areas)
        ? data.service_areas.filter((area): area is string => typeof area === 'string')
        : [];

      const updatedUser: User = {
        id: String(data.id),
        name: String(data.name || ''),
        email: String(data.email || ''),
        phone: String(data.phone || ''),
        role: String(userRole),
        bio: String(data.bio || ''),
        specialization: String(data.specialization || ''),
        profileImage: String(data.profile_image || ''),
        serviceAreas: serviceAreas,
        whatsapp: String(data.whatsapp || ''),
        linkedin: String(data.linkedin || ''),
        instagram: String(data.instagram || ''),
        createdAt: String(data.created_at || ''),
        profileCompleted: Boolean(data.profile_completed)
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
        .from('agents')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('AgentProfileService: Get agents error:', error);
        return [];
      }

      return data.map(agent => ({
        ...agent,
        service_areas: Array.isArray(agent.service_areas) 
          ? agent.service_areas.filter((area): area is string => typeof area === 'string')
          : []
      }));
    } catch (error) {
      console.error('AgentProfileService: Get agents exception:', error);
      return [];
    }
  },

  async getAgentById(agentId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error) {
        console.error('AgentProfileService: Get agent error:', error);
        return null;
      }

      return {
        ...data,
        service_areas: Array.isArray(data.service_areas) 
          ? data.service_areas.filter((area): area is string => typeof area === 'string')
          : []
      };
    } catch (error) {
      console.error('AgentProfileService: Get agent exception:', error);
      return null;
    }
  }
};
