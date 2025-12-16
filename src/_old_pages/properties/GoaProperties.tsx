import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Grid, List, Star, Waves } from "lucide-react";
import GoaPropertyCard from "@/components/properties/GoaPropertyCard";
import PropertyFiltersComponent from "@/components/properties/PropertyFilters";
import { goaHolidayPropertyService } from "@/services/goaHolidayPropertyService";
import type { GoaHolidayProperty, GoaHolidayPropertyFilter } from "@/types/goaHolidayProperty";
import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import FooterSection from "@/components/home/FooterSection";
import CityFAQSection from "@/components/city/CityFAQSection";
import { supabase } from "@/integrations/supabase/client";

interface FAQCategory {
  category: string;
  faqs: { question: string; answer: string }[];
}

const GoaProperties = () => {
  const [properties, setProperties] = useState<GoaHolidayProperty[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<GoaHolidayProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<GoaHolidayPropertyFilter>({});
  const [cityFaqs, setCityFaqs] = useState<FAQCategory[]>([]);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Properties", href: "/properties" },
    { label: "Goa Properties" }
  ];

  useEffect(() => {
    fetchProperties();
    fetchCityFaqs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [properties, filters]);

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const data = await goaHolidayPropertyService.getProperties({
        status: 'Active'
      });
      setProperties(data);
    } catch (error) {
      console.error('Error fetching Goa properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCityFaqs = async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('city_faqs_json')
        .eq('url_slug', 'goa')
        .single();
      
      if (!error && data?.city_faqs_json) {
        setCityFaqs(data.city_faqs_json as unknown as FAQCategory[]);
      }
    } catch (error) {
      console.error('Error fetching Goa FAQs:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...properties];

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(query) ||
        property.description.toLowerCase().includes(query) ||
        (property.location_area && property.location_area.toLowerCase().includes(query))
      );
    }

    if (filters.type) {
      filtered = filtered.filter(property => property.type === filters.type);
    }

    if (filters.district) {
      filtered = filtered.filter(property => property.district === filters.district);
    }

    if (filters.location_area) {
      filtered = filtered.filter(property => property.location_area === filters.location_area);
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

    // Sort by featured first, then by newest
    filtered.sort((a, b) => {
      if (a.is_featured !== b.is_featured) {
        return b.is_featured ? 1 : -1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

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

  const handleFiltersChange = (newFilters: GoaHolidayPropertyFilter) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const featuredProperties = filteredProperties.filter(p => p.is_featured);
  const rentalReadyProperties = filteredProperties.filter(p => 
    p.listing_type === 'Rent' || p.listing_type === 'Both' || p.rental_yield_min
  );

  // Escape special characters for JSON-LD schema to prevent parsing failures
  const escapeSchemaText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')   // Escape backslashes first
      .replace(/"/g, '\\"')     // Escape double quotes
      .replace(/\n/g, ' ')      // Replace newlines with space (safer for JSON-LD)
      .replace(/\r/g, '')       // Remove carriage returns
      .replace(/\t/g, ' ')      // Replace tabs with space
      .replace(/\*\*/g, '')     // Remove markdown bold
      .trim();
  };

  // Generate FAQPage JSON-LD schema from city FAQs
  const faqSchema = cityFaqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": cityFaqs.flatMap(category => 
      category.faqs.map(faq => ({
        "@type": "Question",
        "name": escapeSchemaText(faq.question),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": escapeSchemaText(faq.answer)
        }
      }))
    )
  } : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Goa Properties - Holiday Homes, Villas & Investment Properties | RE/MAX Westside Realty</title>
        <meta name="description" content="Discover luxury holiday homes and investment properties in Goa. Beachside villas, rental-ready apartments in North & South Goa." />
        <meta name="keywords" content="goa properties, holiday homes goa, investment properties goa, goa villas, north goa properties, south goa real estate, beach properties" />
        <link rel="canonical" href="https://www.westsiderealty.in/goa" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Goa Properties - Holiday Homes, Villas & Investment Properties" />
        <meta property="og:description" content="Discover luxury holiday homes and investment properties in Goa. Beachside villas, rental-ready apartments in North & South Goa." />
        <meta property="og:url" content="https://www.westsiderealty.in/goa" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="RE/MAX Westside Realty" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Goa Properties - Holiday Homes & Investment Properties" />
        <meta name="twitter:description" content="Discover luxury holiday homes and investment properties in Goa." />
        
        {/* ItemList Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Goa Properties",
            "description": "Holiday homes and investment properties in Goa",
            "url": "https://www.westsiderealty.in/goa",
            "numberOfItems": properties.length
          })}
        </script>

        {/* FAQPage Schema - Always render script tag, content is conditional */}
        <script type="application/ld+json">
          {JSON.stringify(faqSchema ? faqSchema : {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": []})}
        </script>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <BreadcrumbNav items={breadcrumbItems} />

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Waves className="h-6 w-6" />
            <Badge variant="secondary" className="text-blue-600">
              Goa
            </Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">Paradise Properties in Goa</h1>
          <p className="text-xl mb-6">
            Your gateway to luxury holiday homes and high-yield investment properties in God's Own Country
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
            {rentalReadyProperties.length > 0 && (
              <Badge variant="outline" className="border-white text-white bg-white/10">
                💰 {rentalReadyProperties.length} Rental Ready
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <PropertyFiltersComponent
              location="goa"
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
                  Holiday homes and investment properties in Goa
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
                  <GoaPropertyCard
                    key={property.id}
                    property={property}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      {cityFaqs.length > 0 && (
        <CityFAQSection faqs={cityFaqs} cityName="Goa" />
      )}

      <FooterSection />
    </div>
  );
};

export default GoaProperties;