import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Phone, 
  Car, 
  Waves, 
  Trees, 
  Users, 
  Building2,
  TrendingUp,
  Star,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import FooterSection from "@/components/home/FooterSection";
import GoogleMapEmbed from "@/components/common/GoogleMapEmbed";
import SEO from "@/components/common/SEO";
import FloatingLeadCapture from "@/components/landing/FloatingLeadCapture";
import StickyBottomButtons from "@/components/landing/StickyBottomButtons";
import { supabaseGoaVillaService, GoaVillaContent, GoaVillaImage } from "@/services/admin/supabaseGoaVillaService";

const GoaVilla = () => {
  const [content, setContent] = useState<GoaVillaContent | null>(null);
  const [images, setImages] = useState<GoaVillaImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showLeadCapture, setShowLeadCapture] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [villaContent, villaImages] = await Promise.all([
          supabaseGoaVillaService.getContent(),
          supabaseGoaVillaService.getImages()
        ]);
        
        if (!villaContent) {
          const defaultContent = {
            id: '1',
            headline: 'Luxury 3.5 BHK Villa for Sale in North Goa – ₹6.5 Cr',
            subheadline: 'Private Pool, Staff Quarters, Concierge Services & ₹30L/year Rental Income',
            rich_description: '<p>Discover your perfect investment opportunity in North Goa. This stunning 3.5 BHK villa offers the perfect blend of luxury living and rental income potential. Located in a prime area just minutes from pristine beaches, this property combines modern amenities with traditional Goan charm.</p><p>Whether you\'re looking for a holiday home or a lucrative investment, this villa delivers exceptional value with guaranteed rental returns and professional management services.</p>',
            location_info: 'Just 7 km from Morjim Beach | 25 mins from MOPA Airport',
            whatsapp_number: '919866085831',
            whatsapp_message: 'Hi, I\'m interested in the Goa villa listed on your site. Please share more details.',
            show_google_map: true,
            google_map_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15399.47!2d73.7!3d15.6!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTXCsDM2JzAwLjAiTiA3M8KwNDInMDAuMCJF!5e0!3m2!1sen!2sin!4v1640000000000!5m2!1sen!2sin',
            hero_image_url: '/lovable-uploads/Goa-Villa-Hero-Banner.png',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          await supabaseGoaVillaService.saveContent(defaultContent);
          setContent(defaultContent);
        } else {
          setContent(villaContent);
        }

        if (villaImages.length === 0) {
          const defaultImages = [
            { image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', alt_text: 'Villa Exterior View' },
            { image_url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', alt_text: 'Private Pool Area' },
            { image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800', alt_text: 'Living Room Interior' },
            { image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', alt_text: 'Master Bedroom' },
            { image_url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', alt_text: 'Kitchen Area' },
            { image_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800', alt_text: 'Garden and Lawn' }
          ];
          
          for (const [index, img] of defaultImages.entries()) {
            try {
              const response = await fetch(img.image_url);
              const blob = await response.blob();
              const file = new File([blob], `default-${index + 1}.jpg`, { type: 'image/jpeg' });
              await supabaseGoaVillaService.uploadGalleryImage(file, img.alt_text);
            } catch (error) {
              console.error('Error uploading default image:', error);
            }
          }
          
          const updatedImages = await supabaseGoaVillaService.getImages();
          setImages(updatedImages);
        } else {
          setImages(villaImages);
        }
      } catch (error) {
        console.error('Error loading villa content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, []);

  const handleWhatsAppClick = () => {
    if (content) {
      const message = encodeURIComponent(content.whatsapp_message);
      window.open(`https://wa.me/${content.whatsapp_number}?text=${message}`, '_blank');
    }
  };

  const handleSubmitInterest = () => {
    setShowLeadCapture(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (isLoading || !content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl">Loading villa details...</div>
      </div>
    );
  }

  const highlights = [
    { icon: Waves, text: "Private Pool (26.18 Sq. Mt)" },
    { icon: Trees, text: "Lawn Area" },
    { icon: Users, text: "Staff Quarters + Servant Room" },
    { icon: Building2, text: "Concierge & Rental Management" },
    { icon: Car, text: "Plot: 168 Sq. Mt | Built-up: 174 Sq. Mt" },
    { icon: TrendingUp, text: "₹30L/year Rental Income Potential" }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO
        title="Luxury 3.5 BHK Villa for Sale in North Goa – ₹6.5 Cr | RE/MAX Westside Realty"
        description="Premium 3.5 BHK villa with private pool, staff quarters & ₹30L rental income. 7km from Morjim Beach, 25 mins from MOPA Airport. Perfect investment opportunity in North Goa."
        canonicalUrl="https://www.westsiderealty.in/luxury-3-5bhk-villa-for-sale-in-north-goa"
        imageUrl={content.hero_image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=600&fit=crop"}
        type="article"
        siteName="RE/MAX Westside Realty"
        keywords="goa villa sale, luxury property goa, north goa investment, holiday home goa, villa with pool goa, goa real estate"
      />

      {/* Floating Lead Capture Popup */}
      <FloatingLeadCapture landingPageId={null} />

      {/* Hero Section */}
      <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
        
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${content.hero_image_url || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=600&fit=crop'})` 
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {content.headline}
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            {content.subheadline}
          </p>
          
          {/* Fixed Hero Buttons - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={handleSubmitInterest}
              size="lg"
              className="w-full sm:w-auto bg-remax-red hover:bg-remax-red/90 text-white px-8 py-4 text-lg font-semibold"
            >
              📋 Submit Interest
            </Button>
            <Button 
              onClick={handleWhatsAppClick}
              size="lg"
              className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg font-semibold"
            >
              📲 WhatsApp
            </Button>
          </div>
        </div>
      </section>

      {/* Video Section */}
      {content.youtube_video_url && (
        <section id="video" className="py-16 px-4 bg-gray-50">
          <div className="container mx-auto max-w-4xl">
            <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
              <iframe
                src={content.youtube_video_url}
                title="Villa Video Tour"
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* Property Highlights / Amenities Section */}
      <section id="amenities" className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Property Highlights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {highlights.map((highlight, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <highlight.icon className="h-12 w-12 text-remax-red mx-auto mb-4" />
                  <p className="text-lg font-semibold">{highlight.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Rich Text Description / Pricing Section */}
      <section id="pricing" className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div 
            className="prose prose-lg mx-auto text-gray-700"
            dangerouslySetInnerHTML={{ __html: content.rich_description }}
          />
          
          {/* Fixed Description Section Buttons - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Button 
              onClick={handleSubmitInterest}
              size="lg"
              className="w-full sm:w-auto bg-remax-red hover:bg-remax-red/90 text-white px-8 py-4 text-lg font-semibold"
            >
              📋 Submit Interest
            </Button>
            <Button 
              onClick={handleWhatsAppClick}
              size="lg"
              className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg font-semibold"
            >
              📲 Get More Details on WhatsApp
            </Button>
          </div>
        </div>
      </section>

      {/* Image Gallery */}
      {images.length > 0 && (
        <section id="gallery" className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Villa Gallery</h2>
            
            <div className="relative mb-8">
              <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                <img
                  src={images[currentImageIndex]?.image_url}
                  alt={images[currentImageIndex]?.alt_text || `Villa image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
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
              
              <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded">
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>

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

      {/* Location Info */}
      <section id="location" className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Prime Location</h2>
            <div className="flex items-center justify-center text-xl text-gray-700 mb-8">
              <MapPin className="h-6 w-6 mr-2 text-remax-red" />
              {content.location_info}
            </div>
          </div>
          
          {content.show_google_map && content.google_map_url && (
            <div className="rounded-lg overflow-hidden shadow-lg">
              <GoogleMapEmbed url={content.google_map_url} height={400} />
            </div>
          )}
        </div>
      </section>

      {/* Final CTA / Contact Section */}
      <section id="contact" className="py-16 px-4 bg-remax-red text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Invest in Paradise?</h2>
          <p className="text-xl mb-8 opacity-90">
            Don't miss this exceptional opportunity. Contact us now for exclusive details and site visit arrangements.
          </p>
          
          {/* Fixed Final CTA Buttons - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={handleSubmitInterest}
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto bg-white text-remax-red hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            >
              📋 Submit Interest
            </Button>
            <Button 
              onClick={handleWhatsAppClick}
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto bg-green-500 text-white hover:bg-green-600 px-8 py-4 text-lg font-semibold"
            >
              📲 WhatsApp Now
            </Button>
          </div>
        </div>
      </section>

      {/* Sticky Bottom Buttons */}
      <StickyBottomButtons
        whatsappNumber={content.whatsapp_number}
        whatsappMessage={content.whatsapp_message}
        onSubmitInterest={handleSubmitInterest}
      />

      <FooterSection />
    </div>
  );
};

export default GoaVilla;
