/**
 * Comprehensive User Profile Service
 * Provides unified interface for user profile management with caching, error handling, and thread safety
 */

import { createClient } from '@/lib/supabase/server';
import type {
  UserProfile,
  AgentProfile,
  AdminProfile,
  UserProfileResponse,
  UserProfileListResponse,
  CacheEntry,
  ServiceConfig,
  UserSearchOptions,
  UserProfileUpdate,
  AgentProfileUpdate,
  AdminProfileUpdate,
  UserProfileError,
  UserProfileEvent,
  UserRole
} from '@/types/userProfile';

class UserProfileService {
  private cache: Map<string, CacheEntry<UserProfile | AgentProfile | AdminProfile>>;
  private config: ServiceConfig;
  private cacheLocks: Map<string, Promise<any>>;
  private eventLog: UserProfileEvent[];

  constructor(config?: Partial<ServiceConfig>) {
    this.cache = new Map();
    this.cacheLocks = new Map();
    this.eventLog = [];
    
    // Default configuration
    this.config = {
      cache: {
        ttl_minutes: 5,
        max_entries: 1000,
        cleanup_interval_minutes: 10
      },
      retry: {
        max_attempts: 3,
        delay_ms: 1000,
        exponential_backoff: true
      },
      logging: {
        level: 'info',
        include_stack_trace: false
      },
      ...config
    };

    // Start cache cleanup interval
    this.startCacheCleanup();
  }

