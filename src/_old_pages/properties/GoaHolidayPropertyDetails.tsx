import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { goaHolidayPropertyService } from "@/services/goaHolidayPropertyService";
import type { GoaHolidayProperty } from "@/types/goaHolidayProperty";
import { SimilarPropertiesCarousel } from "@/components/properties/SimilarPropertiesCarousel";
import { 
  ArrowLeft, MapPin, Bed, Bath, Maximize, TrendingUp, Download, 
  Calendar, Phone, Mail, Share2, Heart, Play, Eye, Maximize2
} from "lucide-react";
import { toast } from "sonner";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";

export default function GoaHolidayPropertyDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<GoaHolidayProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (slug) {
      fetchProperty();
    }
  }, [slug]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const data = await goaHolidayPropertyService.getPropertyBySlug(slug!);
      if (data) {
        setProperty(data);
        // Increment view count
        await supabase
          .from('goa_holiday_properties')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', data.id);
      } else {
        toast.error("Property not found");
        navigate("/properties/goa-holiday-homes");
      }
    } catch (error) {
      console.error("Error fetching property:", error);
      toast.error("Property not found");
      navigate("/properties/goa-holiday-homes");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-20 text-center">
          <div className="animate-pulse">Loading property details...</div>
        </div>
      </Layout>
    );
  }

  if (!property) {
    return null;
  }

  const allImages = [property.hero_image_url, ...property.images].filter(Boolean);

  console.log('🔍 Property description fields:', {
    description_main: property.description_main?.substring(0, 50),
    description_developer: property.description_developer?.substring(0, 50),
    description_micromarket: property.description_micromarket?.substring(0, 50),
    description_investment: property.description_investment?.substring(0, 50),
    developer_name: property.developer_name,
    location_area: property.location_area
  });

  return (
    <Layout>
      <Helmet>
        <title>{property.seo_title || `${property.title} | Luxury Holiday Homes Goa`}</title>
        <meta name="description" content={property.meta_description || property.description} />
        
        {/* Schema.org Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            "name": property.title,
            "description": property.description_main || property.description,
            "image": property.hero_image_url || property.images?.[0],
            "address": {
              "@type": "PostalAddress",
              "addressLocality": property.location_area,
              "addressRegion": property.district,
              "addressCountry": "IN"
            },
            "offers": {
              "@type": "Offer",
              "price": property.price,
              "priceCurrency": "INR",
              "availability": "https://schema.org/InStock"
            },
            "numberOfBedrooms": property.bedrooms,
            "numberOfBathroomsTotal": property.bathrooms,
            "floorSize": {
              "@type": "QuantitativeValue",
              "value": property.area_sqft,
              "unitCode": "FTK"
            }
          })}
        </script>
      </Helmet>

      {/* Hero Gallery */}
      <section className="relative h-[70vh] bg-black">
        <img
          src={allImages[selectedImage] || property.hero_image_url}
          alt={property.title}
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        <div className="absolute top-6 left-6">
          <Button variant="secondary" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        <div className="absolute top-6 right-6 flex gap-2">
          <Button variant="secondary" size="icon">
            <Heart className="w-5 h-5" />
          </Button>
          <Button variant="secondary" size="icon">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="container mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5" />
              <span className="text-lg">{property.location_area}, {property.district}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{property.title}</h1>
            <div className="flex flex-wrap items-center gap-6">
              <div className="text-3xl font-bold">
                {property.price_display || `₹${(property.price / 10000000).toFixed(2)} Cr`}
              </div>
              {property.bedrooms && (
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5" />
                  {property.bedrooms} Bedrooms
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-2">
                  <Bath className="w-5 h-5" />
                  {property.bathrooms} Bathrooms
                </div>
              )}
              {property.area_sqft && (
                <div className="flex items-center gap-2">
                  <Maximize className="w-5 h-5" />
                  {property.area_sqft} sqft
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thumbnail Gallery */}
        {allImages.length > 1 && (
          <div className="absolute bottom-32 left-0 right-0 px-8">
            <div className="container mx-auto">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.slice(0, 6).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-24 h-16 rounded overflow-hidden border-2 transition-all ${
                      selectedImage === idx ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* SEO-Optimized Collapsible Content Sections */}
            <Card className="p-6 lg:p-8">
              <Accordion type="multiple" defaultValue={["overview", "developer", "micromarket", "investment"]} className="space-y-2">
                {/* Section 1: Main Description */}
                <AccordionItem value="overview" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-xl font-bold hover:no-underline">
                    Property Overview
                  </AccordionTrigger>
                  <AccordionContent>
                    <div 
                      className="prose prose-lg max-w-none leading-relaxed pt-2"
                      dangerouslySetInnerHTML={{ 
                        __html: property.description_main || property.rich_description || property.description 
                      }}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Section 2: Developer */}
                <AccordionItem value="developer" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-xl font-bold hover:no-underline">
                    About the Developer
                    {property.developer_name && (
                      <span className="text-base font-normal text-muted-foreground ml-2">
                        — {property.developer_name}
                      </span>
                    )}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div 
                      className="prose prose-lg max-w-none leading-relaxed pt-2"
                      dangerouslySetInnerHTML={{ 
                        __html: property.description_developer || 
                          (property.developer_name 
                            ? `<p>${property.developer_name} is a trusted developer with a strong track record in delivering quality properties in Goa.</p>` 
                            : '<p>This property is developed by a reputed developer committed to delivering quality homes.</p>')
                      }}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Section 3: Micromarket */}
                <AccordionItem value="micromarket" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-xl font-bold hover:no-underline">
                    About {property.location_area}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div 
                      className="prose prose-lg max-w-none leading-relaxed pt-2"
                      dangerouslySetInnerHTML={{ 
                        __html: property.description_micromarket || 
                          property.micromarket_description || 
                          `<p>${property.location_area} is a sought-after location in ${property.district}, known for its excellent connectivity and lifestyle amenities.</p>`
                      }}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Section 4: Investment Analysis */}
                <AccordionItem value="investment" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-xl font-bold hover:no-underline">
                    Why Invest in Goa
                  </AccordionTrigger>
                  <AccordionContent>
                    <div 
                      className="prose prose-lg max-w-none leading-relaxed pt-2"
                      dangerouslySetInnerHTML={{ 
                        __html: property.description_investment || 
                          '<p>Goa real estate offers strong investment potential with high rental yields, growing tourism, and excellent lifestyle benefits. Properties in prime locations like this offer both capital appreciation and steady rental income opportunities.</p>'
                      }}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Floor Plans */}
            {property.floor_plans.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Floor Plans</h2>
                <div className="grid gap-4">
                  {property.floor_plans.map((plan) => (
                    <div key={plan.id} className="border rounded-lg overflow-hidden">
                      <img src={plan.image_url} alt={plan.plan_name} className="w-full" />
                      <div className="p-3 bg-muted">
                        <p className="font-medium">{plan.plan_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* MICROMARKET SECTION */}
            {property.micromarket_title && (
              <Card className="p-0 overflow-hidden">
                <div className="p-8 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
                  <h2 className="text-3xl font-bold mb-4 text-amber-900 dark:text-amber-100">
                    {property.micromarket_title}
                  </h2>
                  {property.micromarket_description && (
                    <div 
                      className="prose prose-lg max-w-none text-amber-800 dark:text-amber-200"
                      dangerouslySetInnerHTML={{ __html: property.micromarket_description }}
                    />
                  )}
                </div>

                {property.micromarket_hero_image && (
                  <div className="w-full h-96">
                    <img 
                      src={property.micromarket_hero_image} 
                      alt={property.micromarket_title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {property.nearby_places.length > 0 && (
                  <div className="p-8">
                    <h3 className="text-2xl font-bold mb-6">PLACES NEARBY</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {property.nearby_places.map((place) => (
                        <div key={place.id} className="group cursor-pointer">
                          <div className="relative h-48 rounded-lg overflow-hidden mb-3">
                            <img
                              src={place.image_url}
                              alt={place.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-3 left-3 text-white">
                              <h4 className="text-lg font-bold">{place.name}</h4>
                              <p className="text-sm">{place.travel_time}</p>
                            </div>
                          </div>
                          {place.description && (
                            <p className="text-sm text-muted-foreground">{place.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Investment Analysis */}
            {(property.rental_yield_min || property.investment_highlights.length > 0) && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Investment Analysis</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {property.rental_yield_min && (
                    <div className="text-center p-4 bg-accent/10 rounded-lg">
                      <div className="text-3xl font-bold text-accent">
                        {property.rental_yield_min}% - {property.rental_yield_max}%
                      </div>
                      <div className="text-sm text-muted-foreground">Rental Yield</div>
                    </div>
                  )}
                  {property.rental_income_monthly && (
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <div className="text-3xl font-bold text-primary">
                        ₹{(property.rental_income_monthly / 100000).toFixed(1)}L
                      </div>
                      <div className="text-sm text-muted-foreground">Monthly Rental</div>
                    </div>
                  )}
                </div>
                {property.investment_highlights.length > 0 && (
                  <div className="space-y-3">
                    {property.investment_highlights.map((highlight) => (
                      <div key={highlight.id} className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <h4 className="font-semibold">{highlight.title}</h4>
                          <p className="text-sm text-muted-foreground">{highlight.subtitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Google Maps */}
            {property.google_maps_url && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Location</h2>
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={property.google_maps_url}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                </div>
              </Card>
            )}

            {/* Similar Properties */}
            <Card className="p-6 lg:p-8">
              <h2 className="text-2xl font-bold mb-6">Similar Properties You May Like</h2>
              <SimilarPropertiesCarousel 
                currentPropertyId={property.id}
                locationArea={property.location_area}
                district={property.district}
                price={property.price}
                type={property.type}
              />
            </Card>
          </div>

          {/* Sidebar - Contact Form */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <h3 className="text-xl font-bold mb-4">Interested in this property?</h3>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Inquiry submitted!"); }}>
                <Input placeholder="Your Name" required />
                <Input type="email" placeholder="Email Address" required />
                <Input type="tel" placeholder="Phone Number" required />
                <Textarea placeholder="Message (optional)" rows={4} />
                <Button type="submit" className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Inquiry
                </Button>
              </form>
              
              <div className="mt-6 space-y-3">
                <Button variant="outline" className="w-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Viewing
                </Button>
                {property.brochure_url && (
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download Brochure
                  </Button>
                )}
                <Button variant="outline" className="w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  Call +91 98660 85831
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
