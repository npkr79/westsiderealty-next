
interface UploadedImage {
  id: string;
  url: string;
  file: File;
  preview: string;
  name: string;
}

class ImageService {
  private uploadedImages: Map<string, UploadedImage> = new Map();

  // Upload multiple images
  async uploadMultipleImages(files: FileList | File[]): Promise<UploadedImage[]> {
    const fileArray = Array.from(files);
    const uploadPromises = fileArray.map(file => this.uploadSingleImage(file));
    return Promise.all(uploadPromises);
  }

  // Upload single image
  async uploadSingleImage(file: File): Promise<UploadedImage> {
    // Validate file
    if (!this.isValidImageFile(file)) {
      throw new Error('Invalid file type. Please upload only images.');
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('File size too large. Maximum 5MB allowed.');
    }

    // Create preview URL and actual URL from the file
    const preview = URL.createObjectURL(file);
    
    // Generate unique ID
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    // Convert file to base64 for storage (in real app, this would be uploaded to cloud storage)
    const base64Url = await this.fileToBase64(file);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const uploadedImage: UploadedImage = {
      id,
      url: base64Url, // Use base64 URL instead of mock URL
      file,
      preview,
      name: file.name
    };

    this.uploadedImages.set(id, uploadedImage);
    
    return uploadedImage;
  }

  // Convert file to base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  // Get uploaded image by ID
  getUploadedImage(id: string): UploadedImage | null {
    return this.uploadedImages.get(id) || null;
  }

  // Remove uploaded image
  removeUploadedImage(id: string): boolean {
    const image = this.uploadedImages.get(id);
    if (image) {
      URL.revokeObjectURL(image.preview);
      this.uploadedImages.delete(id);
      return true;
    }
    return false;
  }

  // Validate image file
  private isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(file.type);
  }

  // Get all uploaded images
  getAllUploadedImages(): UploadedImage[] {
    return Array.from(this.uploadedImages.values());
  }

  // Clear all uploaded images
  clearAllImages(): void {
    this.uploadedImages.forEach(image => {
      URL.revokeObjectURL(image.preview);
    });
    this.uploadedImages.clear();
  }
}

export const imageService = new ImageService();
export type { UploadedImage };
