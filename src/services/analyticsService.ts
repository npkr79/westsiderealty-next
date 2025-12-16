
import { propertyService } from "./propertyService";
import { userService } from "./userService";
import type { PropertyData } from "./propertyService";

interface PropertyAnalytics {
  propertyId: string;
  views: number;
  leads: number;
  lastViewed: string;
}

interface LeadData {
  id: string;
  name: string;
  phone: string;
  email: string;
  propertyId: string;
  propertyTitle: string;
  message: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'qualified' | 'closed';
}

interface DashboardStats {
  totalProperties: number;
  activeListings: number;
  totalLeads: number;
  pendingApproval: number;
  thisMonthViews: number;
  conversionRate: number;
}

class AnalyticsService {
  private propertyAnalytics: PropertyAnalytics[] = [];
  private leads: LeadData[] = [];

  // Get dashboard statistics for current agent
  async getDashboardStats(agentId: string): Promise<DashboardStats> {
    const agentProperties = await propertyService.getProperties({ agentId });
    
    const totalProperties = agentProperties.length;
    const activeListings = agentProperties.filter(p => p.status === 'published').length;
    const pendingApproval = agentProperties.filter(p => p.status === 'draft').length;
    
    const agentLeads = this.leads.filter(lead => 
      agentProperties.some(prop => prop.id === lead.propertyId)
    );
    
    const totalLeads = agentLeads.length;
    const thisMonthViews = this.getTotalViews(agentProperties.map(p => p.id!));
    const conversionRate = totalLeads > 0 ? (agentLeads.filter(l => l.status === 'closed').length / totalLeads) * 100 : 0;

    return {
      totalProperties,
      activeListings,
      totalLeads,
      pendingApproval,
      thisMonthViews,
      conversionRate
    };
  }

  // Get analytics for specific properties
  getPropertyAnalytics(propertyIds: string[]): PropertyAnalytics[] {
    return propertyIds.map(id => {
      const existing = this.propertyAnalytics.find(a => a.propertyId === id);
      if (existing) return existing;
      
      // Generate realistic mock data for properties
      const views = Math.floor(Math.random() * 500) + 50;
      const leads = Math.floor(Math.random() * 20) + 1;
      
      const analytics: PropertyAnalytics = {
        propertyId: id,
        views,
        leads,
        lastViewed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      this.propertyAnalytics.push(analytics);
      return analytics;
    });
  }

  // Get recent leads for an agent
  getRecentLeads(agentId: string, limit: number = 5): LeadData[] {
    const agentProperties = propertyService.getProperties({ agentId });
    const propertyIds = agentProperties.then(props => props.map(p => p.id!));
    
    return this.leads
      .filter(lead => propertyIds.then(ids => ids.includes(lead.propertyId)))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Add a new lead (mock functionality)
  addLead(leadData: Omit<LeadData, 'id' | 'createdAt'>): LeadData {
    const newLead: LeadData = {
      ...leadData,
      id: (this.leads.length + 1).toString(),
      createdAt: new Date().toISOString()
    };
    
    this.leads.push(newLead);
    return newLead;
  }

  private getTotalViews(propertyIds: string[]): number {
    return propertyIds.reduce((total, id) => {
      const analytics = this.propertyAnalytics.find(a => a.propertyId === id);
      return total + (analytics?.views || 0);
    }, 0);
  }

  // Initialize with sample data
  init() {
    // Add some sample leads
    if (this.leads.length === 0) {
      this.addSampleLeads();
    }
  }

  private addSampleLeads() {
    const sampleLeads = [
      {
        name: "Rajesh Kumar",
        phone: "+91 9876543210",
        email: "rajesh.kumar@email.com",
        propertyId: "1",
        propertyTitle: "3BHK Apartment in Kokapet",
        message: "Interested in viewing this property",
        status: 'new' as const
      },
      {
        name: "Priya Sharma",
        phone: "+91 9876543211",
        email: "priya.sharma@email.com",
        propertyId: "2",
        propertyTitle: "Villa in Gachibowli",
        message: "Looking for immediate possession",
        status: 'contacted' as const
      },
      {
        name: "Anil Reddy",
        phone: "+91 9876543212",
        email: "anil.reddy@email.com",
        propertyId: "1",
        propertyTitle: "3BHK Apartment in Kokapet",
        message: "What is the final price?",
        status: 'qualified' as const
      }
    ];

    sampleLeads.forEach(lead => this.addLead(lead));
  }
}

export const analyticsService = new AnalyticsService();
export type { PropertyAnalytics, LeadData, DashboardStats };
