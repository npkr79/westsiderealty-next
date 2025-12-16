import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import PropertyGrid from "@/components/realestate/PropertyGrid";
import PropertyFiltersComponent from "@/components/realestate/PropertyFilters";
import { realEstatePropertyService, RealEstateProperty, PropertyFilters } from "@/services/realestatePropertyService";
import { useSearchParams } from "react-router-dom";

const RealEstateProperties = () => {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState<RealEstateProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<PropertyFilters>({
    searchQuery: searchParams.get('search') || '',
    status: 'available'
  });

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      try {
        const fetchedProperties = await realEstatePropertyService.getProperties(filters);
        setProperties(fetchedProperties);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [filters]);

  const handleFiltersChange = (newFilters: PropertyFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({ status: 'available' });
  };

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Properties" }
  ];

  return (
    <>
      <Helmet>
        <title>Premium Properties for Sale | Westside Realty</title>
        <meta name="description" content="Discover luxury properties for sale in prime locations. Browse our collection of premium apartments, villas, and commercial spaces with detailed information and virtual tours." />
        <meta name="keywords" content="properties for sale, luxury real estate, apartments, villas, westside realty, premium properties" />
        <link rel="canonical" href="https://www.westsiderealty.in/properties" />
      </Helmet>
      
      <Layout>
        <div className="bg-background">
          <div className="container mx-auto px-4 py-8">
            <BreadcrumbNav items={breadcrumbItems} />
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Premium Properties for Sale
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Discover luxury properties in prime locations. Find your dream home with our curated collection of premium real estate.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <PropertyFiltersComponent
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onReset={handleResetFilters}
                />
              </div>

              {/* Properties Grid */}
              <div className="lg:col-span-3">
                <div className="mb-6 flex items-center justify-between">
                  <div className="text-muted-foreground">
                    {!isLoading && (
                      <span>Showing {properties.length} {properties.length === 1 ? 'property' : 'properties'}</span>
                    )}
                  </div>
                </div>

                <PropertyGrid properties={properties} isLoading={isLoading} />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default RealEstateProperties;