
import { useState, useEffect, useMemo } from "react";
import FooterSection from "@/components/home/FooterSection";
import { siteImagesService, serviceOverlaysService } from "@/services/adminService";
import { Building2, Palmtree, Landmark } from "lucide-react";

// Add missing imports for service section components
import ServicesHeroSection from "@/components/services/ServicesHeroSection";
import ServiceDetailCard from "@/components/services/ServiceDetailCard";
import WhyChooseUsSection from "@/components/services/WhyChooseUsSection";
import AdvisoryProcessSection from "@/components/services/AdvisoryProcessSection";
import ServicesCTASection from "@/components/services/ServicesCTASection";
import SEO from "@/components/common/SEO";

const Services = () => {
  const [siteImages, setSiteImages] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = () => {
      const images = siteImagesService.getSiteImages();
      setSiteImages(images);
      setLoading(false);
    };
    fetchImages();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "siteImages") {
        fetchImages();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Service structured data
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Real Estate Advisory",
    "provider": {
      "@type": "RealEstateAgent",
      "name": "RE/MAX Westside Realty",
      "url": "https://www.westsiderealty.in"
    },
    "areaServed": [
      { "@type": "City", "name": "Hyderabad", "address": { "@type": "PostalAddress", "addressRegion": "Telangana", "addressCountry": "IN" } },
      { "@type": "City", "name": "Goa", "address": { "@type": "PostalAddress", "addressRegion": "Goa", "addressCountry": "IN" } },
      { "@type": "City", "name": "Dubai", "address": { "@type": "PostalAddress", "addressCountry": "AE" } }
    ],
    "offers": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Resale Properties - West Hyderabad",
          "description": "Premium apartments & villas in Kokapet, Narsingi, Financial District, Gachibowli & Gandipet"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Investment & Holiday Homes - Goa",
          "description": "Curated villas, serviced apartments & investment properties"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Global Investment Properties - Dubai",
          "description": "Rental-assured projects, pre-launch offers & off-plan investments"
        }
      }
    ]
  };

  const services = useMemo(() => {
    const hyderabadUrl = siteImages.hyderabadView || "";
    const goaUrl = siteImages.goaView || "";
    const dubaiUrl = siteImages.dubaiView || "";

    return [
      {
        icon: Building2,
        title: "Resale Properties in Gated Communities – West Hyderabad",
        description: "We specialize in premium resale apartments, villas, and homes within the most desirable gated communities of West Hyderabad — including Kokapet, Narsingi, Financial District, Gachibowli, and Gandipet. Whether you're buying or selling, we bring deep market knowledge and verified inventory to ensure smoother, faster, and more profitable transactions.",
        areas: ["Kokapet", "Narsingi", "Financial District", "Gachibowli", "Gandipet", "Manikonda"],
        features: [
          "Premium gated communities",
          "Verified legal documentation",
          "Market price analysis",
          "Negotiation support",
          "End-to-end transaction management"
        ],
        color: "bg-blue-50 border-blue-200",
        iconColor: "text-blue-600",
        image: hyderabadUrl,
        imageAlt: "West Hyderabad Gated Communities"
      },
      {
        icon: Palmtree,
        title: "Investment & Holiday Homes – Goa",
        description: "Discover curated holiday villas, serviced apartments, and investment properties in Goa, ideal for both personal retreats and income-generating stays. From North Goa hideaways to luxury beachside developments, we help you identify high-yielding properties backed by data, aesthetics, and market demand.",
        areas: ["North Goa", "South Goa", "Beachside Properties", "Luxury Villas", "Serviced Apartments"],
        features: [
          "Holiday villa curation",
          "Rental yield analysis",
          "Property management support",
          "Legal compliance guidance",
          "Investment advisory"
        ],
        color: "bg-green-50 border-green-200",
        iconColor: "text-green-600",
        image: goaUrl,
        imageAlt: "Holiday Homes Goa"
      },
      {
        icon: Landmark,
        title: "Global Investment Properties – Dubai",
        description: "Tap into the thriving real estate market of Dubai with our exclusive investment advisory. We offer access to rental-assured projects, pre-launch offers, and off-plan investments in one of the world's fastest-growing property hubs — powered by our RE/MAX global network and verified developer partnerships.",
        areas: ["Downtown Dubai", "Dubai Marina", "Business Bay", "Jumeirah Lake Towers", "Dubai Creek Harbour"],
        features: [
          "Rental-assured projects",
          "Pre-launch opportunities",
          "Off-plan investments",
          "Developer partnerships",
          "Global RE/MAX network support"
        ],
        color: "bg-yellow-50 border-yellow-200",
        iconColor: "text-yellow-600",
        image: dubaiUrl,
        imageAlt: "Dubai Investment Properties"
      }
    ];
  }, [siteImages]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl">Loading images...</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Our Services | RE/MAX Westside Realty"
        description="Explore our expert real estate services: Hyderabad premium resale, Goa investment & holiday properties, and Dubai global investments with RE/MAX Westside Realty."
        canonicalUrl="https://www.westsiderealty.in/services"
        imageUrl="https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets//remax-favicon.png"
        type="website"
        siteName="RE/MAX Westside Realty"
        keywords="hyderabad property services, goa holiday villas, dubai investment specialist, resale flats, global real estate agent"
        jsonLd={serviceSchema}
      />
      <ServicesHeroSection />
      <section className="py-16 px-4">
        <div className="container mx-auto space-y-16">
          {services.map((service, index) => (
            <ServiceDetailCard 
              key={index}
              service={service}
              flip={index % 2 === 1}
            />
          ))}
        </div>
      </section>
      <WhyChooseUsSection />
      <AdvisoryProcessSection />
      <ServicesCTASection />
      <FooterSection />
    </div>
  );
};

export default Services;
