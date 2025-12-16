
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Home, 
  Car, 
  Phone, 
  MessageSquare,
  Share2,
  Heart,
  Bath,
  Bed,
  Square,
  ArrowLeft
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import ImageGallery from "@/components/property/ImageGallery";
import ContactForm from "@/components/property/ContactForm";
import SimilarProperties from "@/components/property/SimilarProperties";
import { realEstatePropertyService } from "@/services/realestatePropertyService";
import type { RealEstateProperty } from "@/services/realestatePropertyService";

const PropertyDetails = () => {
  const { id } = useParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const [property, setProperty] = useState<RealEstateProperty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [agent, setAgent] = useState<any>(null);

  useEffect(() => {
    const loadProperty = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const fetchedProperty = await realEstatePropertyService.getPropertyById(id);
        if (fetchedProperty) {
          setProperty(fetchedProperty);
          
          // Mock agent data for now
          setAgent({
            name: "Real Estate Agent",
            phone: "+91 9876543210",
            email: "agent@example.com",
            experience: "5 years"
          });
        }
      } catch (error) {
        console.error("Error loading property:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProperty();
  }, [id]);

  if (isLoading) {
    return (
      <Layout className="bg-gray-50">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-64">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-600">Loading property...</p>
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout className="bg-gray-50">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h1>
          <p className="text-gray-600 mb-6">The property you're looking for doesn't exist or has been removed.</p>
          <Link to="/properties">
            <Button>Browse Properties</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // Breadcrumb items
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Properties", href: "/properties" },
    { label: property.title }
  ];

  // Format price
  const formatPrice = (price: number) => {
    return realEstatePropertyService.formatPrice(price);
  };

  const pricePerSft = `₹${Math.round(property.price / property.sq_ft)}`;

  const handleWhatsAppContact = () => {
    const message = `Hi ${agent?.name || 'Agent'}, I'm interested in the property: ${property.title} (${property.location_map_url || 'Hyderabad'}). Could you please share more details?`;
    const url = `https://wa.me/${agent?.phone.replace(/\D/g, '') || '919876543210'}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: `Check out this property: ${property.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <Layout className="bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNav items={breadcrumbItems} />

        {/* Back to Properties Button */}
        <div className="mb-6">
          <Link to="/properties">
            <Button variant="outline" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Properties</span>
            </Button>
          </Link>
        </div>

        {/* Property Images */}
        <ImageGallery images={property.image_gallery_urls} title={property.title} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{property.location_map_url || 'Hyderabad'}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsFavorite(!isFavorite)}
                    >
                      <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-3xl font-bold text-blue-600">{formatPrice(property.price)}</div>
                    <div className="text-sm text-gray-500">{pricePerSft}/sq ft</div>
                  </div>
                  <Badge variant="secondary">{property.status}</Badge>
                </div>

                {/* Property Stats */}
                <div className="grid grid-cols-4 gap-4 py-6 border-t border-b">
                  <div className="text-center">
                    <Square className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <div className="font-semibold">{property.sq_ft} sq ft</div>
                    <div className="text-sm text-gray-500">Area</div>
                  </div>
                  <div className="text-center">
                    <Bed className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <div className="font-semibold">{property.bedrooms}</div>
                    <div className="text-sm text-gray-500">Bedrooms</div>
                  </div>
                  <div className="text-center">
                    <Bath className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <div className="font-semibold">{property.bathrooms}</div>
                    <div className="text-sm text-gray-500">Bathrooms</div>
                  </div>
                  <div className="text-center">
                    <Car className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <div className="font-semibold">1</div>
                    <div className="text-sm text-gray-500">Parking</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{property.description}</p>
              </CardContent>
            </Card>

            {/* Property Specifications */}
            {property.facing && (
              <Card>
                <CardHeader>
                  <CardTitle>Property Specifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Facing</div>
                      <div className="font-semibold">{property.facing}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={agent?.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                    alt={agent?.name || "Agent"}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold">{agent?.name || "Unknown Agent"}</div>
                    <div className="text-sm text-gray-500">{agent?.experience || "5 years"} experience</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button className="w-full" onClick={handleWhatsAppContact}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contact Form */}
            <ContactForm propertyId={property.id || ""} agentId="" />
          </div>
        </div>

        {/* Similar Properties */}
        <div className="mt-12">
          <SimilarProperties currentPropertyId={property.id || ""} location={property.location_map_url || 'Hyderabad'} />
        </div>
      </div>
    </Layout>
  );
};

export default PropertyDetails;
