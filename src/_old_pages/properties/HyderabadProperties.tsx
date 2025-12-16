import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Grid, List, MapPin, Star } from "lucide-react";
import PropertyCard from "@/components/properties/PropertyCard";
import HyderabadFilters from "@/components/properties/filters/HyderabadFilters";
import { locationPropertyService, type HyderabadProperty, type PropertyFilters } from "@/services/locationPropertyService";
import { projectService, type ProjectInfo } from "@/services/projectService";
import LandownerSEOContent from "@/components/properties/LandownerSEOContent";
import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import FooterSection from "@/components/home/FooterSection";

const HyderabadProperties = () => {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState<HyderabadProperty[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<HyderabadProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'shares'>('all');
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [projectDescriptions, setProjectDescriptions] = useState<Map<string, ProjectInfo>>(new Map());

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Properties", href: "/properties" },
    { label: "Hyderabad Properties" }
  ];

  useEffect(() => {
    fetchProperties();
  }, []);

  // Read URL parameters and apply initial filters
  useEffect(() => {
    const microMarket = searchParams.get('microMarket');
    const community = searchParams.get('community');
    
    const initialFilters: PropertyFilters = {};
    
    if (microMarket) {
      console.log('🔗 URL parameter detected: microMarket =', microMarket);
      initialFilters.microMarkets = [microMarket];
    }
    
    if (community) {
      console.log('🔗 URL parameter detected: community =', community);
      initialFilters.communities = [community];
    }
    
    if (Object.keys(initialFilters).length > 0) {
      console.log('🎯 Setting initial filters from URL:', initialFilters);
      setFilters(initialFilters);
    }
  }, [searchParams]);

  useEffect(() => {
    applyFilters();
  }, [properties, filters]);

  // Fetch project descriptions when share properties change
  useEffect(() => {
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
  }, [filteredProperties]);

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const data = await locationPropertyService.getHyderabadProperties();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching Hyderabad properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...properties];
    
    console.log('🔍 FILTER DEBUG START:', {
      totalProperties: properties.length,
      filterCommunities: filters.communities,
      propertiesWithProjectNames: properties.filter(p => p.project_name).length,
      propertiesWithoutProjectNames: properties.filter(p => !p.project_name).length,
      allFilters: filters
    });

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(query) ||
        property.description.toLowerCase().includes(query) ||
        property.location.toLowerCase().includes(query)
      );
    }

    if (filters.propertyType && filters.propertyType !== 'all') {
      filtered = filtered.filter(property => property.property_type === filters.propertyType);
    }

    if (filters.location) {
      filtered = filtered.filter(property => 
        property.location.toLowerCase().includes(filters.location!.toLowerCase()) ||
        property.micro_market?.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters.bedrooms) {
      filtered = filtered.filter(property => property.bedrooms === filters.bedrooms);
    }

    if (filters.priceRange) {
      const [min, max] = parsePriceRange(filters.priceRange);
      filtered = filtered.filter(property => {
        return property.price >= min && (max === null || property.price <= max);
      });
    }

    // Filter by project/community name
    if (filters.communities && filters.communities.length > 0) {
      console.log('🏘️ Filtering by communities:', filters.communities);
      
      filtered = filtered.filter(property => {
        const hasIndependent = filters.communities?.includes('Independent');
        const otherProjects = filters.communities?.filter(c => c !== 'Independent') || [];
        
        console.log(`📍 Checking property: "${property.title}" | Project: "${property.project_name || 'NONE'}"`);
        
        // If "Independent" is selected and property has no project name, include it
        if (hasIndependent && !property.project_name) {
          console.log('  ✅ Matched as Independent (no project name)');
          return true;
        }
        
        // If specific project names are selected, match against them
        if (otherProjects.length > 0 && property.project_name) {
          const matches = otherProjects.some(c => {
            const match = property.project_name?.toLowerCase() === c.toLowerCase();
            console.log(`    Comparing "${property.project_name}" === "${c}": ${match}`);
            return match;
          });
          if (matches) {
            console.log('  ✅ Matched project name');
            return true;
          }
        }
        
        console.log('  ❌ No match');
        return false;
      });
      
      console.log('📊 After community filter:', filtered.length, 'properties');
    }

    // Filter by micro-markets (Area/Location)
    if (filters.microMarkets && filters.microMarkets.length > 0) {
      console.log('🗺️ Filtering by micro-markets:', filters.microMarkets);
      
      filtered = filtered.filter(property => {
        const hasMicroMarket = property.micro_market && 
          filters.microMarkets?.includes(property.micro_market);
        
        console.log(`  Property "${property.title}" | Micro-market: "${property.micro_market || 'NONE'}" | Match: ${hasMicroMarket}`);
        
        return hasMicroMarket;
      });
      
      console.log('📊 After micro-market filter:', filtered.length, 'properties');
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
    console.log('✨ FILTER DEBUG END - Final filtered count:', filtered.length);
  };

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

  const handleFiltersChange = (newFilters: PropertyFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const maxPrice = properties.length > 0 
    ? Math.max(...properties.map(p => p.price), 500000000)
    : 500000000;

  const featuredProperties = filteredProperties.filter(p => p.is_featured);

  // Filter properties for shares tab
  const shareProperties = filteredProperties.filter(
    p => p.landowner_share || p.investor_share
  );

  // Group share properties by project
  const projectGroups = shareProperties.reduce((acc, property) => {
    const projectName = property.project_name || 'Independent';
    if (!acc[projectName]) {
      acc[projectName] = [];
    }
    acc[projectName].push(property);
    return acc;
  }, {} as Record<string, HyderabadProperty[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Hyderabad Properties - Resale Homes, Apartments & Villas | RE/MAX Westside Realty</title>
        <meta name="description" content="Find premium resale properties in Hyderabad. Browse apartments, villas, farmhouses & plots in Gachibowli, Kondapur, Madhapur & other prime locations." />
        <meta name="keywords" content="hyderabad properties, resale properties hyderabad, apartments hyderabad, villas hyderabad, gachibowli properties, kondapur real estate, madhapur homes" />
        <link rel="canonical" href="https://www.westsiderealty.in/hyderabad/buy" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Hyderabad Properties - Resale Homes, Apartments & Villas" />
        <meta property="og:description" content="Find premium resale properties in Hyderabad. Browse apartments, villas, farmhouses & plots in prime locations." />
        <meta property="og:url" content="https://www.westsiderealty.in/hyderabad/buy" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="RE/MAX Westside Realty" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Hyderabad Properties - Resale Homes & Apartments" />
        <meta name="twitter:description" content="Find premium resale properties in Hyderabad." />
        
        {/* JSON-LD Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Hyderabad Properties",
            "description": "Resale properties in Hyderabad",
            "url": "https://www.westsiderealty.in/hyderabad/buy",
            "numberOfItems": properties.length
          })}
        </script>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <BreadcrumbNav items={breadcrumbItems} />

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-remax-red to-red-600 text-white rounded-lg p-8 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-6 w-6" />
            <Badge variant="secondary" className="text-remax-red">
              Hyderabad
            </Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">Premium Properties in Hyderabad</h1>
          <p className="text-xl mb-6">
            Discover luxury resale homes, apartments, and villas in Hyderabad's most sought-after locations
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <HyderabadFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleResetFilters}
              maxPrice={Math.max(...properties.map(p => p.price), 500000000)}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
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
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {filteredProperties.length} Properties Found
                    </h2>
                    <p className="text-gray-600">
                      Premium resale properties in Hyderabad
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsLoading(true);
                        fetchProperties();
                      }}
                    >
                      🔄 Refresh
                    </Button>
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
                      <div key={index} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                        <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                        <div className="bg-gray-200 h-4 rounded mb-2"></div>
                        <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">No properties found</h3>
                    <p className="text-gray-600 mb-6">
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
                        location="hyderabad"
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                )}
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
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default HyderabadProperties;