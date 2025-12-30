"use client";

import { useState, useEffect } from "react";
import TrendingProjects from "./components/TrendingProjects";
import FeaturedProjects from "./components/FeaturedProjects";
import MicroMapExplorer from "./components/MicroMapExplorer";
import TestimonialsCarousel from "./components/TestimonialsCarousel";
import TrustCTA from "./components/TrustCTA";
import Footer from "./components/Footer";
import MobileBottomNav from "./components/MobileBottomNav";
import StickyHeader from "./components/StickyHeader";
import HeroSearch from "./components/HeroSearch";

interface HomeTestClientProps {
  trendingProjects: any[];
  featuredProjects: any[];
  testimonials: any[];
  microMarkets: any[];
}

export default function HomeTestClient({
  trendingProjects,
  featuredProjects,
  testimonials,
  microMarkets,
}: HomeTestClientProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <StickyHeader isScrolled={isScrolled} />

      {/* Hero Section with Search */}
      <HeroSearch />

      {/* Top Trending Section */}
      <TrendingProjects projects={trendingProjects} />

      {/* Featured Projects Section */}
      <FeaturedProjects projects={featuredProjects} />

      {/* Micro-Map Explorer */}
      <MicroMapExplorer microMarkets={microMarkets} />

      {/* Testimonials Carousel */}
      <TestimonialsCarousel testimonials={testimonials} />

      {/* Trust CTA */}
      <TrustCTA />

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
