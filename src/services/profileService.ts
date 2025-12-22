import { createClient } from '@/lib/supabase/client';
import { supabaseImageService, UploadedImage } from './supabaseImageService';

export interface ProfileData {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  specialization?: string;
  profileImage?: string;
  serviceAreas?: string[];
  whatsapp?: string;
  linkedin?: string;
  instagram?: string;
  profileCompleted?: boolean;
}

export interface ProfileUpdateData extends Omit<ProfileData, 'id' | 'email'> {
  profileImageFile?: File;
}

class ProfileService {
  private supabase = createClient();

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<ProfileData | null> {
    try {
      const { data, error } = await this.supabase
        .from('agents')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        return {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          bio: data.bio || '',
          specialization: data.specialization || '',
          profileImage: data.profile_image || '',
          serviceAreas: data.service_areas || [],
          whatsapp: data.whatsapp || '',
          linkedin: data.linkedin || '',
          instagram: data.instagram || '',
          profileCompleted: data.profile_completed || false,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw new Error('Failed to fetch profile');
    }
  }

  /**
   * Update user profile with optional image upload
   */
  async updateProfile(userId: string, profileData: ProfileUpdateData): Promise<ProfileData> {
    try {
      let profileImageUrl = profileData.profileImage;

      // Handle image upload if a new file is provided
      if (profileData.profileImageFile) {
        const uploadResult = await supabaseImageService.uploadSingleImage(
          profileData.profileImageFile,
          'profile-images'
        );
        
        if (uploadResult) {
          profileImageUrl = uploadResult.url;
        } else {
          throw new Error('Failed to upload profile image');
        }
      }

      // Prepare update data
      const updateData = {
        name: profileData.name,
        phone: profileData.phone,
        bio: profileData.bio,
        specialization: profileData.specialization,
        service_areas: profileData.serviceAreas,
        whatsapp: profileData.whatsapp,
        linkedin: profileData.linkedin,
        instagram: profileData.instagram,
        profile_image: profileImageUrl,
        profile_completed: true,
        updated_at: new Date().toISOString(),
      };

      // Update the profile in the database
      const { data, error } = await this.supabase
        .from('agents')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Return the updated profile data
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        bio: data.bio || '',
        specialization: data.specialization || '',
        profileImage: data.profile_image || '',
        serviceAreas: data.service_areas || [],
        whatsapp: data.whatsapp || '',
        linkedin: data.linkedin || '',
        instagram: data.instagram || '',
        profileCompleted: data.profile_completed || false,
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  /**
   * Update profile image only
   */
  async updateProfileImage(userId: string, imageFile: File): Promise<string> {
    try {
      const uploadResult = await supabaseImageService.uploadSingleImage(
        imageFile,
        'profile-images'
      );

      if (!uploadResult) {
        throw new Error('Failed to upload image');
      }

      // Update the profile image URL in the database
      const { error } = await this.supabase
        .from('agents')
        .update({ 
          profile_image: uploadResult.url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      return uploadResult.url;
    } catch (error) {
      console.error('Error updating profile image:', error);
      throw new Error('Failed to update profile image');
    }
  }

  /**
   * Check if profile is completed
   */
  async isProfileCompleted(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('agents')
        .select('profile_completed, name, phone, bio')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Consider profile completed if the flag is true and essential fields are filled
      return data.profile_completed && 
             data.name && 
             data.name.trim() !== '' &&
             data.phone && 
             data.phone.trim() !== '';
    } catch (error) {
      console.error('Error checking profile completion:', error);
      return false;
    }
  }

  /**
   * Mark profile as completed
   */
  async markProfileCompleted(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('agents')
        .update({ 
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking profile as completed:', error);
      throw new Error('Failed to mark profile as completed');
    }
  }

  /**
   * Validate profile data
   */
  validateProfileData(profileData: ProfileUpdateData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!profileData.name || profileData.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }

    if (profileData.linkedin && profileData.linkedin.trim() !== '') {
      const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
      if (!linkedinRegex.test(profileData.linkedin)) {
        errors.push('Invalid LinkedIn URL format');
      }
    }

    if (profileData.whatsapp && profileData.whatsapp.trim() !== '') {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(profileData.whatsapp.replace(/\s/g, ''))) {
        errors.push('Invalid WhatsApp number format');
      }
    }

    if (profileData.phone && profileData.phone.trim() !== '') {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(profileData.phone.replace(/\s/g, ''))) {
        errors.push('Invalid phone number format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get profile completion percentage
   */
  getProfileCompletionPercentage(profileData: ProfileData): number {
    const fields = [
      'name',
      'phone',
      'bio',
      'specialization',
      'profileImage',
      'whatsapp',
      'linkedin',
      'serviceAreas',
    ];

    let completedFields = 0;
    
    fields.forEach(field => {
      const value = profileData[field as keyof ProfileData];
      if (value) {
        if (Array.isArray(value)) {
          if (value.length > 0) completedFields++;
        } else if (typeof value === 'string') {
          if (value.trim() !== '') completedFields++;
        } else {
          completedFields++;
        }
      }
    });

    return Math.round((completedFields / fields.length) * 100);
  }

  /**
   * Get suggested improvements for profile
   */
  getProfileSuggestions(profileData: ProfileData): string[] {
    const suggestions: string[] = [];

    if (!profileData.profileImage) {
      suggestions.push('Add a professional profile picture');
    }

    if (!profileData.bio || profileData.bio.trim().length < 50) {
      suggestions.push('Write a more detailed bio (at least 50 characters)');
    }

    if (!profileData.specialization) {
      suggestions.push('Add your specialization or area of expertise');
    }

    if (!profileData.serviceAreas || profileData.serviceAreas.length === 0) {
      suggestions.push('Select the areas you provide services in');
    }

    if (!profileData.linkedin) {
      suggestions.push('Add your LinkedIn profile for professional networking');
    }

    if (!profileData.whatsapp) {
      suggestions.push('Add your WhatsApp number for easier client communication');
    }

    return suggestions;
  }
}

export const profileService = new ProfileService();