import { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import ImageCarousel from "@/components/realestate/ImageCarousel";
import InquireForm from "@/components/realestate/InquireForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bed, Bath, Square, Compass, ArrowLeft, MapPin, Share2 } from "lucide-react";
import { realEstatePropertyService, RealEstateProperty } from "@/services/realestatePropertyService";

const PropertyDetailsPage = () => {
  const { id } = useParams();
  const [property, setProperty] = useState<RealEstateProperty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      try {
        const fetchedProperty = await realEstatePropertyService.getPropertyById(id);
        if (fetchedProperty) {
          setProperty(fetchedProperty);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Error fetching property:", error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const handleShare = () => {
    if (navigator.share && property) {
      navigator.share({
        title: property.title,
        text: `Check out this property: ${property.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (notFound || !property) {
    return <Navigate to="/properties" replace />;
  }

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Properties", href: "/properties" },
    { label: property.title }
  ];

  return (
    <>
      <Helmet>
        <title>{property.title} | Westside Realty</title>
        <meta name="description" content={property.description.substring(0, 160)} />
        <meta name="keywords" content={`${property.bedrooms} BHK, ${property.sq_ft} sq ft, property for sale, real estate`} />
        <meta property="og:title" content={property.title} />
        <meta property="og:description" content={property.description.substring(0, 160)} />
        <meta property="og:image" content={property.main_image_url} />
        <meta property="og:url" content={window.location.href} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <Layout>
        <div className="bg-background">
          <div className="container mx-auto px-4 py-8">
            <BreadcrumbNav items={breadcrumbItems} />

            {/* Back Button */}
            <div className="mb-6">
              <Link to="/properties">
                <Button variant="outline" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Properties</span>
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Image Gallery */}
                <ImageCarousel
                  images={property.image_gallery_urls}
                  mainImage={property.main_image_url}
                  title={property.title}
                />

                {/* Property Header */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground mb-2">
                        {property.title}
                      </h1>
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>Prime Location</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant={property.status === 'available' ? 'default' : 'secondary'}>
                        {property.status}
                      </Badge>
                      <Button variant="outline" size="icon" onClick={handleShare}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-3xl font-bold text-primary">
                    {realEstatePropertyService.formatPrice(property.price)}
                  </div>

                  {/* Property Stats */}
                  <div className="grid grid-cols-4 gap-4 py-4 border-t border-b">
                    <div className="text-center">
                      <Square className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <div className="font-semibold">{property.sq_ft}</div>
                      <div className="text-sm text-muted-foreground">Sq Ft</div>
                    </div>
                    <div className="text-center">
                      <Bed className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <div className="font-semibold">{property.bedrooms}</div>
                      <div className="text-sm text-muted-foreground">Bedrooms</div>
                    </div>
                    <div className="text-center">
                      <Bath className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <div className="font-semibold">{property.bathrooms}</div>
                      <div className="text-sm text-muted-foreground">Bathrooms</div>
                    </div>
                    {property.facing && (
                      <div className="text-center">
                        <Compass className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <div className="font-semibold">{property.facing}</div>
                        <div className="text-sm text-muted-foreground">Facing</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose prose-sm max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: property.description }}
                    />
                  </CardContent>
                </Card>

                {/* Amenities */}
                {property.amenities.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Amenities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {property.amenities.map((amenity, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span className="text-sm">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Location Map */}
                {property.location_map_url && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Location</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <iframe
                          src={property.location_map_url}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Property Location"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <InquireForm 
                  propertyId={property.id} 
                  propertyTitle={property.title}
                  propertyLocation="hyderabad"
                />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default PropertyDetailsPage;