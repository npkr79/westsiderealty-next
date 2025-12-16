import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();


export interface ContentPreferences {
  defaultProvider: 'lovable' | 'perplexity';
  autoSave: boolean;
  qualityThreshold: number;
  defaultWordCount: number;
  enableProofread: boolean;
  toneStyle: 'professional' | 'friendly' | 'formal' | 'casual';
}

const DEFAULT_PREFERENCES: ContentPreferences = {
  defaultProvider: 'lovable',
  autoSave: true,
  qualityThreshold: 70,
  defaultWordCount: 500,
  enableProofread: true,
  toneStyle: 'professional',
};

export const contentPreferencesService = {
  async getPreferences(): Promise<ContentPreferences> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Try to get from localStorage first for quick access
      const cached = localStorage.getItem('content_preferences');
      if (cached) {
        return JSON.parse(cached);
      }

      // Return defaults if not found
      return DEFAULT_PREFERENCES;
    } catch (error) {
      console.error("Error loading preferences:", error);
      return DEFAULT_PREFERENCES;
    }
  },

  async savePreferences(preferences: ContentPreferences): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Save to localStorage for quick access
      localStorage.setItem('content_preferences', JSON.stringify(preferences));
      
      // You can also save to database if needed in the future
      // For now, localStorage is sufficient for user preferences
      
    } catch (error) {
      console.error("Error saving preferences:", error);
      throw error;
    }
  },

  async resetPreferences(): Promise<ContentPreferences> {
    localStorage.removeItem('content_preferences');
    return DEFAULT_PREFERENCES;
  },
};
