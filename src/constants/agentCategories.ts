export const AGENT_CATEGORIES = [
  "The Commander",
  "The Strategist",
  "The Advisor",
  "The Partner",
  "The Corporate Executive",
  "The Mandate Director",
] as const;

export type AgentCategory = (typeof AGENT_CATEGORIES)[number];

export const isValidAgentCategory = (value: string | null | undefined): value is AgentCategory =>
  AGENT_CATEGORIES.includes(value as AgentCategory);
