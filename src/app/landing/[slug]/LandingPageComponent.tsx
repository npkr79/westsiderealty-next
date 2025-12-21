 "use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import ImageLightbox from "@/components/landing/ImageLightbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Car, 
  Waves, 
  Trees, 
  Users, 
  Building2,
  TrendingUp,
  Star,
  ChevronLeft,
  ChevronRight,
  Shield,
  Wifi,
  Coffee,
  Dumbbell,
  Gamepad2,
  Home,
  Lock,
  Sun,
  Wind,
  Zap,
  Heart,
  Award,
  Calendar,
  Clock,
  Mail,
  Camera,
  Music,
  Plane,
  Train,
  Bus,
  Bike,
  Eye,
  Layers,
  Compass,
  MonitorSmartphone,
  CircleDot,
  GraduationCap,
  Hospital,
  ShoppingBag
} from "lucide-react";
import GoogleMapEmbed from "@/components/common/GoogleMapEmbed";
// SEO metadata is now handled in page.tsx server component
// No need for client-side SEO component
import FloatingLeadCapture from "@/components/landing/FloatingLeadCapture";
import StickyBottomButtons from "@/components/landing/StickyBottomButtons";
import PermanentLeadForm from "@/components/landing/PermanentLeadForm";
import StickyOfferBanner from "@/components/landing/StickyOfferBanner";
import ScrollProgressIndicator from "@/components/landing/ScrollProgressIndicator";
import { type LandingPage, type LandingPageImage, type LandingPageHighlight, type LandingPageFloorPlan, type LandingPageConfiguration, type LandingPageSpecification, type LandingPageLocationPoint, type LandingPageFAQ } from "@/services/admin/supabaseLandingPagesService";
import { Amenity, ContentBlock } from "@/types/landingPageTemplate";
import { UltraLuxuryContentBlock } from "@/components/landing/UltraLuxuryContentBlock";
import ProjectOverviewSection from "@/components/landing/ProjectOverviewSection";
import FloorPlansSlider from "@/components/landing/FloorPlansSlider";
import AnimatedCounter from "@/components/landing/AnimatedCounter";
import ProjectHighlightsTable from "@/components/landing/ProjectHighlightsTable";
import ExpertReview from "@/components/landing/ExpertReview";
// Aerocidade custom components
import AerocidadeHero from "@/components/landing/goa/AerocidadeHero";
import InvestmentHighlights from "@/components/landing/goa/InvestmentHighlights";
import PricePaymentTable from "@/components/landing/goa/PricePaymentTable";
import LocationAdvantages from "@/components/landing/goa/LocationAdvantages";
import AmenitiesGrid from "@/components/landing/goa/AmenitiesGrid";
import AerocidadeFAQ from "@/components/landing/goa/AerocidadeFAQ";
import GoaLeadForm from "@/components/landing/goa/GoaLeadForm";


// Icon mapping for highlights
const ICON_MAP = {
  Car, Waves, Trees, Users, Building2, TrendingUp, Star, MapPin, Shield, Wifi,
  Coffee, Dumbbell, Gamepad2, Home, Lock, Sun, Wind, Zap, Heart,
  Award, Calendar, Clock, Mail, Camera, Music, Plane, Train, Bus, Bike,
  Eye, Layers, Compass, MonitorSmartphone, CircleDot
};

// Icon mapping for location points
const LOCATION_ICON_MAP: Record<string, any> = {
  'Plane': Plane,
  'Building2': Building2,
  'GraduationCap': GraduationCap,
  'Hospital': Hospital,
  'ShoppingBag': ShoppingBag,
  'Train': Train,
  'MapPin': MapPin
};

interface LandingPageComponentProps {
  landingPage: LandingPage;
  images: LandingPageImage[];
  highlights: LandingPageHighlight[];
  amenities: Amenity[];
  contentBlocks: ContentBlock[];
  floorPlans: LandingPageFloorPlan[];
  configurations: LandingPageConfiguration[];
  specifications: LandingPageSpecification[];
  locationPoints: LandingPageLocationPoint[];
  faqs: LandingPageFAQ[];
}

