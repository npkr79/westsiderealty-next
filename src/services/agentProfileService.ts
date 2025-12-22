
import { createClient } from '@/lib/supabase/server';
import { userProfileService } from './userProfileService';
import type { AgentProfile, AgentProfileUpdate } from '@/types/userProfile';

// Legacy User type for backward compatibility
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
  /**
   * Enhanced updateProfile using UserProfileService
   */
  async updateProfile(userId: string, profileData: any): Promise<User | null> {
    try {
      console.log('AgentProfileService: Updating profile for user:', userId);

      // Prepare update data for UserProfileService
      const updateData: AgentProfileUpdate = {
        name: profileData.name,
        phone: profileData.phone,
        bio: profileData.bio,
        specialization: profileData.specialization,
        service_areas: profileData.service_areas || [],
        whatsapp: profileData.whatsapp,
        linkedin: profileData.linkedin,
        instagram: profileData.instagram,
        profile_image: profileData.profile_image
      };

      // Use UserProfileService for the update
      const response = await userProfileService.updateUserProfile(userId, updateData, 'agent');

      if (response.data && response.data.id) {
        const agentProfile = response.data as AgentProfile;
        
        // Convert to legacy User format for backward compatibility
        const updatedUser: User = {
          id: agentProfile.id,
          name: agentProfile.name,
          email: agentProfile.email,
          phone: agentProfile.phone || '',
          role: 'agent',
          bio: agentProfile.bio || '',
          specialization: agentProfile.specialization || '',
          profileImage: agentProfile.profile_image || '',
          serviceAreas: agentProfile.service_areas || [],
          whatsapp: agentProfile.whatsapp || '',
          linkedin: agentProfile.linkedin || '',
          instagram: agentProfile.instagram || '',
          createdAt: agentProfile.created_at,
          profileCompleted: agentProfile.profile_completed
        };

        console.log('AgentProfileService: Profile updated successfully via UserProfileService');
        return updatedUser;
      }

      console.error('AgentProfileService: Update failed:', response.error);
      return null;
    } catch (error) {
      console.error('AgentProfileService: Update exception:', error);
      return null;
    }
  },

  /**
   * Legacy updateProfile method (fallback)
   */
  async updateProfileLegacy(userId: string, profileData: any): Promise<User | null> {
    try {
      const supabase = await createClient();
      console.log('AgentProfileService: Using legacy update for user:', userId);

      // Update agents table directly
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
        console.error('AgentProfileService: Legacy update error:', error);
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
        ? data.service_areas.filter((area: any): area is string => typeof area === 'string')
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

      console.log('AgentProfileService: Legacy profile updated successfully');
      return updatedUser;
    } catch (error) {
      console.error('AgentProfileService: Legacy update exception:', error);
      return null;
    }
  },

  /**
   * Enhanced getAllAgents using UserProfileService
   */
  async getAllAgents(): Promise<any[]> {
    try {
      const response = await userProfileService.searchUsers({
        filters: { role: 'agent', active: true },
        sort_by: 'name',
        sort_order: 'asc',
        page: 1,
        page_size: 1000 // Get all agents
      });

      if (response.error) {
        console.error('AgentProfileService: Get agents error:', response.error);
        return [];
      }

      return response.data.map(agent => ({
        ...agent,
        service_areas: (agent as AgentProfile).service_areas || []
      }));
    } catch (error) {
      console.error('AgentProfileService: Get agents exception:', error);
      return [];
    }
  },

  /**
   * Enhanced getAgentById using UserProfileService
   */
  async getAgentById(agentId: string): Promise<any | null> {
    try {
      const response = await userProfileService.getUserProfile(agentId);

      if (response.error || !response.data) {
        console.error('AgentProfileService: Get agent error:', response.error);
        return null;
      }

      const agent = response.data as AgentProfile;
      return {
        ...agent,
        service_areas: agent.service_areas || []
      };
    } catch (error) {
      console.error('AgentProfileService: Get agent exception:', error);
      return null;
    }
  },

  /**
   * Legacy methods (fallback implementations)
   */
  async getAllAgentsLegacy(): Promise<any[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('AgentProfileService: Legacy get agents error:', error);
        return [];
      }

      return data.map(agent => ({
        ...agent,
        service_areas: Array.isArray(agent.service_areas) 
          ? agent.service_areas.filter((area: any): area is string => typeof area === 'string')
          : []
      }));
    } catch (error) {
      console.error('AgentProfileService: Legacy get agents exception:', error);
      return [];
    }
  },

  async getAgentByIdLegacy(agentId: string): Promise<any | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error) {
        console.error('AgentProfileService: Legacy get agent error:', error);
        return null;
      }

      return {
        ...data,
        service_areas: Array.isArray(data.service_areas) 
          ? data.service_areas.filter((area: any): area is string => typeof area === 'string')
          : []
      };
    } catch (error) {
      console.error('AgentProfileService: Legacy get agent exception:', error);
      return null;
    }
  },

  /**
   * New methods leveraging UserProfileService capabilities
   */
  async searchAgents(query: string, filters?: any) {
    return await userProfileService.searchUsers({
      query,
      filters: { ...filters, role: 'agent' },
      page: 1,
      page_size: 50
    });
  },

  getCacheStats() {
    return userProfileService.getCacheStats();
  },

  clearCache() {
    userProfileService.clearCache();
  }
};
