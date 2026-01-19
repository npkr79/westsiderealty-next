export const AGENT_CATEGORIES = [
  "Tier 1: The Neighborhood Specialist",
  "Tier 2: The Inventory Partner",
  "Tier 3: The Portfolio Manager",
  "Tier 4: The Corporate Associate",
  "Tier 5: The Mandate Director",
] as const;

export type AgentCategory = (typeof AGENT_CATEGORIES)[number];

export const isValidAgentCategory = (value: string | null | undefined): value is AgentCategory =>
  AGENT_CATEGORIES.includes(value as AgentCategory);
