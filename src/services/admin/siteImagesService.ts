
// Use Supabase Storage for all primary site images. GOOGLE DRIVE & UPLOADS ARE GONE.
const SUPABASE_BASE_URL = "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public";
export interface SiteImages {
  hyderabadView: string;
  goaView: string;
  dubaiView: string;
  aboutUsImage: string;
  headerLogo: string;
  faviconLogo: string;
  teamPhoto: string;
  officeImage: string;
  aboutVideoUrl?: string;
  remaxBrand?: string;
}

// These are your provided, canonical Supabase image URLs:
const defaultImageUrls: Record<keyof SiteImages, string> = {
  hyderabadView: `${SUPABASE_BASE_URL}/service-images/hyderabad-view.jpg`,
  goaView: `${SUPABASE_BASE_URL}/service-images/goa-view.jpg`,
  dubaiView: `${SUPABASE_BASE_URL}/service-images/dubai-view.jpg`,
  aboutUsImage: `${SUPABASE_BASE_URL}/service-images/remax-office.jpg`,
  // CHANGE HEADER LOGO
  headerLogo: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets//REMAX%20WR%20Logo%20with%20no%20background.jpg",
  faviconLogo: `${SUPABASE_BASE_URL}/brand-assets/3a58564a-5eaf-4d47-be19-c5a478f13e0b.png`,
  teamPhoto: `${SUPABASE_BASE_URL}/brand-assets/team-photo.png`,
  officeImage: `${SUPABASE_BASE_URL}/brand-assets/office-image.png`,
  aboutVideoUrl: "",
  remaxBrand: `${SUPABASE_BASE_URL}/brand-assets/remax-brand.jpg`,
};

class SiteImagesService {
  private static instance: SiteImagesService;
  public static getInstance(): SiteImagesService {
    if (!SiteImagesService.instance) {
      SiteImagesService.instance = new SiteImagesService();
    }
    return SiteImagesService.instance;
  }

  // Hard (re)set all images to defaults
  forceResetToDefaultImages() {
    const defaultImages: SiteImages = { ...defaultImageUrls };
    this.saveSiteImages(defaultImages);
    console.warn("[siteImagesService] [FORCED RESET] All site images reset to Supabase defaults:", defaultImages);
    return defaultImages;
  }

  getSiteImages(): SiteImages {
    const imagesLS = localStorage.getItem('siteImages');
    const defaultImages: SiteImages = { ...defaultImageUrls };

    // Always REMOVE google drive or legacy links
    if (!imagesLS) {
      this.saveSiteImages(defaultImages);
      return defaultImages;
    }

    try {
      const parsed = JSON.parse(imagesLS);
      let dirty = false;
      // If any Google Drive or non-Supabase URLs are present, overwrite to default
      for (const key in defaultImages) {
        if (
          !parsed[key] ||
          typeof parsed[key] !== "string" ||
          parsed[key].includes("drive.google.com")
        ) {
          parsed[key] = defaultImages[key as keyof SiteImages];
          dirty = true;
        }
      }
      if (dirty) this.saveSiteImages(parsed as SiteImages);
      return parsed;
    } catch (e) {
      this.saveSiteImages(defaultImages);
      return defaultImages;
    }
  }

  saveSiteImages(images: SiteImages): void {
    if (!('aboutVideoUrl' in images)) images.aboutVideoUrl = "";
    if (!('remaxBrand' in images)) images.remaxBrand = "";
    localStorage.setItem('siteImages', JSON.stringify(images));
  }
}

export const siteImagesService = SiteImagesService.getInstance();

