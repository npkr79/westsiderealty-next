export type CrmRole =
  | "admin"
  | "sales_head"
  | "team_lead"
  | "agent"
  | "marketing"
  | "channel_partner"
  | "analyst";

export interface CrmUser {
  id: string;
  email: string;
  full_name: string | null;
  role: CrmRole;
  is_active: boolean;
  role_name?: string | null;
  whatsapp_number?: string | null;
}

export interface CrmLead {
  id: string;
  name: string;
  phone: string;
  source: string | null;
  source_type?: string | null;
  source_channel?: string | null;
  source_name?: string | null;
  project_id?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  location: string | null;
  buyer_type: string | null;
  status: string | null;
  priority?: string | null;
  assignment_status?: string | null;
  assigned_to?: string | null;
  assigned_agent_id: string | null;
  assigned_agent_name?: string | null;
  stage_id?: string | null;
  stage_name?: string | null;
  created_at?: string;
  updated_at?: string;
  last_activity_at?: string | null;
  campaign_name?: string | null;
  campaign_id?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  landing_page_url?: string | null;
  micro_market?: string | null;
  attribution_metadata?: Record<string, unknown> | null;
}

export interface CrmTask {
  id: string;
  title: string;
  description?: string | null;
  status: string | null;
  priority?: string | null;
  due_date?: string | null;
  assigned_to?: string | null;
  lead_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CrmActivity {
  id: string;
  lead_id: string;
  activity_type: string;
  description?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at?: string;
}

export interface CrmConversation {
  id: string;
  lead_id: string;
  channel: "whatsapp" | string;
  recipient_phone: string;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
  last_message_at?: string | null;
}

export interface CrmMessage {
  id: string;
  conversation_id: string;
  lead_id: string;
  direction: "inbound" | "outbound" | string;
  message_type: "text" | "template" | "system" | string;
  content: string | null;
  template_name?: string | null;
  status?: string | null;
  provider_message_id?: string | null;
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CrmBehaviorEvent {
  id: string;
  lead_id: string | null;
  event_name: string;
  event_type?: string | null;
  event_score?: number | null;
  source?: string | null;
  device?: string | null;
  session_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

