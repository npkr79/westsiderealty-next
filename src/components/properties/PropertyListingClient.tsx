"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Grid, List, Star, MapPin, Waves, Building } from "lucide-react";
import PropertyCard from "@/components/properties/PropertyCard";
import GoaPropertyCard from "@/components/properties/GoaPropertyCard";
import PropertyFilters from "@/components/properties/PropertyFilters";
import HyderabadPropertyFilters from "@/components/properties/HyderabadPropertyFilters";
import LandownerSEOContent from "@/components/properties/LandownerSEOContent";
import type { UnifiedProperty, UnifiedPropertyFilters, CitySlug } from "@/types/unifiedProperty";
import { CITY_CONFIGS } from "@/types/unifiedProperty";
import { projectService, type ProjectInfo } from "@/services/projectService";
import { truncateWords } from "@/lib/textUtils";

interface PropertyListingClientProps {
  citySlug: CitySlug;
  initialProperties: UnifiedProperty[];
}

export default function PropertyListingClient({
  citySlug,
  initialProperties,
}: PropertyListingClientProps) {
  const searchParams = useSearchParams();
  const [properties] = useState<UnifiedProperty[]>(initialProperties);
  const [filteredProperties, setFilteredProperties] = useState<UnifiedProperty[]>(initialProperties);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'shares'>('all');
  const [filters, setFilters] = useState<UnifiedPropertyFilters>({});
  const [projectDescriptions, setProjectDescriptions] = useState<Map<string, ProjectInfo>>(new Map());

  const config = CITY_CONFIGS[citySlug];

  // Read URL parameters and apply initial filters
  useEffect(() => {
    const initialFilters: UnifiedPropertyFilters = {};
    
    // Read all URL params
    const search = searchParams.get('search');
    const propertyType = searchParams.get('propertyType');
    const bedrooms = searchParams.get('bedrooms');
    const microMarkets = searchParams.get('microMarkets');
    const communities = searchParams.get('communities');
    const possessionStatus = searchParams.get('possessionStatus');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const landownerShare = searchParams.get('landownerShare');
    const investorShare = searchParams.get('investorShare');
    const isResale = searchParams.get('isResale');
    const amenities = searchParams.get('amenities');
    const sortBy = searchParams.get('sortBy');
    
    if (search) initialFilters.searchQuery = search;
    if (propertyType) {
      initialFilters.propertyType = propertyType.includes(',') 
        ? propertyType.split(',') 
        : propertyType;
    }
    if (bedrooms) {
      const beds = bedrooms.split(',').map(b => parseInt(b));
      initialFilters.bedrooms = beds.length === 1 ? beds[0] : beds;
    }
    if (microMarkets) {
      initialFilters.microMarkets = microMarkets.split(',');
    }
    if (communities) {
      initialFilters.communities = communities.split(',');
    }
    if (possessionStatus) {
      initialFilters.possessionStatus = possessionStatus;
    }
    if (priceMin) {
      initialFilters.priceMin = parseInt(priceMin);
    }
    if (priceMax) {
      initialFilters.priceMax = parseInt(priceMax);
    }
    if (landownerShare === 'true') {
      initialFilters.landownerShare = true;
    }
    if (investorShare === 'true') {
      initialFilters.investorShare = true;
    }
    if (isResale === 'true') {
      initialFilters.isResale = true;
    }
    if (amenities) {
      initialFilters.amenities = amenities.split(',');
    }
    if (sortBy) {
      initialFilters.sortBy = sortBy;
    }
    
    if (Object.keys(initialFilters).length > 0) {
      setFilters(initialFilters);
    }
  }, [searchParams]);

  // Apply filters
  useEffect(() => {
    let filtered = [...properties];

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(query) ||
        property.description.toLowerCase().includes(query) ||
        property.location.toLowerCase().includes(query)
      );
    }

    // Property type (support both single and array)
    if (filters.propertyType) {
      if (Array.isArray(filters.propertyType)) {
        filtered = filtered.filter(property => 
          filters.propertyType!.includes(property.property_type)
        );
      } else if (filters.propertyType !== 'all') {
        filtered = filtered.filter(property => property.property_type === filters.propertyType);
      }
    }

    // Location
    if (filters.location) {
      filtered = filtered.filter(property => 
        property.location.toLowerCase().includes(filters.location!.toLowerCase()) ||
        property.micro_market?.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    // Bedrooms (support both single and array)
    if (filters.bedrooms !== undefined) {
      if (Array.isArray(filters.bedrooms)) {
        const bedroomsArray = filters.bedrooms as number[];
        filtered = filtered.filter(property => 
          property.bedrooms && bedroomsArray.includes(property.bedrooms)
        );
      } else {
        filtered = filtered.filter(property => property.bedrooms === filters.bedrooms);
      }
    }

    // Price range (support both priceRange string and priceMin/priceMax)
    if (filters.priceRange) {
      const [min, max] = parsePriceRange(filters.priceRange);
      filtered = filtered.filter(property => {
        return property.price >= min && (max === null || property.price <= max);
      });
    } else if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      filtered = filtered.filter(property => {
        const min = filters.priceMin ?? 0;
        const max = filters.priceMax ?? Infinity;
        return property.price >= min && property.price <= max;
      });
    }

    // Hyderabad-specific filters
    if (citySlug === 'hyderabad') {
      // Communities
      if (filters.communities && filters.communities.length > 0) {
        filtered = filtered.filter(property => {
          const hasIndependent = filters.communities?.includes('Independent');
          const otherProjects = filters.communities?.filter(c => c !== 'Independent') || [];
          
          if (hasIndependent && !property.project_name) {
            return true;
          }
          
          if (otherProjects.length > 0 && property.project_name) {
            return otherProjects.some(c => 
              property.project_name?.toLowerCase() === c.toLowerCase()
            );
          }
          
          return false;
        });
      }

      // Micro markets
      if (filters.microMarkets && filters.microMarkets.length > 0) {
        filtered = filtered.filter(property => 
          property.micro_market && 
          filters.microMarkets?.includes(property.micro_market)
        );
      }

      // Landowner/Investor share
      if (filters.landownerShare) {
        filtered = filtered.filter(property => property.landowner_share);
      }
      if (filters.investorShare) {
        filtered = filtered.filter(property => property.investor_share);
      }
      if (filters.isResale) {
        filtered = filtered.filter(property => property.is_resale);
      }

      // Possession status
      if (filters.possessionStatus) {
        filtered = filtered.filter(property => {
          // Check if property has possession_status field (may be in different format)
          const possessionStatus = (property as any).possession_status || (property as any).possessionStatus;
          return possessionStatus?.toLowerCase() === filters.possessionStatus?.toLowerCase();
        });
      }

      // Amenities filter
      if (filters.amenities && filters.amenities.length > 0) {
        filtered = filtered.filter(property => {
          const propertyAmenities = (property as any).amenities || [];
          if (!Array.isArray(propertyAmenities)) return false;
          // Check if property has all selected amenities
          return filters.amenities!.every(amenity =>
            propertyAmenities.some((propAmenity: string) =>
              propAmenity.toLowerCase().includes(amenity.toLowerCase())
            )
          );
        });
      }
    }

    // Goa-specific filters
    if (citySlug === 'goa') {
      if (filters.district) {
        filtered = filtered.filter(property => property.district === filters.district);
      }
      if (filters.location_area) {
        filtered = filtered.filter(property => property.location_area === filters.location_area);
      }
      if (filters.listing_type) {
        filtered = filtered.filter(property => property.listing_type === filters.listing_type);
      }
    }

    // Dubai-specific filters
    if (citySlug === 'dubai') {
      if (filters.emirate) {
        filtered = filtered.filter(property => property.emirate === filters.emirate);
      }
      if (filters.community) {
        filtered = filtered.filter(property => property.community === filters.community);
      }
    }

    // Sort
    switch (filters.sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        filtered.sort((a, b) => {
          if (a.is_featured !== b.is_featured) {
            return b.is_featured ? 1 : -1;
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }

    setFilteredProperties(filtered);
  }, [properties, filters, citySlug]);

  // Fetch project descriptions for share properties (Hyderabad only)
  useEffect(() => {
    if (citySlug !== 'hyderabad') return;

    const fetchProjectDescriptions = async () => {
      const shareProps = filteredProperties.filter(p => p.landowner_share || p.investor_share);
      if (shareProps.length === 0) {
        setProjectDescriptions(new Map());
        return;
      }
      
      const projectNames = [...new Set(
        shareProps
          .map(p => p.project_name)
          .filter(Boolean) as string[]
      )];

      const descriptions = await projectService.getMultipleProjects(projectNames);
      setProjectDescriptions(descriptions);
    };

    fetchProjectDescriptions();
  }, [filteredProperties, citySlug]);

  const parsePriceRange = (range: string): [number, number | null] => {
    switch (range) {
      case '0-50L': return [0, 5000000];
      case '50L-1Cr': return [5000000, 10000000];
      case '1-2Cr': return [10000000, 20000000];
      case '2-5Cr': return [20000000, 50000000];
      case '5Cr+': return [50000000, null];
      default: return [0, null];
    }
  };

  const handleFiltersChange = (newFilters: UnifiedPropertyFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const featuredProperties = filteredProperties.filter(p => p.is_featured);
  const shareProperties = citySlug === 'hyderabad' 
    ? filteredProperties.filter(p => p.landowner_share || p.investor_share)
    : [];

  // Group share properties by project (Hyderabad only)
  const projectGroups = useMemo(() => {
    if (citySlug !== 'hyderabad') return {};
    
    return shareProperties.reduce((acc, property) => {
      const projectName = property.project_name || 'Independent';
      if (!acc[projectName]) {
        acc[projectName] = [];
      }
      acc[projectName].push(property);
      return acc;
    }, {} as Record<string, UnifiedProperty[]>);
  }, [shareProperties, citySlug]);

  // Calculate min and max prices from properties
  const priceRange = useMemo(() => {
    if (properties.length === 0) {
      return { min: 0, max: 500000000 };
    }
    const prices = properties.map(p => p.price).filter(p => p > 0);
    return {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 500000000,
    };
  }, [properties]);

  const IconComponent = {
    MapPin,
    Waves,
    Building,
  }[config.icon] || MapPin;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className={`bg-gradient-to-r ${config.heroGradient} text-white rounded-lg p-8 mb-8`}>
          <div className="flex items-center gap-2 mb-4">
            <IconComponent className="h-6 w-6" />
            <Badge variant="secondary" className={citySlug === 'hyderabad' ? 'text-remax-red' : citySlug === 'goa' ? 'text-blue-600' : 'text-amber-600'}>
              {config.displayName}
            </Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            {citySlug === 'hyderabad' && 'Premium Properties in Hyderabad'}
            {citySlug === 'goa' && 'Paradise Properties in Goa'}
            {citySlug === 'dubai' && 'Global Investment Properties in Dubai'}
          </h1>
          <p className="text-xl mb-6">
            {citySlug === 'hyderabad' && 'Discover luxury resale homes, apartments, and villas in Hyderabad\'s most sought-after locations'}
            {citySlug === 'goa' && 'Your gateway to luxury holiday homes and high-yield investment properties in God\'s Own Country'}
            {citySlug === 'dubai' && 'Discover world-class investment opportunities in the UAE\'s most dynamic real estate market'}
          </p>
          <div className="flex flex-wrap gap-4">
            <Badge variant="outline" className="border-white text-white bg-white/10">
              {properties.length} Properties Available
            </Badge>
            {featuredProperties.length > 0 && (
              <Badge variant="outline" className="border-white text-white bg-white/10">
                <Star className="h-3 w-3 mr-1" />
                {featuredProperties.length} Featured
              </Badge>
            )}
            {citySlug === 'goa' && filteredProperties.filter(p => p.listing_type === 'Rent' || p.listing_type === 'Both' || p.rental_yield_min).length > 0 && (
              <Badge variant="outline" className="border-white text-white bg-white/10">
                💰 {filteredProperties.filter(p => p.listing_type === 'Rent' || p.listing_type === 'Both' || p.rental_yield_min).length} Rental Ready
              </Badge>
            )}
            {citySlug === 'dubai' && filteredProperties.filter(p => p.roi_percentage && p.roi_percentage > 8).length > 0 && (
              <Badge variant="outline" className="border-white text-white bg-white/10">
                📈 {filteredProperties.filter(p => p.roi_percentage && p.roi_percentage > 8).length} High ROI (8%+)
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            {citySlug === 'hyderabad' ? (
              <HyderabadPropertyFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onReset={handleResetFilters}
                minPrice={priceRange.min}
                maxPrice={priceRange.max}
                properties={properties}
              />
            ) : (
              <PropertyFilters
                citySlug={citySlug}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onReset={handleResetFilters}
                maxPrice={priceRange.max}
              />
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {citySlug === 'hyderabad' ? (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'shares')}>
                <TabsList className="mb-6 w-full justify-start">
                  <TabsTrigger value="all" className="flex-1 sm:flex-none">
                    All Properties ({filteredProperties.length})
                  </TabsTrigger>
                  <TabsTrigger value="shares" className="flex-1 sm:flex-none">
                    Landowner/Investor Shares ({shareProperties.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <PropertyGrid
                    properties={filteredProperties}
                    citySlug={citySlug}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                  />
                </TabsContent>

                <TabsContent value="shares">
                  {shareProperties.length === 0 ? (
                    <div className="text-center py-12 bg-background rounded-lg border border-border shadow">
                      <h3 className="text-xl font-semibold text-foreground mb-4">No landowner/investor share properties available</h3>
                      <p className="text-muted-foreground mb-6">
                        Currently there are no properties with landowner or investor shares available
                      </p>
                      <Button onClick={() => setActiveTab('all')}>View All Properties</Button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <LandownerSEOContent />
                      
                      {Object.entries(projectGroups)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([projectName, properties]) => (
                        <Card key={projectName}>
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <div className="flex-1 pr-4">
                                <span className="text-xl font-bold">{projectName}</span>
                                {projectDescriptions.get(projectName) && (
                                  <p className="text-sm text-muted-foreground font-normal mt-2 leading-relaxed">
                                    {truncateWords(projectDescriptions.get(projectName)!.description, 500)}
                                  </p>
                                )}
                              </div>
                              <Badge variant="secondary" className="ml-4 shrink-0">
                                {properties.length} unit{properties.length > 1 ? 's' : ''}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {properties.map(property => (
                                <PropertyCard 
                                  key={property.id} 
                                  property={property} 
                                  location="hyderabad"
                                  viewMode="grid"
                                />
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <PropertyGrid
                properties={filteredProperties}
                citySlug={citySlug}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PropertyGrid({
  properties,
  citySlug,
  viewMode,
  setViewMode,
}: {
  properties: UnifiedProperty[];
  citySlug: CitySlug;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {properties.length} Properties Found
          </h2>
          <p className="text-gray-600">
            {citySlug === 'hyderabad' && 'Premium resale properties in Hyderabad'}
            {citySlug === 'goa' && 'Holiday homes and investment properties in Goa'}
            {citySlug === 'dubai' && 'Premium investment properties in Dubai, UAE'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Property Grid */}
      {properties.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">No properties found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your filters to see more results
          </p>
        </div>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {properties.map((property) => {
            if (citySlug === 'goa') {
              return (
                <GoaPropertyCard
                  key={property.id}
                  property={property as any}
                />
              );
            }
            return (
              <PropertyCard
                key={property.id}
                property={property as any}
                location={citySlug}
                viewMode={viewMode}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

