"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { profileService, ProfileData, ProfileUpdateData } from '@/services/profileService';
import { useToast } from '@/hooks/use-toast';

interface ProfileCompletion {
  completionPercentage: number;
  suggestions: string[];
  isCompleted: boolean;
}

export function useProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const profileData = await profileService.getProfile(user.id);
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Load profile completion data
  const loadCompletion = useCallback(async () => {
    if (!user || !profile) return;

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_completion' }),
      });

      if (response.ok) {
        const data = await response.json();
        setCompletion(data);
      }
    } catch (error) {
      console.error('Error loading profile completion:', error);
    }
  }, [user, profile]);

  // Update profile
  const updateProfile = useCallback(async (updateData: ProfileUpdateData): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsUpdating(true);

      // Validate data first
      const validation = profileService.validateProfileData(updateData);
      if (!validation.isValid) {
        toast({
          title: "Validation Error",
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return false;
      }

      const updatedProfile = await profileService.updateProfile(user.id, updateData);
      setProfile(updatedProfile);
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });

      // Reload completion data
      await loadCompletion();
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [user, toast, loadCompletion]);

  // Update profile image only
  const updateProfileImage = useCallback(async (imageFile: File): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive",
      });
      return null;
    }

    try {
      setIsUpdating(true);
      const imageUrl = await profileService.updateProfileImage(user.id, imageFile);
      
      // Update local profile state
      if (profile) {
        setProfile({ ...profile, profileImage: imageUrl });
      }
      
      toast({
        title: "Success",
        description: "Profile image updated successfully!",
      });
      
      return imageUrl;
    } catch (error) {
      console.error('Error updating profile image:', error);
      toast({
        title: "Error",
        description: "Failed to update profile image. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [user, profile, toast]);

  // Mark profile as completed
  const markCompleted = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      await profileService.markProfileCompleted(user.id);
      
      if (profile) {
        setProfile({ ...profile, profileCompleted: true });
      }
      
      toast({
        title: "Success",
        description: "Profile marked as completed!",
      });
      
      await loadCompletion();
      return true;
    } catch (error) {
      console.error('Error marking profile as completed:', error);
      toast({
        title: "Error",
        description: "Failed to mark profile as completed.",
        variant: "destructive",
      });
      return false;
    }
  }, [user, profile, toast, loadCompletion]);

  // Check if profile is completed
  const checkCompletion = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      return await profileService.isProfileCompleted(user.id);
    } catch (error) {
      console.error('Error checking profile completion:', error);
      return false;
    }
  }, [user]);

  // Get profile suggestions
  const getSuggestions = useCallback((): string[] => {
    if (!profile) return [];
    return profileService.getProfileSuggestions(profile);
  }, [profile]);

  // Get completion percentage
  const getCompletionPercentage = useCallback((): number => {
    if (!profile) return 0;
    return profileService.getProfileCompletionPercentage(profile);
  }, [profile]);

  // Load profile on mount and when user changes
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Load completion data when profile is loaded
  useEffect(() => {
    if (profile) {
      loadCompletion();
    }
  }, [profile, loadCompletion]);

  return {
    profile,
    isLoading,
    isUpdating,
    completion,
    updateProfile,
    updateProfileImage,
    markCompleted,
    checkCompletion,
    getSuggestions,
    getCompletionPercentage,
    refetch: loadProfile,
  };
}