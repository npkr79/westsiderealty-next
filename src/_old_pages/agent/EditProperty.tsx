import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { propertyService, userService, imageService } from "@/services";
import type { PropertyData, UploadedImage } from "@/services";
import BasicInformationSection from "@/components/property/BasicInformationSection";
import PropertySpecificationsSection from "@/components/property/PropertySpecificationsSection";
import PropertyFeaturesSection from "@/components/property/PropertyFeaturesSection";
import AmenitiesSection from "@/components/property/AmenitiesSection";
import AIDescriptionPreview from "@/components/property/AIDescriptionPreview";
import ImageUploadSection from "@/components/property/ImageUploadSection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { PropertyFormData } from "@/hooks/usePropertyForm";
import RichTextEditor from "@/components/property/RichTextEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EditProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PropertyFormData | null>(null);
  const [property, setProperty] = useState<any>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [coverImage, setCoverImage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadProperty = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const currentUser = userService.getCurrentUser();
        if (!currentUser) {
          navigate("/login");
          return;
        }

        const property = await propertyService.getPropertyById(id);
        if (!property) {
          toast({
            title: "Property not found",
            description: "The property you're looking for doesn't exist.",
            variant: "destructive"
          });
          navigate("/agent/my-listings");
          return;
        }

        // Check if current user owns this property
        if (property.agentId !== currentUser.id) {
          toast({
            title: "Access denied",
            description: "You can only edit your own properties.",
            variant: "destructive"
          });
          navigate("/agent/my-listings");
          return;
        }

        // Fetch projects
        const { data: projectsData } = await supabase
          .from('hyderabad_project_names')
          .select('name')
          .eq('is_active', true)
          .order('name');
        
        if (projectsData) {
          setProjects(['Independent', ...projectsData.map(p => p.name)]);
        }

        // Store the property object for slug and ownership_type
        setProperty(property);

        // Convert PropertyData to PropertyFormData
        const convertedFormData: PropertyFormData = {
          title: property.title,
          description: property.description,
          propertyType: property.propertyType,
          price: property.price.toString(),
          area: property.area.toString(),
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          floorNumber: property.floorNumber || "",
          totalFloors: property.totalFloors || "",
          carParkings: (property.carParkings || 1).toString(),
          facing: property.facing || "",
          ageOfProperty: property.ageOfProperty || "",
          uniqueUSPs: property.uniqueUSPs || [],
          furnishedStatus: property.furnishedStatus || "",
          communityName: property.communityName || "",
          project_name: property.project_name || "",
          location: property.location,
          microMarket: property.microMarket,
          nearbyFacilities: property.nearbyFacilities || [],
          accessibility: property.accessibility || "",
          nearbyLandmarks: property.nearbyLandmarks || "",
          amenities: property.amenities,
          status: property.status,
          isFeatured: property.isFeatured || false
        };

        setFormData(convertedFormData);
        setExistingImages(property.images || []);
        setCoverImage(property.images?.[0] || "");
      } catch (error) {
        console.error("Error loading property:", error);
        toast({
          title: "Error",
          description: "Failed to load property data.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProperty();
  }, [id, navigate, toast]);

  const handleInputChange = (field: string, value: any) => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔥 SUBMIT CLICKED - ID from useParams:', id);
    console.log('🔥 Property object:', property);
    console.log('🔥 Form data exists:', !!formData);
    
    if (!id) {
      toast({
        title: "Error",
        description: "Property ID is missing. Cannot update.",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData) return;
    
    setIsSubmitting(true);

    try {
      const allImages = [...existingImages, ...uploadedImages.map(img => img.url)].sort((a, b) => 
        a.localeCompare(b)
      );

      console.log('=== PROPERTY UPDATE DEBUG ===');
      console.log('Property ID:', id);
      console.log('Form Data:', formData);
      console.log('All Images:', allImages);
      console.log('Stored Property:', property);

      const updateData = {
        title: formData.title,
        description: formData.description,
        property_type: formData.propertyType,
        ownership_type: property?.ownership_type || 'Freehold', // REQUIRED - use existing or default
        price: parseInt(formData.price),
        price_display: formData.price, // REQUIRED - use the price as display
        slug: property?.slug, // REQUIRED - keep existing slug
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
        project_name: formData.project_name || formData.communityName || null,
        location: formData.location,
        micro_market: formData.microMarket || null,
        nearby_landmarks: formData.nearbyFacilities?.length || formData.accessibility || formData.nearbyLandmarks ? {
          facilities: formData.nearbyFacilities || [],
          accessibility: formData.accessibility || "",
          landmarks: formData.nearbyLandmarks || ""
        } : null,
        amenities: formData.amenities || [],
        status: formData.status,
        image_gallery: allImages.length > 0 ? allImages : [],
        main_image_url: allImages[0] || null
      };

      console.log('=== UPDATE DATA TO BE SENT ===');
      console.log(JSON.stringify(updateData, null, 2));

      const { error } = await supabase
        .from('hyderabad_properties')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Property Updated!",
        description: "Your property has been successfully updated."
      });

      navigate("/agent/my-listings");
    } catch (error: any) {
      console.error("=== ERROR UPDATING PROPERTY ===");
      console.error("Error object:", error);
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);
      console.error("Error hint:", error.hint);
      console.error("Error code:", error.code);
      
      toast({
        title: "Error",
        description: error.message || "Failed to update property. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExistingImageRemove = (imageUrl: string) => {
    setExistingImages(existingImages.filter(img => img !== imageUrl));
  };

  const handleAmenityToggle = (amenity: string) => {
    if (!formData) return;
    
    setFormData(prev => ({
      ...prev!,
      amenities: prev!.amenities.includes(amenity)
        ? prev!.amenities.filter(a => a !== amenity)
        : [...prev!.amenities, amenity]
    }));
  };

  const handleUSPToggle = (usp: string) => {
    if (!formData) return;
    
    setFormData(prev => ({
      ...prev!,
      uniqueUSPs: prev!.uniqueUSPs.includes(usp)
        ? prev!.uniqueUSPs.filter(u => u !== usp)
        : [...prev!.uniqueUSPs, usp]
    }));
  };

  const handleNearbyFacilityToggle = (facility: string) => {
    if (!formData) return;
    
    setFormData(prev => ({
      ...prev!,
      nearbyFacilities: prev!.nearbyFacilities.includes(facility)
        ? prev!.nearbyFacilities.filter(f => f !== facility)
        : [...prev!.nearbyFacilities, facility]
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading property...</p>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Property not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/agent/my-listings">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Listings
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          <BasicInformationSection formData={formData} onInputChange={handleInputChange} />
          
          <ImageUploadSection
            uploadedImages={uploadedImages}
            setUploadedImages={setUploadedImages}
            existingImages={existingImages}
            onExistingImageRemove={handleExistingImageRemove}
            onCoverImageChange={setCoverImage}
            coverImage={coverImage}
            isEditMode={true}
          />
          
          <PropertySpecificationsSection formData={formData} setFormData={setFormData} />
          <PropertyFeaturesSection 
            formData={formData} 
            onInputChange={handleInputChange}
          />
          <AIDescriptionPreview formData={formData} setFormData={setFormData} isEditMode={true} />
          
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

          <AmenitiesSection 
            formData={formData} 
            handleAmenityToggle={handleAmenityToggle} 
          />

          {/* Submit Buttons */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="status">Property Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-x-4">
              <Link to={`/property/${id}`}>
                <Button type="button" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Updating..." : "Update Property"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProperty;
