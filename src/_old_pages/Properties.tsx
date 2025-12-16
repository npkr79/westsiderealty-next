import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import FilterSidebar from "@/components/property/FilterSidebar";
import PropertyGrid from "@/components/property/PropertyGrid";
import { realEstatePropertyService } from "@/services/realestatePropertyService";
import type { RealEstateProperty } from "@/services/realestatePropertyService";
import type { AgentProfile } from "@/services/supabaseAgentService";

const Properties = () => {
  const [searchParams] = useSearchParams();
  const locationParam = searchParams.get('location');
  const searchParam = searchParams.get('search');

  // CORRECTED: useState syntax for type generics and initial values
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState(searchParam || "");
  const [selectedLocation, setSelectedLocation] = useState(locationParam || "all");
  const [selectedPropertyType, setSelectedPropertyType] = useState("all");
  const [selectedBedrooms, setSelectedBedrooms] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [properties, setProperties] = useState<RealEstateProperty[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const microMarkets = [
    "Kokapet", "Gandipet", "Narsingi", "Gachibowli", "Kondapur", 
    "Tellapur", "Mokila", "Nallagandla", "Nanakramguda", 
    "Financial District", "Hitech City", "Manikonda", "Khajaguda"
  ];

  useEffect(() => {
    const loadAgents = async () => {
      try {
        setAgents([]);
      } catch (error) {
        console.error("Error loading agents:", error);
      }
    };

    loadAgents();
  }, []);

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      try {
        const filters = {
          searchQuery: searchQuery || undefined,
          location: selectedLocation !== "all" ? selectedLocation : undefined,
          propertyType: selectedPropertyType !== "all" ? selectedPropertyType : undefined,
          bedrooms: selectedBedrooms !== "all" ? parseInt(selectedBedrooms) : undefined,
          priceRange: priceRange !== "all" ? priceRange : undefined,
          status: "available"
        };

        console.log('Properties page: Fetching properties with filters:', filters);
        const fetchedProperties = await realEstatePropertyService.getProperties(filters);
        console.log('Properties page: Fetched', fetchedProperties.length, 'properties from Supabase');
        setProperties(fetchedProperties);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [searchQuery, selectedLocation, selectedPropertyType, selectedBedrooms, priceRange]);

  const convertToLegacyFormat = (property: RealEstateProperty) => {
    return {
      id: parseInt(property.id) || 0,
      title: property.title,
      location: `${property.bedrooms}BHK in ${property.location_map_url || 'Hyderabad'}`,
      price: realEstatePropertyService.formatPrice(property.price),
      pricePerSft: `₹${Math.round(property.price / property.sq_ft)}/sft`,
      area: `${property.sq_ft} sft`,
      bedrooms: property.bedrooms.toString(),
      propertyType: property.status,
      agent: "Real Estate Agent",
      agentPhone: "+91 9876543210",
      image: property.main_image_url || "/placeholder.svg",
      featured: false
    };
  };

  const legacyProperties = properties.map(convertToLegacyFormat);
  console.log('Properties page: Converted to legacy format:', legacyProperties.length, 'properties');

  const handleWhatsAppContact = (agentPhone: string, propertyTitle: string) => {
    const message = `Hi, I'm interested in your property "${propertyTitle}" listed on Hyderabad Resale Properties.`;
    const whatsappUrl = `https://wa.me/${agentPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Properties" }
  ];

  return (
    <Layout>
      <div className="bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <FilterSidebar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
                selectedPropertyType={selectedPropertyType}
                setSelectedPropertyType={setSelectedPropertyType}
                selectedBedrooms={selectedBedrooms}
                setSelectedBedrooms={setSelectedBedrooms}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                microMarkets={microMarkets}
              />
            </div>

            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading properties from Supabase...</p>
                </div>
              ) : (
                <PropertyGrid
                  properties={legacyProperties}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  onWhatsAppContact={handleWhatsAppContact}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Properties;
