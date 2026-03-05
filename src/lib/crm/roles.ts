import type { CrmRole } from "@/lib/crm/types";

const normalizeRoleName = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const roleNameMap: Record<string, CrmRole> = {
  admin: "admin",
  sales_head: "sales_head",
  saleshead: "sales_head",
  team_lead: "team_lead",
  teamlead: "team_lead",
  agent: "agent",
  marketing: "marketing",
  channel_partner: "channel_partner",
  channelpartner: "channel_partner",
  analyst: "analyst",
  analytics: "analyst",
};

export const mapRoleNameToCrmRole = (roleName: string | null | undefined): CrmRole | null => {
  if (!roleName) return null;
  return roleNameMap[normalizeRoleName(roleName)] ?? null;
};

export const getDashboardPathForRole = (role: CrmRole): string => {
  if (role === "admin") return "/dashboard/admin";
  if (role === "sales_head") return "/dashboard/sales";
  if (role === "team_lead") return "/dashboard/team";
  if (role === "agent") return "/dashboard/agent";
  if (role === "marketing") return "/dashboard/marketing";
  if (role === "channel_partner") return "/dashboard/partner";
  return "/dashboard/analytics";
};
