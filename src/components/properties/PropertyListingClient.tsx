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
import LandownerSEOContent from "@/components/properties/LandownerSEOContent";
import type { UnifiedProperty, UnifiedPropertyFilters, CitySlug } from "@/types/unifiedProperty";
import { CITY_CONFIGS } from "@/types/unifiedProperty";
import { projectService, type ProjectInfo } from "@/services/projectService";

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
    const microMarket = searchParams.get('microMarket');
    const community = searchParams.get('community');
    
    const initialFilters: UnifiedPropertyFilters = {};
    
    if (microMarket) {
      initialFilters.microMarkets = [microMarket];
    }
    
    if (community) {
      initialFilters.communities = [community];
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

    // Property type
    if (filters.propertyType && filters.propertyType !== 'all') {
      filtered = filtered.filter(property => property.property_type === filters.propertyType);
    }

    // Location
    if (filters.location) {
      filtered = filtered.filter(property => 
        property.location.toLowerCase().includes(filters.location!.toLowerCase()) ||
        property.micro_market?.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    // Bedrooms
    if (filters.bedrooms) {
      filtered = filtered.filter(property => property.bedrooms === filters.bedrooms);
    }

    // Price range
    if (filters.priceRange) {
      const [min, max] = parsePriceRange(filters.priceRange);
      filtered = filtered.filter(property => {
        return property.price >= min && (max === null || property.price <= max);
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

  const maxPrice = properties.length > 0 
    ? Math.max(...properties.map(p => p.price), 500000000)
    : 500000000;

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
            <PropertyFilters
              citySlug={citySlug}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleResetFilters}
              maxPrice={maxPrice}
            />
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
                                    {projectDescriptions.get(projectName)!.description}
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

