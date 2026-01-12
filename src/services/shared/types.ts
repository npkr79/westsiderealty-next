// Shared types that can be used by both client and server services
// These types have no dependencies on server-only or client-only code

export interface UploadedImage {
  id: string;
  url: string;
  file: File;
  preview: string;
  name: string;
  bucket?: string;
}
