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
import StatsSection from "@/components/home/StatsSection";
import ServicesSection from "@/components/home/ServicesSection";
import AboutPreviewSection from "@/components/home/AboutPreviewSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CtaSection from "@/components/home/CtaSection";
import CityCardsSection from "@/components/home/CityCardsSection";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import { supabaseTestimonialClientService } from "@/services/admin/supabaseTestimonialClientService";
import { siteImagesService } from "@/services/adminService";

const fallbackImage = "/placeholder.svg";

export default function IndexPageWithSearch() {
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
      title: "Resale Properties - West Hyderabad",
      description:
        "Premium apartments & villas in Kokapet, Narsingi, Financial District, Gachibowli & Gandipet",
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
      <HeroSectionWithSearch onContactClick={handleContactClick} />
      <StatsSection stats={stats} />
      <ServicesSection services={services} />
      {/* Featured Projects Section */}
      <FeaturedProjects />
      <AboutPreviewSection
        aboutImage={
          siteImages.aboutUsImage ||
          "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/service-images//remax-office.jpg"
        }
      />
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
