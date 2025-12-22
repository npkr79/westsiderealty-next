
import { userProfileService } from './userProfileService';
import type { UserProfile, UserProfileUpdate } from '@/types/userProfile';

// Define a minimal User type for local storage operations (backward compatibility)
type User = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  profileCompleted?: boolean;
  [key: string]: any;
};

export const userService = {
  /**
   * Legacy localStorage methods (maintained for backward compatibility)
   */
  saveUserToStorage(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    console.log('UserService: User saved to localStorage');
  },

  loadUserFromStorage(): User | null {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        console.log('UserService: Loaded user from localStorage:', userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error('UserService: Error parsing stored user:', error);
      localStorage.removeItem('currentUser');
      return null;
    }
  },

  clearUserFromStorage(): void {
    localStorage.removeItem('currentUser');
    console.log('UserService: User cleared from localStorage');
  },

  /**
   * Enhanced methods using UserProfileService
   */
  async updateUserProfile(userId: string, profileData: UserProfileUpdate): Promise<UserProfile | null> {
    try {
      const response = await userProfileService.updateUserProfile(userId, profileData);
      
      if (response.data) {
        // Also update localStorage for backward compatibility
        const legacyUser: User = {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone,
          profileCompleted: response.data.profile_completed
        };
        this.saveUserToStorage(legacyUser);
        
        console.log('UserService: Profile updated successfully via UserProfileService');
        return response.data;
      }
      
      console.error('UserService: Failed to update profile:', response.error);
      return null;
    } catch (error) {
      console.error('UserService: Error updating profile:', error);
      return null;
    }
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    // First try to get from localStorage for immediate response
    const localUser = this.loadUserFromStorage();
    
    if (localUser?.id) {
      try {
        // Then fetch fresh data from UserProfileService
        const response = await userProfileService.getUserProfile(localUser.id);
        return response.data;
      } catch (error) {
        console.error('UserService: Error fetching current user from service:', error);
        // Fall back to localStorage data
        return this.mapLegacyUserToProfile(localUser);
      }
    }
    
    return null;
  },

  async getUserById(id: string): Promise<UserProfile | null> {
    try {
      const response = await userProfileService.getUserProfile(id);
      return response.data;
    } catch (error) {
      console.error('UserService: Error fetching user by ID:', error);
      
      // Fallback to localStorage if it's the current user
      const currentUser = this.loadUserFromStorage();
      if (currentUser?.id === id) {
        return this.mapLegacyUserToProfile(currentUser);
      }
      
      return null;
    }
  },

  /**
   * New methods leveraging UserProfileService capabilities
   */
  async searchUsers(query: string, filters?: any) {
    return await userProfileService.searchUsers({
      query,
      filters,
      page: 1,
      page_size: 20
    });
  },

  async getUserRole(userId: string) {
    return await userProfileService.getUserRole(userId);
  },

  getCacheStats() {
    return userProfileService.getCacheStats();
  },

  clearCache() {
    userProfileService.clearCache();
  },

  /**
   * Utility methods
   */
  private mapLegacyUserToProfile(user: User): UserProfile {
    return {
      id: user.id,
      name: user.name,
      email: user.email || '',
      phone: user.phone,
      profile_image: user.profileImage,
      bio: user.bio,
      active: true,
      profile_completed: user.profileCompleted || false,
      created_at: user.createdAt || new Date().toISOString(),
      updated_at: user.updatedAt || new Date().toISOString()
    };
  },

  init(): void {
    console.log('UserService: Initialized with UserProfileService integration');
  }
};
