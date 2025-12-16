import { supabaseAgentService } from '@/services/supabaseAgentService';

// Use Supabase image for agent profile pictures.
const DEFAULT_AGENT_IMAGE = "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/bdc043d1-2a86-4db4-a75f-9749a13a8ae8.png";

// Hardcoded agents data to match our authentication system
const hardcodedAgents = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Admin User',
    email: 'admin@hyderabadresale.com',
    phone: '9866085831',
    bio: 'System Administrator with extensive experience in real estate management and operations.',
    specialization: 'Administration',
    profile_image: DEFAULT_AGENT_IMAGE,
    service_areas: ['Hyderabad', 'Secunderabad'],
    whatsapp: '919866085831',
    linkedin: '',
    instagram: '',
    profile_completed: true,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Srinivas',
    email: 'srinivas@hyderabadresale.com',
    phone: '7901008990',
    bio: 'Experienced real estate professional specializing in residential properties. Helping families find their dream homes with personalized service and market expertise.',
    specialization: 'Residential Properties',
    profile_image: DEFAULT_AGENT_IMAGE,
    service_areas: ['Gachibowli', 'Madhapur', 'Hitech City'],
    whatsapp: '917901008990',
    linkedin: '',
    instagram: '',
    profile_completed: true,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Yaswanth',
    email: 'yaswanth@hyderabadresale.com',
    phone: '8919567156',
    bio: 'Commercial real estate expert with deep understanding of business property needs. Specializing in office spaces, retail outlets, and investment opportunities.',
    specialization: 'Commercial Properties',
    profile_image: DEFAULT_AGENT_IMAGE,
    service_areas: ['Banjara Hills', 'Jubilee Hills', 'Financial District'],
    whatsapp: '918919567156',
    linkedin: '',
    instagram: '',
    profile_completed: true,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Naveen',
    email: 'naveen@hyderabadresale.com',
    phone: '9573808992',
    bio: 'Luxury property specialist catering to high-end residential and commercial properties. Expert in premium locations and exclusive developments.',
    specialization: 'Luxury Properties',
    profile_image: DEFAULT_AGENT_IMAGE,
    service_areas: ['Banjara Hills', 'Jubilee Hills', 'Kondapur'],
    whatsapp: '919573808992',
    linkedin: '',
    instagram: '',
    profile_completed: true,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'Shashi',
    email: 'shashi@hyderabadresale.com',
    phone: '9063452291',
    bio: 'Villa and independent house specialist with expertise in premium residential properties. Focused on providing luxury living solutions.',
    specialization: 'Villa Properties',
    profile_image: DEFAULT_AGENT_IMAGE,
    service_areas: ['Shamshabad', 'Kompally', 'Bowenpally'],
    whatsapp: '919063452291',
    linkedin: '',
    instagram: '',
    profile_completed: true,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    name: 'Rakesh',
    email: 'rakesh@hyderabadresale.com',
    phone: '8341578039',
    bio: 'Plot and land development expert helping clients find the perfect plots for their dream projects. Specializing in residential and commercial land deals.',
    specialization: 'Plot Sales',
    profile_image: DEFAULT_AGENT_IMAGE,
    service_areas: ['Outer Ring Road', 'Shamirpet', 'Ghatkesar'],
    whatsapp: '918341578039',
    linkedin: '',
    instagram: '',
    profile_completed: true,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000007',
    name: 'Swetha',
    email: 'swetha@hyderabadresale.com',
    phone: '9866017201',
    bio: 'Apartment sales specialist with comprehensive knowledge of residential complexes and gated communities. Dedicated to finding the perfect home for every family.',
    specialization: 'Apartment Sales',
    profile_image: DEFAULT_AGENT_IMAGE,
    service_areas: ['Miyapur', 'Kukatpally', 'Bachupally'],
    whatsapp: '919866017201',
    linkedin: '',
    instagram: '',
    profile_completed: true,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000008',
    name: 'Krishna',
    email: 'krishna@hyderabadresale.com',
    phone: '9666845340',
    bio: 'Investment property advisor helping clients maximize their real estate portfolio returns. Expert in identifying high-growth potential properties.',
    specialization: 'Investment Properties',
    profile_image: DEFAULT_AGENT_IMAGE,
    service_areas: ['Uppal', 'LB Nagar', 'Dilsukhnagar'],
    whatsapp: '919666845340',
    linkedin: '',
    instagram: '',
    profile_completed: true,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const agentService = {
  async getAllAgentsForPublic() {
    try {
      const supabaseAgents = await supabaseAgentService.getPublicAgents();
      console.log('Fetched agents from Supabase:', supabaseAgents);
      
      if (supabaseAgents && supabaseAgents.length > 0) {
        return supabaseAgents;
      }
      
      // Fallback to hardcoded data if no Supabase data
      console.log('No Supabase data found, using hardcoded agents');
      return hardcodedAgents;
    } catch (error) {
      console.error('AgentService: Error getting agents for public, using hardcoded data:', error);
      return hardcodedAgents;
    }
  },

  async getAllAgents() {
    try {
      const supabaseAgents = await supabaseAgentService.getAllAgents();
      console.log('Fetched all agents from Supabase:', supabaseAgents);
      
      if (supabaseAgents && supabaseAgents.length > 0) {
        return supabaseAgents;
      }
      
      // Fallback to hardcoded data if no Supabase data
      console.log('No Supabase data found, using hardcoded agents');
      return hardcodedAgents;
    } catch (error) {
      console.error('AgentService: Error getting all agents, using hardcoded data:', error);
      return hardcodedAgents;
    }
  },

  async getAgentById(id: string) {
    try {
      const supabaseAgent = await supabaseAgentService.getAgentById(id);
      console.log('Fetched agent by ID from Supabase:', supabaseAgent);
      
      if (supabaseAgent) {
        return supabaseAgent;
      }
      
      // Fallback to hardcoded data
      console.log('No Supabase data found for agent, using hardcoded agent');
      return hardcodedAgents.find(agent => agent.id === id) || null;
    } catch (error) {
      console.error('AgentService: Error getting agent by ID, using hardcoded data:', error);
      return hardcodedAgents.find(agent => agent.id === id) || null;
    }
  },

  async createOrUpdateAgent(agentData: any) {
    try {
      console.log('Creating/updating agent:', agentData);
      
      // Check if agent exists
      const existingAgent = await supabaseAgentService.getAgentById(agentData.id);
      
      if (existingAgent) {
        // Update existing agent
        const updatedAgent = await supabaseAgentService.updateAgent(agentData.id, agentData);
        console.log('Updated agent:', updatedAgent);
        return updatedAgent;
      } else {
        // Create new agent
        const newAgent = await supabaseAgentService.createAgent(agentData);
        console.log('Created new agent:', newAgent);
        return newAgent;
      }
    } catch (error) {
      console.error('AgentService: Error creating/updating agent:', error);
      throw error;
    }
  },

  // Performance tracking methods
  async getAgentPerformance(agentId: string) {
    return await supabaseAgentService.getAgentPerformance(agentId);
  },

  async updateAgentPerformance(agentId: string, performance: any) {
    return await supabaseAgentService.updateAgentPerformance(agentId, performance);
  },

  // Activity tracking methods
  async getAgentActivities(agentId: string, limit?: number) {
    return await supabaseAgentService.getAgentActivities(agentId, limit);
  },

  async logAgentActivity(agentId: string, activityType: string, description: string, metadata?: any) {
    return await supabaseAgentService.logAgentActivity({
      agent_id: agentId,
      activity_type: activityType,
      activity_description: description,
      metadata: metadata || {}
    });
  },

  // Commission tracking methods
  async getAgentCommissions(agentId: string) {
    return await supabaseAgentService.getAgentCommissions(agentId);
  },

  async addAgentCommission(commission: any) {
    return await supabaseAgentService.createCommission(commission);
  },

  // Preferences methods
  async getAgentPreferences(agentId: string) {
    return await supabaseAgentService.getAgentPreferences(agentId);
  },

  async updateAgentPreferences(agentId: string, preferences: any) {
    return await supabaseAgentService.updateAgentPreferences(agentId, preferences);
  }
};