  /**
   * Get user profile by ID with caching
   */
  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    try {
      this.logEvent('cache_hit', userId, { operation: 'getUserProfile' });
      
      // Check cache first (thread-safe)
      const cachedProfile = await this.getCachedProfile(userId);
      if (cachedProfile) {
        return {
          data: cachedProfile,
          error: null,
          cached: true,
          cache_timestamp: this.cache.get(userId)?.timestamp
        };
      }

      this.logEvent('cache_miss', userId, { operation: 'getUserProfile' });

      // Fetch from database with retry logic
      const profile = await this.fetchProfileWithRetry(userId);
      
      if (profile) {
        // Cache the result
        await this.setCachedProfile(userId, profile);
        
        return {
          data: profile,
          error: null,
          cached: false
        };
      }

      return {
        data: null,
        error: 'User profile not found',
        cached: false
      };

    } catch (error) {
      const errorDetails = this.createError('FETCH_ERROR', 'Failed to fetch user profile', error, userId, 'getUserProfile');
      this.logError(errorDetails);
      
      return {
        data: null,
        error: errorDetails.message,
        cached: false
      };
    }
  }

  /**
   * Update user profile with cache invalidation
   */
  async updateUserProfile(
    userId: string, 
    updates: UserProfileUpdate | AgentProfileUpdate | AdminProfileUpdate,
    userType: 'user' | 'agent' | 'admin' = 'user'
  ): Promise<UserProfileResponse> {
    try {
      const supabase = await createClient();
      let updatedProfile: UserProfile | AgentProfile | AdminProfile | null = null;

      // Determine which table to update based on user type
      switch (userType) {
        case 'agent':
          updatedProfile = await this.updateAgentProfile(supabase, userId, updates as AgentProfileUpdate);
          break;
        case 'admin':
          updatedProfile = await this.updateAdminProfile(supabase, userId, updates as AdminProfileUpdate);
          break;
        default:
          updatedProfile = await this.updateBaseProfile(supabase, userId, updates);
      }

      if (updatedProfile) {
        // Invalidate cache and update with new data
        await this.invalidateCache(userId);
        await this.setCachedProfile(userId, updatedProfile);
        
        this.logEvent('profile_updated', userId, { userType, updates });
        
        return {
          data: updatedProfile,
          error: null,
          cached: false
        };
      }

      return {
        data: null,
        error: 'Failed to update profile',
        cached: false
      };

    } catch (error) {
      const errorDetails = this.createError('UPDATE_ERROR', 'Failed to update user profile', error, userId, 'updateUserProfile');
      this.logError(errorDetails);
      
      return {
        data: null,
        error: errorDetails.message,
        cached: false
      };
    }
  }

  /**
   * Search users with filtering and pagination
   */
  async searchUsers(options: UserSearchOptions = {}): Promise<UserProfileListResponse> {
    try {
      const supabase = await createClient();
      const {
        query = '',
        filters = {},
        sort_by = 'created_at',
        sort_order = 'desc',
        page = 1,
        page_size = 20
      } = options;

      let queryBuilder = supabase
        .from('agents') // Start with agents table as it has most profile data
        .select(`
          *,
          user_roles!inner(role)
        `);

      // Apply filters
      if (filters.role) {
        queryBuilder = queryBuilder.eq('user_roles.role', filters.role);
      }
      
      if (filters.active !== undefined) {
        queryBuilder = queryBuilder.eq('active', filters.active);
      }
      
      if (filters.profile_completed !== undefined) {
        queryBuilder = queryBuilder.eq('profile_completed', filters.profile_completed);
      }

      if (filters.service_areas && filters.service_areas.length > 0) {
        queryBuilder = queryBuilder.overlaps('service_areas', filters.service_areas);
      }

      if (filters.specialization) {
        queryBuilder = queryBuilder.ilike('specialization', `%${filters.specialization}%`);
      }

      // Apply search query
      if (query) {
        queryBuilder = queryBuilder.or(`
          name.ilike.%${query}%,
          email.ilike.%${query}%,
          bio.ilike.%${query}%,
          specialization.ilike.%${query}%
        `);
      }

      // Apply sorting
      queryBuilder = queryBuilder.order(sort_by, { ascending: sort_order === 'asc' });

      // Apply pagination
      const offset = (page - 1) * page_size;
      queryBuilder = queryBuilder.range(offset, offset + page_size - 1);

      const { data, error, count } = await queryBuilder;

      if (error) throw error;

      const profiles = data?.map(this.mapDatabaseToProfile) || [];

      return {
        data: profiles,
        error: null,
        total_count: count || 0,
        page,
        page_size
      };

    } catch (error) {
      const errorDetails = this.createError('SEARCH_ERROR', 'Failed to search users', error, undefined, 'searchUsers');
      this.logError(errorDetails);
      
      return {
        data: [],
        error: errorDetails.message,
        total_count: 0,
        page: options.page || 1,
        page_size: options.page_size || 20
      };
    }
  }

  /**
   * Get user role information
   */
  async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.logError(this.createError('ROLE_FETCH_ERROR', 'Failed to fetch user role', error, userId, 'getUserRole'));
      return null;
    }
  }

  /**
   * Cache management methods
   */
  private async getCachedProfile(userId: string): Promise<UserProfile | AgentProfile | AdminProfile | null> {
    const entry = this.cache.get(userId);
    
    if (!entry) return null;
    
    // Check if cache entry is expired
    if (Date.now() > entry.expires_at) {
      this.cache.delete(userId);
      return null;
    }

    // Update access statistics
    entry.access_count++;
    entry.last_accessed = Date.now();
    
    return entry.data;
  }

  private async setCachedProfile(userId: string, profile: UserProfile | AgentProfile | AdminProfile): Promise<void> {
    // Prevent concurrent cache operations for the same user
    const existingLock = this.cacheLocks.get(userId);
    if (existingLock) {
      await existingLock;
    }

    const lockPromise = this.performCacheSet(userId, profile);
    this.cacheLocks.set(userId, lockPromise);
    
    try {
      await lockPromise;
    } finally {
      this.cacheLocks.delete(userId);
    }
  }

  private async performCacheSet(userId: string, profile: UserProfile | AgentProfile | AdminProfile): Promise<void> {
    const now = Date.now();
    const ttlMs = this.config.cache.ttl_minutes * 60 * 1000;
    
    const entry: CacheEntry<UserProfile | AgentProfile | AdminProfile> = {
      data: profile,
      timestamp: now,
      expires_at: now + ttlMs,
      access_count: 1,
      last_accessed: now
    };

    // Check cache size limit
    if (this.cache.size >= this.config.cache.max_entries) {
      this.evictOldestEntries();
    }

    this.cache.set(userId, entry);
  }

  private async invalidateCache(userId: string): Promise<void> {
    this.cache.delete(userId);
  }

  private evictOldestEntries(): void {
    // Remove 10% of entries, starting with least recently accessed
    const entriesToRemove = Math.floor(this.config.cache.max_entries * 0.1);
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.last_accessed - b.last_accessed)
      .slice(0, entriesToRemove);

    entries.forEach(([key]) => this.cache.delete(key));
  }

  private startCacheCleanup(): void {
    const intervalMs = this.config.cache.cleanup_interval_minutes * 60 * 1000;
    
    setInterval(() => {
      const now = Date.now();
      const expiredKeys: string[] = [];
      
      this.cache.forEach((entry, key) => {
        if (now > entry.expires_at) {
          expiredKeys.push(key);
        }
      });
      
      expiredKeys.forEach(key => this.cache.delete(key));
      
      if (expiredKeys.length > 0) {
        this.log('info', `Cleaned up ${expiredKeys.length} expired cache entries`);
      }
    }, intervalMs);
  }

  /**
   * Database operations with retry logic
   */
  private async fetchProfileWithRetry(userId: string): Promise<UserProfile | AgentProfile | AdminProfile | null> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.config.retry.max_attempts; attempt++) {
      try {
        return await this.fetchProfileFromDatabase(userId);
      } catch (error) {
        lastError = error;
        
        if (attempt < this.config.retry.max_attempts) {
          const delay = this.config.retry.exponential_backoff 
            ? this.config.retry.delay_ms * Math.pow(2, attempt - 1)
            : this.config.retry.delay_ms;
          
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  private async fetchProfileFromDatabase(userId: string): Promise<UserProfile | AgentProfile | AdminProfile | null> {
    const supabase = await createClient();
    
    // First, get user role to determine which table to query
    const roleData = await this.getUserRole(userId);
    
    if (!roleData) return null;

    switch (roleData.role) {
      case 'agent':
        return await this.fetchAgentProfile(supabase, userId);
      case 'admin':
      case 'super_admin':
        return await this.fetchAdminProfile(supabase, userId);
      default:
        return await this.fetchBaseProfile(supabase, userId);
    }
  }

  private async fetchAgentProfile(supabase: any, userId: string): Promise<AgentProfile | null> {
    const { data, error } = await supabase
      .from('agents')
      .select(`
        *,
        user_roles!inner(role)
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return this.mapDatabaseToProfile(data) as AgentProfile;
  }

  private async fetchAdminProfile(supabase: any, userId: string): Promise<AdminProfile | null> {
    // Assuming admin profiles are stored in agents table with additional admin data
    const { data, error } = await supabase
      .from('agents')
      .select(`
        *,
        user_roles!inner(role),
        admin_permissions(*)
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return this.mapDatabaseToProfile(data) as AdminProfile;
  }

  private async fetchBaseProfile(supabase: any, userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('agents')
      .select(`
        *,
        user_roles!inner(role)
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return this.mapDatabaseToProfile(data) as UserProfile;
  }

  /**
   * Update operations for different profile types
   */
  private async updateAgentProfile(supabase: any, userId: string, updates: AgentProfileUpdate): Promise<AgentProfile | null> {
    const { data, error } = await supabase
      .from('agents')
      .update({
        ...updates,
        service_areas: updates.service_areas ? JSON.stringify(updates.service_areas) : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return this.mapDatabaseToProfile(data) as AgentProfile;
  }

  private async updateAdminProfile(supabase: any, userId: string, updates: AdminProfileUpdate): Promise<AdminProfile | null> {
    const { data, error } = await supabase
      .from('agents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return this.mapDatabaseToProfile(data) as AdminProfile;
  }

  private async updateBaseProfile(supabase: any, userId: string, updates: UserProfileUpdate): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('agents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return this.mapDatabaseToProfile(data) as UserProfile;
  }

  /**
   * Utility methods
   */
  private mapDatabaseToProfile(data: any): UserProfile | AgentProfile | AdminProfile {
    const baseProfile = {
      id: data.id,
      email: data.email,
      name: data.name,
      phone: data.phone,
      profile_image: data.profile_image,
      bio: data.bio,
      active: data.active,
      profile_completed: data.profile_completed,
      created_at: data.created_at,
      updated_at: data.updated_at,
      last_login: data.last_login
    };

    // Parse service areas if it exists
    const serviceAreas = data.service_areas 
      ? (typeof data.service_areas === 'string' 
          ? JSON.parse(data.service_areas) 
          : data.service_areas)
      : [];

    if (data.specialization || serviceAreas.length > 0) {
      return {
        ...baseProfile,
        specialization: data.specialization,
        service_areas: serviceAreas,
        whatsapp: data.whatsapp,
        linkedin: data.linkedin,
        instagram: data.instagram,
        license_number: data.license_number
      } as AgentProfile;
    }

    return baseProfile as UserProfile;
  }

  private createError(code: string, message: string, originalError: any, userId?: string, operation?: string): UserProfileError {
    return {
      code,
      message,
      details: originalError,
      timestamp: Date.now(),
      user_id: userId,
      operation
    };
  }

  private logError(error: UserProfileError): void {
    this.log('error', `[${error.code}] ${error.message}`, error);
  }

  private logEvent(type: UserProfileEvent['type'], userId: string, metadata?: any): void {
    const event: UserProfileEvent = {
      type,
      user_id: userId,
      timestamp: Date.now(),
      metadata
    };
    
    this.eventLog.push(event);
    
    // Keep only last 1000 events
    if (this.eventLog.length > 1000) {
      this.eventLog.splice(0, this.eventLog.length - 1000);
    }
  }

  private log(level: string, message: string, details?: any): void {
    if (this.shouldLog(level)) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        service: 'UserProfileService',
        message,
        ...(details && { details })
      };
      
      console.log(JSON.stringify(logEntry));
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logging.level);
    const messageLevel = levels.indexOf(level);
    return messageLevel >= configLevel;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Public utility methods
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      max_entries: this.config.cache.max_entries,
      ttl_minutes: this.config.cache.ttl_minutes,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        timestamp: entry.timestamp,
        expires_at: entry.expires_at,
        access_count: entry.access_count,
        last_accessed: entry.last_accessed
      }))
    };
  }

  clearCache(): void {
    this.cache.clear();
    this.log('info', 'Cache cleared manually');
  }

  getEventLog(): UserProfileEvent[] {
    return [...this.eventLog];
  }
}

// Export singleton instance
export const userProfileService = new UserProfileService();
export default userProfileService;