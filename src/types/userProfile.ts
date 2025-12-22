/**
 * Comprehensive User Profile Types
 * Defines all user-related interfaces for the application
 */

export interface BaseUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends BaseUser {
  name: string;
  phone?: string;
  profile_image?: string;
  bio?: string;
  active: boolean;
  profile_completed: boolean;
  last_login?: string;
  preferences?: UserPreferences;
}

export interface AgentProfile extends UserProfile {
  specialization?: string;
  service_areas: string[];
  whatsapp?: string;
  linkedin?: string;
  instagram?: string;
  license_number?: string;
  commission_rate?: number;
  performance_metrics?: AgentPerformanceMetrics;
}

export interface AdminProfile extends UserProfile {
  permissions: AdminPermission[];
  department?: string;
  access_level: 'read' | 'write' | 'admin' | 'super_admin';
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  privacy: {
    profile_visibility: 'public' | 'private' | 'agents_only';
    contact_visibility: boolean;
  };
  communication: {
    preferred_language: string;
    timezone: string;
  };
}

export interface AgentPerformanceMetrics {
  total_sales: number;
  properties_sold: number;
  average_rating: number;
  total_reviews: number;
  response_time_hours: number;
  active_listings: number;
}

export interface AdminPermission {
  resource: string;
  actions: string[];
  granted_at: string;
  granted_by: string;
}

export interface UserRole {
  user_id: string;
  role: 'user' | 'agent' | 'admin' | 'super_admin';
  assigned_at: string;
  assigned_by: string;
}

// API Response Types
export interface UserProfileResponse {
  data: UserProfile | AgentProfile | AdminProfile | null;
  error: string | null;
  cached: boolean;
  cache_timestamp?: number;
}

export interface UserProfileListResponse {
  data: UserProfile[];
  error: string | null;
  total_count: number;
  page: number;
  page_size: number;
}

// Service Configuration Types
export interface CacheConfig {
  ttl_minutes: number;
  max_entries: number;
  cleanup_interval_minutes: number;
}

export interface ServiceConfig {
  cache: CacheConfig;
  retry: {
    max_attempts: number;
    delay_ms: number;
    exponential_backoff: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    include_stack_trace: boolean;
  };
}

// Cache Entry Type
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires_at: number;
  access_count: number;
  last_accessed: number;
}

// Search and Filter Types
export interface UserSearchFilters {
  role?: string;
  active?: boolean;
  profile_completed?: boolean;
  service_areas?: string[];
  specialization?: string;
  created_after?: string;
  created_before?: string;
}

export interface UserSearchOptions {
  query?: string;
  filters?: UserSearchFilters;
  sort_by?: 'name' | 'created_at' | 'last_login' | 'performance';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

// Update Types
export interface UserProfileUpdate {
  name?: string;
  phone?: string;
  profile_image?: string;
  bio?: string;
  preferences?: Partial<UserPreferences>;
}

export interface AgentProfileUpdate extends UserProfileUpdate {
  specialization?: string;
  service_areas?: string[];
  whatsapp?: string;
  linkedin?: string;
  instagram?: string;
  license_number?: string;
}

export interface AdminProfileUpdate extends UserProfileUpdate {
  permissions?: AdminPermission[];
  department?: string;
  access_level?: 'read' | 'write' | 'admin' | 'super_admin';
}

// Error Types
export interface UserProfileError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  user_id?: string;
  operation?: string;
}

// Event Types for logging and monitoring
export interface UserProfileEvent {
  type: 'profile_created' | 'profile_updated' | 'profile_deleted' | 'cache_hit' | 'cache_miss' | 'api_error';
  user_id: string;
  timestamp: number;
  metadata?: any;
}