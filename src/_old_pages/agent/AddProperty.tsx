import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabasePropertyService } from "@/services/supabasePropertyService";
import { slugify, ensureUniqueSlug } from "@/utils/seoUrlGenerator";
import { supabase } from "@/integrations/supabase/client";
// REMOVE: import { useAuth } from "@/contexts/AuthContext";
import BasicInformationSection from "@/components/property/BasicInformationSection";
import PropertyDetailsSection from "@/components/property/PropertyDetailsSection";
import PropertyFeaturesSection from "@/components/property/PropertyFeaturesSection";
import ImageUploadSection from "@/components/property/ImageUploadSection";
import AIDescriptionGenerator from "@/components/property/AIDescriptionGenerator";
import RichTextEditor from "@/components/property/RichTextEditor";
import { supabaseImageService, UploadedImage } from "@/services/supabaseImageService";

const AddProperty = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // REMOVE: const { user } = useAuth();
  
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
    carParkings: "1", // Changed to string for consistency
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
    status: 'published' as const,
    isFeatured: false
  });
  
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [coverImage, setCoverImage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDescriptionGenerated = (description: string) => {
    setFormData(prev => ({ ...prev, description }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // REMOVE: if (!user) {
    // REMOVE:   toast({
    // REMOVE:     title: "Error",
    // REMOVE:     description: "You must be logged in to add a property.",
    // REMOVE:     variant: "destructive"
    // REMOVE:   });
    // REMOVE:   return;
    // REMOVE: }

    if (uploadedImages.length === 0) {
      toast({
        title: "Missing Images",
        description: "Please upload at least one image for the property.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Fetch existing slugs from hyderabad_properties
      const { data: existingProps } = await supabase
        .from('hyderabad_properties')
        .select('seo_slug, slug');

      const existingSlugs = existingProps?.map(p => p.seo_slug || p.slug).filter(Boolean) || [];

      // Generate clean slug from SEO-optimized title
      let baseSlug = slugify(formData.title);

      // Append location if not already in title
      const locationSlug = slugify(formData.location);
      if (!baseSlug.includes(locationSlug)) {
        baseSlug += `-${locationSlug}`;
      }

      // Ensure uniqueness (only adds -1, -2 if collision, NOT timestamps)
      const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs);

      const imageUrls = uploadedImages.map(img => img.url);
      const finalCoverImage = coverImage || imageUrls[0];

      const propertyData = {
        title: formData.title,
        slug: uniqueSlug,
        seo_slug: uniqueSlug,
        description: formData.description,
        propertyType: formData.propertyType,
        price: parseInt(formData.price),
        area: parseInt(formData.area),
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        floorNumber: formData.floorNumber,
        totalFloors: formData.totalFloors,
        carParkings: parseInt(formData.carParkings) || 1, // Parse string to number
        facing: formData.facing,
        ageOfProperty: formData.ageOfProperty,
        uniqueUSPs: formData.uniqueUSPs,
        furnishedStatus: formData.furnishedStatus,
        communityName: formData.communityName,
        location: formData.location,
        microMarket: formData.microMarket,
        nearbyFacilities: formData.nearbyFacilities,
        accessibility: formData.accessibility,
        nearbyLandmarks: formData.nearbyLandmarks,
        amenities: formData.amenities,
        status: formData.status,
        // REMOVE: agentId: user.id,
        agentId: 'hardcoded-agent-id',
        images: imageUrls,
        isFeatured: formData.isFeatured
      };

      const result = await supabasePropertyService.addProperty(propertyData);
      
      if (result) {
        toast({
          title: "Property Added!",
          description: "Your property has been successfully added and is now live."
        });
        navigate("/agent/my-listings");
      }
    } catch (error) {
      console.error("Error adding property:", error);
      toast({
        title: "Error",
        description: "Failed to add property. Please try again.",
        variant: "destructive"
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
              <Link to="/agent/dashboard">
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
                onChange={(value) => handleInputChange('description', value)}
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
            uploadedImages={uploadedImages}
            setUploadedImages={setUploadedImages}
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
};

export default AddProperty;
