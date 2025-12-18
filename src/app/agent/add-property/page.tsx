"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { slugify, ensureUniqueSlug } from "@/utils/seoUrlGenerator";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import BasicInformationSection from "@/components/property/BasicInformationSection";
import PropertyDetailsSection from "@/components/property/PropertyDetailsSection";
import PropertyFeaturesSection from "@/components/property/PropertyFeaturesSection";
import ImageUploadSection from "@/components/property/ImageUploadSection";
import AIDescriptionGenerator from "@/components/property/AIDescriptionGenerator";
import RichTextEditor from "@/components/property/RichTextEditor";
import { supabaseImageService, UploadedImage } from "@/services/supabaseImageService";

export default function AddProperty() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    propertyType: "",
    price: "",
    area: "",
    bedrooms: "",
    bathrooms: "",
    floorNumber: "",
    totalFloors: "",
    carParkings: "1",
    facing: "",
    ageOfProperty: "",
    uniqueUSPs: [] as string[],
    furnishedStatus: "",
    communityName: "",
    location: "",
    microMarket: "",
    nearbyFacilities: [] as string[],
    accessibility: "",
    nearbyLandmarks: "",
    amenities: [] as string[],
    status: "published" as const,
    isFeatured: false,
  });

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [coverImage, setCoverImage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDescriptionGenerated = (description: string) => {
    setFormData((prev) => ({ ...prev, description }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add a property.",
        variant: "destructive",
      });
      return;
    }

    if (uploadedImages.length === 0) {
      toast({
        title: "Missing Images",
        description: "Please upload at least one image for the property.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Fetch existing slugs from hyderabad_properties
      const { data: existingProps } = await supabase
        .from("hyderabad_properties")
        .select("seo_slug, slug");

      const existingSlugs =
        existingProps?.map((p: any) => p.seo_slug || p.slug).filter(Boolean) || [];

      // Generate clean slug from SEO-optimized title
      let baseSlug = slugify(formData.title);

      // Append location if not already in title
      const locationSlug = slugify(formData.location);
      if (!baseSlug.includes(locationSlug)) {
        baseSlug += `-${locationSlug}`;
      }

      // Ensure uniqueness
      const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs);

      const imageUrls = uploadedImages.map((img) => img.url);
      const finalCoverImage = coverImage || imageUrls[0];

      const propertyData = {
        title: formData.title,
        slug: uniqueSlug,
        seo_slug: uniqueSlug,
        description: formData.description,
        property_type: formData.propertyType,
        price: parseInt(formData.price),
        price_display: formData.price,
        area_sqft: parseInt(formData.area),
        bhk_config: formData.bedrooms,
        bathrooms: parseInt(formData.bathrooms) || 2,
        floor_number: formData.floorNumber || null,
        total_floors: formData.totalFloors || null,
        parking_spaces: parseInt(formData.carParkings) || 1,
        facing: formData.facing || null,
        age_of_property: formData.ageOfProperty || null,
        unique_features: formData.uniqueUSPs || [],
        furnished_status: formData.furnishedStatus || null,
        project_name: formData.communityName || null,
        location: formData.location,
        micro_market: formData.microMarket || null,
        nearby_landmarks: formData.nearbyFacilities?.length ||
          formData.accessibility ||
          formData.nearbyLandmarks
          ? {
              facilities: formData.nearbyFacilities || [],
              accessibility: formData.accessibility || "",
              landmarks: formData.nearbyLandmarks || "",
            }
          : null,
        amenities: formData.amenities || [],
        status: formData.status,
        agent_id: user.id,
        image_gallery: imageUrls,
        main_image_url: finalCoverImage,
        is_featured: formData.isFeatured,
        ownership_type: "Freehold",
      };

      const { error } = await supabase
        .from("hyderabad_properties")
        .insert([propertyData]);

      if (error) throw error;

      toast({
        title: "Property Added!",
        description: "Your property has been successfully added and is now live.",
      });
      router.push("/agent/listings");
    } catch (error: any) {
      console.error("Error adding property:", error);
      toast({
        title: "Error",
        description: "Failed to add property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/agent">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Add New Property</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <BasicInformationSection
            formData={formData}
            onInputChange={handleInputChange}
          />

          {/* AI Description Generator */}
          <AIDescriptionGenerator
            formData={formData}
            onDescriptionGenerated={handleDescriptionGenerated}
            currentDescription={formData.description}
          />

          {/* Rich Text Description Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Property Description</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                label="Description"
                value={formData.description}
                onChange={(value) => handleInputChange("description", value)}
                placeholder="Enter detailed property description with formatting..."
                required
              />
            </CardContent>
          </Card>

          {/* Property Details */}
          <PropertyDetailsSection
            formData={formData}
            onInputChange={handleInputChange}
          />

          {/* Property Features */}
          <PropertyFeaturesSection
            formData={formData}
            onInputChange={handleInputChange}
          />

          {/* Image Upload */}
          <ImageUploadSection
            uploadedImages={uploadedImages.map(img => ({ url: img.preview || img.url || '', name: img.file?.name }))}
            setUploadedImages={(images) => {
              const converted = images.map((img: any) => ({
                id: img.id || Math.random().toString(36),
                file: img.file || null,
                preview: img.url,
                url: img.url,
                name: img.name || img.file?.name || 'image',
              }));
              setUploadedImages(converted);
            }}
            onCoverImageChange={setCoverImage}
            coverImage={coverImage}
          />

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Adding Property..." : "Add Property"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
