
import { LandingPageLeadsApi } from './landingPageLeadsApi';
import { LandingPageLeadsExport } from './landingPageLeadsExport';
import { LandingPageLead, CreateLandingPageLead } from '@/types/landingPageLead';

class LandingPageLeadsService {
  private api: LandingPageLeadsApi;
  private export: LandingPageLeadsExport;

  constructor() {
    this.api = new LandingPageLeadsApi();
    this.export = new LandingPageLeadsExport();
  }

  // API methods
  async submitLead(leadData: CreateLandingPageLead): Promise<void> {
    return this.api.submitLead(leadData);
  }

  async getAllLeads(): Promise<LandingPageLead[]> {
    return this.api.getAllLeads();
  }

  async getLeadsByPage(sourcePageUrl: string): Promise<LandingPageLead[]> {
    return this.api.getLeadsByPage(sourcePageUrl);
  }

  async testDatabaseAccess(): Promise<{ success: boolean; message: string; details?: any }> {
    return this.api.testDatabaseAccess();
  }

  // Export methods
  exportToCsv(leads: LandingPageLead[]): void {
    return this.export.exportToCsv(leads);
  }
}

export const landingPageLeadsService = new LandingPageLeadsService();

// Re-export types for backward compatibility
export type { LandingPageLead, CreateLandingPageLead };
