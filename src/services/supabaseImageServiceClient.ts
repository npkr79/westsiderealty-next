"use client";

import { createClient } from '@/lib/supabase/client';

export interface UploadedImage {
  id: string;
  url: string;
  file: File;
  preview: string;
  name: string;
  bucket?: string;
}

class SupabaseImageServiceClient {
  private uploadedImages: Map<string, UploadedImage> = new Map();

  private getSupabase() {
    return createClient();
  }

  async uploadSingleImage(file: File, bucket: string = 'blog-images'): Promise<UploadedImage> {
    const supabase = this.getSupabase();
    
    // Validate file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPG, PNG, or WebP images.');
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Max 5MB allowed.');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to the target bucket
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file);
    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

    const preview = URL.createObjectURL(file);
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    const uploadedImage: UploadedImage = {
      id,
      url: urlData.publicUrl,
      file,
      preview,
      name: file.name,
      bucket
    };

    this.uploadedImages.set(id, uploadedImage);
    return uploadedImage;
  }

  // Multiple image upload
  async uploadMultipleImages(files: File[], bucket = 'blog-images'): Promise<UploadedImage[]> {
    const results: UploadedImage[] = [];
    for (const file of files) {
      const img = await this.uploadSingleImage(file, bucket);
      results.push(img);
    }
    return results;
  }

  getUploadedImage(id: string): UploadedImage | null {
    return this.uploadedImages.get(id) || null;
  }

  async removeUploadedImage(id: string): Promise<boolean> {
    const image = this.uploadedImages.get(id);
    if (image) {
      try {
        const supabase = this.getSupabase();
        // Extract file path from URL
        const url = new URL(image.url);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.findIndex(part => part === image.bucket || part === 'blog-images');
        const filePath = pathParts.slice(bucketIndex + 1).join('/');

        if (filePath) {
          // Delete from Supabase Storage
          await supabase.storage
            .from(image.bucket || 'blog-images')
            .remove([filePath]);
        }

        URL.revokeObjectURL(image.preview);
        this.uploadedImages.delete(id);
        return true;
      } catch (error) {
        console.error('Error removing image:', error);
        return false;
      }
    }
    return false;
  }

  private isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(file.type);
  }

  getAllUploadedImages(): UploadedImage[] {
    return Array.from(this.uploadedImages.values());
  }

  clearAllImages(): void {
    this.uploadedImages.forEach(image => {
      URL.revokeObjectURL(image.preview);
    });
    this.uploadedImages.clear();
  }
}

export const supabaseImageServiceClient = new SupabaseImageServiceClient();

