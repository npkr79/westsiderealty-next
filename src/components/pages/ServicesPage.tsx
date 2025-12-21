"use client";

import { Building2, Palmtree, Landmark } from "lucide-react";
import ServicesHeroSection from "@/components/services/ServicesHeroSection";
import ServiceDetailCard from "@/components/services/ServiceDetailCard";
import WhyChooseUsSection from "@/components/services/WhyChooseUsSection";
import AdvisoryProcessSection from "@/components/services/AdvisoryProcessSection";
import ServicesCTASection from "@/components/services/ServicesCTASection";

const fallbackImage = "/placeholder.svg";

// Default image URLs - these are static and don't require client-side loading
const DEFAULT_IMAGES = {
  hyderabadView: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/service-images/hyderabad-view.jpg",
  goaView: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/service-images/goa-view.jpg",
  dubaiView: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/service-images/dubai-view.jpg",
};

export default function ServicesPage() {
  // Services data - static content, rendered immediately without loading state
  const services = [
    {
      icon: Building2,
      title: "Premium Properties in Gated Communities – West Hyderabad",
      description:
        "We specialize in premium apartments, villas, and homes within the most desirable gated communities of West Hyderabad — including Kokapet, Narsingi, Financial District, Gachibowli, and Gandipet. Whether you're buying or selling, we bring deep market knowledge and verified inventory to ensure smoother, faster, and more profitable transactions.",
      areas: ["Kokapet", "Narsingi", "Financial District", "Gachibowli", "Gandipet", "Manikonda"],
      features: [
        "Premium gated communities",
        "Verified legal documentation",
        "Market price analysis",
        "Negotiation support",
        "End-to-end transaction management",
      ],
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600",
      image: DEFAULT_IMAGES.hyderabadView || fallbackImage,
      imageAlt: "West Hyderabad Gated Communities",
    },
    {
      icon: Palmtree,
      title: "Investment & Holiday Homes – Goa",
      description:
        "Discover curated holiday villas, serviced apartments, and investment properties in Goa, ideal for both personal retreats and income-generating stays. From North Goa hideaways to luxury beachside developments, we help you identify high-yielding properties backed by data, aesthetics, and market demand.",
      areas: ["North Goa", "South Goa", "Beachside Properties", "Luxury Villas", "Serviced Apartments"],
      features: [
        "Holiday villa curation",
        "Rental yield analysis",
        "Property management support",
        "Legal compliance guidance",
        "Investment advisory",
      ],
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-600",
      image: DEFAULT_IMAGES.goaView || fallbackImage,
      imageAlt: "Holiday Homes Goa",
    },
    {
      icon: Landmark,
      title: "Global Investment Properties – Dubai",
      description:
        "Tap into the thriving real estate market of Dubai with our exclusive investment advisory. We offer access to rental-assured projects, pre-launch offers, and off-plan investments in one of the world's fastest-growing property hubs — powered by our RE/MAX global network and verified developer partnerships.",
      areas: ["Downtown Dubai", "Dubai Marina", "Business Bay", "Jumeirah Lake Towers", "Dubai Creek Harbour"],
      features: [
        "Rental-assured projects",
        "Pre-launch opportunities",
        "Off-plan investments",
        "Developer partnerships",
        "Global RE/MAX network support",
      ],
      color: "bg-yellow-50 border-yellow-200",
      iconColor: "text-yellow-600",
      image: DEFAULT_IMAGES.dubaiView || fallbackImage,
      imageAlt: "Dubai Investment Properties",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <ServicesHeroSection />
      <section className="py-16 px-4">
        <div className="container mx-auto space-y-16">
          {services.map((service, index) => (
            <ServiceDetailCard key={index} service={service} flip={index % 2 === 1} />
          ))}
        </div>
      </section>
      <WhyChooseUsSection />
      <AdvisoryProcessSection />
      <ServicesCTASection />
    </div>
  );
}
