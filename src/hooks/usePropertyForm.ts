"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { supabasePropertyService, supabaseImageService } from "@/services";
import type { UploadedImage } from "@/services/supabaseImageService";

export interface PropertyFormData {
  title: string;
  description: string;
  propertyType: string;
  price: string;
  
  // Common fields
  area: string;
  location: string;
  microMarket: string;
  bedrooms: string;
  bathrooms: string;
  
  // Optional common fields
  floorNumber: string;
  totalFloors: string;
  carParkings: string; // Changed to string for consistency
  facing: string;
  ageOfProperty: string;
  uniqueUSPs: string[];
  furnishedStatus: string;
  communityName: string;
  project_name?: string;
  nearbyFacilities: string[];
  accessibility: string;
  nearbyLandmarks: string;
  amenities: string[];
  status: 'draft' | 'published' | 'inactive';
  isFeatured: boolean;
  
  // Villa specific fields
  plotArea?: string;
  villaType?: string;
  hasGarden?: string;
  isGatedCommunity?: string;
  
  // Commercial specific fields
  commercialSubtype?: string;
  hasCurrentTenant?: string;
  monthlyRental?: string;
  usageType?: string;
  
  // Plot specific fields
  isCornerPlot?: string;
  isGatedLayout?: string;
  approvalType?: string;
  
  // Open Land specific fields
  landType?: string;
  hasBorewell?: string;
  hasElectricity?: string;
  nearbyVillages?: string;
  approvalStatus?: string;
}

// Create a dummy user for property posting (replace logic that was useAuth before)
const dummyUser = {
  id: "agent-1",
  name: "Hardcoded Agent",
};

export const usePropertyForm = () => {
  const router = useRouter();
  const { toast } = useToast();
  const user = dummyUser;

  const [formData, setFormData] = useState<PropertyFormData>({
    title: "",
    description: "",
    propertyType: "",
    price: "",
    area: "",
    location: "",
    microMarket: "",
    bedrooms: "",
    bathrooms: "",
    floorNumber: "",
    totalFloors: "",
    carParkings: "1", // Changed to string
    facing: "",
    ageOfProperty: "",
    uniqueUSPs: [],
    furnishedStatus: "",
    communityName: "",
    nearbyFacilities: [],
    accessibility: "",
    nearbyLandmarks: "",
    amenities: [],
    status: 'published',
    isFeatured: false
  });

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [coverImage, setCoverImage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (status: "draft" | "published") => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add a property.",
        variant: "destructive"
      });
      return;
    }

    // Validation
    if (!formData.title || !formData.propertyType || !formData.price || !formData.area) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (uploadedImages.length === 0) {
      toast({
        title: "Images required",
        description: "Please upload at least one image for the property.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Sort images to put cover image first
      const sortedImages = coverImage ? 
        [coverImage, ...uploadedImages.map(img => img.url).filter(url => url !== coverImage)] : 
        uploadedImages.map(img => img.url);

      const propertyData = {
        title: formData.title,
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
        status,
        agentId: user.id,
        images: sortedImages,
        isFeatured: formData.isFeatured
      };

      await supabasePropertyService.addProperty(propertyData);

      toast({
        title: "Property Added!",
        description: `Your property has been ${status === 'published' ? 'published' : 'saved as draft'} successfully.`
      });

      router.push("/agent/my-listings");
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

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleUSPToggle = (usp: string) => {
    setFormData(prev => ({
      ...prev,
      uniqueUSPs: prev.uniqueUSPs.includes(usp)
        ? prev.uniqueUSPs.filter(u => u !== usp)
        : [...prev.uniqueUSPs, usp]
    }));
  };

  const handleNearbyFacilityToggle = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      nearbyFacilities: prev.nearbyFacilities.includes(facility)
        ? prev.nearbyFacilities.filter(f => f !== facility)
        : [...prev.nearbyFacilities, facility]
    }));
  };

  return {
    formData,
    setFormData,
    uploadedImages,
    setUploadedImages,
    coverImage,
    setCoverImage,
    isSubmitting,
    handleSubmit,
    handleAmenityToggle,
    handleUSPToggle,
    handleNearbyFacilityToggle
  };
};