const LandingPageComponent = ({
  landingPage,
  images,
  highlights,
  amenities,
  contentBlocks,
  floorPlans,
  configurations,
  specifications,
  locationPoints,
  faqs
}: LandingPageComponentProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFloatingForm, setShowFloatingForm] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);
  const [isFloorPlanLightboxOpen, setIsFloorPlanLightboxOpen] = useState(false);
  const [floorPlanLightboxImages, setFloorPlanLightboxImages] = useState<string[]>([]);
  const [floorPlanLightboxInitialIndex, setFloorPlanLightboxInitialIndex] = useState(0);
  const [parallaxOffset, setParallaxOffset] = useState(0);

  const openLightbox = (images: string[], initialIndex: number = 0) => {
    setLightboxImages(images);
    setLightboxInitialIndex(initialIndex);
    setIsLightboxOpen(true);
  };

  const openFloorPlanLightbox = (images: string[], initialIndex: number) => {
    setFloorPlanLightboxImages(images);
    setFloorPlanLightboxInitialIndex(initialIndex);
    setIsFloorPlanLightboxOpen(true);
  };

  // Parallax effect for hero section
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const parallaxSpeed = 0.5; // Adjust for parallax intensity (lower = more parallax)
      setParallaxOffset(scrolled * parallaxSpeed);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // All data is now passed as props from server component
  // No need for client-side fetching

  const nextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName as keyof typeof ICON_MAP] || Star;
  };

  const handleScrollToForm = () => {
    const formElement = document.getElementById('permanent-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Data is guaranteed to be available from server component
  // No loading or not found states needed

  // Extract location for display
  const extractedLocation = landingPage.location_info?.split(',')[0]?.trim() || 'Hyderabad';

  // Aerocidade Custom Template Component
  const AerocidadeTemplate = () => (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <AerocidadeHero landingPage={landingPage} configurations={configurations} />

      {/* Investment Highlights */}
      <InvestmentHighlights highlights={highlights} />

      {/* Price & Payment Plan */}
      <PricePaymentTable configurations={configurations} />

      {/* Location Advantages */}
      <LocationAdvantages landingPage={landingPage} locationPoints={locationPoints} />

      {/* Amenities Grid */}
      <AmenitiesGrid amenities={amenities} />

      {/* FAQ Section */}
      <AerocidadeFAQ faqs={faqs} />

      {/* Lead Form & WhatsApp CTA */}
      <GoaLeadForm landingPage={landingPage} />
    </div>
  );

  // Check if this is the Aerocidade page - render custom template
  if (landingPage.uri === 'aerocidade-studio-apartments-dabolim') {
    return <AerocidadeTemplate />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Floating Lead Capture Popup */}
      <FloatingLeadCapture 
        landingPageId={landingPage.id}
        brochureUrl={landingPage.brochure_url}
      />

      {/* Sticky Offer Banner */}
      <StickyOfferBanner 
        onUnlockClick={() => {
          const formSection = document.getElementById('permanent-form');
          formSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      />

      {/* Scroll Progress Indicator */}
      <ScrollProgressIndicator />

      {/* Sticky Bottom Buttons */}
      <StickyBottomButtons
        whatsappNumber={landingPage.whatsapp_number}
        whatsappMessage={landingPage.whatsapp_message}
        onSubmitInterest={handleScrollToForm}
        hasBrochure={!!landingPage.brochure_url}
      />

      {/* Hero Section with Parallax */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat cursor-pointer will-change-transform"
          style={{ 
            backgroundImage: `url(${landingPage.hero_image_url || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=600&fit=crop'})`,
            transform: `translateY(${parallaxOffset}px) scale(1.1)`,
            transition: 'transform 0.1s ease-out'
          }}
          onClick={() => landingPage.hero_image_url && openLightbox([landingPage.hero_image_url])}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-luxury-navy/60 via-black/40 to-luxury-charcoal/80"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto animate-fade-in">
          <h1 className="font-playfair text-4xl md:text-6xl font-bold mb-6 leading-tight drop-shadow-2xl">
            {landingPage.title} | Premium {configurations.map(c => c.unit_type).join('/')} Flats in {extractedLocation}, Hyderabad
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 animate-fade-in-up">
            {landingPage.subheadline}
          </p>
          
          {/* RERA Badge */}
          {landingPage.rera_number && (
            <div className="mb-8 flex justify-center animate-scale-in">
              <div className="bg-gradient-luxury backdrop-blur-sm px-6 py-3 rounded-full inline-flex items-center gap-2 border border-luxury-gold-light/40 shadow-luxury">
                <Shield className="h-5 w-5 text-white" />
                <span className="text-white font-semibold">
                  RERA No:{' '}
                  {landingPage.rera_link ? (
                    <a 
                      href={landingPage.rera_link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="underline hover:text-luxury-gold-light transition-colors"
                    >
                      {landingPage.rera_number}
                    </a>
                  ) : (
                    landingPage.rera_number
                  )}
                </span>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleScrollToForm}
              size="lg"
              className="bg-gradient-luxury hover:shadow-luxury text-white px-8 py-4 text-lg font-semibold transition-all duration-300 animate-scale-in shadow-elegant"
            >
              🚀 Get Exclusive Details
            </Button>
          </div>
        </div>
      </section>

      {/* Project Highlights Table */}
      <div className="container mx-auto max-w-6xl px-4">
        <ProjectHighlightsTable
          projectType="Luxury High-Rise Apartments"
          landArea={landingPage.project_land_area}
          bhkConfig={configurations.map(c => c.unit_type).join(', ')}
          minSize={configurations.length > 0 ? Math.min(...configurations.map(c => c.size_min).filter((s): s is number => typeof s === 'number' && !isNaN(s))) : undefined}
          maxSize={configurations.length > 0 ? Math.max(...configurations.map(c => c.size_max || c.size_min).filter((s): s is number => typeof s === 'number' && !isNaN(s))) : undefined}
          possessionDate="July 2030"
          reraNumber={landingPage.rera_number}
        />
      </div>

      {/* Expert Review Section */}
      <div className="container mx-auto max-w-6xl px-4">
        <ExpertReview projectName={landingPage.title} />
      </div>

      {/* Video Section */}
      {landingPage.youtube_video_url && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Video Tour: {landingPage.title} {extractedLocation} Hyderabad</h2>
              <p className="text-gray-600">Take a virtual walkthrough of this amazing property</p>
            </div>
            <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
              <iframe
                src={landingPage.youtube_video_url}
                title="Property Video Tour"
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* Key Statistics Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-luxury-navy to-luxury-charcoal text-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-center mb-4 animate-fade-in">
            📊 Project at a Glance
          </h2>
          <div className="h-1 w-24 bg-gradient-luxury mx-auto mb-12 animate-slide-in"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {landingPage.project_total_flats && (
              <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-lg border border-luxury-gold-light/20 hover:shadow-luxury transition-all duration-300 hover:scale-105">
                <Building2 className="h-12 w-12 text-luxury-gold mx-auto mb-4" />
                <div className="text-5xl font-bold mb-2 text-luxury-gold">
                  <AnimatedCounter end={parseInt(landingPage.project_total_flats) || 0} duration={2500} separator />
                </div>
                <p className="text-lg opacity-90">Total Units</p>
              </div>
            )}
            {landingPage.project_land_area && (
              <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-lg border border-luxury-gold-light/20 hover:shadow-luxury transition-all duration-300 hover:scale-105">
                <Layers className="h-12 w-12 text-luxury-gold mx-auto mb-4" />
                <div className="text-5xl font-bold mb-2 text-luxury-gold">
                  <AnimatedCounter 
                    end={parseFloat(landingPage.project_land_area) || 0} 
                    duration={2500} 
                    suffix=" Acres"
                    decimals={1}
                  />
                </div>
                <p className="text-lg opacity-90">Project Area</p>
              </div>
            )}
            {landingPage.project_total_towers && (
              <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-lg border border-luxury-gold-light/20 hover:shadow-luxury transition-all duration-300 hover:scale-105">
                <Building2 className="h-12 w-12 text-luxury-gold mx-auto mb-4" />
                <div className="text-5xl font-bold mb-2 text-luxury-gold">
                  <AnimatedCounter end={parseInt(landingPage.project_total_towers) || 0} duration={2500} />
                </div>
                <p className="text-lg opacity-90">Towers</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Property Highlights Section */}
      {highlights.length > 0 && (
        <section className="py-16 px-4 bg-gradient-subtle">
          <div className="container mx-auto max-w-6xl">
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-center mb-4 text-luxury-navy animate-fade-in">
              Premium Amenities at {landingPage.title} {extractedLocation}
            </h2>
            <div className="h-1 w-24 bg-gradient-luxury mx-auto mb-12 animate-slide-in"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {highlights.map((highlight, index) => {
                const IconComponent = getIconComponent(highlight.icon_name);
                return (
                  <Card 
                    key={highlight.id} 
                    className="text-center p-6 hover:shadow-luxury transition-all duration-300 border-2 hover:border-luxury-gold/30 animate-fade-in-up group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="space-y-4">
                      <div className="flex justify-center">
                        <div className="bg-gradient-luxury p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
                          <IconComponent className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold">{highlight.title} at {landingPage.title}</h3>
                      {highlight.subtitle && (
                        <p className="text-gray-600">{highlight.subtitle}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Configurations & Pricing Section */}
      {configurations.length > 0 && (
        <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {configurations.map(c => c.unit_type).join(', ')} Flats in {extractedLocation} - Price & Configurations
              </h2>
              <p className="text-lg text-muted-foreground">
                Choose from our exquisite range of ultra-luxury residences
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-card shadow-lg rounded-lg overflow-hidden">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="p-4 text-left font-bold">Unit Type</th>
                    <th className="p-4 text-left font-bold">Size (Sq. Ft.)</th>
                    <th className="p-4 text-left font-bold">Starting Price</th>
                  </tr>
                </thead>
                <tbody>
                  {configurations.map((config, index) => (
                    <tr 
                      key={config.id} 
                      className={index % 2 === 0 ? 'bg-muted/30' : 'bg-card hover:bg-muted/50 transition-colors'}
                    >
                      <td className="p-4 font-semibold text-lg">
                        <h3>{config.unit_type} in {extractedLocation}</h3>
                      </td>
                      <td className="p-4">
                        {config.size_min && config.size_max 
                          ? `${config.size_min.toLocaleString()} - ${config.size_max.toLocaleString()}` 
                          : config.size_min?.toLocaleString() || config.size_max?.toLocaleString() || 'Contact for details'}
                      </td>
                      <td className="p-4 text-primary font-bold text-lg">{config.price_display}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-center mt-8">
              <Button 
                onClick={handleScrollToForm}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4"
              >
                💰 Get Detailed Pricing
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Rich Text Description */}
      <section className="py-16 px-4 bg-gray-50">
            <div className="container mx-auto max-w-6xl">
              <div 
                className={`prose prose-lg mx-auto text-gray-700 luxury-description-render ${
                  landingPage?.template_type === 'ultra_luxury_duplex' 
                    ? 'prose-headings:font-serif prose-headings:text-[#1a1a1a]' 
                    : ''
                }`}
                dangerouslySetInnerHTML={{ __html: landingPage.rich_description }}
              />
          <div className="text-center mt-8">
                <Button 
                  onClick={handleScrollToForm}
                  size="lg"
                  className="bg-remax-red hover:bg-remax-red/90 text-white px-8 py-4"
                >
                  📋 Request Detailed Information
                </Button>
          </div>
        </div>
      </section>

      {/* Project Overview Section - Between Rich Description and Amenities */}
      <ProjectOverviewSection 
        landingPage={landingPage}
        isUltraLuxury={landingPage?.template_type === 'ultra_luxury_duplex'}
      />

      {/* Amenities Section */}
      {amenities.length > 0 && (
        <section className="py-16 px-4 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-subtle opacity-30"></div>
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-12 animate-fade-in">
              <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-4 text-luxury-navy">
                Luxury Amenities at Godrej Properties {extractedLocation}
              </h2>
              <div className="h-1 w-24 bg-gradient-luxury mx-auto mb-4"></div>
              <p className="text-lg text-luxury-slate">
                Experience unparalleled lifestyle with premium facilities
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {amenities.map((amenity, index) => (
                <Card 
                  key={amenity.id} 
                  className="overflow-hidden hover:shadow-luxury transition-all duration-300 hover:-translate-y-1 border-2 hover:border-luxury-gold/30 animate-fade-in-up group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {amenity.image_url && (
                    <div className="aspect-video overflow-hidden relative">
                      <img
                        src={amenity.image_url}
                        alt={amenity.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-luxury-navy/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-3 text-luxury-charcoal group-hover:text-luxury-gold transition-colors duration-300">
                      {amenity.title}
                    </h3>
                    {amenity.description && (
                      <p className="text-luxury-slate leading-relaxed">
                        {amenity.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Floor Plans Section - Between Amenities and Technical Specifications */}
      <FloorPlansSlider
        floorPlans={floorPlans}
        isUltraLuxury={landingPage?.template_type === 'ultra_luxury_duplex'}
        onImageClick={openFloorPlanLightbox}
      />

      {/* Technical Specifications Section */}
      {specifications.length > 0 && (
        <section className="py-16 px-4 bg-gradient-subtle">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12 animate-fade-in">
              <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-4 text-luxury-navy">
                Premium Specifications - {landingPage.title} Hyderabad
              </h2>
              <div className="h-1 w-24 bg-gradient-luxury mx-auto mb-4"></div>
              <p className="text-lg text-luxury-slate">
                Premium quality materials and world-class construction standards
              </p>
            </div>
            
            {/* Group specifications by category */}
            {Object.entries(
              specifications.reduce((acc, spec) => {
                if (!acc[spec.category]) {
                  acc[spec.category] = [];
                }
                acc[spec.category].push(spec);
                return acc;
              }, {} as Record<string, LandingPageSpecification[]>)
            ).map(([category, specs], catIndex) => (
              <Card 
                key={category} 
                className="mb-6 border-2 hover:border-luxury-gold/30 transition-all duration-300 hover:shadow-luxury animate-fade-in-up group"
                style={{ animationDelay: `${catIndex * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <h3 className="font-playfair text-2xl font-bold mb-6 text-luxury-navy border-b-2 border-gradient-luxury pb-2 relative">
                    <span className="relative z-10">{category}</span>
                    <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-luxury group-hover:w-full transition-all duration-500"></div>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {specs.map((spec, specIndex) => (
                      <div 
                        key={spec.id} 
                        className="border-l-4 border-luxury-gold pl-4 py-2 hover:bg-luxury-cream/50 transition-colors duration-300 rounded-r animate-slide-in"
                        style={{ animationDelay: `${(catIndex * 0.1) + (specIndex * 0.05)}s` }}
                      >
                        <h4 className="font-bold text-luxury-charcoal mb-1 text-lg">
                          {spec.specification_key} - Premium Design
                        </h4>
                        <p className="text-luxury-slate leading-relaxed">
                          {spec.specification_value}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Flexible Content Blocks - Project Overview & Floor Plans */}
      {contentBlocks.length > 0 && (
        <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto max-w-6xl">
            {contentBlocks.map((block) => (
              <UltraLuxuryContentBlock 
                key={block.id} 
                block={block} 
                isUltraLuxury={landingPage?.template_type === 'ultra_luxury_duplex'}
              />
            ))}
          </div>
        </section>
      )}

      {/* Image Gallery */}
      {images.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Photo Gallery: Luxury Apartments near Financial District</h2>
            
            {/* Main Image */}
            <div className="relative mb-8">
              <div className="aspect-video rounded-lg overflow-hidden shadow-lg cursor-pointer">
                <img
                  src={images[currentImageIndex]?.image_url}
                  alt={images[currentImageIndex]?.alt_text || `Gallery image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  onClick={() => openLightbox(images.map(img => img.image_url), currentImageIndex)}
                />
              </div>
              
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded">
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    index === currentImageIndex ? 'border-remax-red' : 'border-gray-200'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img
                    src={image.image_url}
                    alt={image.alt_text || `Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Location & Connectivity Section */}
      {(locationPoints.length > 0 || landingPage.location_info) && (
        <section className="py-16 px-4 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-royal opacity-5"></div>
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-12 animate-fade-in">
              <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-4 text-luxury-navy">
                Prime Location in {extractedLocation} Near Financial District & Gachibowli
              </h2>
              <div className="h-1 w-24 bg-gradient-luxury mx-auto mb-4"></div>
              {landingPage.location_info && (
                <div className="flex items-center justify-center text-xl text-luxury-slate mb-8">
                  <MapPin className="h-6 w-6 mr-2 text-luxury-gold" />
                  {landingPage.location_info}
                </div>
              )}
              <p className="text-lg text-luxury-slate">
                Perfectly positioned with seamless access to key destinations
              </p>
            </div>

            {/* Location Points Grid */}
            {locationPoints.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {locationPoints.map((point, index) => {
                  const IconComponent = LOCATION_ICON_MAP[point.icon_name || 'MapPin'] || MapPin;

                  return (
                    <Card 
                      key={point.id} 
                      className="hover:shadow-luxury transition-all duration-300 hover:-translate-y-1 border-2 hover:border-luxury-gold/30 animate-fade-in-up group"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="bg-gradient-luxury p-3 rounded-full flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-luxury-charcoal mb-1 text-lg">
                              {point.distance} to {point.landmark_name} from {landingPage.title}
                            </h3>
                            <Badge variant="secondary" className="mb-3 bg-luxury-cream text-luxury-gold-dark border-luxury-gold/20">
                              {point.distance}
                            </Badge>
                            {point.description && (
                              <p className="text-luxury-slate text-sm leading-relaxed">
                                {point.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            
            {/* Google Map */}
            {landingPage.show_google_map && (
              <div className="rounded-lg overflow-hidden shadow-luxury animate-scale-in">
                <GoogleMapEmbed 
                  lat={landingPage.map_latitude}
                  lng={landingPage.map_longitude}
                  zoom={(landingPage.map_zoom && landingPage.map_zoom >= 10) ? landingPage.map_zoom : 18}
                  mapType={(landingPage.map_type === 'roadmap' || landingPage.map_type === 'satellite') ? landingPage.map_type : 'satellite'}
                  url={landingPage.google_map_url}
                  height={450}
                  title={`${landingPage.title} Location`}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Permanent Lead Form Below Map */}
      <section id="permanent-form" className="py-16 px-4 pb-32">
        <div className="container mx-auto">
        <PermanentLeadForm 
          landingPageId={landingPage.id}
          brochureUrl={landingPage.brochure_url}
          projectName={landingPage.title}
        />
        </div>
      </section>

      {/* FAQ Section with H2-H6 Hierarchy */}
      <section className="py-16 px-4 bg-gradient-subtle">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-4 text-luxury-navy">
              Frequently Asked Questions - {landingPage.title} {extractedLocation}
            </h2>
            <div className="h-1 w-24 bg-gradient-luxury mx-auto"></div>
          </div>
          
          <div className="space-y-8">
            {/* Price & Payment Section */}
            <Card className="border-2 hover:border-luxury-gold/30 transition-all">
              <CardContent className="p-6 space-y-6">
                <h3 className="text-2xl font-bold text-primary border-b-2 border-luxury-gold/30 pb-3">
                  About Godrej Regal Pavilion Price & Payment
                </h3>
                <div className="space-y-5 ml-4">
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-luxury-charcoal flex items-start">
                      <span className="text-luxury-gold mr-2">Q:</span>
                      What is the starting price of flats in Rajendra Nagar?
                    </h4>
                    <p className="text-luxury-slate ml-6 leading-relaxed">
                      Godrej Regal Pavilion offers premium 2 BHK, 3 BHK, 3.5 BHK, 4 BHK apartments with competitive pricing. Contact us for the latest pricing details and exclusive launch offers.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-luxury-charcoal flex items-start">
                      <span className="text-luxury-gold mr-2">Q:</span>
                      Are there payment plans available for Godrej Regal Pavilion?
                    </h4>
                    <p className="text-luxury-slate ml-6 leading-relaxed">
                      Yes, we have an exclusive Easy Payment Plan tailored for salaried professionals. You can book your home with just a 5% Down Payment, avail a 90% Home Loan, and pay the remaining 5% after 18 months. This minimizes your upfront capital requirement significantly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location & Connectivity Section */}
            <Card className="border-2 hover:border-luxury-gold/30 transition-all">
              <CardContent className="p-6 space-y-6">
                <h3 className="text-2xl font-bold text-primary border-b-2 border-luxury-gold/30 pb-3">
                  Location & Connectivity
                </h3>
                <div className="space-y-5 ml-4">
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-luxury-charcoal flex items-start">
                      <span className="text-luxury-gold mr-2">Q:</span>
                      How far is Godrej Regal Pavilion from Financial District?
                    </h4>
                    <p className="text-luxury-slate ml-6 leading-relaxed">
                      Godrej Regal Pavilion in Rajendra Nagar is strategically located just minutes away from Financial District, making it ideal for IT and corporate professionals.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-luxury-charcoal flex items-start">
                      <span className="text-luxury-gold mr-2">Q:</span>
                      Is there metro connectivity to Rajendra Nagar?
                    </h4>
                    <p className="text-luxury-slate ml-6 leading-relaxed">
                      There is no operational metro station in Rajendra Nagar right now. However, it is a primary station on the proposed/upcoming Airport Express Line (Metro Phase 2).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-luxury-charcoal flex items-start">
                      <span className="text-luxury-gold mr-2">Q:</span>
                      What are the nearby landmarks to Godrej Regal Pavilion, Rajendra Nagar?
                    </h4>
                    <p className="text-luxury-slate ml-6 leading-relaxed">
                      Key landmarks include Financial District, Gachibowli, HITEC City, DLF Cyber City, major IT parks, international schools, hospitals, and shopping malls - all within easy reach.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amenities & Features Section */}
            <Card className="border-2 hover:border-luxury-gold/30 transition-all">
              <CardContent className="p-6 space-y-6">
                <h3 className="text-2xl font-bold text-primary border-b-2 border-luxury-gold/30 pb-3">
                  Amenities & Features
                </h3>
                <div className="space-y-5 ml-4">
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-luxury-charcoal flex items-start">
                      <span className="text-luxury-gold mr-2">Q:</span>
                      What amenities are available in Godrej Regal Pavilion in Rajendra Nagar?
                    </h4>
                    <p className="text-luxury-slate ml-6 leading-relaxed">
                      Godrej Regal Pavilion features a 75,000 sq.ft clubhouse with swimming pool, fitness center, sports facilities, landscaped gardens, kids play areas, multipurpose hall, and 24/7 security with modern surveillance.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-luxury-charcoal flex items-start">
                      <span className="text-luxury-gold mr-2">Q:</span>
                      What are the specifications of 3 BHK apartments?
                    </h4>
                    <p className="text-luxury-slate ml-6 leading-relaxed">
                      The 3 BHK flats in Rajendra Nagar feature premium vitrified flooring, modular kitchens, branded bathroom fittings, video door phones, and high-quality construction with earthquake-resistant RCC framed structure.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RERA & Legal Section */}
            <Card className="border-2 hover:border-luxury-gold/30 transition-all">
              <CardContent className="p-6 space-y-6">
                <h3 className="text-2xl font-bold text-primary border-b-2 border-luxury-gold/30 pb-3">
                  RERA & Legal Information
                </h3>
                <div className="space-y-5 ml-4">
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-luxury-charcoal flex items-start">
                      <span className="text-luxury-gold mr-2">Q:</span>
                      Is Godrej Regal Pavilion RERA approved?
                    </h4>
                    <p className="text-luxury-slate ml-6 leading-relaxed">
                      Yes, Godrej Regal Pavilion is fully RERA registered (RERA No: P02400009910), ensuring complete transparency and timely project delivery as per government regulations.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-luxury-charcoal flex items-start">
                      <span className="text-luxury-gold mr-2">Q:</span>
                      What is the possession timeline for Godrej Regal Pavilion?
                    </h4>
                    <p className="text-luxury-slate ml-6 leading-relaxed">
                      Godrej Regal Pavilion is a new launch project with possession scheduled for July 2030. The project follows a transparent construction schedule. Contact our sales team for the latest construction progress updates.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-remax-red text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Own Your Dream Home in {extractedLocation}?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Premium properties like this don't stay available for long. Get in touch now for exclusive access and personalized assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleScrollToForm}
              size="lg"
              variant="secondary"
              className="bg-white text-remax-red hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            >
              📋 Submit Your Interest
            </Button>
            <Button 
              onClick={() => {
                const message = encodeURIComponent(landingPage.whatsapp_message);
                window.open(`https://wa.me/${landingPage.whatsapp_number}?text=${message}`, '_blank');
              }}
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-remax-red px-8 py-4 text-lg font-semibold"
            >
              📲 WhatsApp Now
            </Button>
          </div>
        </div>
      </section>

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        initialIndex={lightboxInitialIndex}
      />

      {/* Floor Plans Lightbox */}
      <ImageLightbox
        images={floorPlanLightboxImages}
        isOpen={isFloorPlanLightboxOpen}
        onClose={() => setIsFloorPlanLightboxOpen(false)}
        initialIndex={floorPlanLightboxInitialIndex}
      />

    </div>
  );
};

export default LandingPageComponent;
