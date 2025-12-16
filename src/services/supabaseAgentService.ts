
// Re-export all agent services from a single entry point for backward compatibility
export * from './agent/agentProfileService';
export * from './agent/agentPerformanceService';
export * from './agent/agentActivityService';
export * from './agent/agentCommissionService';
export * from './agent/agentPreferencesService';

// Main service object that combines all agent services
import { agentProfileService } from './agent/agentProfileService';
import { agentPerformanceService } from './agent/agentPerformanceService';
import { agentActivityService } from './agent/agentActivityService';
import { agentCommissionService } from './agent/agentCommissionService';
import { agentPreferencesService } from './agent/agentPreferencesService';

export const supabaseAgentService = {
  // Agent Profile methods
  ...agentProfileService,
  
  // Agent Performance methods
  ...agentPerformanceService,
  
  // Agent Activities methods
  ...agentActivityService,
  
  // Agent Commissions methods
  ...agentCommissionService,
  
  // Agent Preferences methods
  ...agentPreferencesService
};
