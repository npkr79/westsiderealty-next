 "use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { slugify, ensureUniqueSlug } from "@/utils/seoUrlGenerator";
import type { UploadedImage } from "@/services/supabaseImageService";
import ImageUploadSection from "@/components/property/ImageUploadSection";
import { VideoUploadSection } from "@/components/property/VideoUploadSection";
import RichTextEditor from "@/components/property/RichTextEditor";
import AIPropertyDescriptionGenerator from "@/components/property/AIPropertyDescriptionGenerator";

export default function AddProperty() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [coverImage, setCoverImage] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [projects, setProjects] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    priceDisplay: "",
    propertyType: "",
    city: "hyderabad",
    location: "",
    microMarket: "",
    projectName: "",
    bhkConfig: "",
    bedrooms: "",
    bathrooms: "",
    areaSqft: "",
    floorNumber: "",
    totalFloors: "",
    facing: "",
    parkingSpaces: "1",
    ownershipType: "Resale",
    possessionStatus: "Ready to Move",
    googleMapsUrl: "",
  });

  useEffect(() => {
    const fetchProjects = async () => {
      if (formData.city === "hyderabad") {
        const { data } = await supabase
          .from('hyderabad_project_names')
          .select('name')
          .eq('is_active', true)
          .order('name');
        
        if (data) {
          setProjects(['Independent', ...data.map(p => p.name)]);
        }
      }
    };
    fetchProjects();
  }, [formData.city]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.price || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // Determine table name based on city
      const tableName = formData.city === "goa" ? 'goa_holiday_properties' 
        : formData.city === "dubai" ? 'dubai_properties' 
        : 'hyderabad_properties';

      // Fetch existing slugs
      const { data: existingProps } = await supabase
        .from(tableName)
        .select('seo_slug');

      const existingSlugs = existingProps?.map(p => p.seo_slug).filter(Boolean) || [];

      // Generate clean slug from SEO-optimized title
      let baseSlug = slugify(formData.title);

      // Append location if not already in title
      const locationSlug = slugify(formData.location);
      if (!baseSlug.includes(locationSlug)) {
        baseSlug += `-${locationSlug}`;
      }

      // Ensure uniqueness (only adds -1, -2 if collision, NOT timestamps)
      const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs);

      const propertyData = {
        title: formData.title,
        slug: uniqueSlug,
        seo_slug: uniqueSlug,
        description: formData.description,
        price: parseInt(formData.price),
        price_display: formData.priceDisplay || `₹${formData.price}`,
        property_type: formData.propertyType,
        location: formData.location,
        micro_market: formData.microMarket,
        project_name: formData.projectName || null,
        bhk_config: formData.bhkConfig,
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        area_sqft: parseInt(formData.areaSqft) || 0,
        floor_number: formData.floorNumber,
        total_floors: formData.totalFloors,
        facing: formData.facing,
        parking_spaces: parseInt(formData.parkingSpaces) || 1,
        ownership_type: formData.ownershipType,
        possession_status: formData.possessionStatus,
        main_image_url: coverImage || uploadedImages[0]?.url || "/images/placeholder-property.png",
        image_gallery: uploadedImages.map(img => img.url),
        google_maps_url: formData.googleMapsUrl,
        video_url: videoUrl,
        amenities: [],
        unique_features: [],
        status: "active",
      };

      if (formData.city === "goa") {
        const goaData = {
          title: propertyData.title,
          type: propertyData.property_type,
          listing_type: 'Sale',
          location_area: propertyData.location,
          district: formData.location,
          price: propertyData.price,
          price_display: propertyData.price_display,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          area_sqft: propertyData.area_sqft,
          description: propertyData.description,
          seo_slug: propertyData.seo_slug,
          images: propertyData.image_gallery,
          hero_image_url: propertyData.main_image_url,
          amenities: propertyData.amenities || [],
          unique_features: propertyData.unique_features || [],
          status: 'Active',
          google_maps_url: propertyData.google_maps_url,
          video_link: propertyData.video_url,
        };
        
        const { error: goaError } = await supabase
          .from("goa_holiday_properties")
          .insert([goaData]);
        if (goaError) throw goaError;
      } else if (formData.city === "dubai") {
        const dubaiData: any = {
          ...propertyData,
          emirate: "Dubai",
          community: formData.location,
          floor_number: formData.floorNumber ? parseInt(formData.floorNumber) : null,
        };
        delete dubaiData.total_floors;
        
        const { error: dubaiError } = await supabase
          .from("dubai_properties")
          .insert([dubaiData]);
        if (dubaiError) throw dubaiError;
      } else {
        // Hyderabad
        const hydData: any = { ...propertyData };
        delete hydData.total_floors;
        
        const { error: hydError } = await supabase
          .from("hyderabad_properties")
          .insert([hydData]);
        if (hydError) throw hydError;
      }

      toast.success("Property created successfully!");
      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Error creating property:", error);
      toast.error("Failed to create property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Add New Property</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="title">Property Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="e.g., 3BHK Apartment in Gachibowli"
                  required
                />
              </div>

              <div>
                <Label htmlFor="city">City *</Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => handleInputChange("city", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hyderabad">Hyderabad</SelectItem>
                    <SelectItem value="goa">Goa</SelectItem>
                    <SelectItem value="dubai">Dubai</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="propertyType">Property Type</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) => handleInputChange("propertyType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                    <SelectItem value="Villa">Villa</SelectItem>
                    <SelectItem value="Independent House">Independent House</SelectItem>
                    <SelectItem value="Plot">Plot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="e.g., Gachibowli"
                  required
                />
              </div>

              <div>
                <Label htmlFor="microMarket">Micro Market</Label>
                <Input
                  id="microMarket"
                  value={formData.microMarket}
                  onChange={(e) => handleInputChange("microMarket", e.target.value)}
                  placeholder="e.g., Kondapur"
                />
              </div>

              <div>
                <Label htmlFor="projectName">Project / Community Name</Label>
                <Select
                  value={formData.projectName || 'Independent'}
                  onValueChange={(value) => 
                    handleInputChange('projectName', value === 'Independent' ? '' : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Description Generator */}
        <AIPropertyDescriptionGenerator
          formData={{
            city: formData.city,
            propertyType: formData.propertyType,
            location: formData.location,
            microMarket: formData.microMarket,
            projectName: formData.projectName,
            price: formData.price,
            priceDisplay: formData.priceDisplay,
            bhk: formData.bhkConfig,
            bedrooms: formData.bedrooms,
            bathrooms: formData.bathrooms,
            area: formData.areaSqft,
            floorNumber: formData.floorNumber,
            totalFloors: formData.totalFloors,
            facing: formData.facing,
            parkingSpaces: formData.parkingSpaces,
            ownershipType: formData.ownershipType,
            possessionStatus: formData.possessionStatus,
          }}
          onDescriptionGenerated={(description) => handleInputChange("description", description)}
        />

        {/* Description Field */}
        <Card>
          <CardHeader>
            <CardTitle>Property Description</CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              label="Description"
              value={formData.description}
              onChange={(value) => handleInputChange("description", value)}
              placeholder="Use the AI generator above or write your own description..."
            />
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="e.g., 85000000"
                  required
                />
              </div>

              <div>
                <Label htmlFor="priceDisplay">Price Display</Label>
                <Input
                  id="priceDisplay"
                  value={formData.priceDisplay}
                  onChange={(e) => handleInputChange("priceDisplay", e.target.value)}
                  placeholder="e.g., ₹8.5 Cr"
                />
              </div>

              <div>
                <Label htmlFor="bhkConfig">BHK Configuration</Label>
                <Input
                  id="bhkConfig"
                  value={formData.bhkConfig}
                  onChange={(e) => handleInputChange("bhkConfig", e.target.value)}
                  placeholder="e.g., 3BHK"
                />
              </div>

              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange("bedrooms", e.target.value)}
                  placeholder="e.g., 3"
                />
              </div>

              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange("bathrooms", e.target.value)}
                  placeholder="e.g., 2"
                />
              </div>

              <div>
                <Label htmlFor="areaSqft">Area (sq.ft.)</Label>
                <Input
                  id="areaSqft"
                  type="number"
                  value={formData.areaSqft}
                  onChange={(e) => handleInputChange("areaSqft", e.target.value)}
                  placeholder="e.g., 1500"
                />
              </div>

              <div>
                <Label htmlFor="floorNumber">Floor Number</Label>
                <Input
                  id="floorNumber"
                  value={formData.floorNumber}
                  onChange={(e) => handleInputChange("floorNumber", e.target.value)}
                  placeholder="e.g., 5th Floor"
                />
              </div>

              <div>
                <Label htmlFor="totalFloors">Total Floors</Label>
                <Input
                  id="totalFloors"
                  value={formData.totalFloors}
                  onChange={(e) => handleInputChange("totalFloors", e.target.value)}
                  placeholder="e.g., 15"
                />
              </div>

              <div>
                <Label htmlFor="facing">Facing</Label>
                <Select
                  value={formData.facing}
                  onValueChange={(value) => handleInputChange("facing", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select facing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="North">North</SelectItem>
                    <SelectItem value="South">South</SelectItem>
                    <SelectItem value="East">East</SelectItem>
                    <SelectItem value="West">West</SelectItem>
                    <SelectItem value="North-East">North-East</SelectItem>
                    <SelectItem value="North-West">North-West</SelectItem>
                    <SelectItem value="South-East">South-East</SelectItem>
                    <SelectItem value="South-West">South-West</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="parkingSpaces">Parking Spaces</Label>
                <Input
                  id="parkingSpaces"
                  type="number"
                  value={formData.parkingSpaces}
                  onChange={(e) => handleInputChange("parkingSpaces", e.target.value)}
                  placeholder="e.g., 1"
                />
              </div>

              <div>
                <Label htmlFor="ownershipType">Ownership Type</Label>
                <Select
                  value={formData.ownershipType}
                  onValueChange={(value) => handleInputChange("ownershipType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Resale">Resale</SelectItem>
                    <SelectItem value="New Launch">New Launch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="possessionStatus">Possession Status</Label>
                <Select
                  value={formData.possessionStatus}
                  onValueChange={(value) => handleInputChange("possessionStatus", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ready to Move">Ready to Move</SelectItem>
                    <SelectItem value="Under Construction">Under Construction</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="googleMapsUrl">Google Maps URL</Label>
                <Input
                  id="googleMapsUrl"
                  type="url"
                  value={formData.googleMapsUrl}
                  onChange={(e) => handleInputChange("googleMapsUrl", e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Upload */}
        <ImageUploadSection
          uploadedImages={uploadedImages.map(img => ({ url: img.preview || img.url || '', name: img.file?.name }))}
          setUploadedImages={(images) => {
            // Convert SimpleUploadedImage[] back to UploadedImage[]
            const converted = images.map((img: any) => ({
              id: img.id || Math.random().toString(36),
              file: img.file || null,
              preview: img.url,
              url: img.url,
              name: img.name || img.file?.name || 'image',
            }));
            setUploadedImages(converted);
          }}
          existingImages={[]}
          onExistingImageRemove={() => {}}
          onCoverImageChange={setCoverImage}
          coverImage={coverImage}
          isEditMode={false}
        />

        {/* Video Upload */}
        <VideoUploadSection
          videoUrl={videoUrl}
          onVideoUrlChange={setVideoUrl}
        />

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/dashboard")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Creating..." : "Create Property"}
          </Button>
        </div>
      </form>
    </div>
  );
}
