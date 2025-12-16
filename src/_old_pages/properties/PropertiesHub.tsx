import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Grid, List, MapPin, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PropertyCard from "@/components/properties/PropertyCard";
import HyderabadFilters from "@/components/properties/filters/HyderabadFilters";
import GoaFilters from "@/components/properties/filters/GoaFilters";
import DubaiFilters from "@/components/properties/filters/DubaiFilters";
import { locationPropertyService, type HyderabadProperty, type GoaProperty, type DubaiProperty } from "@/services/locationPropertyService";
import { projectService, type ProjectInfo } from "@/services/projectService";
import LandownerSEOContent from "@/components/properties/LandownerSEOContent";
import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import FooterSection from "@/components/home/FooterSection";

type CityType = 'hyderabad' | 'goa' | 'dubai';
type PropertyType = HyderabadProperty | GoaProperty | DubaiProperty;

interface CityConfig {
  name: string;
  tagline: string;
  gradient: string;
  icon: React.ReactNode;
  badgeColor: string;
}

const cityConfigs: Record<CityType, CityConfig> = {
  hyderabad: {
    name: "Hyderabad",
    tagline: "Premium Properties in Hyderabad",
    gradient: "from-remax-red to-red-600",
    icon: <MapPin className="h-6 w-6" />,
    badgeColor: "text-remax-red"
  },
  goa: {
    name: "Goa",
    tagline: "Paradise Properties in Goa",
    gradient: "from-blue-600 to-blue-800",
    icon: <MapPin className="h-6 w-6" />,
    badgeColor: "text-blue-600"
  },
  dubai: {
    name: "Dubai",
    tagline: "Global Investment Properties in Dubai",
    gradient: "from-amber-600 to-orange-600",
    icon: <MapPin className="h-6 w-6" />,
    badgeColor: "text-amber-600"
  }
};

