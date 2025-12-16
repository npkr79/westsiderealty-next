import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Grid, List, MapPin, Star, Building } from "lucide-react";
import PropertyCard from "@/components/properties/PropertyCard";
import PropertyFiltersComponent from "@/components/properties/PropertyFilters";
import { locationPropertyService, type DubaiProperty, type PropertyFilters } from "@/services/locationPropertyService";
import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import FooterSection from "@/components/home/FooterSection";

const DubaiProperties = () => {
  console.log('[DubaiProperties] Component mounted');
  const [properties, setProperties] = useState<DubaiProperty[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<DubaiProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<PropertyFilters>({});

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Properties", href: "/properties" },
    { label: "Dubai Properties" }
  ];

  useEffect(() => {
    console.log('[DubaiProperties] useEffect - fetchProperties triggered');
    fetchProperties();
  }, []);

  useEffect(() => {
    console.log('[DubaiProperties] useEffect - applyFilters triggered, properties:', properties.length);
    applyFilters();
  }, [properties, filters]);

  const fetchProperties = async () => {
    console.log('[DubaiProperties] fetchProperties started');
    setIsLoading(true);
    try {
      const data = await locationPropertyService.getDubaiProperties();
      console.log('[DubaiProperties] Fetched properties:', data.length);
      setProperties(data);
    } catch (error) {
      console.error('[DubaiProperties] Error fetching Dubai properties:', error);
    } finally {
      setIsLoading(false);
      console.log('[DubaiProperties] fetchProperties completed');
    }
  };

  const applyFilters = () => {
    let filtered = [...properties];

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(query) ||
        property.description.toLowerCase().includes(query) ||
        property.community.toLowerCase().includes(query)
      );
    }

    if (filters.propertyType && filters.propertyType !== 'all') {
      filtered = filtered.filter(property => property.property_type === filters.propertyType);
    }

    if (filters.location) {
      filtered = filtered.filter(property => property.emirate === filters.location);
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

  const featuredProperties = filteredProperties.filter(p => p.is_featured);
  const highROIProperties = filteredProperties.filter(p => p.roi_percentage && p.roi_percentage > 8);

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Dubai Properties - Investment Apartments, Villas & Studios | RE/MAX Westside Realty</title>
        <meta name="description" content="Explore premium investment properties in Dubai. High-ROI apartments, luxury villas, and studio units in prime UAE locations." />
        <meta name="keywords" content="dubai properties, investment properties dubai, dubai apartments, dubai villas, uae real estate, dubai studios, emirates properties" />
        <link rel="canonical" href="https://www.westsiderealty.in/dubai" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Dubai Properties - Investment Apartments, Villas & Studios" />
        <meta property="og:description" content="Explore premium investment properties in Dubai. High-ROI apartments, luxury villas, and studio units in prime UAE locations." />
        <meta property="og:url" content="https://www.westsiderealty.in/dubai" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="RE/MAX Westside Realty" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Dubai Properties - Investment Apartments & Villas" />
        <meta name="twitter:description" content="Explore premium investment properties in Dubai." />
        
        {/* JSON-LD Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Dubai Properties",
            "description": "Investment properties in Dubai, UAE",
            "url": "https://www.westsiderealty.in/dubai",
            "numberOfItems": properties.length
          })}
        </script>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <BreadcrumbNav items={breadcrumbItems} />

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg p-8 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Building className="h-6 w-6" />
            <Badge variant="secondary" className="text-amber-600">
              Dubai, UAE
            </Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">Global Investment Properties in Dubai</h1>
          <p className="text-xl mb-6">
            Discover world-class investment opportunities in the UAE's most dynamic real estate market
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
            {highROIProperties.length > 0 && (
              <Badge variant="outline" className="border-white text-white bg-white/10">
                📈 {highROIProperties.length} High ROI (8%+)
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <PropertyFiltersComponent
              location="dubai"
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleResetFilters}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {filteredProperties.length} Properties Found
                </h2>
                <p className="text-gray-600">
                  Premium investment properties in Dubai, UAE
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
                    location="dubai"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default DubaiProperties;