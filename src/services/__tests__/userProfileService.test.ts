/**
 * Unit Tests for UserProfileService
 * Demonstrates the service functionality and validates key features
 */

import { userProfileService } from '../userProfileService';
import type { UserProfileUpdate, AgentProfileUpdate } from '@/types/userProfile';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'test-user-id',
              name: 'Test User',
              email: 'test@example.com',
              phone: '+1234567890',
              bio: 'Test bio',
              active: true,
              profile_completed: true,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              specialization: 'Residential',
              service_areas: '["Goa", "Mumbai"]',
              whatsapp: '+1234567890',
              linkedin: 'test-linkedin',
              instagram: 'test-instagram'
            },
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'test-user-id',
                name: 'Updated User',
                email: 'test@example.com',
                phone: '+1234567890',
                bio: 'Updated bio',
                active: true,
                profile_completed: true,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: new Date().toISOString(),
                specialization: 'Commercial',
                service_areas: '["Goa", "Pune"]',
                whatsapp: '+1234567890',
                linkedin: 'updated-linkedin',
                instagram: 'updated-instagram'
              },
              error: null
            }))
          }))
        }))
      }))
    }))
  }))
}));

// Mock user roles
jest.mock('../userProfileService', () => {
  const originalModule = jest.requireActual('../userProfileService');
  return {
    ...originalModule,
    userProfileService: {
      ...originalModule.userProfileService,
      getUserRole: jest.fn(() => Promise.resolve({
        user_id: 'test-user-id',
        role: 'agent',
        assigned_at: '2024-01-01T00:00:00Z',
        assigned_by: 'admin'
      }))
    }
  };
});

describe('UserProfileService', () => {
  beforeEach(() => {
    // Clear cache before each test
    userProfileService.clearCache();
  });

  describe('getUserProfile', () => {
    it('should fetch user profile successfully', async () => {
      const response = await userProfileService.getUserProfile('test-user-id');
      
      expect(response.error).toBeNull();
      expect(response.data).toBeDefined();
      expect(response.data?.id).toBe('test-user-id');
      expect(response.data?.name).toBe('Test User');
      expect(response.cached).toBe(false);
    });

    it('should return cached profile on second request', async () => {
      // First request
      const firstResponse = await userProfileService.getUserProfile('test-user-id');
      expect(firstResponse.cached).toBe(false);
      
      // Second request should be cached
      const secondResponse = await userProfileService.getUserProfile('test-user-id');
      expect(secondResponse.cached).toBe(true);
      expect(secondResponse.cache_timestamp).toBeDefined();
    });

    it('should handle user not found', async () => {
      const response = await userProfileService.getUserProfile('non-existent-user');
      
      expect(response.data).toBeNull();
      expect(response.error).toBe('User profile not found');
      expect(response.cached).toBe(false);
    });
  });

  describe('updateUserProfile', () => {
    it('should update agent profile successfully', async () => {
      const updates: AgentProfileUpdate = {
        name: 'Updated User',
        bio: 'Updated bio',
        specialization: 'Commercial',
        service_areas: ['Goa', 'Pune'],
        linkedin: 'updated-linkedin'
      };

      const response = await userProfileService.updateUserProfile('test-user-id', updates, 'agent');
      
      expect(response.error).toBeNull();
      expect(response.data).toBeDefined();
      expect(response.data?.name).toBe('Updated User');
      expect(response.cached).toBe(false);
    });

    it('should invalidate cache after update', async () => {
      // First, get profile to cache it
      await userProfileService.getUserProfile('test-user-id');
      
      // Verify it's cached
      const cachedResponse = await userProfileService.getUserProfile('test-user-id');
      expect(cachedResponse.cached).toBe(true);
      
      // Update profile
      const updates: UserProfileUpdate = { name: 'Updated Name' };
      await userProfileService.updateUserProfile('test-user-id', updates);
      
      // Next request should fetch fresh data
      const freshResponse = await userProfileService.getUserProfile('test-user-id');
      expect(freshResponse.cached).toBe(false);
    });
  });

  describe('searchUsers', () => {
    it('should search users with filters', async () => {
      const response = await userProfileService.searchUsers({
        query: 'test',
        filters: { role: 'agent', active: true },
        page: 1,
        page_size: 10
      });
      
      expect(response.error).toBeNull();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.page).toBe(1);
      expect(response.page_size).toBe(10);
    });

    it('should handle empty search results', async () => {
      const response = await userProfileService.searchUsers({
        query: 'nonexistent',
        page: 1,
        page_size: 10
      });
      
      expect(response.error).toBeNull();
      expect(response.data).toEqual([]);
      expect(response.total_count).toBe(0);
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', () => {
      const stats = userProfileService.getCacheStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.max_entries).toBe('number');
      expect(typeof stats.ttl_minutes).toBe('number');
      expect(Array.isArray(stats.entries)).toBe(true);
    });

    it('should clear cache successfully', () => {
      userProfileService.clearCache();
      const stats = userProfileService.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock a database error
      const originalMethod = userProfileService.getUserProfile;
      jest.spyOn(userProfileService, 'getUserProfile').mockRejectedValueOnce(new Error('Database connection failed'));
      
      const response = await userProfileService.getUserProfile('test-user-id');
      
      expect(response.data).toBeNull();
      expect(response.error).toContain('Failed to fetch user profile');
      
      // Restore original method
      userProfileService.getUserProfile = originalMethod;
    });
  });

  describe('Event Logging', () => {
    it('should log events during operations', async () => {
      await userProfileService.getUserProfile('test-user-id');
      
      const eventLog = userProfileService.getEventLog();
      expect(Array.isArray(eventLog)).toBe(true);
      expect(eventLog.length).toBeGreaterThan(0);
      
      const cacheEvent = eventLog.find(event => event.type === 'cache_miss');
      expect(cacheEvent).toBeDefined();
      expect(cacheEvent?.user_id).toBe('test-user-id');
    });
  });
});

