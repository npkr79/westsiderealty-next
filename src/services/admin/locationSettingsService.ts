export interface LocationSettings {
  locationDescription: string;
}

class LocationSettingsService {
  private static instance: LocationSettingsService;
  public static getInstance(): LocationSettingsService {
    if (!LocationSettingsService.instance) {
      LocationSettingsService.instance = new LocationSettingsService();
    }
    return LocationSettingsService.instance;
  }

  getLocationSettings(): LocationSettings {
    const settings = localStorage.getItem('locationSettings');
    if (!settings) {
      const defaultSettings: LocationSettings = {
        locationDescription: 'Located in the heart of Kokapet, Hyderabad - easily accessible from all major areas'
      };
      this.saveLocationSettings(defaultSettings);
      return defaultSettings;
    }
    const parsed = JSON.parse(settings);
    
    // Migration: ensure we only keep the description field
    const migratedSettings: LocationSettings = {
      locationDescription: parsed.locationDescription || 'Located in the heart of Kokapet, Hyderabad - easily accessible from all major areas'
    };
    
    this.saveLocationSettings(migratedSettings);
    return migratedSettings;
  }

  saveLocationSettings(settings: LocationSettings): void {
    localStorage.setItem('locationSettings', JSON.stringify(settings));
  }
}

export const locationSettingsService = LocationSettingsService.getInstance();
