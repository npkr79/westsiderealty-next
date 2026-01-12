"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  Users,
  Award,
  Building2,
  Palmtree,
  Landmark,
} from "lucide-react";
import HeroSectionWithSearch from "@/components/home/HeroSectionWithSearch";
import TrendingProjectsSlider from "@/components/home/TrendingProjectsSlider";
import StatsSection from "@/components/home/StatsSection";
import ServicesSection from "@/components/home/ServicesSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CtaSection from "@/components/home/CtaSection";
import CityCardsSection from "@/components/home/CityCardsSection";
import { supabaseTestimonialClientService } from "@/services/admin/supabaseTestimonialClientService";
import { siteImagesService } from "@/services/admin/siteImagesService";
import HeroBannerSlider from "@/components/home/HeroBannerSlider";
import IntentCards from "@/components/home/IntentCards";
import type { HeroBannerOffer } from "@/services/heroBannerService";

const fallbackImage = "/placeholder.svg";

interface IndexPageWithSearchProps {
  heroBannerOffers?: HeroBannerOffer[];
}

export default function IndexPageWithSearch({ heroBannerOffers = [] }: IndexPageWithSearchProps) {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [siteImages, setSiteImages] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      setLoading(true);
      try {
        const result = await supabaseTestimonialClientService.getTestimonials(true);
        setTestimonials(result);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
        setTestimonials([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();

    // ENFORCE siteImages only reference Supabase (force reset if Google Drive detected)
    let images = siteImagesService.getSiteImages();
    const needReset = Object.values(images).some(
      (v) => typeof v === "string" && v.includes("drive.google.com")
    );
    if (needReset) {
      images = siteImagesService.forceResetToDefaultImages();
    }
    setSiteImages(images);

    // Helper for admin: window.resetDefaultSiteImages()
    (window as any).resetDefaultSiteImages = () => {
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
      description: "RE/MAX Global Network",
    },
    {
      icon: Users,
      number: "Expert",
      label: "Advisory Team",
      description: "Local Market Specialists",
    },
    {
      icon: Award,
      number: "Premium",
      label: "Service Quality",
      description: "Trusted RE/MAX Standards",
    },
  ];

  const services = [
    {
      icon: Building2,
      title: "Residential & Commercial - Hyderabad",
      description:
        "Expert guidance for buying, selling & investing in premium residential, commercial & plots across Hyderabad",
      areas: ["Kokapet", "Narsingi", "Financial District", "Gachibowli"],
      color: "bg-blue-50 border-blue-200",
      image: siteImages.hyderabadView || fallbackImage,
    },
    {
      icon: Palmtree,
      title: "Investment & Holiday Homes - Goa",
      description:
        "Curated villas, serviced apartments & investment properties for personal retreats and income generation",
      areas: ["North Goa", "South Goa", "Beachside Properties"],
      color: "bg-green-50 border-green-200",
      image: siteImages.goaView || fallbackImage,
    },
    {
      icon: Landmark,
      title: "Global Investment Properties - Dubai",
      description:
        "Rental-assured projects, pre-launch offers & off-plan investments in one of the world's fastest-growing markets",
      areas: ["Downtown Dubai", "Dubai Marina", "Business Bay"],
      color: "bg-yellow-50 border-yellow-200",
      image: siteImages.dubaiView || fallbackImage,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner Slider */}
      {heroBannerOffers.length > 0 && (
        <HeroBannerSlider offers={heroBannerOffers} />
      )}
      <HeroSectionWithSearch onContactClick={handleContactClick} />
      <IntentCards />
      <TrendingProjectsSlider />
      <StatsSection stats={stats} />
      <ServicesSection services={services} />
      {/* Explore Cities Section */}
      <CityCardsSection />

      {loading ? (
        <div className="py-20 text-center text-gray-400 text-lg">
          Loading testimonials...
        </div>
      ) : (
        <TestimonialsSection testimonials={Array.isArray(testimonials) ? testimonials : []} />
      )}
      <CtaSection onContactClick={handleContactClick} />
    </div>
  );
}
