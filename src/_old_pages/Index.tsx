
import { useState, useEffect } from "react";
import { 
  Globe, 
  Users, 
  Award, 
  Building2,
  Palmtree,
  Landmark,
} from "lucide-react";
import { supabaseTestimonialService, siteImagesService } from "@/services/adminService";
import HeroSection from "@/components/home/HeroSection";
import StatsSection from "@/components/home/StatsSection";
import ServicesSection from "@/components/home/ServicesSection";
import AboutPreviewSection from "@/components/home/AboutPreviewSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CtaSection from "@/components/home/CtaSection";
import FooterSection from "@/components/home/FooterSection";
import SEO from "@/components/common/SEO";
import { Helmet } from "react-helmet";

const Index = () => {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [siteImages, setSiteImages] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Organization structured data
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "RE/MAX Westside Realty",
    "description": "Premier real estate advisory for Hyderabad, Goa & Dubai. Expert guidance for resale properties, investment opportunities & holiday homes.",
    "url": "https://www.westsiderealty.in",
    "logo": "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo.jpg",
    "image": "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo.jpg",
    "telephone": "+91-9866085831",
    "email": "npkr79@gmail.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Hyderabad",
      "addressRegion": "Telangana",
      "addressCountry": "IN"
    },
    "areaServed": [
      { "@type": "City", "name": "Hyderabad" },
      { "@type": "City", "name": "Goa" },
      { "@type": "City", "name": "Dubai" }
    ],
    "sameAs": [
      "https://www.facebook.com/remaxwestsiderealty",
      "https://www.instagram.com/remaxwestsiderealty"
    ]
  };

  useEffect(() => {
    // Fetch testimonials from Supabase (published only)
    const fetchTestimonials = async () => {
      setLoading(true);
      const result = await supabaseTestimonialService.getTestimonials(true);
      setTestimonials(result);
      setLoading(false);
    };
    fetchTestimonials();

    // ENFORCE siteImages only reference Supabase (force reset if Google Drive detected)
    let images = siteImagesService.getSiteImages();
    let needReset =
      Object.values(images).some(
        v => typeof v === "string" && v.includes("drive.google.com")
      );
    if (needReset) {
      images = siteImagesService.forceResetToDefaultImages();
    }
    setSiteImages(images);

    // Helper for admin: window.resetDefaultSiteImages()
    window.resetDefaultSiteImages = () => {
      siteImagesService.forceResetToDefaultImages();
      setSiteImages(siteImagesService.getSiteImages());
      alert("[ADMIN] Site images reset to Supabase-defaults.");
    };
  }, []);

  const handleContactClick = () => {
    window.location.href = "/contact";
  };

  const stats = [
    {
      icon: Globe,
      number: "110+",
      label: "Countries Worldwide",
      description: "RE/MAX Global Network"
    },
    {
      icon: Users,
      number: "Expert",
      label: "Advisory Team",
      description: "Local Market Specialists"
    },
    {
      icon: Award,
      number: "Premium",
      label: "Service Quality",
      description: "Trusted RE/MAX Standards"
    }
  ];

  const services = [
    {
      icon: Building2,
      title: "Resale Properties - West Hyderabad",
      description: "Premium apartments & villas in Kokapet, Narsingi, Financial District, Gachibowli & Gandipet",
      areas: ["Kokapet", "Narsingi", "Financial District", "Gachibowli"],
      color: "bg-blue-50 border-blue-200",
      image: siteImages.hyderabadView || ""
    },
    {
      icon: Palmtree,
      title: "Investment & Holiday Homes - Goa",
      description: "Curated villas, serviced apartments & investment properties for personal retreats and income generation",
      areas: ["North Goa", "South Goa", "Beachside Properties"],
      color: "bg-green-50 border-green-200",
      image: siteImages.goaView || ""
    },
    {
      icon: Landmark,
      title: "Global Investment Properties - Dubai",
      description: "Rental-assured projects, pre-launch offers & off-plan investments in one of the world's fastest-growing markets",
      areas: ["Downtown Dubai", "Dubai Marina", "Business Bay"],
      color: "bg-yellow-50 border-yellow-200",
      image: siteImages.dubaiView || ""
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
      </Helmet>
      <SEO
        title="RE/MAX Westside Realty - Hyderabad, Goa, Dubai | Premium Real Estate Agents"
        description="Find premium resale properties in Hyderabad, investment & holiday homes in Goa, and global real estate in Dubai. RE/MAX Westside Realty: Your local & global property expert."
        canonicalUrl="https://www.westsiderealty.in/"
        type="website"
        imageUrl="https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets//remax-favicon.png"
        siteName="RE/MAX Westside Realty"
        keywords="hyderabad resale property, goa holiday homes, dubai real estate, buy property hyderabad, investment property india"
      />

      {/* Hero Section */}
      <HeroSection onContactClick={handleContactClick} />

      {/* Stats */}
      <StatsSection stats={stats} />

      {/* What We Do Section */}
      <ServicesSection services={services} />

      {/* About Preview: Show only office image */}
      <AboutPreviewSection 
        aboutImage={siteImages.aboutUsImage || "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/service-images//remax-office.jpg"}
      />

      {/* Testimonials: Show loader, handle empty gracefully */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 text-lg">Loading testimonials...</div>
      ) : (
        <TestimonialsSection testimonials={Array.isArray(testimonials) ? testimonials : []} />
      )}

      {/* CTA Section */}
      <CtaSection onContactClick={handleContactClick} />

      {/* Footer */}
      <FooterSection />
    </div>
  );
};
export default Index;
