
interface GoaVillaContent {
  id: string;
  headline: string;
  subheadline: string;
  rich_description: string;
  location_info: string;
  whatsapp_number: string;
  whatsapp_message: string;
  youtube_video_url?: string;
  show_google_map: boolean;
  google_map_url?: string;
  hero_image_url?: string;
  created_at: string;
  updated_at: string;
}

interface GoaVillaImage {
  id: string;
  image_url: string;
  alt_text?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

class GoaVillaService {
  private storageKey = 'goaVillaContent';
  private imagesKey = 'goaVillaImages';

  getContent(): GoaVillaContent | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading Goa villa content:', error);
      return null;
    }
  }

  saveContent(content: Partial<GoaVillaContent>): void {
    try {
      const existing = this.getContent();
      const updated = {
        ...existing,
        ...content,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
      window.dispatchEvent(new StorageEvent('storage', { key: this.storageKey }));
    } catch (error) {
      console.error('Error saving Goa villa content:', error);
    }
  }

  getImages(): GoaVillaImage[] {
    try {
      const stored = localStorage.getItem(this.imagesKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading Goa villa images:', error);
      return [];
    }
  }

  saveImages(images: GoaVillaImage[]): void {
    try {
      localStorage.setItem(this.imagesKey, JSON.stringify(images));
      window.dispatchEvent(new StorageEvent('storage', { key: this.imagesKey }));
    } catch (error) {
      console.error('Error saving Goa villa images:', error);
    }
  }

  addImage(imageUrl: string, altText?: string): void {
    const images = this.getImages();
    const newImage: GoaVillaImage = {
      id: Date.now().toString(),
      image_url: imageUrl,
      alt_text: altText,
      display_order: images.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    images.push(newImage);
    this.saveImages(images);
  }

  removeImage(imageId: string): void {
    const images = this.getImages().filter(img => img.id !== imageId);
    this.saveImages(images);
  }

  updateImageOrder(imageId: string, newOrder: number): void {
    const images = this.getImages();
    const imageIndex = images.findIndex(img => img.id === imageId);
    if (imageIndex !== -1) {
      images[imageIndex].display_order = newOrder;
      this.saveImages(images);
    }
  }
}

export const goaVillaService = new GoaVillaService();
export type { GoaVillaContent, GoaVillaImage };