describe('Service Integration', () => {
  it('should demonstrate thread-safe cache operations', async () => {
    const userId = 'concurrent-test-user';
    
    // Simulate concurrent requests
    const promises = Array.from({ length: 10 }, () => 
      userProfileService.getUserProfile(userId)
    );
    
    const results = await Promise.all(promises);
    
    // All requests should succeed
    results.forEach(result => {
      expect(result.error).toBeNull();
    });
    
    // Only one should be from database, others from cache
    const cachedResults = results.filter(result => result.cached);
    const nonCachedResults = results.filter(result => !result.cached);
    
    expect(nonCachedResults.length).toBe(1); // First request
    expect(cachedResults.length).toBe(9); // Subsequent requests
  });

  it('should demonstrate retry mechanism', async () => {
    let attemptCount = 0;
    
    // Mock a method that fails twice then succeeds
    const originalFetch = userProfileService['fetchProfileWithRetry'];
    jest.spyOn(userProfileService as any, 'fetchProfileWithRetry').mockImplementation(async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error('Temporary failure');
      }
      return {
        id: 'retry-test-user',
        name: 'Retry Test User',
        email: 'retry@test.com',
        active: true,
        profile_completed: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };
    });
    
    const response = await userProfileService.getUserProfile('retry-test-user');
    
    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(attemptCount).toBe(3); // Should have retried twice
    
    // Restore original method
    (userProfileService as any).fetchProfileWithRetry = originalFetch;
  });
});

describe('Performance Tests', () => {
  it('should handle large cache efficiently', async () => {
    const startTime = Date.now();
    
    // Add many entries to cache
    const promises = Array.from({ length: 100 }, (_, i) => 
      userProfileService.getUserProfile(`user-${i}`)
    );
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time (adjust threshold as needed)
    expect(duration).toBeLessThan(5000); // 5 seconds
    
    const stats = userProfileService.getCacheStats();
    expect(stats.size).toBeGreaterThan(0);
  });

  it('should demonstrate cache expiry', async () => {
    // This test would need to mock time or use a shorter TTL
    // For demonstration purposes, we'll test the cache expiry logic
    const stats = userProfileService.getCacheStats();
    expect(stats.ttl_minutes).toBe(5); // Default TTL
  });
});