const PropertiesHub = () => {
  const [selectedCity, setSelectedCity] = useState<CityType>('hyderabad');
  const [properties, setProperties] = useState<PropertyType[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'shares'>('all');
  const [filters, setFilters] = useState<any>({});
  const [projectDescriptions, setProjectDescriptions] = useState<Map<string, ProjectInfo>>(new Map());
  const { locationSlug } = useParams<{ locationSlug?: string }>();
  const navigate = useNavigate();

  // Initialize selectedCity from URL path parameter or query param (backward compatibility)
  useEffect(() => {
    // Priority 1: URL path parameter
    if (locationSlug && ['hyderabad', 'goa', 'dubai'].includes(locationSlug.toLowerCase())) {
      setSelectedCity(locationSlug.toLowerCase() as CityType);
      return;
    }
    
    // Priority 2: Query parameter (for backward compatibility)
    const params = new URLSearchParams(window.location.search);
    const cityParam = params.get('city')?.trim().toLowerCase();
    if (cityParam && ['hyderabad', 'goa', 'dubai'].includes(cityParam)) {
      // Redirect to clean URL
      navigate(`/properties/${cityParam}`, { replace: true });
      return;
    }
    
    // Default: Hyderabad if no location slug
    if (!locationSlug) {
      setSelectedCity('hyderabad');
    }
  }, [locationSlug, navigate]);

  useEffect(() => {
    fetchProperties();
  }, [selectedCity]);

  useEffect(() => {
    applyFilters();
  }, [properties, filters]);

  // Fetch project descriptions for Hyderabad share properties
  useEffect(() => {
    const fetchProjectDescriptions = async () => {
      if (selectedCity !== 'hyderabad') {
        setProjectDescriptions(new Map());
        return;
      }

      const shareProps = filteredProperties.filter(p => {
        const hyderabadProp = p as HyderabadProperty;
        return hyderabadProp.landowner_share || hyderabadProp.investor_share;
      });

      if (shareProps.length === 0) {
        setProjectDescriptions(new Map());
        return;
      }
      
      const projectNames = [...new Set(
        shareProps
          .map(p => (p as HyderabadProperty).project_name)
          .filter(Boolean) as string[]
      )];

      const descriptions = await projectService.getMultipleProjects(projectNames);
      setProjectDescriptions(descriptions);
    };

    fetchProjectDescriptions();
  }, [selectedCity, filteredProperties]);

  const fetchProperties = async () => {
    setIsLoading(true);
    setFilters({});
    console.log('[PropertiesHub] Fetching properties for city:', selectedCity);
    try {
      let data: PropertyType[] = [];
      
      switch (selectedCity) {
        case 'hyderabad':
          data = await locationPropertyService.getHyderabadProperties();
          break;
        case 'goa':
          data = await locationPropertyService.getGoaProperties();
          break;
        case 'dubai':
          data = await locationPropertyService.getDubaiProperties();
          break;
      }
      
      console.log(`[PropertiesHub] Fetched ${data.length} ${selectedCity} properties`);
      setProperties(data);
    } catch (error) {
      console.error(`Error fetching ${selectedCity} properties:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...properties];

    // City-specific filtering logic
    if (selectedCity === 'hyderabad') {
      filtered = applyHyderabadFilters(filtered as HyderabadProperty[]);
    } else if (selectedCity === 'goa') {
      filtered = applyGoaFilters(filtered as GoaProperty[]);
    } else if (selectedCity === 'dubai') {
      filtered = applyDubaiFilters(filtered as DubaiProperty[]);
    }

    // Common sorting
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
  };

  const applyHyderabadFilters = (props: HyderabadProperty[]) => {
    console.log('🔍 [PropertiesHub] Applying Hyderabad filters:', {
      totalProperties: props.length,
      selectedCommunities: filters.communities,
      sampleProjectNames: props.slice(0, 5).map(p => ({
        title: p.title,
        project_name: p.project_name
      })),
      allFilters: filters
    });
    
    let filtered = props;

    if (filters.propertyTypes && filters.propertyTypes.length > 0) {
      filtered = filtered.filter(p => filters.propertyTypes.includes(p.property_type));
    }

    if (filters.bhkConfig && filters.bhkConfig.length > 0) {
      filtered = filtered.filter(p => p.bedrooms && filters.bhkConfig.includes(p.bedrooms));
    }

    if (filters.microMarkets && filters.microMarkets.length > 0) {
      filtered = filtered.filter(p => 
        filters.microMarkets.some((market: string) => 
          p.micro_market?.toLowerCase().includes(market.toLowerCase()) ||
          p.location.toLowerCase().includes(market.toLowerCase())
        )
      );
    }

    if (filters.possessionStatus) {
      filtered = filtered.filter(p => p.possession_status === filters.possessionStatus);
    }

    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      filtered = filtered.filter(p => p.price >= min && p.price <= max);
    }

    if (filters.amenities && filters.amenities.length > 0) {
      filtered = filtered.filter(p => {
        const propertyAmenities = p.amenities || [];
        return filters.amenities.every((amenity: string) => 
          propertyAmenities.includes(amenity)
        );
      });
    }

    // Community/Project Name Filter - Using database project_name column
    if (filters.communities && filters.communities.length > 0) {
      console.log('🏘️ [PropertiesHub] Filtering by communities:', filters.communities);
      
      filtered = filtered.filter(property => {
        const hasIndependent = filters.communities?.includes('Independent');
        const otherProjects = filters.communities?.filter((c: string) => c !== 'Independent') || [];
        
        console.log('  Property:', property.title, '| DB project_name:', property.project_name);
        
        // Match Independent properties (those without project_name)
        if (hasIndependent && !property.project_name) {
          console.log('    ✅ Matched as Independent');
          return true;
        }
        
        // Match specific project names from database
        if (otherProjects.length > 0 && property.project_name) {
          const matches = otherProjects.some((c: string) => {
            const match = property.project_name?.toLowerCase() === c.toLowerCase();
            console.log(`    Comparing "${property.project_name}" with "${c}": ${match}`);
            return match;
          });
          if (matches) {
            console.log('    ✅ Matched project name');
            return true;
          }
        }
        
        console.log('    ❌ No match - excluded from results');
        return false;
      });
      
      console.log('📊 [PropertiesHub] After community filter:', filtered.length, 'properties remain');
    }

    return filtered;
  };

  const applyGoaFilters = (props: GoaProperty[]) => {
    let filtered = props;

    if (filters.propertyTypes && filters.propertyTypes.length > 0) {
      filtered = filtered.filter(p => filters.propertyTypes.includes(p.property_type));
    }

    if (filters.region) {
      filtered = filtered.filter(p => 
        p.region.toLowerCase() === filters.region.toLowerCase()
      );
    }

    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      filtered = filtered.filter(p => p.price >= min && p.price <= max);
    }

    return filtered;
  };

  const applyDubaiFilters = (props: DubaiProperty[]) => {
    let filtered = props;

    if (filters.propertyTypes && filters.propertyTypes.length > 0) {
      filtered = filtered.filter(p => filters.propertyTypes.includes(p.property_type));
    }

    if (filters.communities && filters.communities.length > 0) {
      filtered = filtered.filter(p => 
        filters.communities.some((community: string) => 
          p.community.toLowerCase().includes(community.toLowerCase())
        )
      );
    }

    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      filtered = filtered.filter(p => p.price >= min && p.price <= max);
    }

    return filtered;
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const cityConfig = cityConfigs[selectedCity];
  const featuredCount = filteredProperties.filter(p => p.is_featured).length;

  const breadcrumbItems = locationSlug 
    ? [
        { label: "Home", href: "/" },
        { label: "Properties", href: "/properties" },
        { label: cityConfig.name }
      ]
    : [
        { label: "Home", href: "/" },
        { label: "Properties" }
      ];

  const seoTitle = `${cityConfig.name} Properties - Luxury Homes & Investments | RE/MAX Westside Realty`;
  const seoDescription = `Explore premium properties in ${cityConfig.name}. World-class real estate listings with detailed filters and virtual tours.`;
  const canonicalUrl = `https://www.westsiderealty.in/properties${locationSlug ? `/${locationSlug}` : ''}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="RE/MAX Westside Realty" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        
        {/* JSON-LD Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": `${cityConfig.name} Properties`,
            "description": seoDescription,
            "url": canonicalUrl,
            "numberOfItems": properties.length
          })}
        </script>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <BreadcrumbNav items={breadcrumbItems} />

        {/* City Selector & Hero */}
        <div className={`bg-gradient-to-r ${cityConfig.gradient} text-white rounded-lg p-8 mb-8`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                {cityConfig.icon}
                <Badge variant="secondary" className={cityConfig.badgeColor}>
                  {cityConfig.name}
                </Badge>
              </div>
              <h1 className="text-4xl font-bold mb-4">{cityConfig.tagline}</h1>
              <p className="text-xl">
                {selectedCity === 'hyderabad' && "Discover luxury resale homes, apartments, and villas in Hyderabad's most sought-after locations"}
                {selectedCity === 'goa' && "Your gateway to luxury holiday homes and high-yield investment properties"}
                {selectedCity === 'dubai' && "World-class investment opportunities in the UAE's most dynamic real estate market"}
              </p>
            </div>

            <div className="md:min-w-[250px]">
              <label className="text-sm font-medium mb-2 block">Switch City</label>
              <Select 
                value={selectedCity} 
                onValueChange={(value) => {
                  const sanitizedValue = value.trim().toLowerCase() as CityType;
                  if (['hyderabad', 'goa', 'dubai'].includes(sanitizedValue)) {
                    // Navigate directly to the city route
                    navigate(`/${sanitizedValue}`);
                  }
                }}
              >
                <SelectTrigger className="bg-white text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hyderabad">🏢 Hyderabad</SelectItem>
                  <SelectItem value="goa">🌴 Goa</SelectItem>
                  <SelectItem value="dubai">🏙️ Dubai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Badge variant="outline" className="border-white text-white bg-white/10">
              {properties.length} Properties Available
            </Badge>
            {featuredCount > 0 && (
              <Badge variant="outline" className="border-white text-white bg-white/10">
                <Star className="h-3 w-3 mr-1" />
                {featuredCount} Featured
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Dynamic Filters Sidebar */}
          <div className="lg:col-span-1">
            {selectedCity === 'hyderabad' && (
              <HyderabadFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onReset={handleResetFilters}
                maxPrice={Math.max(...properties.map(p => p.price), 200000000)}
              />
            )}
            {selectedCity === 'goa' && (
              <GoaFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onReset={handleResetFilters}
              />
            )}
            {selectedCity === 'dubai' && (
              <DubaiFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onReset={handleResetFilters}
              />
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedCity === 'hyderabad' ? (
              // HYDERABAD: Two-tab interface with landowner/investor shares
              <>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'shares')} className="w-full">
                  <TabsList className="mb-6 w-full justify-start">
                    <TabsTrigger value="all" className="flex-1 sm:flex-none">
                      All Properties ({filteredProperties.length})
                    </TabsTrigger>
                    <TabsTrigger value="shares" className="flex-1 sm:flex-none">
                      Landowner/Investor Shares ({
                        filteredProperties.filter(p => {
                          const hyderabadProp = p as HyderabadProperty;
                          return hyderabadProp.landowner_share || hyderabadProp.investor_share;
                        }).length
                      })
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">
                          {filteredProperties.length} Properties Found
                        </h2>
                        <p className="text-muted-foreground">
                          Premium resale properties in Hyderabad
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
                    {isLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, index) => (
                          <div key={index} className="bg-background rounded-lg border border-border p-4 animate-pulse">
                            <div className="bg-muted h-48 rounded-lg mb-4"></div>
                            <div className="bg-muted h-4 rounded mb-2"></div>
                            <div className="bg-muted h-4 rounded w-3/4"></div>
                          </div>
                        ))}
                      </div>
                    ) : filteredProperties.length === 0 ? (
                      <div className="text-center py-12">
                        <h3 className="text-xl font-semibold text-foreground mb-4">No properties found</h3>
                        <p className="text-muted-foreground mb-6">
                          Try adjusting your filters to see more results
                        </p>
                        <Button onClick={handleResetFilters}>Clear All Filters</Button>
                      </div>
                    ) : (
                      <div className={`grid gap-6 ${
                        viewMode === 'grid' 
                          ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                          : 'grid-cols-1'
                      }`}>
                        {filteredProperties.map((property) => (
                          <PropertyCard
                            key={property.id}
                            property={property}
                            location={selectedCity}
                            viewMode={viewMode}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="shares">
                    {(() => {
                      const shareProperties = filteredProperties.filter(p => {
                        const hyderabadProp = p as HyderabadProperty;
                        return hyderabadProp.landowner_share || hyderabadProp.investor_share;
                      });

                      const projectGroups = shareProperties.reduce((acc, property) => {
                        const hyderabadProp = property as HyderabadProperty;
                        const projectName = hyderabadProp.project_name || 'Independent';
                        if (!acc[projectName]) {
                          acc[projectName] = [];
                        }
                        acc[projectName].push(hyderabadProp);
                        return acc;
                      }, {} as Record<string, HyderabadProperty[]>);

                      return shareProperties.length === 0 ? (
                        <div className="text-center py-12 bg-background rounded-lg border border-border shadow">
                          <h3 className="text-xl font-semibold text-foreground mb-4">
                            No landowner/investor share properties available
                          </h3>
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
                      );
                    })()}
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              // GOA/DUBAI: Single view without tabs
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {filteredProperties.length} Properties Found
                    </h2>
                    <p className="text-muted-foreground">
                      {selectedCity === 'goa' && "Holiday homes and investment properties in Goa"}
                      {selectedCity === 'dubai' && "Investment properties in Dubai, UAE"}
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
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, index) => (
                      <div key={index} className="bg-background rounded-lg border border-border p-4 animate-pulse">
                        <div className="bg-muted h-48 rounded-lg mb-4"></div>
                        <div className="bg-muted h-4 rounded mb-2"></div>
                        <div className="bg-muted h-4 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold text-foreground mb-4">No properties found</h3>
                    <p className="text-muted-foreground mb-6">
                      Try adjusting your filters to see more results
                    </p>
                    <Button onClick={handleResetFilters}>Clear All Filters</Button>
                  </div>
                ) : (
                  <div className={`grid gap-6 ${
                    viewMode === 'grid' 
                      ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                      : 'grid-cols-1'
                  }`}>
                    {filteredProperties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        location={selectedCity}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default PropertiesHub;
