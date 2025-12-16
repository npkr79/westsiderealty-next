export interface CreateLandingPageLead {
  name: string;
  phone: string;
  email: string;
  message?: string | null;
  source_page_url: string;
}

export interface LandingPageLead extends CreateLandingPageLead {
  id: string;
  full_name?: string;
  requirements_message?: string | null;
  lead_type?: string;
  status?: string;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any; // Allow additional fields from database
}

