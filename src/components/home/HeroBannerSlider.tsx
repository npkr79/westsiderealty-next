"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, ExternalLink } from "lucide-react";
import type { HeroBannerOffer } from "@/services/heroBannerService";

interface HeroBannerSliderProps {
  offers: HeroBannerOffer[];
}

export default function HeroBannerSlider({ offers }: HeroBannerSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play slider (changes slide every 5 seconds)
  useEffect(() => {
    if (!isAutoPlaying || offers.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % offers.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, offers.length]);

  if (!offers || offers.length === 0) {
    return null;
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + offers.length) % offers.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % offers.length);
    setIsAutoPlaying(false);
  };

  const currentOffer = offers[currentSlide];

  // Get responsive image URLs
  // Mobile: hero_banner_mobile_url (fallback to image_url if null)
  // Desktop: image_url (fallback to background_image_url for backward compatibility)
  const mobileImageUrl = currentOffer.hero_banner_mobile_url 
    || currentOffer.image_url 
    || currentOffer.background_image_url;
  
  const desktopImageUrl = currentOffer.image_url 
    || currentOffer.background_image_url 
    || currentOffer.hero_banner_mobile_url;

  // Use the same image for both if mobile-specific is not available
  const hasResponsiveImages = currentOffer.hero_banner_mobile_url && currentOffer.image_url && 
    currentOffer.hero_banner_mobile_url !== currentOffer.image_url;

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development' && currentOffer) {
    console.log("[HeroBannerSlider] Current offer:", {
      id: currentOffer.id,
      title: currentOffer.title,
      mobileImageUrl,
      desktopImageUrl,
      hasResponsiveImages
    });
  }

  // Get link URL - use cta_link if available, otherwise default to /contact
  const bannerLink = currentOffer.cta_link || "/contact";

  return (
    <Link href={bannerLink} className="block mb-6 md:mb-8">
      <section className="relative h-[220px] sm:h-[300px] md:h-[400px] lg:h-[450px] w-full overflow-hidden bg-gray-900 cursor-pointer">
        {/* Background Image - Responsive using CSS swap */}
        <div className="absolute inset-0 bg-gray-900">
          {mobileImageUrl || desktopImageUrl ? (
            hasResponsiveImages ? (
              // Option B: CSS swap - render both images, show/hide based on screen size
              <>
                {/* Mobile image - shown on < 768px */}
                {mobileImageUrl && (
                  <Image
                    src={mobileImageUrl}
                    alt={currentOffer.title || "Banner"}
                    fill
                    className="object-contain md:object-cover md:hidden"
                    priority
                    sizes="100vw"
                  />
                )}
                {/* Desktop image - shown on >= 768px */}
                {desktopImageUrl && (
                  <Image
                    src={desktopImageUrl}
                    alt={currentOffer.title || "Banner"}
                    fill
                    className="object-contain md:object-cover hidden md:block"
                    priority
                    sizes="100vw"
                  />
                )}
              </>
            ) : (
              // Fallback: Single image if both are same or only one exists
              <Image
                src={desktopImageUrl || mobileImageUrl || ""}
                alt={currentOffer.title || "Banner"}
                fill
                className="object-contain md:object-cover"
                priority
                sizes="100vw"
              />
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800" />
          )}
        </div>

      {/* Navigation Arrows */}
      {offers.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-2 md:left-4 bottom-4 md:bottom-6 z-20 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all text-white"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-2 md:right-4 bottom-4 md:bottom-6 z-20 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all text-white"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </>
      )}

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          <div className="max-w-2xl text-white">
            {/* Title */}
            {currentOffer.title && (
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 leading-tight">
                {currentOffer.title}
              </h1>
            )}

            {/* Offer Headline */}
            {currentOffer.offer_headline && (
              <p className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-4 text-blue-300">
                {currentOffer.offer_headline}
              </p>
            )}

            {/* RERA Info */}
            {currentOffer.rera_number && (
              <div className="text-xs sm:text-sm md:text-base text-gray-200 mb-2 sm:mb-4">
                RERA No. {currentOffer.rera_number}
                {currentOffer.rera_link && (
                  <a
                    href={currentOffer.rera_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="ml-2 underline hover:text-white transition-colors"
                  >
                    {currentOffer.rera_link}
                  </a>
                )}
              </div>
            )}

            {/* Location Highlights */}
            {currentOffer.location_text && (
              <div className="flex items-center gap-2 text-sm sm:text-base md:text-lg text-gray-200 mb-1 sm:mb-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>{currentOffer.location_text}</span>
              </div>
            )}
            {currentOffer.location_highlight && (
              <p className="text-xs sm:text-sm md:text-base text-gray-300 mb-2 sm:mb-4">
                {currentOffer.location_highlight}
              </p>
            )}

            {/* Configurations */}
            {currentOffer.configurations && Array.isArray(currentOffer.configurations) && currentOffer.configurations.length > 0 && (
              <div className="mb-6 space-y-2">
                {currentOffer.configurations.map((config, idx) => (
                  <div key={idx} className="text-base md:text-lg text-white">
                    {config.bhk && (
                      <span className="font-semibold">{config.bhk}</span>
                    )}
                    {config.sqft && (
                      <span className="mx-2">
                        {config.sqft}
                        {config.sqm && ` (${config.sqm})`}
                      </span>
                    )}
                    {config.price && (
                      <span className="font-semibold"> - {config.price}</span>
                    )}
                    {config.location && (
                      <span className="text-gray-300"> | {config.location}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* CTA Button - Hidden since entire banner is clickable */}
            {currentOffer.cta_text && (
              <div className="inline-flex items-center gap-2 bg-white text-gray-900 px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-semibold shadow-lg pointer-events-none">
                {currentOffer.cta_text}
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide Indicators (Dots) */}
      {offers.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {offers.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToSlide(index);
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? "bg-white w-8"
                  : "bg-white/50 w-2 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
      </section>
    </Link>
  );
}
