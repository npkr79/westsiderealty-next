
export * from "./userService";
export * from "./imageService";
export * from "./pdfService";
export * from "./aiDescriptionService";
export * from "./propertyTypeService";
export * from "./analyticsService";
export { propertyService, type PropertyData, type PropertyFilter } from "./propertyService";
export { supabasePropertyService, type SupabasePropertyData, type SupabasePropertyFilter } from "./supabasePropertyService";
export { supabaseImageService } from "./client/supabaseImageService";
export type { UploadedImage } from "./shared/types";
export { blogService, type BlogArticle } from "./blogService";
export { microMarketPagesService, type MicroMarketPage, type FeaturedProject, type FAQ } from "./microMarketPagesService";
export { microMarketService, type MicroMarketInfo, type MicroMarketGridItem } from "./microMarketService";
export { projectService, type ProjectInfo, type ProjectWithRelations } from "./projectService";
export { cityService, type CityInfo } from "./cityService";
export { developerService, type Developer } from "./developerService";

// Only initialize services with an .init() method.
// blogService does not have an init() (yet).
import { propertyService } from "./propertyService";
import { userService } from "./userService";
import { analyticsService } from "./analyticsService";

export const initializeServices = () => {
  propertyService.init();
  userService.init();
  analyticsService.init();
  // blogService.init(); // Removed, since it doesn't exist
};
